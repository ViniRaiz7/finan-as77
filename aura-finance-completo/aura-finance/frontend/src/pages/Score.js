// src/pages/Score.js
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { getScore } from '../services/api';

export default function Score() {
  const { currentUser, showNotification } = useApp();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleCalc() {
    if (!currentUser) return showNotification('Selecione um usuário.', 'error');
    if (!currentUser.consentGiven) return showNotification('Consentimento necessário para calcular score.', 'error');
    setLoading(true);
    try {
      const res = await getScore(currentUser.id);
      setResult(res.data);
    } catch (e) {
      showNotification(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function scoreColor(score) {
    if (score >= 800) return '#4ade80';
    if (score >= 650) return '#22d3ee';
    if (score >= 500) return '#fbbf24';
    if (score >= 300) return '#fb923c';
    return '#f87171';
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Score Alternativo</div>
        <div className="page-sub">Análise baseada em comportamento financeiro real — sem exigir comprovante de renda</div>
      </div>

      {!currentUser?.consentGiven && (
        <div className="alert alert-warn">⚠️ Usuário precisa dar consentimento antes da análise.</div>
      )}

      {!result && (
        <div className="card" style={{ textAlign: 'center', padding: 48, marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Calcule o score de {currentUser?.name || 'um usuário'}</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            O score é calculado com base em frequência de renda, consistência, volume e saúde financeira.
          </div>
          <button className="btn btn-primary" onClick={handleCalc} disabled={loading}>
            {loading ? '⏳ Calculando...' : '🚀 Calcular Score'}
          </button>
        </div>
      )}

      {result && (
        <>
          {result.alerta && result.alerta.length > 0 && (
            <div className="alert alert-error">
              ⚠️ <strong>Alerta de fraude:</strong> {result.alerta.map(a => a.descricao).join(' ')}
            </div>
          )}

          <div className="grid-2">
            {/* Score visual */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              <ScoreRing score={result.score} color={scoreColor(result.score)} />
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor(result.score) }}>{result.classificacao}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Score de crédito alternativo</div>
              </div>

              <div style={{ marginTop: 24, width: '100%', background: 'var(--surface2)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Renda estimada/mês</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>R$ {result.mediaMensalEstimada?.toLocaleString('pt-BR') || '0'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Limite sugerido</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>R$ {result.limiteCredito?.toLocaleString('pt-BR') || '0'}</span>
                </div>
              </div>

              <button className="btn btn-secondary" style={{ marginTop: 16, width: '100%' }} onClick={handleCalc} disabled={loading}>
                🔄 Recalcular
              </button>
            </div>

            {/* Fatores e detalhes */}
            <div className="card">
              <div className="section-title">Fatores da análise</div>
              <div className="factor-list" style={{ marginBottom: 20 }}>
                {result.fatores?.map((f, i) => (
                  <div className="factor-item" key={i}>
                    <div className={`factor-dot ${f.impacto}`}></div>
                    <div className="factor-text">
                      <strong>{f.fator}</strong>
                      <span>{f.descricao}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="section-title">Pontuação por critério</div>
              {result.detalhes && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Frequência de renda', pts: result.detalhes.pontuacaoFrequencia, max: 250 },
                    { label: 'Consistência', pts: result.detalhes.pontuacaoConsistencia, max: 200 },
                    { label: 'Volume mensal', pts: result.detalhes.pontuacaoVolume, max: 200 },
                    { label: 'Saúde financeira', pts: result.detalhes.pontuacaoSaude, max: 200 },
                    { label: 'Tempo de histórico', pts: result.detalhes.pontuacaoTempo, max: 150 },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{item.pts}/{item.max}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{
                          width: `${(item.pts / item.max) * 100}%`,
                          background: item.pts / item.max >= 0.7 ? 'var(--green)' : item.pts / item.max >= 0.4 ? 'var(--yellow)' : 'var(--red)'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ScoreRing({ score, color }) {
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / 1000, 1);
  const dash = pct * circumference;

  return (
    <div className="score-ring">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--surface2)" strokeWidth="12" />
        <circle
          cx="80" cy="80" r={radius} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="score-number">
        <div className="score-value" style={{ color }}>{score}</div>
        <div className="score-label">/ 1000</div>
      </div>
    </div>
  );
}
