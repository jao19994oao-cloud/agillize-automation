const required = [
  'JWT_SECRET',
  'DB_USER',
  'DB_HOST',
  'DB_NAME',
  'DB_PASSWORD'
];

const missing = required.filter(k => !process.env[k]);

if (missing.length > 0) {
  console.error('ERROR: Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

console.log('OK: All required environment variables are set.');
