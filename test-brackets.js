const fs = require('fs');
const content = fs.readFileSync('c:/Users/Lazy/Desktop/Paomobile Web Main/seller-chat.js', 'utf8');
let balance = 0;
let inString = false;
let stringChar = '';
let inLineComment = false;
let inBlockComment = false;

for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const next = content[i+1];
    
    if (inLineComment) {
        if (c === '\n') inLineComment = false;
        continue;
    }
    if (inBlockComment) {
        if (c === '*' && next === '/') {
            inBlockComment = false;
            i++;
        }
        continue;
    }
    if (inString) {
        if (c === '\\') { i++; continue; }
        if (c === stringChar) inString = false;
        continue;
    }
    
    if (c === '/' && next === '/') { inLineComment = true; i++; continue; }
    if (c === '/' && next === '*') { inBlockComment = true; i++; continue; }
    if (c === '"' || c === "'" || c === '\') { inString = true; stringChar = c; continue; }
    
    if (c === '{') balance++;
    if (c === '}') {
        balance--;
        if (balance < 0) {
            let line = content.substring(0, i).split('\n').length;
            console.log('Negative balance at line ' + line);
            break;
        }
    }
}
console.log('Final balance: ' + balance);
