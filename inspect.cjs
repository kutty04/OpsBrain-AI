const fs=require('fs');
const p='C:/Users/R.Murugesan/.gemini/antigravity/playground/ai-agent-app/frontend/src/App.jsx';
let c=fs.readFileSync(p,'utf8');
const broken=c.indexOf('Run JS');
console.log('Before:',JSON.stringify(c.slice(broken-5,broken+120)));
const oldArr=c.slice(broken-1, broken + c.slice(broken).indexOf('.map'));
console.log('OLD ARR:',JSON.stringify(oldArr));
