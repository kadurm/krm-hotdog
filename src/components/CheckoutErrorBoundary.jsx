// src/components/CheckoutErrorBoundary.jsx
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class CheckoutErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erro isolado no componente de Checkout:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={28} color="#ef4444" />
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
            Houve uma instabilidade temporária no checkout online
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '360px', lineHeight: 1.4 }}>
            Você pode tentar carregar novamente ou voltar e selecionar a opção em Dinheiro na entrega.
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={this.handleReset}
              className="btn-primary"
              style={{ padding: '8px 14px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '6px' }}
            >
              <RefreshCw size={13} /> Tentar Novamente
            </button>
            {this.props.onFallbackToOffline && (
              <button
                type="button"
                onClick={this.props.onFallbackToOffline}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.8rem', borderRadius: '6px' }}
              >
                Mudar Forma de Pagamento
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
