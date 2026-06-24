import { readFileSync, writeFileSync } from 'fs';

const path = 'C:/Users/R.Murugesan/.gemini/antigravity/playground/ai-agent-app/frontend/src/App.jsx';
let c = readFileSync(path, 'utf8');

// The broken version looks like:  {⚡ Run JS Sandbox,...}.map
// Restore proper array syntax with quotes and brackets
c = c.replace(
  /\{⚡ Run JS Sandbox,🔍 Tavily Web Docs,💾 Auto-Caching,📋 Clipboard Copy,🛡️ Safe Execution\.map/,
  {['⚡ Run JS Sandbox', '🔍 Tavily Web Docs', '💾 Auto-Caching', '📋 Clipboard Copy', '🛡️ Safe Execution'].map
);

writeFileSync(path, c, 'utf8');
console.log('Array syntax restored!');

// Verify
const check = readFileSync(path, 'utf8');
const idx = check.indexOf('Run JS');
console.log('Result:', JSON.stringify(check.slice(idx - 10, idx + 100)));
