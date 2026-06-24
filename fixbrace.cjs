const fs = require('fs');
const p = 'C:/Users/R.Murugesan/.gemini/antigravity/playground/ai-agent-app/frontend/src/App.jsx';
let c = fs.readFileSync(p, 'utf8');

// The broken line (array without JSX braces)
const broken = "                ['\u26a1 Run JS Sandbox', '\uD83D\uDD0D Tavily Web Docs', '\uD83D\uDCBE Auto-Caching', '\uD83D\uDCCB Clipboard Copy', '\uD83D\uDEE1\uFE0F Safe Execution'].map((cap, i) => (";
const fixed  = "                {['\u26a1 Run JS Sandbox', '\uD83D\uDD0D Tavily Web Docs', '\uD83D\uDCBE Auto-Caching', '\uD83D\uDCCB Clipboard Copy', '\uD83D\uDEE1\uFE0F Safe Execution'].map((cap, i) => (";

if (c.includes(broken)) {
  c = c.replace(broken, fixed);
  // Also fix missing closing }) if needed
  // After the .map block: ))} should exist - check
  fs.writeFileSync(p, c, 'utf8');
  console.log('FIXED: Added opening { to badge array');
} else {
  const idx = c.indexOf('Run JS');
  console.log('Not matched. Current:', JSON.stringify(c.slice(idx-20, idx+80)));
}