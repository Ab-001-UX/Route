const fs = require('fs');
const path = require('path');

// Helper to convert strings to kebab-case
function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase to kebab-case
    .replace(/[\s_]+/g, '-')             // spaces and underscores to dashes
    .replace(/[^a-zA-Z0-9-]/g, '')       // remove special chars
    .toLowerCase();
}

// Check if a path represents primitive colors
function isPrimitiveColor(keyPath) {
  const pathStr = keyPath.join('.').toLowerCase();
  
  // Skip explicitly labeled primitive paths
  if (pathStr.includes('primitive') || pathStr.includes('palette') || pathStr.includes('ref')) {
    return true;
  }
  
  // Standard primitive color names
  const primitiveColors = [
    'blue', 'red', 'green', 'yellow', 'orange', 'purple', 
    'pink', 'teal', 'indigo', 'gray', 'grey', 'neutral', 
    'slate', 'zinc', 'stone'
  ];
  
  for (let i = 0; i < keyPath.length; i++) {
    const segment = keyPath[i].toLowerCase();
    if (primitiveColors.includes(segment)) {
      // If the next segment is a shade number (e.g. blue.500)
      const nextSegment = keyPath[i + 1];
      if (nextSegment && !isNaN(Number(nextSegment))) {
        return true;
      }
    }
  }
  return false;
}

// Recursive helper to traverse token objects
function extractTokens(obj, currentPath = [], tokenList = []) {
  if (obj === null || typeof obj !== 'object') {
    return tokenList;
  }

  // A token is a leaf node if it has a 'value' key
  if (Object.prototype.hasOwnProperty.call(obj, 'value') && !Object.prototype.hasOwnProperty.call(obj.value, 'value')) {
    tokenList.push({
      path: currentPath,
      value: obj.value,
      type: obj.type,
      description: obj.description || obj.semantic || ''
    });
    return tokenList;
  }

  for (const key of Object.keys(obj)) {
    extractTokens(obj[key], [...currentPath, key], tokenList);
  }

  return tokenList;
}

function generateCSS() {
  const colorFilePath = path.join(__dirname, '..', 'route-color-tokens.json');
  const typographyFilePath = path.join(__dirname, '..', 'design-tokens.tokens (3).json');
  const outputDir = path.join(__dirname, '..', 'tokens');
  const outputFilePath = path.join(outputDir, 'theme.css');

  console.log('Reading token files...');
  
  let colorData = {};
  let typoData = {};

  try {
    colorData = JSON.parse(fs.readFileSync(colorFilePath, 'utf8'));
  } catch (err) {
    console.error('Error reading route-color-tokens.json:', err.message);
  }

  try {
    typoData = JSON.parse(fs.readFileSync(typographyFilePath, 'utf8'));
  } catch (err) {
    console.error('Error reading design-tokens.tokens (3).json:', err.message);
  }

  const colorTokens = extractTokens(colorData);
  const typoTokens = extractTokens(typoData);

  let cssContent = '/* Generated Design Tokens CSS Variables */\n\n:root {\n';

  // Process Colors
  cssContent += '  /* === COLORS === */\n';
  colorTokens.forEach(token => {
    // Differentiate primitive colors and color roles
    if (isPrimitiveColor(token.path)) {
      console.log(`Skipping primitive color: ${token.path.join('.')}`);
      return;
    }

    // Format CSS Variable Name
    // Remove "color" prefix segment if present to avoid --color-color-
    const cleanPath = token.path[0] === 'color' ? token.path.slice(1) : token.path;
    const varName = `--color-${cleanPath.map(toKebabCase).join('-')}`;
    
    let value = token.value;
    const comment = token.description ? ` /* ${token.description} */` : '';
    cssContent += `  ${varName}: ${value};${comment}\n`;
  });

  // Process Typography / Grid / Spacing
  cssContent += '\n  /* === TYPOGRAPHY, SPACING & GRIDS === */\n';
  
  typoTokens.forEach(token => {
    const cleanPath = token.path.map(toKebabCase);
    const varName = `--${cleanPath.join('-')}`;
    
    let value = token.value;
    const propName = token.path[token.path.length - 1].toLowerCase();

    // Format value with unit if it's a number
    if (typeof value === 'number') {
      if (propName === 'fontweight') {
        value = value.toString();
      } else if (
        propName.includes('size') || 
        propName.includes('height') || 
        propName.includes('spacing') || 
        propName.includes('indent') ||
        propName.includes('gutter') ||
        propName.includes('offset') ||
        token.path.includes('spacing') ||
        token.path.includes('Spacing variable')
      ) {
        value = `${value}px`;
      }
    }

    const comment = token.description ? ` /* ${token.description} */` : '';
    cssContent += `  ${varName}: ${value};${comment}\n`;
  });

  cssContent += '}\n';

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFilePath, cssContent, 'utf8');
  console.log(`Successfully generated CSS variables at: ${outputFilePath}`);
}

generateCSS();
