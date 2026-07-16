const path = require('path');
const fs = require('fs');
const PDFJob = require('../models/PDFJob');
const LayoutConfig = require('../models/LayoutConfig');
const Voter = require('../models/Voter');
const pdfService = require('../services/pdf.service');
const cropService = require('../services/crop.service');
const ocrService = require('../services/ocr.service');
const parserService = require('../services/parser.service');
const aiService = require('../services/ai.service');

exports.processPDF = async (req, res) => {
  const { id } = req.params;
  const { layoutId, startPage, endPage, extractionMethod } = req.body || {};
  const isAiMode = extractionMethod === 'ai';

  try {
    const job = await PDFJob.findById(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    // We send an immediate response and do the heavy lifting in the background
    job.status = 'processing';
    await job.save();
    res.status(200).json({ message: 'Processing started', job });

    // Fetch the grid layout model
    let config;
    if (layoutId) {
      config = await LayoutConfig.findById(layoutId);
    } else {
      config = await LayoutConfig.findOne({ isDefault: true });
    }

    // Fallback default grid config if none found in DB
    if (!config) {
      config = {
        columns: 3, rows: 10, marginLeft: 57, marginTop: 113, cardWidth: 780, cardHeight: 319, spacingX: 12, spacingY: 12,
        photoBox: { xOffsetPercent: 70, yOffsetPercent: 15, widthPercent: 28, heightPercent: 80 }
      };
    }

    // 1. Convert PDF to Images
    const pdfFilePath = path.join(__dirname, '../uploads/pdf', job.pdfName);
    const pagesDir = path.join(__dirname, `../uploads/pages/${job.pdfName}_pages`);
    if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });
    
    const pageImagePaths = await pdfService.convertPdfToImages(pdfFilePath, pagesDir, startPage, endPage);
    
    job.totalPages = pageImagePaths.length;
    await job.save();

    let totalVotersExtracted = 0;
    const failedPages = [];

    // Ensure OCR language data is ready before processing pages
    await ocrService.ensureOfflineData();

    // 2. Process each page sequentially (to manage memory)
    for (let pIndex = 0; pIndex < pageImagePaths.length; pIndex++) {
      const pagePath = pageImagePaths[pIndex];
      let pageFailed = false;

      // Ensure directory for cards and photos exist
      const cardsDir = path.join(__dirname, `../uploads/cards/${job.pdfName}_page${pIndex}`);
      const photosDir = path.join(__dirname, `../uploads/photos/${job.pdfName}_page${pIndex}`);
      if (!fs.existsSync(cardsDir)) fs.mkdirSync(cardsDir, { recursive: true });
      if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });

      try {
        const tasks = [];
        for (let row = 0; row < config.rows; row++) {
          for (let col = 0; col < config.columns; col++) {
            tasks.push({ row, col });
          }
        }

        const newVoters = [];
        const concurrencyLimit = isAiMode ? 10 : 5; // Process up to 10 cards concurrently in AI mode to batch requests

        for (let i = 0; i < tasks.length; i += concurrencyLimit) {
          const chunk = tasks.slice(i, i + concurrencyLimit);
          
          // 1. Crop and extract OCR text concurrently
          const chunkPromises = chunk.map(async ({ row, col }) => {
            const cardFilename = `card_r${row}_c${col}.png`;
            const photoFilename = `photo_r${row}_c${col}.png`;
            const cardPath = path.join(cardsDir, cardFilename);
            const photoPath = path.join(photosDir, photoFilename);

            const cardRes = await cropService.cropCard(pagePath, col, row, config, cardPath);
            if (cardRes) {
              await cropService.cropPhotoFromCard(cardPath, config, photoPath);
              const ocrText = await ocrService.recognizeText(cardPath);
              return { cardFilename, photoFilename, ocrText, valid: true };
            }
            return { valid: false };
          });

          const rawResults = await Promise.all(chunkPromises);
          const validResults = rawResults.filter(r => r.valid);

          // 2. Parse the OCR text
          let parsedChunk = [];
          if (isAiMode && validResults.length > 0) {
            try {
              console.log(`\n⏳ [Process] Assembling chunk of ${validResults.length} cards for AI...`);
              const texts = validResults.map(r => r.ocrText);
              const aiParsed = await aiService.parseVoterBatch(texts);
              console.log(`✨ [Process] Successfully parsed chunk with AI!`);
              
              parsedChunk = validResults.map((r, idx) => {
                 const parsedData = aiParsed[idx] || {};
                 if (parsedData.epicNumber || parsedData.name) {
                   return {
                     ...parsedData,
                     photo: `/uploads/photos/${job.pdfName}_page${pIndex}/${r.photoFilename}`,
                     voterCardImage: `/uploads/cards/${job.pdfName}_page${pIndex}/${r.cardFilename}`,
                     pdfName: job.pdfName,
                     pageNumber: pIndex + 1
                   };
                 }
                 return null;
              });
            } catch (aiErr) {
              console.error('AI Parsing failed for chunk, falling back to local OCR', aiErr);
              // Fallback to local if AI fails (e.g. rate limit)
              parsedChunk = validResults.map(r => {
                 const parsedData = parserService.parseVoterText(r.ocrText);
                 if (parsedData.epicNumber || parsedData.name) {
                   return {
                     ...parsedData,
                     photo: `/uploads/photos/${job.pdfName}_page${pIndex}/${r.photoFilename}`,
                     voterCardImage: `/uploads/cards/${job.pdfName}_page${pIndex}/${r.cardFilename}`,
                     pdfName: job.pdfName,
                     pageNumber: pIndex + 1
                   };
                 }
                 return null;
              });
            }
          } else {
            // Local Regex Parsing
            parsedChunk = validResults.map(r => {
               const parsedData = parserService.parseVoterText(r.ocrText);
               if (parsedData.epicNumber || parsedData.name) {
                 return {
                   ...parsedData,
                   photo: `/uploads/photos/${job.pdfName}_page${pIndex}/${r.photoFilename}`,
                   voterCardImage: `/uploads/cards/${job.pdfName}_page${pIndex}/${r.cardFilename}`,
                   pdfName: job.pdfName,
                   pageNumber: pIndex + 1
                 };
               }
               return null;
            });
          }

          newVoters.push(...parsedChunk.filter(Boolean));
        }

        // Save valid voters in bulk
        if (newVoters.length > 0) {
          const votersToInsert = newVoters.map((voter, index) => {
             voter.serialNumber = index + 1;
             return voter;
          });
          await Voter.insertMany(votersToInsert);
          totalVotersExtracted += votersToInsert.length;
        }
      } catch (err) {
        console.error(`Error processing page ${pIndex + 1}:`, err);
        pageFailed = true;
        failedPages.push(pIndex + 1);
      }

      job.processedPages = pIndex + 1;
      job.totalVotersExtracted = totalVotersExtracted;
      await job.save();
    }

    job.status = failedPages.length === pageImagePaths.length ? 'failed' : 'completed';
    job.failedPages = failedPages;
    await job.save();
    console.log(`Job ${job._id} completed. Extracted ${totalVotersExtracted} voters.`);

  } catch (error) {
    console.error('Process error:', error);
    // If job was fetched, update it to failed
    PDFJob.findByIdAndUpdate(id, { status: 'failed', error: error.message }).catch(console.error);
  }
};
