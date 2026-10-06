import React from 'react';
import { Award, Sparkles, CheckCircle2, Gift, Flame, PartyPopper } from 'lucide-react';
import { useSystem } from '../contexts/SystemContext';

export default function LoyaltyCard({ customer, onApplyReward }) {
  const { storeSettings } = useSystem();
  const loyaltyConfig = storeSettings?.loyalty || {
    requiredOrders: 10,
    rewardType: 'discount',
    rewardValue: 20,
    active: true
  };

  if (!loyaltyConfig.active) return null;

  const currentStamps = customer?.loyaltyStamps || 0;
  const targetStamps = loyaltyConfig.requiredOrders || 10;
  const isComplete = currentStamps >= targetStamps;
  const progressPercent = Math.min(100, Math.round((currentStamps / targetStamps) * 100));

  const rewardDescription = loyaltyConfig.rewardType === 'free_product'
    ? '1 Lanche Prensado Grátis'
    : `R$ ${Number(loyaltyConfig.rewardValue || 20).toFixed(2)} de desconto no próximo pedido`;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #450a0a 100%)',
      border: '1px solid rgba(245, 158, 11, 0.4)',
      borderRadius: '16px',
      padding: '1.25rem',
      color: '#fff',
      boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
      position: 'relative',
      overflow: 'hidden',
      marginBottom: '1rem'
    }}>
      {/* Brilho decorativo */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(234,179,8,0.25) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Cabeçalho do Cartão */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#eab308',
            color: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            <Award size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.5px' }}>
              FIDELIDADE NUU PRENSADO
            </div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
              {customer ? `${customer.name || 'Cliente'} (${customer.phone})` : 'Identifique-se para acumular selos'}
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: isComplete ? '#22c55e' : 'rgba(234,179,8,0.2)',
          color: isComplete ? '#fff' : '#fde047',
          border: `1px solid ${isComplete ? '#4ade80' : 'rgba(234,179,8,0.4)'}`,
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {isComplete ? <Sparkles size={14} /> : <Flame size={14} />}
          {currentStamps} / {targetStamps} SELOS
        </div>
      </div>

      {/* Grade com os 10 carimbos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px',
        margin: '14px 0'
      }}>
        {Array.from({ length: targetStamps }).map((_, i) => {
          const isStamped = i < currentStamps;
          const isLastSlot = i === targetStamps - 1;

          return (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                borderRadius: '10px',
                border: isStamped 
                  ? '2px solid #eab308' 
                  : isLastSlot 
                    ? '2px dashed #f43f5e' 
                    : '1px dashed rgba(255,255,255,0.25)',
                backgroundColor: isStamped 
                  ? 'rgba(234,179,8,0.2)' 
                  : isLastSlot 
                    ? 'rgba(244,63,94,0.1)' 
                    : 'rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: isStamped ? '#fde047' : 'rgba(255,255,255,0.4)',
                position: 'relative',
                transition: 'all 0.3s ease'
              }}
            >
              {isStamped ? (
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '18px', display: 'block' }}>🌭</span>
                  <CheckCircle2 size={12} color="#4ade80" style={{ position: 'absolute', top: '3px', right: '3px' }} />
                </div>
              ) : isLastSlot ? (
                <Gift size={18} color="#f43f5e" />
              ) : (
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{i + 1}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Barra de Progresso e Regra */}
      <div style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: '#e2e8f0' }}>
          <span>Recompensa: <strong>{rewardDescription}</strong></span>
          <span>{progressPercent}%</span>
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '99px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: isComplete ? '#22c55e' : '#eab308',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Botão de Resgate se Completo */}
      {isComplete && onApplyReward && (
        <button
          onClick={onApplyReward}
          style={{
            marginTop: '12px',
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: '#22c55e',
            color: '#fff',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(34,197,94,0.4)'
          }}
        >
          <PartyPopper size={18} /> Resgatar Prêmio Agora!
        </button>
      )}
    </div>
  );
}
