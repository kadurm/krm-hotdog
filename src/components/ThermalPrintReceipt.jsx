import React, { useState, useEffect } from 'react';
import { useSystem } from '../contexts/SystemContext';
import { Printer, X, Scissors, Layers, Check, Info } from 'lucide-react';

export default function ThermalPrintReceipt({ order, onClose, autoPrint = false }) {
  const { storeSettings, currentOperator } = useSystem();
  
  // Opções de impressão: 2 vias (padrão solicitado) ou 1 via
  const [printCopies, setPrintCopies] = useState('two_copies'); // 'two_copies' | 'single_copy'
  // Largura da bobina térmica: 80mm (padrão de mercado) ou 58mm
  const [paperWidth, setPaperWidth] = useState('80mm'); // '80mm' | '58mm'
  const [showKioskHelp, setShowKioskHelp] = useState(false);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  // Se autoPrint estiver ativo, dispara a impressão automaticamente
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, order?.id]);

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
          fontSize: paperWidth === '58mm' ? '11px' : '12.5px',
          lineHeight: '1.35',
          paddingBottom: '8px'
        }}
      >
        {/* Cabeçalho da Empresa */}
        <div style={{ textAlign: 'center', borderBottom: '1.5px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
          <div style={{ fontSize: paperWidth === '58mm' ? '16px' : '19px', fontWeight: '900', letterSpacing: '0.5px' }}>
            NUU PRENSADO
          </div>
          <div style={{ fontSize: paperWidth === '58mm' ? '10px' : '11px', fontWeight: '600', color: '#111' }}>
            O Melhor Prensado da Cidade
          </div>
          <div style={{ fontSize: paperWidth === '58mm' ? '10px' : '11px', fontWeight: '700', color: '#000', marginTop: '1px' }}>
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
          fontSize: paperWidth === '58mm' ? '11px' : '12.5px',
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
            <span style={{ fontSize: paperWidth === '58mm' ? '16px' : '18px', fontWeight: '900' }}>
              PEDIDO #{order.id}
            </span>
            <span style={{ 
              fontWeight: '900',
              border: '1.5px solid #000',
              padding: '2px 6px',
              fontSize: paperWidth === '58mm' ? '10px' : '11px'
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
          <div style={{ fontSize: paperWidth === '58mm' ? '11.5px' : '13px', fontWeight: '800' }}>
            CLIENTE: {order.customerName || 'Cliente Balcão'}
          </div>
          {order.phone && (
            <div style={{ fontSize: paperWidth === '58mm' ? '12px' : '13.5px', fontWeight: '900', marginTop: '2px' }}>
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
              <div style={{ fontWeight: '900', fontSize: paperWidth === '58mm' ? '11px' : '12px', textDecoration: 'underline' }}>
                ENDEREÇO DE ENTREGA:
              </div>
              <div style={{ fontSize: paperWidth === '58mm' ? '12px' : '13.5px', fontWeight: '800', marginTop: '2px' }}>
                {order.address || 'Endereço não informado'}
              </div>
              {order.neighborhood && (
                <div style={{ fontSize: paperWidth === '58mm' ? '11.5px' : '13px', fontWeight: '900', marginTop: '2px' }}>
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
                <span style={{ fontSize: paperWidth === '58mm' ? '12px' : '13.5px' }}>
                  {item.quantity}x {item.name}
                </span>
                <span style={{ fontSize: paperWidth === '58mm' ? '11px' : '12.5px', fontWeight: '700' }}>
                  R$ {(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)}
                </span>
              </div>
              {/* Observações / Adicionais */}
              {item.notes && (
                <div style={{ 
                  fontSize: paperWidth === '58mm' ? '11px' : '12px', 
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
            fontSize: paperWidth === '58mm' ? '15px' : '17px', 
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
            <div style={{ fontSize: paperWidth === '58mm' ? '11px' : '12.5px', fontWeight: '900' }}>
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
      {/* Barra de controle superior (escondida na impressão física) */}
      <div style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: 100000,
        backgroundColor: '#18181b',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '12px',
        padding: '8px 14px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
        maxWidth: '95vw',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }} className="no-print">
        {/* Botão de Disparo de Impressão */}
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
            padding: '9px 18px',
            fontSize: '0.92rem',
            fontWeight: 800,
            boxShadow: '0 4px 15px rgba(225,29,72,0.4)',
            cursor: 'pointer'
          }}
        >
          <Printer size={18} /> Imprimir Comanda
        </button>

        {/* Seletor de Vias (2 Vias solicitado) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '3px' }}>
          <button
            type="button"
            onClick={() => setPrintCopies('two_copies')}
            style={{
              background: printCopies === 'two_copies' ? '#eab308' : 'transparent',
              color: printCopies === 'two_copies' ? '#000' : '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Layers size={13} /> 2 Vias (Motoboy + Caixa)
          </button>
          <button
            type="button"
            onClick={() => setPrintCopies('single_copy')}
            style={{
              background: printCopies === 'single_copy' ? '#eab308' : 'transparent',
              color: printCopies === 'single_copy' ? '#000' : '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            1 Via
          </button>
        </div>

        {/* Seletor de Largura (80mm ou 58mm) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '3px' }}>
          <button
            type="button"
            onClick={() => setPaperWidth('80mm')}
            style={{
              background: paperWidth === '80mm' ? '#3b82f6' : 'transparent',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 9px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            80mm
          </button>
          <button
            type="button"
            onClick={() => setPaperWidth('58mm')}
            style={{
              background: paperWidth === '58mm' ? '#3b82f6' : 'transparent',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 9px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            58mm
          </button>
        </div>

        {/* Botão de Dica Kiosk */}
        <button
          type="button"
          onClick={() => setShowKioskHelp(prev => !prev)}
          style={{
            background: showKioskHelp ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#93c5fd',
            borderRadius: '8px',
            padding: '7px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Dica para impressão 100% silenciosa sem abrir janelas"
        >
          <Info size={14} /> Dica Auto-Print
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
            padding: '7px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.82rem',
            fontWeight: 600
          }}
        >
          <X size={16} /> Fechar (ESC)
        </button>
      </div>

      {/* Caixa de ajuda sobre impressão 100% silenciosa no Chrome */}
      {showKioskHelp && (
        <div 
          className="no-print animate-fade-in"
          style={{
            position: 'fixed',
            top: '75px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '560px',
            width: '90%',
            backgroundColor: '#1e293b',
            border: '1px solid #3b82f6',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#f8fafc',
            fontSize: '0.8rem',
            lineHeight: '1.4',
            zIndex: 100001,
            boxShadow: '0 15px 35px rgba(0,0,0,0.6)'
          }}
        >
          <div style={{ fontWeight: 800, color: '#60a5fa', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Como imprimir 100% automático e direto na impressora física:</span>
            <button onClick={() => setShowKioskHelp(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>×</button>
          </div>
          <p style={{ margin: '0 0 6px 0' }}>
            O Chrome por padrão abre a janela de confirmação de impressão. Para que a impressão saia <strong>direto e silenciosamente na impressora térmica sem abrir o diálogo do Chrome</strong>:
          </p>
          <ol style={{ margin: '0', paddingLeft: '18px', color: '#cbd5e1' }}>
            <li>No Windows, clique com botão direito no atalho do Google Chrome &gt; <strong>Propriedades</strong>.</li>
            <li>No campo <strong>Destino</strong>, ao final do texto, dê um espaço e adicione: <code style={{ color: '#facc15', backgroundColor: '#0f172a', padding: '1px 5px', borderRadius: '4px' }}>--kiosk-printing</code></li>
            <li>Defina sua impressora térmica de 80mm/58mm como a <strong>Impressora Padrão do Windows</strong>.</li>
            <li>Pronto! Ao chegar qualquer pedido, a comanda sairá automaticamente sem necessidade de clicar em nada!</li>
          </ol>
        </div>
      )}

      {/* Folha / Recibo Térmico Formatado */}
      <div 
        id="thermal-printable-receipt"
        className={`thermal-receipt ${paperWidth === '58mm' ? 'receipt-58mm' : 'receipt-80mm'}`}
        style={{
          width: paperWidth === '58mm' ? '280px' : '360px',
          maxWidth: '100%',
          backgroundColor: '#fff',
          color: '#000',
          padding: '20px 18px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.7)',
          borderRadius: '4px',
          maxHeight: '85vh',
          overflowY: 'auto',
          marginTop: '70px',
          marginBottom: '20px'
        }}
      >
        {/* VIA 1: MOTOBOY / ENTREGA */}
        {renderReceiptContent('motoboy')}

        {/* SE FOR 2 VIAS: LINHA DE CORTE + VIA 2 (CAIXA / CONFERÊNCIA) */}
        {printCopies === 'two_copies' && (
          <>
            {/* Linha de separação e corte com tesourinha */}
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
          </>
        )}
      </div>

      {/* ESTILOS CSS DE IMPRESSÃO TÉRMICA PROFISSIONAL */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: auto;
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
          /* Zera margens da página no Chrome/Windows */
          @page {
            margin: 0mm !important;
          }
          
          html, body {
            width: 100% !important;
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
            width: ${paperWidth === '58mm' ? '52mm' : '76mm'} !important;
            max-width: ${paperWidth === '58mm' ? '52mm' : '76mm'} !important;
            margin: 0 !important;
            padding: 2mm 3mm 8mm 3mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #fff !important;
            color: #000 !important;
            overflow: visible !important;
            max-height: none !important;
            font-size: ${paperWidth === '58mm' ? '10.5px' : '12px'} !important;
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
