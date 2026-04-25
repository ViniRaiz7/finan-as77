// routes/users.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// GET /api/users — listar todos
router.get('/', (req, res) => {
  res.json({ success: true, data: db.users });
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  res.json({ success: true, data: user });
});

// POST /api/users — cadastrar novo usuário
router.post('/', (req, res) => {
  const { name, cpf, phone, profession } = req.body;
  if (!name || !cpf) {
    return res.status(400).json({ success: false, message: 'Nome e CPF são obrigatórios.' });
  }

  // Verificar duplicata de CPF
  if (db.users.find(u => u.cpf === cpf)) {
    return res.status(409).json({ success: false, message: 'CPF já cadastrado.' });
  }

  const user = {
    id: uuidv4(),
    name,
    cpf,
    phone: phone || '',
    profession: profession || 'Autônomo',
    createdAt: new Date().toISOString(),
    consentGiven: false,
    deviceId: req.headers['x-device-id'] || uuidv4(),
  };

  db.users.push(user);
  res.status(201).json({ success: true, data: user });
});

// PATCH /api/users/:id/consent — registrar consentimento Open Finance
router.patch('/:id/consent', (req, res) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });

  user.consentGiven = true;
  user.consentDate = new Date().toISOString();
  user.consentScope = req.body.scope || ['transactions', 'balance'];

  res.json({ success: true, data: user, message: 'Consentimento registrado com sucesso.' });
});

module.exports = router;
