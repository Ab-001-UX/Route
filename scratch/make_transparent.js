const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function processImage() {
  const sourceImgPath = path.join(__dirname, '..', 'public', 'screenshots', 'hero_phone.jpg');
  const targetImgPath = path.join(__dirname, '..', 'public', 'screenshots', 'hero_phone.png');

  const imgDataUri = `data:image/jpeg;base64,${fs.readFileSync(sourceImgPath).toString('base64')}`;

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="margin:0; background:transparent;">
        <canvas id="c"></canvas>
        <script>
          window.processCanvas = function(dataUri) {
            return new Promise((resolve) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.getElementById('c');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                const imgData = ctx.getImageData(0, 0, img.width, img.height);
                const data = imgData.data;

                const width = img.width;
                const height = img.height;
                const visited = new Uint8Array(width * height);
                const queue = [];

                // Add all border pixels to flood fill queue if they are dark
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

                  const pIdx = idx * 4;
                  const r = data[pIdx];
                  const g = data[pIdx + 1];
                  const b = data[pIdx + 2];

                  // If pixel is dark background (luminance < 35 or close to #0b0b0b)
                  if (r < 32 && g < 32 && b < 32) {
                    data[pIdx + 3] = 0; // set alpha to 0

                    // Add neighbors
                    if (x > 0 && !visited[idx - 1]) queue.push(x - 1, y);
                    if (x < width - 1 && !visited[idx + 1]) queue.push(x + 1, y);
                    if (y > 0 && !visited[idx - width]) queue.push(x, y - 1);
                    if (y < height - 1 && !visited[idx + width]) queue.push(x, y + 1);
                  }
                }

                // Smooth edges slightly
                ctx.putImageData(imgData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
              };
              img.src = dataUri;
            });
          };
        </script>
      </body>
    </html>
  `);

  const pngDataUri = await page.evaluate(async (uri) => {
    return await window.processCanvas(uri);
  }, imgDataUri);

  await browser.close();

  const base64Data = pngDataUri.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(targetImgPath, Buffer.from(base64Data, 'base64'));
  console.log('Successfully generated transparent PNG at:', targetImgPath);
}

processImage().catch(console.error);
