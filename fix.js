const fs = require('fs');
const path = require('path');

const garbledHeader = 'เธ„เน‰เธ™เธซเธฒเธชเธดเธ™เธ„เน‰เธฒ';
const correctHeader = 'ค้นหาสินค้า';

const garbledPlaceholder = 'เธ„เน‰เธ™เธซเธฒ เน€เธ„เธฃเธทเนˆเธญเธ‡เธกเธทเธญ 1, เน€เธ„เธฃเธทเนˆเธญเธ‡เธกเธทเธญ 2, เธฃเธธเนˆเธ™เธกเธทเธญเธ–เธทเธญ...';
const correctPlaceholder = 'ค้นหา มือถือ 1, มือถือ 2, รุ่นมือถือ...';

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    if (content.includes(garbledHeader)) {
        content = content.replace(new RegExp(garbledHeader, 'g'), correctHeader);
        changed = true;
    }
    if (content.includes(garbledPlaceholder)) {
        content = content.replace(new RegExp(garbledPlaceholder, 'g'), correctPlaceholder);
        changed = true;
    }
    
    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed', file);
    }
});
