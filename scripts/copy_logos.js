const fs = require('fs');
const path = require('path');

const srcFile = 'C:\\Users\\MONSURAT\\.gemini\\antigravity-ide\\brain\\0dcf1eac-751f-459b-bee4-c1ed32450f09\\route_logo_var_c_1784147696283.png';
const destFile = path.join(__dirname, '..', 'public', 'route-logo.png');

if (fs.existsSync(srcFile)) {
  fs.copyFileSync(srcFile, destFile);
  console.log('Successfully copied logo to public/route-logo.png');
} else {
  console.error('Source file not found: ' + srcFile);
}
