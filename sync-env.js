const fs = require('fs');
const path = require('path');

function syncEnv() {
  const envPath = path.join(__dirname, '.env');
  let url = process.env.SUPABASE_URL || '';
  let key = process.env.SUPABASE_ANON_KEY || '';

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!url && trimmed.startsWith('SUPABASE_URL=')) {
        url = trimmed.slice('SUPABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '');
      } else if (!key && trimmed.startsWith('SUPABASE_ANON_KEY=')) {
        key = trimmed.slice('SUPABASE_ANON_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
      }
    });
  }

  if (!url) {
    url = "https://gwqtjfplefjysjdkfjyi.supabase.co";
  }
  if (!key) {
    key = "sb_publishable_JCy_kQtd54fmsAZuJF08bw_LwzMnXsp";
  }

  const jsContent = `const SUPABASE_CONFIG = {
  url: "${url}",
  anonKey: "${key}"
};
`;

  fs.writeFileSync(path.join(__dirname, 'supabase-config.js'), jsContent, 'utf8');

  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const arquivos = [
    'index.html',
    'painel.html',
    'style.css',
    'script.js',
    'supabase.js',
    'supabase-config.js'
  ];

  arquivos.forEach(arq => {
    const src = path.join(__dirname, arq);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(publicDir, arq));
    }
  });

  const assetsSrc = path.join(__dirname, 'assets');
  const assetsDest = path.join(publicDir, 'assets');
  if (fs.existsSync(assetsSrc)) {
    fs.cpSync(assetsSrc, assetsDest, { recursive: true, force: true });
  }
}

syncEnv();
