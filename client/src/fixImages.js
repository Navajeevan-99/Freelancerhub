const fs = require('fs');
const path = require('path');

const targetDir = 'd:/EDUCATION/SEM6/PROJECTS/FREELANCERHUB/client/src';

const processFile = (filePath, helperDepth) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  let modified = false;

  // Ensure helper is imported
  if (!content.includes('getImageUrl')) {
    const importStr = `import { getImageUrl } from "${helperDepth}utils/image";\n`;
    content = importStr + content;
    modified = true;
  }

  // Replace <img src={something} ...> with <img src={getImageUrl(something)} ...>
  // Be careful with nested functions or already stringified ones.
  // We use a regex, but handle carefully:
  // We target standard pattern `src={var}` or `src={var || var2}`
  const regex = /<img([^>]*?)src=\{([^}]*?)\}([^>]*?)>/g;
  content = content.replace(regex, (match, prefix, srcExp, suffix) => {
    if (srcExp.includes('getImageUrl(')) return match; // Already fixed
    modified = true;
    return `<img${prefix}src={getImageUrl(${srcExp})}${suffix}>`;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated images in: ${filePath}`);
  }
};

const components = [
  { p: 'components/GigCard.jsx', d: '../' }
];

const pages = [
  'Profile.jsx', 'OrderRequirements.jsx', 'Network.jsx', 
  'Messages.jsx', 'GigCreate.jsx', 'Feed.jsx', 'Dashboard.jsx', 'GigDetail.jsx'
];

components.forEach(c => processFile(path.join(targetDir, c.p), c.d));
pages.forEach(p => processFile(path.join(targetDir, 'pages', p), '../'));

console.log('Finished updating image paths.');
