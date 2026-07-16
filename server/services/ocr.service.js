const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

class OCRService {
  async ensureOfflineData() {
    // No-op for Python implementation. 
    // The Python server handles its own model downloading on first boot.
  }

  /**
   * Recognizes text from a voter card image using the local Python PaddleOCR microservice
   * @param {string} imagePath - Absolute path to the cropped image
   * @returns {Promise<string>} - Extracted raw text
   */
  async recognizeText(imagePath) {
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(imagePath));

      // Make request to the local Python FastAPI server
      const response = await axios.post('http://127.0.0.1:8000/extract', form, {
        headers: {
          ...form.getHeaders()
        }
      });
      
      return response.data.text || '';
    } catch (error) {
      console.error('OCR Microservice Error (Is the Python server running on port 8000?):', error.message);
      return '';
    }
  }
}

module.exports = new OCRService();
