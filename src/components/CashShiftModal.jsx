import React, { useState } from 'react';
import { 
  BadgeDollarSign, X, Check, ArrowDownRight, ArrowUpRight, 
  Lock, Unlock, AlertTriangle, FileText, Calendar, Clock, DollarSign
} from 'lucide-react';
import { useSystem } from '../contexts/SystemContext';

export default function CashShiftModal({ onClose }) {
  const { 
    currentShift, 
    shiftHistory, 
    openCashShift, 
    closeCashShift, 
    addShiftBleed, 
    addShiftSupply,
    orders 
  } = useSystem();

  const [mode, setMode] = useState('summary'); // 'summary' | 'open' | 'bleed' | 'supply' | 'close' | 'history'

  // Form states
  const [initialFloat, setInitialFloat] = useState('100.00');
  const [bleedAmount, setBleedAmount] = useState('');
  const [bleedReason, setBleedReason] = useState('');
  const [supplyAmount, setSupplyAmount] = useState('');
  const [supplyReason, setSupplyReason] = useState('');
  
  // Fechamento cego: operador conta e digita
  const [countedCash, setCountedCash] = useState('');
  const [countedCard, setCountedCard] = useState('');
  const [countedPix, setCountedPix] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  // Cálculos do turno atual
  const shiftOrders = currentShift 
    ? orders.filter(o => o.shiftId === currentShift.id || (new Date(o.date) >= new Date(currentShift.openedAt)))
    : [];

  const cashSales = shiftOrders
    .filter(o => o.paymentMethod?.toLowerCase().includes('dinheiro'))
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const cardSales = shiftOrders
    .filter(o => o.paymentMethod?.toLowerCase().includes('cartão') || o.paymentMethod?.toLowerCase().includes('crédito') || o.paymentMethod?.toLowerCase().includes('débito'))
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const pixSales = shiftOrders
    .filter(o => o.paymentMethod?.toLowerCase().includes('pix'))
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const totalBleeds = (currentShift?.bleeds || []).reduce((acc, b) => acc + (b.amount || 0), 0);
  const totalSupplies = (currentShift?.supplies || []).reduce((acc, s) => acc + (s.amount || 0), 0);
  const initialCash = currentShift?.initialFloat || 0;
  const expectedCashInDrawer = initialCash + cashSales + totalSupplies - totalBleeds;

  const handleOpenShift = (e) => {
    e.preventDefault();
    const floatNum = parseFloat(initialFloat) || 0;
    openCashShift(floatNum);
    setMode('summary');
  };

  const handleAddBleed = (e) => {
    e.preventDefault();
    const val = parseFloat(bleedAmount);
    if (!val || val <= 0) return alert('Informe um valor válido de sangria');
    addShiftBleed(val, bleedReason || 'Sangria de caixa');
    setBleedAmount('');
    setBleedReason('');
    setMode('summary');
  };

  const handleAddSupply = (e) => {
    e.preventDefault();
    const val = parseFloat(supplyAmount);
    if (!val || val <= 0) return alert('Informe um valor válido de suprimento');
    addShiftSupply(val, supplyReason || 'Reforço de troco');
    setSupplyAmount('');
    setSupplyReason('');
    setMode('summary');
  };

  const handleCloseShift = (e) => {
    e.preventDefault();
    const countedCashNum = parseFloat(countedCash) || 0;
    const countedCardNum = parseFloat(countedCard) || 0;
    const countedPixNum = parseFloat(countedPix) || 0;

    const summary = closeCashShift({
      cash: countedCashNum,
      card: countedCardNum,
      pix: countedPixNum
    }, closeNotes);

    alert(`Turno de caixa fechado com sucesso!\nDiferença apurada em dinheiro: R$ ${(countedCashNum - expectedCashInDrawer).toFixed(2)}`);
    setMode('summary');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{
        width: '620px',
        maxWidth: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.5rem',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.15)',
        backgroundColor: '#18181b',
        color: '#fff',
        boxShadow: '0 20px 40px rgba(0,0,0,0.7)'
      }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: currentShift ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: currentShift ? '#4ade80' : '#f87171'
            }}>
              {currentShift ? <Unlock size={22} /> : <Lock size={22} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Controle de Turno de Caixa</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {currentShift 
                  ? `🟢 Turno #${currentShift.id} Aberto em ${new Date(currentShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : '🔴 Caixa Fechado - Abra o turno para registrar vendas'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '4px' }}>
          <button
            onClick={() => setMode('summary')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: mode === 'summary' ? 'var(--color-brand)' : 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Resumo do Turno
          </button>
          {currentShift ? (
            <>
              <button
                onClick={() => setMode('bleed')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: mode === 'bleed' ? 'var(--color-brand)' : 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ArrowDownRight size={14} color="#f87171" /> Sangria
              </button>
              <button
                onClick={() => setMode('supply')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: mode === 'supply' ? 'var(--color-brand)' : 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ArrowUpRight size={14} color="#4ade80" /> Suprimento
              </button>
              <button
                onClick={() => setMode('close')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: mode === 'close' ? 'var(--color-danger)' : 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Lock size={14} /> Fechar Caixa
              </button>
            </>
          ) : (
            <button
              onClick={() => setMode('open')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: mode === 'open' ? '#22c55e' : 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Unlock size={14} /> Abrir Turno
            </button>
          )}
          <button
            onClick={() => setMode('history')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: mode === 'history' ? 'var(--color-brand)' : 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            Histórico de Turnos
          </button>
        </div>

        {/* Conteúdo: Resumo */}
        {mode === 'summary' && (
          <div>
            {currentShift ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '1.25rem' }}>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fundo Inicial de Troco</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>R$ {initialCash.toFixed(2)}</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vendas em Dinheiro</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4ade80' }}>R$ {cashSales.toFixed(2)}</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vendas em Cartão (Déb/Créd)</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>R$ {cardSales.toFixed(2)}</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vendas em Pix</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#a855f7' }}>R$ {pixSales.toFixed(2)}</div>
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  padding: '14px',
                  borderRadius: '12px',
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#86efac' }}>Dinheiro Esperado na Gaveta</div>
                    <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
                      (Inicial: R$ {initialCash.toFixed(2)} + Vendas: R$ {cashSales.toFixed(2)} + Suprimentos: R$ {totalSupplies.toFixed(2)} - Sangrias: R$ {totalBleeds.toFixed(2)})
                    </div>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#4ade80' }}>
                    R$ {expectedCashInDrawer.toFixed(2)}
                  </div>
                </div>

                {/* Movimentações de Sangria e Suprimento */}
                {((currentShift.bleeds?.length > 0) || (currentShift.supplies?.length > 0)) && (
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Movimentações do Turno:</div>
                    {currentShift.bleeds?.map((b, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#f87171', padding: '2px 0' }}>
                        <span>Sangria: {b.reason}</span>
                        <span>- R$ {b.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {currentShift.supplies?.map((s, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#4ade80', padding: '2px 0' }}>
                        <span>Suprimento: {s.reason}</span>
                        <span>+ R$ {s.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔒</div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>Nenhum turno de caixa em andamento</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Inicie o turno informando o valor de troco inicial da gaveta para liberar operações.
                </p>
                <button
                  onClick={() => setMode('open')}
                  className="btn-primary"
                  style={{ padding: '10px 24px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Unlock size={18} /> Abrir Caixa Agora
                </button>
              </div>
            )}
          </div>
        )}

        {/* Abrir Turno */}
        {mode === 'open' && (
          <form onSubmit={handleOpenShift}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Abertura de Caixa</h4>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                Fundo de Troco Inicial (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={initialFloat}
                onChange={(e) => setInitialFloat(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: 700
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setMode('summary')} className="btn-secondary" style={{ padding: '8px 16px' }}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }}>
                Confirmar Abertura
              </button>
            </div>
          </form>
        )}

        {/* Sangria */}
        {mode === 'bleed' && (
          <form onSubmit={handleAddBleed}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#f87171' }}>Realizar Sangria (Retirada de Dinheiro)</h4>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                Valor da Retirada (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ex: 150.00"
                value={bleedAmount}
                onChange={(e) => setBleedAmount(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: 700
                }}
              />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                Motivo / Destino
              </label>
              <input
                type="text"
                placeholder="Ex: Pagamento do fornecedor de pão / Depósito bancário"
                value={bleedReason}
                onChange={(e) => setBleedReason(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setMode('summary')} className="btn-secondary" style={{ padding: '8px 16px' }}>
                Voltar
              </button>
              <button type="submit" style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontWeight: 700, cursor: 'pointer' }}>
                Confirmar Sangria
              </button>
            </div>
          </form>
        )}

        {/* Suprimento */}
        {mode === 'supply' && (
          <form onSubmit={handleAddSupply}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#4ade80' }}>Adicionar Suprimento (Entrada de Troco)</h4>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                Valor Adicionado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ex: 50.00"
                value={supplyAmount}
                onChange={(e) => setSupplyAmount(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: 700
                }}
              />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                Motivo / Origem
              </label>
              <input
                type="text"
                placeholder="Ex: Troca de moedas e notas de 2 reais"
                value={supplyReason}
                onChange={(e) => setSupplyReason(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setMode('summary')} className="btn-secondary" style={{ padding: '8px 16px' }}>
                Voltar
              </button>
              <button type="submit" style={{ backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontWeight: 700, cursor: 'pointer' }}>
                Confirmar Suprimento
              </button>
            </div>
          </form>
        )}

        {/* Fechamento com Conferência Cega */}
        {mode === 'close' && (
          <form onSubmit={handleCloseShift}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#f87171' }}>Conferência Cega & Fechamento de Turno</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Conte o dinheiro físico presente na gaveta e os comprovantes de cartão. O sistema calculará automaticamente quebras ou sobras.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                  Dinheiro Físico (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 700
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                  Maquininha/Cartão (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={countedCard}
                  onChange={(e) => setCountedCard(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 700
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                  Pix Confirmado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={countedPix}
                  onChange={(e) => setCountedPix(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 700
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                Observações do Fechamento
              </label>
              <textarea
                placeholder="Ex: Turno encerrado às 23:45, tudo correto sem divergências."
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setMode('summary')} className="btn-secondary" style={{ padding: '8px 16px' }}>
                Voltar
              </button>
              <button type="submit" style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontWeight: 700, cursor: 'pointer' }}>
                Finalizar e Fechar Turno
              </button>
            </div>
          </form>
        )}

        {/* Histórico */}
        {mode === 'history' && (
          <div>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Histórico de Fechamentos</h4>
            {shiftHistory.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem', fontSize: '0.85rem' }}>
                Nenhum turno anterior registrado ainda.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {shiftHistory.slice().reverse().map(shift => {
                  const diff = shift.cashDifference || 0;
                  return (
                    <div key={shift.id} style={{
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Turno #{shift.id}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Fechado em {new Date(shift.closedAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                          Gaveta: R$ {(shift.countedCash || 0).toFixed(2)}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          color: diff === 0 ? '#4ade80' : diff > 0 ? '#38bdf8' : '#f87171' 
                        }}>
                          {diff === 0 ? 'Conferência exata' : diff > 0 ? `Sobra: +R$ ${diff.toFixed(2)}` : `Quebra: R$ ${diff.toFixed(2)}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
