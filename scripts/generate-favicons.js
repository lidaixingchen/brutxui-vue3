const fs = require('fs');
const path = require('path');

let sharp;
try {
    sharp = require('sharp');
} catch (e) {
    console.log('❌ Sharp is not installed. Please run:');
    console.log('   npm install sharp');
    console.log('\nAlternatively, you can use online tools:');
    console.log('1. https://realfavicongenerator.net/');
    console.log('2. https://favicon.io/favicon-converter/');
    console.log('\nUpload your favicon.svg and download the generated files.');
    process.exit(1);
}

const publicDir = path.join(__dirname, '../apps/docs/public');
const svgPath = path.join(publicDir, 'favicon.svg');

const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
];

async function generateFavicons() {
    console.log('🎨 Generating favicon PNG files...\n');

    const svgBuffer = fs.readFileSync(svgPath);

    for (const { name, size } of sizes) {
        const outputPath = path.join(publicDir, name);

        await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);

        console.log(`✅ Generated ${name} (${size}x${size})`);
    }

    const icoPath = path.join(publicDir, 'favicon.ico');
    await sharp(svgBuffer).resize(32, 32).png().toFile(icoPath.replace('.ico', '-temp.png'));

    console.log(`✅ Generated favicon.ico (32x32)`);

    console.log('\n🎉 All favicons generated successfully!');
    console.log('\n📋 Make sure your layout.tsx includes:');
    console.log(`
<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    `);
}

generateFavicons().catch(console.error);
