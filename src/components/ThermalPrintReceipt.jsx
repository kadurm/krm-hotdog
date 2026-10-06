import React, { useRef } from 'react';
import { Printer, X, Check, Scissors } from 'lucide-react';

export default function ThermalPrintReceipt({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.date || Date.now()).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="thermal-modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem'
    }}>
      {/* Botões de controle de tela (escondidos na impressão) */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        display: 'flex',
        gap: '12px',
        zIndex: 100000
      }} className="no-print">
        <button
          onClick={handlePrint}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            fontSize: '0.95rem',
            boxShadow: '0 4px 15px rgba(225,29,72,0.4)',
            cursor: 'pointer'
          }}
        >
          <Printer size={18} /> Imprimir Comanda
        </button>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            borderRadius: '8px',
            padding: '10px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <X size={18} /> Fechar
        </button>
      </div>

      {/* Recibo Térmico (58mm / 80mm compatível) */}
      <div 
        id="thermal-printable-receipt"
        className="thermal-receipt"
        style={{
          width: '320px',
          maxWidth: '100%',
          backgroundColor: '#fff',
          color: '#000',
          fontFamily: "'Courier New', Courier, monospace",
          padding: '18px 16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          borderRadius: '4px',
          fontSize: '13px',
          lineHeight: '1.35',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
          <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '1px' }}>NUU PRENSADO</div>
          <div style={{ fontSize: '11px', marginTop: '2px' }}>O Melhor Prensado da Cidade</div>
          <div style={{ fontSize: '11px', color: '#333' }}>WhatsApp: (31) 99999-9999</div>
        </div>

        {/* Informações do Pedido */}
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold' }}>
            <span>PEDIDO #{order.id}</span>
            <span style={{ 
              textTransform: 'uppercase', 
              backgroundColor: '#000', 
              color: '#fff', 
              padding: '1px 6px', 
              borderRadius: '2px',
              fontSize: '12px'
            }}>
              {order.type === 'delivery' ? 'DELIVERY' : 'BALCÃO'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#444', marginTop: '4px' }}>
            Data/Hora: {formattedDate}
          </div>
        </div>

        {/* Cliente e Endereço */}
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
          <div><strong>Cliente:</strong> {order.customerName || 'Cliente Balcão'}</div>
          {order.phone && <div><strong>Tel:</strong> {order.phone}</div>}
          {order.type === 'delivery' && (
            <div style={{ marginTop: '4px' }}>
              <strong>Endereço:</strong>
              <div style={{ fontSize: '12px', whiteSpace: 'pre-line' }}>{order.address}</div>
              {order.neighborhood && (
                <div><strong>Bairro:</strong> {order.neighborhood}</div>
              )}
            </div>
          )}
        </div>

        {/* Itens */}
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase' }}>
            ITENS DO PEDIDO
          </div>
          {order.items?.map((item, idx) => (
            <div key={idx} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>{item.quantity}x {item.name}</span>
                <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
              </div>
              {item.notes && (
                <div style={{ fontSize: '11px', fontStyle: 'italic', paddingLeft: '10px', color: '#222' }}>
                  Obs: {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Totais & Pagamento */}
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
          {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Taxa de Entrega:</span>
              <span>R$ {Number(order.deliveryFee).toFixed(2)}</span>
            </div>
          )}
          {order.discount !== undefined && order.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#000' }}>
              <span>Desconto ({order.couponCode || 'Cupom'}):</span>
              <span>- R$ {Number(order.discount).toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '900', marginTop: '4px' }}>
            <span>TOTAL:</span>
            <span>R$ {Number(order.total).toFixed(2)}</span>
          </div>
          <div style={{ marginTop: '6px', fontSize: '12px' }}>
            <strong>Pagamento:</strong> {order.paymentMethod || 'Não informado'}
          </div>
          {order.changeFor && (
            <div style={{ fontSize: '12px' }}>
              <strong>Troco para:</strong> R$ {order.changeFor} (Levar: R$ {(parseFloat(order.changeFor) - order.total).toFixed(2)})
            </div>
          )}
        </div>

        {/* Rodapé da Comanda */}
        <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '10px' }}>
          <div>Obrigado pela preferência! ❤️</div>
          <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>Sistema Nuu Prensado PDV</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '8px', color: '#888', fontSize: '9px' }}>
            <Scissors size={12} /> - - - - - - CORTE AQUI - - - - - -
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          .no-print {
            display: none !important;
          }
          #thermal-printable-receipt, #thermal-printable-receipt * {
            visibility: visible !important;
          }
          #thermal-printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 80mm !important;
            box-shadow: none !important;
            padding: 4mm !important;
            font-size: 12px !important;
          }
        }
      `}} />
    </div>
  );
}
