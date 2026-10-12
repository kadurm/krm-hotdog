import React, { useState } from 'react';
import { Trophy, Gift, MessageCircle, X, Check, Copy, Sparkles, Award } from 'lucide-react';

export default function FidelityCelebrationModal({ alert, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!alert) return null;

  const handleCopyCode = () => {
    if (alert.voucherCode) {
      navigator.clipboard.writeText(alert.voucherCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    if (alert.whatsappUrl) {
      window.open(alert.whatsappUrl, '_blank');
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        zIndex: 10000
      }}
    >
      <div 
        className="modal-content animate-scale-up" 
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#0c1322',
          border: '2px solid rgba(237, 177, 67, 0.6)',
          borderRadius: '20px',
          padding: '1.75rem',
          color: '#fff',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(237, 177, 67, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          position: 'relative'
        }}
      >
        {/* Botão Fechar */}
        <button 
          type="button" 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <X size={22} />
        </button>

        {/* Header Festivo */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(237, 177, 67, 0.18)',
            border: '2px solid var(--color-brand-yellow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-brand-yellow)',
            boxShadow: '0 0 20px rgba(237, 177, 67, 0.4)'
          }}>
            <Trophy size={34} />
          </div>

          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(237, 177, 67, 0.15)',
              color: 'var(--color-brand-yellow)',
              padding: '4px 12px',
              borderRadius: '99px',
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '6px'
            }}>
              <Sparkles size={14} />
              <span>10º Pedido Concluído • Cartão Fidelidade</span>
            </div>
            
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
              Parabéns ao Cliente! 🎉
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <strong>{alert.customerName}</strong> completou o 10º pedido e ganhou um lanche gratuito para a próxima compra!
            </p>
          </div>
        </div>

        {/* Card do Voucher em Destaque */}
        <div style={{
          padding: '16px 20px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(168, 35, 25, 0.35) 0%, rgba(237, 177, 67, 0.25) 100%)',
          border: '1px dashed rgba(237, 177, 67, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
            VOUCHER DE LANCHE GRÁTIS GERADO AUTOMATICAMENTE
          </span>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '8px 18px',
            borderRadius: '10px',
            border: '1px solid rgba(237, 177, 67, 0.4)'
          }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-brand-yellow)', letterSpacing: '2px' }}>
              {alert.voucherCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Copiar código do voucher"
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Gift size={16} color="#10b981" />
            <span>Válido para 1 Lanche Prensado Grátis (R$ 25,00 OFF)</span>
          </div>
        </div>

        {/* Pré-visualização da Mensagem */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '10px',
          backgroundColor: 'rgba(37, 211, 102, 0.08)',
          border: '1px solid rgba(37, 211, 102, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#25D366', fontWeight: 800, fontSize: '0.8rem' }}>
            <MessageCircle size={15} />
            <span>Mensagem com Voucher Pronta para Envio:</span>
          </div>
          <div style={{
            fontSize: '0.76rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.45',
            whiteSpace: 'pre-line',
            maxHeight: '110px',
            overflowY: 'auto'
          }}>
            {alert.message}
          </div>
        </div>

        {/* Botões de Ação */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="btn-primary"
            style={{
              width: '100%',
              backgroundColor: '#25D366',
              borderColor: '#25D366',
              color: '#fff',
              padding: '12px 16px',
              fontSize: '0.95rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)'
            }}
          >
            <MessageCircle size={18} />
            <span>Enviar Voucher no WhatsApp Agora</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
          >
            Concluir e Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
