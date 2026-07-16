class ParserService {
  /**
   * Parses raw OCR text into structured Voter details
   */
  parseVoterText(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    // Join with spaces to prevent multi-line breaks from ruining regex matches
    const fullText = lines.join(' ');
    const cleanedText = this.cleanOCRText(fullText);

    const data = {
      epicNumber: this.extractEpic(cleanedText) || this.extractEpic(rawText),
      name: this.extractName(cleanedText),
      relationName: this.extractRelationName(cleanedText),
      relationType: this.extractRelationType(cleanedText),
      houseNumber: this.extractHouseNumber(cleanedText),
      age: this.extractAge(cleanedText),
      gender: this.extractGender(cleanedText)
    };

    return data;
  }

  cleanOCRText(text) {
    return text
      // Common OCR label misspellings
      .replace(/Nane/gi, 'Name')
      .replace(/Mame/gi, 'Name')
      .replace(/Elector.*?s/gi, "Elector's")
      .replace(/Fsther/gi, 'Father')
      .replace(/Hushend/gi, 'Husband')
      .replace(/Hous[e\s]*No/gi, 'House No')
      .replace(/H0use/gi, 'House')
      .replace(/H\.?\s*No\.?/gi, 'House No')
      .replace(/Aqe/gi, 'Age')
      .replace(/Aqg/gi, 'Age')
      .replace(/Gendet/gi, 'Gender')
      .replace(/Gen[\s]*der/gi, 'Gender');
  }

  cleanValue(str) {
    // Removes leading punctuations that might accidentally be matched
    return str.replace(/^[:\-\.,]+\s*/, '').trim().replace(/\s+/g, ' ');
  }

  cleanEpic(epic) {
    if (!epic) return '';
    // Standard modern EPIC is 10 chars: 3 Letters + 7 Numbers
    if (epic.length === 10) {
      let prefix = epic.substring(0, 3);
      let suffix = epic.substring(3);
      
      // Force first 3 chars to be letters (fix OCR hallucinating numbers)
      prefix = prefix.replace(/0/g, 'O').replace(/1/g, 'I').replace(/2/g, 'Z').replace(/5/g, 'S').replace(/8/g, 'B');
      
      // Force last 7 chars to be numbers (fix OCR hallucinating letters)
      suffix = suffix.replace(/O/gi, '0').replace(/I/gi, '1').replace(/Z/gi, '2').replace(/S/gi, '5').replace(/B/gi, '8').replace(/l/gi, '1').replace(/Q/gi, '0');

      return prefix + suffix;
    }
    return epic;
  }

  extractEpic(text) {
    let extracted = '';
    
    // 1st Priority: Legacy formats with slashes (e.g., UP/41/200/0123456)
    // OCR might hallucinate numbers/letters, so we allow [A-Z0-9] in the blocks
    const legacyMatch = text.match(/[A-Z]{2,3}\/[A-Z0-9]{1,2}\/[A-Z0-9]{2,3}\/[A-Z0-9]{6,7}/i);
    if (legacyMatch) return legacyMatch[0].toUpperCase();

    const words = text.replace(/[:\-\.,]/g, ' ').split(/\s+/);
    
    // 2nd Priority: Look for standalone words that strictly match modern EPIC format (2-4 letters + 6-8 numbers)
    const strictRegex = /^[A-Z]{2,4}[0-9]{6,8}$/i;
    for (const word of words) {
      if (strictRegex.test(word)) {
        extracted = word.toUpperCase();
        break;
      }
    }

    // 3rd Priority: Strict pattern found inside merged text
    if (!extracted) {
      const strictMergedMatch = text.match(/[A-Z]{2,4}[0-9]{6,8}/i);
      if (strictMergedMatch) extracted = strictMergedMatch[0].toUpperCase();
    }

    // 4th Priority: Dynamic Alphanumeric Block (OCR Hallucinations & Varied Lengths)
    // Looks for any string between 8 and 16 characters that has a mix of letters and numbers.
    // Must have at least 1 letter and 3 numbers to be considered a dynamic EPIC number, safely avoiding names.
    if (!extracted) {
      for (const word of words) {
        const cleanWord = word.replace(/[^A-Z0-9]/gi, ''); // Strip weird chars to check length
        if (cleanWord.length >= 8 && cleanWord.length <= 16) {
          const letterCount = (cleanWord.match(/[A-Z]/gi) || []).length;
          const numberCount = (cleanWord.match(/[0-9]/g) || []).length;
          
          if (letterCount >= 1 && numberCount >= 3) {
            extracted = word.toUpperCase();
            break;
          }
        }
      }
    }

    return this.cleanEpic(extracted);
  }

  extractName(text) {
    // Negative lookbehind: Ensure "Name" is not preceded by Father's, Husband's, etc.
    const regex = /(?<!(?:Father'?s|Husband'?s|Mother'?s|Wife'?s|Fathers|Husbands|Mothers|Wifes)\s*)(?:Name|Elector'?s Name)\s*[:\-\.]?\s*(.+?)\s*(?:Father|Husband|Mother|Wife|House|Age|Photo|Gender|$)/i;
    const match = text.match(regex);
    if (match && match[1]) {
      return this.cleanValue(match[1]);
    }
    return '';
  }

  extractRelationType(text) {
    if (/Husband/i.test(text)) return 'Husband';
    if (/Mother/i.test(text)) return 'Mother';
    if (/Father/i.test(text)) return 'Father';
    if (/Wife/i.test(text)) return 'Wife';
    if (/Other/i.test(text)) return 'Other';
    return 'Father'; // Default fallback
  }

  extractRelationName(text) {
    const match = text.match(/(?:Father'?s|Husband'?s|Mother'?s|Wife'?s|Fathers|Husbands|Mothers|Wifes)\s*Name\s*[:\-\.]?\s*(.+?)\s*(?:House|Age|Photo|Gender|$)/i);
    if (match && match[1]) {
      return this.cleanValue(match[1]);
    }
    return '';
  }

  extractHouseNumber(text) {
    // Catch variations of House Number
    const match = text.match(/(?:House No|House Number|House)\s*[:\-\.,]?\s*(.+?)\s*(?:Age|Photo|Gender|$)/i);
    if (match && match[1]) {
      let houseNo = this.cleanValue(match[1]);
      // Apply common OCR fixes for house numbers (e.g., "Oe" -> "06", "O" -> "0", "l" -> "1")
      houseNo = houseNo.replace(/O/g, '0').replace(/o/g, '0').replace(/e/g, '6').replace(/l/g, '1');
      return houseNo;
    }
    return '';
  }

  extractAge(text) {
    const match = text.match(/Age\s*[:\-\.,]?\s*(\d{2})/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  extractGender(text) {
    if (/Female/i.test(text) || /Fema/i.test(text)) return 'Female';
    if (/Male/i.test(text)) return 'Male';
    if (/Other/i.test(text)) return 'Other';
    return 'Unknown';
  }
}

module.exports = new ParserService();
