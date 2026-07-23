FROM node:20-slim

# Install graphicsmagick/imagemagick and Ghostscript if needed for PDF processing
# (Assuming cropService or pdfService uses them)
RUN apt-get update && apt-get install -y \
    ghostscript \
    graphicsmagick \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000
CMD ["npm", "start"]
