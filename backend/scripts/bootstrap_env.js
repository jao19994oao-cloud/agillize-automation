const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envExamplePath = path.resolve(__dirname, '..', '.env.example');
const envPath = path.resolve(__dirname, '..', '.env');

if (!fs.existsSync(envExamplePath)) {
  console.error('.env.example not found. Please create one first.');
  process.exit(1);
}

const example = fs.readFileSync(envExamplePath, 'utf8');
const secret = crypto.randomBytes(32).toString('hex');

let out = example.replace(/JWT_SECRET=.*/i, `JWT_SECRET=${secret}`);

if (fs.existsSync(envPath)) {
  console.warn('.env já existe — o arquivo não será sobrescrito automaticamente. Renomeie ou remova antes de rodar este script se quiser regenerar.');
  process.exit(0);
}

fs.writeFileSync(envPath, out, { mode: 0o600 });
console.log('Arquivo `.env` criado em:', envPath);
console.log('JWT_SECRET gerado e salvo em `.env` (copie e guarde em local seguro se precisar).');
console.log('Agora edite o `.env` com credenciais reais do banco se necessário.');
