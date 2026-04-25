// routes/credit.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { calcularScore, detectarFraude } = require('../services/scoreEngine');

// GET /api/credit/score/:userId — calcular e retornar score
router.get('/score/:userId', (req, res) => {
  const user = db.users.find(u => u.id === req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  if (!user.consentGiven) return res.status(403).json({ success: false, message: 'Consentimento necessário para análise de score.' });

  const transactions = db.transactions.filter(t => t.userId === user.id);
  const scoreResult = calcularScore(transactions);
  const fraudeResult = detectarFraude(transactions);

  res.json({
    success: true,
    data: {
      userId: user.id,
      userName: user.name,
      ...scoreResult,
      alerta: fraudeResult.suspeito ? fraudeResult.alertas : [],
      analisadoEm: new Date().toISOString(),
    },
  });
});

// POST /api/credit/request — solicitar crédito
router.post('/request', (req, res) => {
  const { userId, valorSolicitado, finalidade } = req.body;

  if (!userId || !valorSolicitado) {
    return res.status(400).json({ success: false, message: 'userId e valorSolicitado são obrigatórios.' });
  }

  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  if (!user.consentGiven) return res.status(403).json({ success: false, message: 'Consentimento necessário.' });

  // Checar fraude antes de aprovar
  const transactions = db.transactions.filter(t => t.userId === userId);
  const fraudeResult = detectarFraude(transactions);
  if (fraudeResult.suspeito) {
    const solicitacao = {
      id: uuidv4(),
      userId,
      valorSolicitado: parseFloat(valorSolicitado),
      finalidade: finalidade || 'Não informado',
      status: 'negado',
      motivo: 'Padrão de movimentação suspeito identificado.',
      criadoEm: new Date().toISOString(),
    };
    db.creditRequests.push(solicitacao);
    return res.status(200).json({ success: true, data: solicitacao });
  }

  const scoreResult = calcularScore(transactions);
  const valor = parseFloat(valorSolicitado);

  let status, motivo, valorAprovado;

  if (scoreResult.score < 300) {
    status = 'negado';
    motivo = 'Score insuficiente para aprovação.';
    valorAprovado = 0;
  } else if (valor > scoreResult.limiteCredito) {
    status = 'aprovado_parcial';
    motivo = `Valor aprovado com base no seu limite atual de R$ ${scoreResult.limiteCredito.toFixed(2)}.`;
    valorAprovado = scoreResult.limiteCredito;
  } else {
    status = 'aprovado';
    motivo = 'Crédito aprovado com base no seu perfil de renda.';
    valorAprovado = valor;
  }

  const solicitacao = {
    id: uuidv4(),
    userId,
    valorSolicitado: valor,
    valorAprovado: valorAprovado || 0,
    finalidade: finalidade || 'Não informado',
    status,
    motivo,
    score: scoreResult.score,
    classificacao: scoreResult.classificacao,
    fatores: scoreResult.fatores,
    criadoEm: new Date().toISOString(),
    prazoMeses: status !== 'negado' ? 12 : null,
    parcelaMensal: status !== 'negado' ? parseFloat((valorAprovado / 12).toFixed(2)) : null,
  };

  db.creditRequests.push(solicitacao);

  // Se aprovado, criar empréstimo ativo
  if (status === 'aprovado' || status === 'aprovado_parcial') {
    db.activeLoans.push({
      id: uuidv4(),
      creditRequestId: solicitacao.id,
      userId,
      valorTotal: valorAprovado,
      saldoDevedor: valorAprovado,
      parcelaMensal: solicitacao.parcelaMensal,
      prazoMeses: 12,
      parcelasPagas: 0,
      status: 'ativo',
      criadoEm: new Date().toISOString(),
    });
  }

  res.json({ success: true, data: solicitacao });
});

// GET /api/credit/requests/:userId — histórico de solicitações
router.get('/requests/:userId', (req, res) => {
  const requests = db.creditRequests.filter(r => r.userId === req.params.userId);
  res.json({ success: true, data: requests });
});

// GET /api/credit/loans/:userId — empréstimos ativos
router.get('/loans/:userId', (req, res) => {
  const loans = db.activeLoans.filter(l => l.userId === req.params.userId);
  res.json({ success: true, data: loans });
});

// POST /api/credit/loans/:loanId/pay — registrar pagamento de parcela
router.post('/loans/:loanId/pay', (req, res) => {
  const loan = db.activeLoans.find(l => l.id === req.params.loanId);
  if (!loan) return res.status(404).json({ success: false, message: 'Empréstimo não encontrado.' });

  if (loan.parcelasPagas >= loan.prazoMeses) {
    return res.status(400).json({ success: false, message: 'Empréstimo já quitado.' });
  }

  loan.parcelasPagas++;
  loan.saldoDevedor = Math.max(0, loan.saldoDevedor - loan.parcelaMensal);

  if (loan.parcelasPagas >= loan.prazoMeses) {
    loan.status = 'quitado';
  }

  res.json({ success: true, data: loan, message: `Parcela ${loan.parcelasPagas}/${loan.prazoMeses} registrada.` });
});

// GET /api/credit/dashboard — resumo geral (admin)
router.get('/dashboard', (req, res) => {
  const totalSolicitacoes = db.creditRequests.length;
  const aprovadas = db.creditRequests.filter(r => r.status !== 'negado').length;
  const negadas = db.creditRequests.filter(r => r.status === 'negado').length;
  const totalEmprestado = db.activeLoans.reduce((sum, l) => sum + l.valorTotal, 0);
  const inadimplentes = db.activeLoans.filter(l => l.status === 'inadimplente').length;

  res.json({
    success: true,
    data: {
      usuarios: db.users.length,
      totalSolicitacoes,
      aprovadas,
      negadas,
      taxaAprovacao: totalSolicitacoes > 0 ? ((aprovadas / totalSolicitacoes) * 100).toFixed(1) : 0,
      totalEmprestado,
      emprestimosAtivos: db.activeLoans.filter(l => l.status === 'ativo').length,
      inadimplentes,
    },
  });
});

module.exports = router;
