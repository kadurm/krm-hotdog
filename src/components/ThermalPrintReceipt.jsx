import React, { useEffect } from 'react';
import { useSystem } from '../contexts/SystemContext';
import { Printer, X, Scissors } from 'lucide-react';

export default function ThermalPrintReceipt({ order, onClose, autoPrint = false }) {
  const { storeSettings, currentOperator } = useSystem();

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  // Se autoPrint estiver ativo, dispara a impressão automaticamente
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, order?.id]);

  // Fecha o modal automaticamente quando o diálogo de impressão é concluído/enviado
  useEffect(() => {
    const handleAfterPrint = () => {
      if (onClose) onClose();
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [onClose]);

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formattedDate = new Date(order.date || Date.now()).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const isDelivery = order.type === 'delivery';

  // Subtotal dos itens
  const subtotal = order.items?.reduce((acc, item) => acc + (Number(item.price || 0) * (item.quantity || 1)), 0) || 0;
  const deliveryFee = Number(order.deliveryFee || 0);
  const discount = Number(order.discount || 0);
  const total = Number(order.total || (subtotal + deliveryFee - discount));

  // Renderizador de cada via (Via 1: Motoboy/Entrega | Via 2: Caixa/Conferência)
  const renderReceiptContent = (copyType) => {
    const isMotoboyCopy = copyType === 'motoboy';
    const isCashCopy = copyType === 'cash';

    return (
      <div 
        className="receipt-copy-container"
        style={{
          color: '#000',
          backgroundColor: '#fff',
          fontFamily: "'Segoe UI', Arial, -apple-system, sans-serif",
          fontSize: '12.5px',
          lineHeight: '1.35',
          paddingBottom: '8px'
        }}
      >
        {/* Cabeçalho da Empresa */}
        <div style={{ textAlign: 'center', borderBottom: '1.5px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
          <div style={{ fontSize: '19px', fontWeight: '900', letterSpacing: '0.5px' }}>
            NUU PRENSADO
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#111' }}>
            O Melhor Prensado da Cidade
          </div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#000', marginTop: '1px' }}>
            WhatsApp: {storeSettings?.whatsapp || storeSettings?.phone || '(38) 99161-1378'}
          </div>
          {storeSettings?.storeAddress && (
            <div style={{ fontSize: '9.5px', color: '#333', marginTop: '2px' }}>
              {storeSettings.storeAddress}
            </div>
          )}
        </div>

        {/* Faixa de Identificação da Via */}
        <div style={{
          backgroundColor: '#000',
          color: '#fff',
          textAlign: 'center',
          fontWeight: '900',
          fontSize: '12.5px',
          padding: '3px 4px',
          letterSpacing: '0.5px',
          marginBottom: '8px'
        }}>
          {isMotoboyCopy ? (
            isDelivery ? '★ 1ª VIA: MOTOBOY / ENTREGA ★' : '★ 1ª VIA: CLIENTE / BALCÃO ★'
          ) : (
            '★ 2ª VIA: CAIXA / CONFERÊNCIA ★'
          )}
        </div>

        {/* Identificação do Pedido */}
        <div style={{ borderBottom: '1.5px dashed #000', paddingBottom: '7px', marginBottom: '7px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: '900' }}>
              PEDIDO #{order.id}
            </span>
            <span style={{ 
              fontWeight: '900',
              border: '1.5px solid #000',
              padding: '2px 6px',
              fontSize: '11px'
            }}>
              {isDelivery ? 'DELIVERY' : 'BALCÃO'}
            </span>
          </div>
          <div style={{ fontSize: '10.5px', color: '#222', marginTop: '3px', fontWeight: '600' }}>
            Data: {formattedDate}
          </div>
          {isCashCopy && (
            <div style={{ fontSize: '10.5px', color: '#222', marginTop: '2px', fontWeight: '600' }}>
              Operador: {order.operatorName || currentOperator?.name || 'Caixa'}
            </div>
          )}
        </div>

        {/* Dados do Cliente e Endereço */}
        <div style={{ borderBottom: '1.5px dashed #000', paddingBottom: '7px', marginBottom: '7px' }}>
          <div style={{ fontSize: '13px', fontWeight: '800' }}>
            CLIENTE: {order.customerName || 'Cliente Balcão'}
          </div>
          {order.phone && (
            <div style={{ fontSize: '13.5px', fontWeight: '900', marginTop: '2px' }}>
              TEL: {order.phone}
            </div>
          )}

          {isDelivery && (
            <div style={{ 
              marginTop: '5px', 
              backgroundColor: isMotoboyCopy ? '#f4f4f4' : 'transparent', 
              padding: isMotoboyCopy ? '4px 6px' : '0', 
              border: isMotoboyCopy ? '1px solid #000' : 'none' 
            }}>
              <div style={{ fontWeight: '900', fontSize: '12px', textDecoration: 'underline' }}>
                ENDEREÇO DE ENTREGA:
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: '800', marginTop: '2px' }}>
                {order.address || 'Endereço não informado'}
              </div>
              {order.neighborhood && (
                <div style={{ fontSize: '13px', fontWeight: '900', marginTop: '2px' }}>
                  BAIRRO: {order.neighborhood}
                </div>
              )}
              {(order.addressComplement || order.complement) && (
                <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '2px' }}>
                  Compl: {order.addressComplement || order.complement}
                </div>
              )}
              {(order.referencePoint || order.reference) && (
                <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '2px' }}>
                  Ref: {order.referencePoint || order.reference}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Itens do Pedido */}
        <div style={{ borderBottom: '1.5px dashed #000', paddingBottom: '7px', marginBottom: '7px' }}>
          <div style={{ fontWeight: '900', fontSize: '11.5px', marginBottom: '5px', letterSpacing: '0.5px' }}>
            ITENS DO PEDIDO:
          </div>
          {order.items?.map((item, idx) => (
            <div key={idx} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontWeight: '800' }}>
                <span style={{ fontSize: '13.5px' }}>
                  {item.quantity}x {item.name}
                </span>
                <span style={{ fontSize: '12.5px', fontWeight: '700' }}>
                  R$ {(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)}
                </span>
              </div>
              {/* Observações / Adicionais */}
              {item.notes && (
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: '800', 
                  padding: '2px 4px', 
                  backgroundColor: '#f3f3f3', 
                  borderLeft: '2.5px solid #000',
                  marginTop: '2px',
                  color: '#000' 
                }}>
                  Obs: {item.notes}
                </div>
              )}
            </div>
          ))}
          {order.notes && (
            <div style={{ 
              marginTop: '4px', 
              fontSize: '11.5px', 
              fontWeight: '800', 
              border: '1px solid #000', 
              padding: '4px' 
            }}>
              OBS GERAL: {order.notes}
            </div>
          )}
        </div>

        {/* Totais & Pagamento */}
        <div style={{ borderBottom: '1.5px dashed #000', paddingBottom: '7px', marginBottom: '7px' }}>
          {deliveryFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '600' }}>
              <span>Taxa de Entrega:</span>
              <span>R$ {deliveryFee.toFixed(2)}</span>
            </div>
          )}
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '600' }}>
              <span>Desconto ({order.couponCode || 'Cupom'}):</span>
              <span>- R$ {discount.toFixed(2)}</span>
            </div>
          )}

          {/* TOTAL DO PEDIDO */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            fontSize: '17px', 
            fontWeight: '900', 
            marginTop: '4px',
            paddingTop: '3px',
            borderTop: '1px solid #000'
          }}>
            <span>TOTAL:</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>

          {/* Instruções de Pagamento e Cobrança */}
          <div style={{ 
            marginTop: '6px', 
            padding: '4px 6px', 
            border: '1.5px solid #000', 
            backgroundColor: isMotoboyCopy ? '#f4f4f4' : 'transparent' 
          }}>
            <div style={{ fontSize: '12.5px', fontWeight: '900' }}>
              PAGAMENTO: {order.paymentMethod || 'Não informado'}
            </div>

            {/* Aviso especial para o motoboy se já foi pago online ou se precisa cobrar */}
            {isMotoboyCopy && (
              <div style={{ marginTop: '2px' }}>
                {order.paymentMethod?.toLowerCase().includes('pix') || order.paymentMethod?.toLowerCase().includes('mercado pago') ? (
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#000' }}>
                    {order.isPaid || order.status !== 'pending' ? '>>> JÁ PAGO ONLINE (NÃO COBRAR) <<<' : '>>> CONFERIR COMPROVANTE PIX <<<'}
                  </div>
                ) : order.paymentMethod?.toLowerCase().includes('dinheiro') ? (
                  <div style={{ fontSize: '11.5px', fontWeight: '900' }}>
                    &gt;&gt;&gt; COBRAR DO CLIENTE: R$ {total.toFixed(2)} &lt;&lt;&lt;
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', fontWeight: '900' }}>
                    &gt;&gt;&gt; COBRAR NA ENTREGA: R$ {total.toFixed(2)} &lt;&lt;&lt;
                  </div>
                )}
              </div>
            )}

            {order.changeFor && (
              <div style={{ fontSize: '11.5px', fontWeight: '800', marginTop: '2px' }}>
                Troco para: R$ {Number(order.changeFor).toFixed(2)} 
                <span style={{ fontWeight: '900', display: 'block' }}>
                  (LEVAR TROCO: R$ {(parseFloat(order.changeFor) - total).toFixed(2)})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé específico de cada via */}
        {isMotoboyCopy ? (
          <div style={{ textAlign: 'center', fontSize: '10.5px', marginTop: '6px' }}>
            <div style={{ fontWeight: '700' }}>Obrigado pela preferência! ❤️</div>
            <div style={{ fontSize: '9.5px', color: '#444' }}>Sistema Nuu Prensado PDV</div>
          </div>
        ) : (
          <div style={{ marginTop: '8px', fontSize: '10.5px' }}>
            <div style={{ fontWeight: '700', marginBottom: '6px', textAlign: 'center' }}>
              CONFERÊNCIA DE OPERAÇÃO & EXPEDIÇÃO
            </div>
            <div style={{ borderBottom: '1px solid #000', margin: '14px 0 3px 0' }}></div>
            <div style={{ fontSize: '9.5px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Motoboy Responsável</span>
              <span>Horário Saída: ___:___</span>
            </div>
            <div style={{ borderBottom: '1px solid #000', margin: '14px 0 3px 0' }}></div>
            <div style={{ fontSize: '9.5px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Conferido por (Caixa)</span>
              <span>Assinatura</span>
            </div>
          </div>
        )}
      </div>
    );
  };

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
      padding: '1rem',
      overflowY: 'auto'
    }}>
      {/* Barra de controle superior simplificada (escondida na impressão física) */}
      <div style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 100000,
        backgroundColor: '#18181b',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '12px',
        padding: '8px 16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
        maxWidth: '95vw',
        justifyContent: 'center'
      }} className="no-print">
        {/* Botão de Disparo Manual de Impressão */}
        <button
          type="button"
          onClick={handlePrint}
          style={{
            background: '#e11d48',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 20px',
            fontSize: '0.92rem',
            fontWeight: 800,
            boxShadow: '0 4px 15px rgba(225,29,72,0.4)',
            cursor: 'pointer'
          }}
        >
          <Printer size={18} /> Imprimir Comanda (2 Vias • 80mm)
        </button>

        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff',
            borderRadius: '8px',
            padding: '8px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <X size={16} /> Fechar (ESC)
        </button>
      </div>

      {/* Folha / Recibo Térmico Padrão 80mm com 2 Vias */}
      <div 
        id="thermal-printable-receipt"
        className="thermal-receipt receipt-80mm"
        style={{
          width: '360px',
          maxWidth: '100%',
          backgroundColor: '#fff',
          color: '#000',
          padding: '20px 18px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.7)',
          borderRadius: '4px',
          maxHeight: '85vh',
          overflowY: 'auto',
          marginTop: '65px',
          marginBottom: '20px'
        }}
      >
        {/* VIA 1: MOTOBOY / ENTREGA */}
        {renderReceiptContent('motoboy')}

        {/* LINHA DE CORTE E SERRILHA */}
        <div 
          className="receipt-cut-divider"
          style={{
            margin: '14px 0',
            padding: '6px 0',
            borderTop: '1.5px dashed #000',
            borderBottom: '1.5px dashed #000',
            textAlign: 'center',
            fontWeight: '900',
            fontSize: '11px',
            letterSpacing: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            color: '#000'
          }}
        >
          <Scissors size={14} /> - - - - CORTE AQUI - - - - <Scissors size={14} />
        </div>

        {/* VIA 2: CAIXA / CONFERÊNCIA */}
        {renderReceiptContent('cash')}
      </div>

      {/* ESTILOS CSS DE IMPRESSÃO TÉRMICA 80MM */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: 80mm auto;
          margin: 0mm !important;
        }

        @media screen {
          .thermal-receipt::-webkit-scrollbar {
            width: 6px;
          }
          .thermal-receipt::-webkit-scrollbar-thumb {
            background-color: #cbd5e1;
            border-radius: 4px;
          }
        }

        @media print {
          @page {
            size: 80mm auto;
            margin: 0mm !important;
          }
          
          html, body {
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Oculta toda a interface do sistema web */
          body * {
            visibility: hidden !important;
          }

          .no-print, .thermal-modal-backdrop {
            background: none !important;
            backdrop-filter: none !important;
            position: static !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          .no-print {
            display: none !important;
          }

          /* Torna visível unicamente o recibo térmico */
          #thermal-printable-receipt, 
          #thermal-printable-receipt * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #thermal-printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 76mm !important;
            max-width: 76mm !important;
            margin: 0 !important;
            padding: 2mm 3mm 8mm 3mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #fff !important;
            color: #000 !important;
            overflow: visible !important;
            max-height: none !important;
            font-size: 12px !important;
            line-height: 1.3 !important;
          }

          .receipt-copy-container {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .receipt-cut-divider {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 12px 0 !important;
            padding: 6px 0 !important;
          }
        }
      `}} />
    </div>
  );
}
