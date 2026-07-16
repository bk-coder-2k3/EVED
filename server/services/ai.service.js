const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

const ensureInit = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined in .env');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use the latest flash model available for this API key
    model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" } 
    });
  }
};

/**
 * Parses a batch of raw OCR texts into structured JSON voter data using Gemini 1.5 Flash.
 * @param {string[]} ocrTextsBatch - Array of raw OCR texts.
 * @returns {Promise<Array>} - Array of parsed voter objects in the same order.
 */
exports.parseVoterBatch = async (ocrTextsBatch) => {
  try {
    ensureInit();

    const prompt = `You are an expert data extraction system for Indian Electoral Rolls.
I am providing you with a batch of ${ocrTextsBatch.length} independent OCR texts extracted from different voter cards.
They are strictly separated by "---CARD [index]---".

Extract the fields for EACH card strictly using ONLY the text within its section. Do NOT mix data or EPIC numbers between cards!

Fields to extract:
- epicNumber: The Voter ID (e.g., ZQO4003109). Auto-correct common OCR confusions (e.g., Z vs 2).
- name: The full name of the elector.
- relationName: The name of the relative.
- relationType: The type of relation ("Father", "Husband", "Mother", "Wife", "Other").
- houseNumber: The house number exactly as it appears.
- age: The age (integer).
- gender: The gender ("Male", "Female", "Third Gender").

Input Data:
${ocrTextsBatch.map((t, idx) => `---CARD ${idx}---
${t}`).join('\n\n')}

Return a JSON array containing exactly ${ocrTextsBatch.length} objects. Each object MUST include a "card_index" field matching the input index (0 to ${ocrTextsBatch.length - 1}).
If a card is completely empty, return empty strings for its fields, but include the "card_index".
`;

    console.log(`\n🤖 [AI Service] Sending batch of ${ocrTextsBatch.length} cards to Gemini AI...`);
    
    // Add a 30-second timeout to prevent indefinite hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Gemini API request timed out after 30 seconds')), 30000)
    );

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ]);
    
    console.log(`✅ [AI Service] Received response from Gemini AI. Formatting output...`);
    
    let text = result.response.text();
    
    // 1. Strip markdown blocks if Gemini accidentally wraps the JSON
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ [AI Service] JSON Parse Error! Raw output from Gemini:');
      console.error(text); // Log the exact string to debug what went wrong
      throw new Error(`Failed to parse Gemini JSON: ${parseError.message}`);
    }
    
    // Ensure the array is sorted exactly by the input order just in case Gemini shuffled them
    if (Array.isArray(parsed)) {
      parsed.sort((a, b) => {
        const idxA = a.card_index !== undefined ? a.card_index : 0;
        const idxB = b.card_index !== undefined ? b.card_index : 0;
        return idxA - idxB;
      });
    }

    return parsed;
  } catch (err) {
    console.error('[Gemini AI Service Error]:', err.message);
    throw err; // Propagate the error so the controller can handle it
  }
};
