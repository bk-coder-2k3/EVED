const fs = require('fs');
const PDFParser = require("pdf2json");
const path = require('path');

const pdfPath = path.join(__dirname, 'uploads/pdf/1783426834612-495692032.pdf');

const pdfParser = new PDFParser(this, 1);

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
pdfParser.on("pdfParser_dataReady", pdfData => {
    const rawText = pdfParser.getRawTextContent().trim();
    if (rawText.length > 50) {
        console.log("SUCCESS! This PDF contains a digital text layer.");
        console.log(rawText.substring(0, 500));
    } else {
        console.log("FAILURE. No text layer.");
    }
});

pdfParser.loadPDF(pdfPath);
