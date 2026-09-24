const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function processImage() {
  const inputImagePath = 'C:\\Users\\MONSURAT\\.gemini\\antigravity-ide\\brain\\68657d30-2bc3-4b10-a1c9-34e29f5e01fc\\hero_phone_facing_left_1790201126684.jpg';
  const outputImagePath = path.join(__dirname, '../public/screenshots/hero_phone.png');

  if (!fs.existsSync(inputImagePath)) {
    console.error("Input image not found at:", inputImagePath);
    return;
  }

  const base64Image = fs.readFileSync(inputImagePath, { encoding: 'base64' });
  const dataUrl = `data:image/jpeg;base64,${base64Image}`;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const resultBase64 = await page.evaluate(async (imgSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        const width = canvas.width;
        const height = canvas.height;
        const visited = new Uint8Array(width * height);
        const queue = [];

        // Push border pixels
        for (let x = 0; x < width; x++) {
          queue.push(x, 0);
          queue.push(x, height - 1);
        }
        for (let y = 0; y < height; y++) {
          queue.push(0, y);
          queue.push(width - 1, y);
        }

        while (queue.length > 0) {
          const y = queue.pop();
          const x = queue.pop();
          const idx = y * width + x;

          if (visited[idx]) continue;
          visited[idx] = 1;

          const p = (y * width + x) * 4;
          const r = data[p];
          const g = data[p + 1];
          const b = data[p + 2];

          // Check if pixel is dark background (threshold < 22)
          if (r < 22 && g < 22 && b < 22) {
            data[p + 3] = 0; // Make transparent

            // Neighbors
            if (x > 0 && !visited[idx - 1]) queue.push(x - 1, y);
            if (x < width - 1 && !visited[idx + 1]) queue.push(x + 1, y);
            if (y > 0 && !visited[idx - width]) queue.push(x, y - 1);
            if (y < height - 1 && !visited[idx + width]) queue.push(x, y + 1);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imgSrc;
    });
  }, dataUrl);

  await browser.close();

  const base64Data = resultBase64.replace(/^data:image\/png;base64,/, "");
  fs.writeFileSync(outputImagePath, base64Data, 'base64');
  console.log("Successfully created transparent PNG at public/screenshots/hero_phone.png");
}

processImage().catch(console.error);
