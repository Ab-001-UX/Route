const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\MONSURAT\\.gemini\\antigravity-ide\\brain\\b746ac0e-7e6b-463a-a14c-57604293f485';
const destDir = 'c:\\Users\\MONSURAT\\OneDrive\\Desktop\\Route\\public';

const files = [
  'media__1781630289822.png',
  'media__1781630571242.png',
  'media__1781630640205.png'
];

files.forEach(file => {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(destDir, file);
  try {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Successfully copied ${file} to ${destPath}`);
  } catch (err) {
    console.error(`Error copying ${file}:`, err.message);
  }
});
