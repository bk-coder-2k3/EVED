require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  console.log('Sending test request to gemini-2.0-flash...');
  
  try {
    const start = Date.now();
    const result = await model.generateContent("Hello! Please reply instantly.");
    console.log(`Response in ${Date.now() - start}ms:`, result.response.text());
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testAPI();
