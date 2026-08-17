const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const ROUTES = ['/', '/home', '/profile', '/trips', '/history'];
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'screenshots');

// Device dimensions for iPhone 14 Pro
const VIEWPORT = {
  width: 393,
  height: 852,
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
};

async function captureScreenshots() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Launching browser for ${BASE_URL}...`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  for (const route of ROUTES) {
    const url = `${BASE_URL}${route}`;
    const filename = route === '/' ? 'index.png' : `${route.replace(/^\//, '').replace(/[/\\?%*:|"<>]/g, '-')}.png`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    try {
      console.log(`Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Capture full-page screenshot
      await page.screenshot({ path: outputPath, fullPage: true });
      console.log(`Saved screenshot: ${outputPath}`);
    } catch (error) {
      if (error.message.includes('ERR_CONNECTION_REFUSED')) {
        console.error(`❌ Connection refused at ${url}.`);
        console.error(`   Make sure your dev server is running ('npm run dev')!`);
        console.error(`   If your dev server is running on port 3000 (default Next.js port), set BASE_URL:`);
        console.error(`   PowerShell: $env:BASE_URL="http://localhost:3000"; npm run screenshot`);
      } else {
        console.error(`Failed to capture screenshot for ${route}:`, error.message);
      }
    }
  }

  await browser.close();
  console.log('Finished capturing all screenshots.');
}

captureScreenshots().catch((err) => {
  console.error('Error running screenshot script:', err);
  process.exit(1);
});
