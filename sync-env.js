const fs = require('fs');
const path = require('path');

function syncEnv() {
  const envPath = path.join(__dirname, '.env');
  let url = '';
  let key = '';

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('SUPABASE_URL=')) {
        url = trimmed.slice('SUPABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '');
      } else if (trimmed.startsWith('SUPABASE_ANON_KEY=')) {
        key = trimmed.slice('SUPABASE_ANON_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
      }
    });
  }

  const jsContent = `const SUPABASE_CONFIG = {
  url: "${url}",
  anonKey: "${key}"
};
`;

  fs.writeFileSync(path.join(__dirname, 'supabase-config.js'), jsContent, 'utf8');
}

syncEnv();
