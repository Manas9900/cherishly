const fs = require('fs');
const html = fs.readFileSync('C:/Users/manas/.gemini/antigravity/scratch/girlfriend-site/index.html', 'utf8');

// Find the script contents
const m = html.match(/function _0x54da[\s\S]*?<\/script>/);
if (m) {
    console.log('Script length:', m[0].length);
    // Let's search inside the script for references to om-gf-try or stage
    // To do that, evaluate _0x54da table
    const sub = m[0].substring(0, 15000);
    // Let's extract _0x54da and _0xfccc
    const tableMatch = m[0].match(/function _0x54da.*?function _0xfccc\(\)\{var _0x58ef7a=(\[.*?\]);return _0x58ef7a;\}/);
    if (tableMatch) {
        const arr = eval(tableMatch[1]);
        console.log('Arr length:', arr.length);
        const idx = arr.indexOf('om-gf-try');
        console.log('om-gf-try index in arr:', idx, 'hex code:', '0x' + (idx + 0xb4).toString(16));
        const stageIdx = arr.indexOf('om-gf-stage');
        console.log('om-gf-stage index in arr:', stageIdx, 'hex code:', '0x' + (stageIdx + 0xb4).toString(16));
    }
}
