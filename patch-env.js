const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'ai-agent-app', 'backend', '.env');
let content = fs.readFileSync(envPath, 'utf8');

// Replace all instances of DATABASE_URL="file:./dev.db" or DATABASE_URL = ...
content = content.replace(/DATABASE_URL\s*=\s*["']?file:[^"\r\n]+["']?/g, '');
// Clean up double empty lines
content = content.replace(/\r?\n\r?\n+/g, '\n');

// Append the new connection string at the bottom
content += '\nDATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.jzpjkjpobqvjattujjfg.supabase.co:5432/postgres"\n';

fs.writeFileSync(envPath, content, 'utf8');
console.log('Successfully updated DATABASE_URL in .env');
