const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

class CropService {
  /**
   * Crops a single voter card out of a PDF page based on LayoutConfig
   */
  async cropCard(pageImagePath, colIndex, rowIndex, config, outputCardPath) {
    const x = config.marginLeft + (colIndex * (config.cardWidth + config.spacingX));
    const y = config.marginTop + (rowIndex * (config.cardHeight + config.spacingY));

    const metadata = await sharp(pageImagePath).metadata();
    
    let left = Math.floor(x);
    let top = Math.floor(y);
    let width = Math.floor(config.cardWidth);
    let height = Math.floor(config.cardHeight);

    // Clamp coordinates to image boundaries to prevent crashes
    if (left + width > metadata.width) width = metadata.width - left;
    if (top + height > metadata.height) height = metadata.height - top;
    
    if (width <= 0 || height <= 0 || left < 0 || top < 0 || left >= metadata.width || top >= metadata.height) {
        console.warn(`Card at ${colIndex},${rowIndex} is out of bounds. Skipping.`);
        return null;
    }

    // We preprocess the card for better OCR accuracy (grayscale, thresholding/contrast)
    try {
      await sharp(pageImagePath)
        .extract({ left, top, width, height })
        // Preprocess for OCR: Upscale 2x to make characters clearer to the model
        .resize({ width: width * 2 })
        .grayscale()
        .normalize()
        // Slightly sharpen to improve text clarity
        .sharpen()
        .toFile(outputCardPath);
        
      return outputCardPath;
    } catch (err) {
      console.warn(`[Crop Warning] Card at ${colIndex},${rowIndex} could not be extracted: ${err.message}. Skipping.`);
      return null;
    }
  }

  /**
   * Crops the photo from a cropped voter card image
   */
  async cropPhotoFromCard(cardImagePath, config, outputPhotoPath) {
    try {
      const metadata = await sharp(cardImagePath).metadata();
      
      // Use the ACTUAL dimensions of the cropped card (since it might have been clamped)
      const photoX = Math.floor(metadata.width * (config.photoBox.xOffsetPercent / 100));
      const photoY = Math.floor(metadata.height * (config.photoBox.yOffsetPercent / 100));
      const photoW = Math.floor(metadata.width * (config.photoBox.widthPercent / 100));
      const photoH = Math.floor(metadata.height * (config.photoBox.heightPercent / 100));

      // Clamp just in case
      let finalW = photoW;
      let finalH = photoH;
      if (photoX + finalW > metadata.width) finalW = metadata.width - photoX;
      if (photoY + finalH > metadata.height) finalH = metadata.height - photoY;

      if (finalW > 0 && finalH > 0) {
        await sharp(cardImagePath)
          .extract({ left: photoX, top: photoY, width: finalW, height: finalH })
          .toFile(outputPhotoPath);
        return outputPhotoPath;
      }
      return null;
    } catch (err) {
      console.warn(`[Photo Crop Warning] Photo could not be extracted from card: ${err.message}`);
      return null;
    }
  }
}

module.exports = new CropService();
