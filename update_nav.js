const fs = require('fs');
const path = require('path');

const dir = '.';
const files = fs.readdirSync(dir);

const desktopPattern = /<\/li>\s*<li><a href="index\.html#why-us">/g;
const desktopReplacement = `</li>\n                <li><a href="repair-track.html">เช็คสถานะงานซ่อม</a></li>\n                <li><a href="index.html#why-us">`;

const mobilePattern = /<\/div><a href="index\.html#why-us">/g;
const mobileReplacement = `</div><a href="repair-track.html">เช็คสถานะงานซ่อม</a><a href="index.html#why-us">`;

let count = 0;

for (const file of files) {
    if (file.endsWith('.html') && !['index.html', 'repair-track.html', 'seller-repairs.html'].includes(file)) {
        const filePath = path.join(dir, file);
        const originalContent = fs.readFileSync(filePath, 'utf-8');
        
        let newContent = originalContent.replace(desktopPattern, desktopReplacement);
        newContent = newContent.replace(mobilePattern, mobileReplacement);
        
        if (newContent !== originalContent) {
            fs.writeFileSync(filePath, newContent, 'utf-8');
            console.log(`Updated ${file}`);
            count++;
        }
    }
}

console.log(`Total files updated: ${count}`);
