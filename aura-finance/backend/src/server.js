// server.js — Servidor principal da API Aura Finance
const express = require('express');
const cors = require('cors');

const usersRouter = require('./routes/users');
const transactionsRouter = require('./routes/transactions');
const creditRouter = require('./routes/credit');

const app = express();
const PORT = process.env.PORT || 3001;

// Lista de origens permitidas
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
].filter(Boolean);

// Middlewares
app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origin (ex: mobile, Postman) ou da lista permitida
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      // Em produção no Render, aceita qualquer origin para facilitar o deploy inicial
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id'],
  credentials: true,
}));

app.use(express.json());

// Log de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Rotas com prefixo /api
app.use('/api/users', usersRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/credit', creditRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Aura Finance API v1.0',
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Aura Finance API',
    version: '1.0.0',
    endpoints: ['/api/health', '/api/users', '/api/transactions', '/api/credit'],
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor Aura Finance rodando na porta ${PORT}`);
});

module.exports = app;
