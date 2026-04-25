// routes/transactions.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// GET /api/transactions?userId=xxx
router.get('/', (req, res) => {
  const { userId } = req.query;
  let list = db.transactions;
  if (userId) list = list.filter(t => t.userId === userId);
  // Ordenar por data decrescente
  list = list.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ success: true, data: list, total: list.length });
});

// POST /api/transactions — simular importação Open Finance
router.post('/', (req, res) => {
  const { userId, type, amount, description, source, date } = req.body;

  if (!userId || !type || !amount) {
    return res.status(400).json({ success: false, message: 'userId, type e amount são obrigatórios.' });
  }

  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  if (!user.consentGiven) return res.status(403).json({ success: false, message: 'Usuário não deu consentimento para compartilhamento de dados.' });

  const transaction = {
    id: uuidv4(),
    userId,
    type,
    amount: parseFloat(amount),
    description: description || '',
    source: source || 'manual',
    date: date || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  db.transactions.push(transaction);
  res.status(201).json({ success: true, data: transaction });
});

// POST /api/transactions/simulate/:userId — simular dados Open Finance de forma aleatória
router.post('/simulate/:userId', (req, res) => {
  const user = db.users.find(u => u.id === req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  if (!user.consentGiven) return res.status(403).json({ success: false, message: 'Consentimento necessário.' });

  const { dias = 30 } = req.body;
  const novas = [];
  const now = Date.now();

  for (let i = parseInt(dias); i >= 0; i--) {
    const day = new Date(now - i * 86400000);
    if (day.getDay() === 0) continue; // pula domingo

    if (Math.random() > 0.2) {
      const income = 80 + Math.floor(Math.random() * 250);
      const t = {
        id: uuidv4(),
        userId: user.id,
        type: 'income',
        amount: income,
        description: 'Serviços prestados',
        source: ['uber', 'ifood', 'getninjas', 'manual'][Math.floor(Math.random() * 4)],
        date: day.toISOString(),
        createdAt: new Date().toISOString(),
      };
      db.transactions.push(t);
      novas.push(t);
    }

    if (Math.random() > 0.5) {
      const expense = 20 + Math.floor(Math.random() * 80);
      const t = {
        id: uuidv4(),
        userId: user.id,
        type: 'expense',
        amount: expense,
        description: 'Despesa operacional',
        source: 'manual',
        date: day.toISOString(),
        createdAt: new Date().toISOString(),
      };
      db.transactions.push(t);
      novas.push(t);
    }
  }

  res.json({ success: true, message: `${novas.length} transações simuladas.`, data: novas });
});

module.exports = router;
