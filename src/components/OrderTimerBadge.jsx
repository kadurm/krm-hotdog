import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function OrderTimerBadge({ orderDate }) {
  const [minutes, setMinutes] = useState(() => {
    return Math.max(0, Math.floor((Date.now() - new Date(orderDate || Date.now()).getTime()) / 60000));
  });

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(orderDate || Date.now()).getTime()) / 60000));
      setMinutes(diff);
    };

    update();
    const interval = setInterval(update, 15000); // atualiza a cada 15s
    return () => clearInterval(interval);
  }, [orderDate]);

  let bg = 'rgba(34,197,94,0.18)';
  let color = '#4ade80';
  let border = '1px solid rgba(34,197,94,0.35)';
  let label = `${minutes} min`;

  if (minutes >= 15 && minutes < 30) {
    bg = 'rgba(234,179,8,0.2)';
    color = '#fde047';
    border = '1px solid rgba(234,179,8,0.4)';
    label = `${minutes} min`;
  } else if (minutes >= 30) {
    bg = 'rgba(239,68,68,0.25)';
    color = '#f87171';
    border = '1px solid rgba(239,68,68,0.5)';
    label = `${minutes} min (Atraso!)`;
  }

  return (
    <span style={{
      backgroundColor: bg,
      color: color,
      border: border,
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '0.72rem',
      fontWeight: 700,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      letterSpacing: '0.3px'
    }}>
      <Clock size={12} /> {label}
    </span>
  );
}
