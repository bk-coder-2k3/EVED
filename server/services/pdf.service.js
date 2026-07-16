const { pdfToPng } = require('pdf-to-png-converter');
const path = require('path');
const fs = require('fs');

class PDFService {
  /**
   * Converts all pages of a PDF to high-resolution PNG images.
   * @param {string} pdfFilePath - Absolute path to the uploaded PDF
   * @param {string} outputDir - Directory to save page images
   * @returns {Promise<Array>} List of generated image paths
   */
  async convertPdfToImages(pdfFilePath, outputDir, startPage, endPage) {
    try {
      console.log(`Starting PDF to PNG conversion for: ${pdfFilePath}`);
      
      const options = {
        outputFolder: outputDir,
        viewportScale: 4.166, // 300 DPI (300 / 72 = 4.166)
        outputFileMask: 'page', // Will generate page_1.png, page_2.png, etc.
      };

      if (startPage && endPage) {
        const pages = [];
        for (let i = startPage; i <= endPage; i++) pages.push(i);
        options.pagesToProcess = pages; // Use correct field for pdf-to-png-converter
      }
      
      const pngPages = await pdfToPng(pdfFilePath, options);

      console.log(`Converted ${pngPages.length} pages.`);
      
      // Return the array of output paths
      return pngPages.map(p => p.path);
    } catch (error) {
      console.error('Error in PDFService convertPdfToImages:', error);
      throw error;
    }
  }
}

module.exports = new PDFService();
