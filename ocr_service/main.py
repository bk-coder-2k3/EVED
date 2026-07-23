from fastapi import FastAPI, UploadFile, File
from paddleocr import PaddleOCR
import shutil
import os

app = FastAPI(title="Voter OCR Service")

# Initialize PaddleOCR model (English)
# This will download the model files to ~/.paddleocr on first run
ocr = PaddleOCR(use_angle_cls=True, lang='en')

@app.post("/extract")
async def extract_text(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Run inference
        result = ocr.ocr(temp_path)
        
        text_lines = []
        if result and result[0]:
            # result[0] contains a list of lines
            for line in result[0]:
                text = line[1][0]
                text_lines.append(text)
                
        # Join lines into a single string for Node parser
        full_text = "\n".join(text_lines)
        return {"text": full_text}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
