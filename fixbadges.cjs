const fs = require('fs');
const p = 'C:/Users/R.Murugesan/.gemini/antigravity/playground/ai-agent-app/frontend/src/App.jsx';
let c = fs.readFileSync(p, 'utf8');

// The broken string (emojis present but no quotes/brackets)
const brokenStr = '{\u26a1 Run JS Sandbox,\uD83D\uDD0D Tavily Web Docs,\uD83D\uDCBE Auto-Caching,\uD83D\uDCCB Clipboard Copy,\uD83D\uDEE1\uFE0F Safe Execution.map';
const fixedStr  = "['\u26a1 Run JS Sandbox', '\uD83D\uDD0D Tavily Web Docs', '\uD83D\uDCBE Auto-Caching', '\uD83D\uDCCB Clipboard Copy', '\uD83D\uDEE1\uFE0F Safe Execution'].map";

if (c.includes(brokenStr)) {
  c = c.replace(brokenStr, fixedStr);
  fs.writeFileSync(p, c, 'utf8');
  console.log('FIXED badges array!');
} else {
  console.log('String not found - checking context...');
  const idx = c.indexOf('Run JS');
  console.log(JSON.stringify(c.slice(idx - 10, idx + 130)));
}