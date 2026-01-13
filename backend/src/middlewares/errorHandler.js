module.exports = (err, req, res, next) => {
  console.error(err && err.stack ? err.stack : err);
  const status = err.status || 500;
  const message = err.message || 'Erro interno no servidor';
  res.status(status).json({ error: message });
};