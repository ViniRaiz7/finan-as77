// scoreEngine.js — Motor de Score Alternativo para Autônomos
// Baseado nas entrevistas: foco em comportamento, não saldo pontual

/**
 * Calcula o score de crédito alternativo de um usuário com base em suas transações.
 * Retorna score (0–1000), classificação, limite sugerido e fatores explicativos.
 */
function calcularScore(transactions) {
  if (!transactions || transactions.length === 0) {
    return {
      score: 0,
      classificacao: 'Sem histórico',
      limiteCredito: 0,
      fatores: [{ fator: 'Histórico insuficiente', impacto: 'negativo', descricao: 'Nenhuma transação encontrada.' }],
      detalhes: {},
    };
  }

  const incomes = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');

  // --- 1. FREQUÊNCIA DE RENDA (até 250 pts) ---
  // Quantos dias distintos houve entrada nos últimos 90 dias?
  const diasComRenda = new Set(incomes.map(t => t.date.slice(0, 10))).size;
  const pontuacaoFrequencia = Math.min(250, Math.floor((diasComRenda / 60) * 250));

  // --- 2. CONSISTÊNCIA (até 200 pts) ---
  // Coeficiente de variação da renda: menor variação = mais consistente
  const valores = incomes.map(t => t.amount);
  const media = valores.reduce((a, b) => a + b, 0) / (valores.length || 1);
  const desvio = Math.sqrt(valores.map(v => Math.pow(v - media, 2)).reduce((a, b) => a + b, 0) / (valores.length || 1));
  const cv = media > 0 ? desvio / media : 1;
  // CV baixo = consistente. CV > 1 = muito irregular.
  const pontuacaoConsistencia = Math.max(0, Math.floor((1 - Math.min(cv, 1)) * 200));

  // --- 3. VOLUME MÉDIO MENSAL (até 200 pts) ---
  const mediaMensal = media * 22; // estimativa ~22 dias úteis/mês
  let pontuacaoVolume = 0;
  if (mediaMensal >= 5000) pontuacaoVolume = 200;
  else if (mediaMensal >= 3000) pontuacaoVolume = 160;
  else if (mediaMensal >= 1500) pontuacaoVolume = 110;
  else if (mediaMensal >= 800) pontuacaoVolume = 70;
  else pontuacaoVolume = 20;

  // --- 4. SAÚDE FINANCEIRA (até 200 pts) ---
  // Proporção renda/despesa
  const totalRenda = incomes.reduce((a, t) => a + t.amount, 0);
  const totalDespesas = expenses.reduce((a, t) => a + t.amount, 0);
  const ratio = totalRenda > 0 ? (totalRenda - totalDespesas) / totalRenda : 0;
  const pontuacaoSaude = Math.max(0, Math.min(200, Math.floor(ratio * 200)));

  // --- 5. TEMPO DE RELACIONAMENTO (até 150 pts) ---
  // Quantos dias desde a primeira transação?
  const datas = transactions.map(t => new Date(t.date).getTime());
  const diasHistorico = datas.length > 0 ? Math.floor((Date.now() - Math.min(...datas)) / 86400000) : 0;
  const pontuacaoTempo = Math.min(150, Math.floor((diasHistorico / 90) * 150));

  // --- SCORE TOTAL ---
  const scoreTotal = pontuacaoFrequencia + pontuacaoConsistencia + pontuacaoVolume + pontuacaoSaude + pontuacaoTempo;

  // --- LIMITE DE CRÉDITO SUGERIDO ---
  // Conservador: até 60% da renda média mensal, escalado pelo score
  const fatorScore = scoreTotal / 1000;
  const limiteCredito = Math.floor(mediaMensal * 0.6 * fatorScore / 100) * 100;

  // --- CLASSIFICAÇÃO ---
  let classificacao;
  if (scoreTotal >= 800) classificacao = 'Excelente';
  else if (scoreTotal >= 650) classificacao = 'Bom';
  else if (scoreTotal >= 500) classificacao = 'Regular';
  else if (scoreTotal >= 300) classificacao = 'Baixo';
  else classificacao = 'Muito Baixo';

  // --- FATORES EXPLICATIVOS (transparência/compliance) ---
  const fatores = [];

  if (diasComRenda >= 20) {
    fatores.push({ fator: 'Frequência de renda', impacto: 'positivo', descricao: `Renda registrada em ${diasComRenda} dias — boa regularidade de trabalho.` });
  } else {
    fatores.push({ fator: 'Frequência de renda', impacto: 'negativo', descricao: `Renda em apenas ${diasComRenda} dias — histórico ainda reduzido.` });
  }

  if (cv < 0.4) {
    fatores.push({ fator: 'Consistência de renda', impacto: 'positivo', descricao: 'Seus ganhos são estáveis — baixa variação entre os dias.' });
  } else if (cv < 0.7) {
    fatores.push({ fator: 'Consistência de renda', impacto: 'neutro', descricao: 'Seus ganhos variam moderadamente.' });
  } else {
    fatores.push({ fator: 'Consistência de renda', impacto: 'negativo', descricao: 'Seu padrão de renda apresenta instabilidade elevada.' });
  }

  if (ratio > 0.3) {
    fatores.push({ fator: 'Saúde financeira', impacto: 'positivo', descricao: 'Suas despesas estão bem controladas em relação à renda.' });
  } else if (ratio > 0) {
    fatores.push({ fator: 'Saúde financeira', impacto: 'neutro', descricao: 'Sua margem financeira é estreita.' });
  } else {
    fatores.push({ fator: 'Saúde financeira', impacto: 'negativo', descricao: 'Suas despesas superam sua renda no período analisado.' });
  }

  if (diasHistorico >= 60) {
    fatores.push({ fator: 'Tempo de histórico', impacto: 'positivo', descricao: `${diasHistorico} dias de histórico disponíveis.` });
  } else {
    fatores.push({ fator: 'Tempo de histórico', impacto: 'negativo', descricao: `Histórico curto (${diasHistorico} dias). Com mais tempo, sua análise melhora.` });
  }

  return {
    score: scoreTotal,
    classificacao,
    limiteCredito,
    mediaMensalEstimada: Math.round(mediaMensal),
    fatores,
    detalhes: {
      pontuacaoFrequencia,
      pontuacaoConsistencia,
      pontuacaoVolume,
      pontuacaoSaude,
      pontuacaoTempo,
      diasComRenda,
      diasHistorico,
      coeficienteVariacao: Math.round(cv * 100) / 100,
      ratioSaude: Math.round(ratio * 100) / 100,
    },
  };
}

