import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG content for the favicon (using the church icon from Logo component)
const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="url(#grad)"/>
  <g transform="translate(20, 20) scale(2.5)">
    <path d="m18 7 4 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9l4-2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M18 22V5l-6-3-6 3v17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M12 7v5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M10 9h4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>
`;

// SVG content for larger icons (apple-touch-icon, etc.)
const largeSvgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="180" height="180" rx="36" fill="url(#grad)"/>
  <g transform="translate(36, 36) scale(4.5)">
    <path d="m18 7 4 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9l4-2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M18 22V5l-6-3-6 3v17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M12 7v5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M10 9h4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>
`;

// Favicon sizes and their purposes
const faviconSizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  { size: 64, name: 'favicon-64x64.png' },
  { size: 96, name: 'favicon-96x96.png' },
  { size: 128, name: 'favicon-128x128.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  { size: 144, name: 'msapplication-icon-144x144.png' },
  { size: 150, name: 'mstile-150x150.png' },
];

async function generateFavicons() {
  const publicDir = path.join(__dirname, '../public');
  
  console.log('Generating favicon files...');
  
  for (const { size, name } of faviconSizes) {
    try {
      // Use large SVG for icons 144px and above, small SVG for smaller icons
      const svgToUse = size >= 144 ? largeSvgContent : svgContent;
      
      await sharp(Buffer.from(svgToUse))
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, name));
      
      console.log(`✓ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }
  
  // Generate ICO file (multi-size favicon)
  try {
    const icoSizes = [16, 32, 48];
    const icoBuffers = [];
    
    for (const icoSize of icoSizes) {
      const buffer = await sharp(Buffer.from(svgContent))
        .resize(icoSize, icoSize)
        .png()
        .toBuffer();
      icoBuffers.push(buffer);
    }
    
    // For now, just copy the 32x32 PNG as favicon.ico
    // In a real implementation, you'd use a library like 'to-ico' to create proper ICO files
    await sharp(Buffer.from(svgContent))
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));
    
    console.log('✓ Generated favicon.ico');
  } catch (error) {
    console.error('✗ Failed to generate favicon.ico:', error.message);
  }
  
  console.log('\nFavicon generation complete!');
}

generateFavicons().catch(console.error);