/**
 * Detecta padrões suspeitos de fraude nas transações
 */
function detectarFraude(transactions) {
  const alertas = [];

  // Checar circular — entrada e saída do mesmo valor no mesmo dia
  const porDia = {};
  transactions.forEach(t => {
    const dia = t.date.slice(0, 10);
    if (!porDia[dia]) porDia[dia] = { incomes: [], expenses: [] };
    if (t.type === 'income') porDia[dia].incomes.push(t.amount);
    else porDia[dia].expenses.push(t.amount);
  });

  let diasCircular = 0;
  Object.values(porDia).forEach(({ incomes, expenses }) => {
    incomes.forEach(inc => {
      if (expenses.some(exp => Math.abs(exp - inc) < 5)) diasCircular++;
    });
  });

  if (diasCircular > 5) {
    alertas.push({ tipo: 'circular', descricao: 'Possível movimentação circular detectada para inflar score.' });
  }

  // Picos repentinos
  const valores = transactions.filter(t => t.type === 'income').map(t => t.amount);
  if (valores.length > 10) {
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const picos = valores.filter(v => v > media * 3);
    if (picos.length > 3) {
      alertas.push({ tipo: 'pico', descricao: 'Valores de entrada incomumente altos detectados.' });
    }
  }

  return { suspeito: alertas.length > 0, alertas };
}

module.exports = { calcularScore, detectarFraude };
