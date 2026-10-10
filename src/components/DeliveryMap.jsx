import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function DeliveryMap({ 
  storeLat = -16.7401, 
  storeLng = -43.8746, 
  radiuses = [], 
  onLocationChange,
  isEditable = true 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circlesRef = useRef([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Garante limpeza de instâncias anteriores e _leaflet_id
    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {}
      mapInstanceRef.current = null;
    }

    try {
      // Inicializa o mapa Leaflet
      const map = L.map(mapContainerRef.current, {
        center: [storeLat, storeLng],
        zoom: 13,
        zoomControl: true
      });

      mapInstanceRef.current = map;

      // Camada de mapa OpenStreetMap (gratuita e sem API key)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Ícone personalizado para a loja
      const storeIcon = L.divIcon({
        className: 'store-map-icon',
        html: `
          <div style="background-color: #eab308; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.5); border: 2px solid #fff; font-size: 18px;">
            🌭
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      // Marcador da loja
      const marker = L.marker([storeLat, storeLng], {
        icon: storeIcon,
        draggable: isEditable
      }).addTo(map);

      marker.bindPopup(`
        <div style="text-align: center; color: #000; font-family: sans-serif;">
          <strong>Nuu Prensado</strong><br/>
          <span style="font-size: 0.8rem; color: #666;">Localização da Loja</span>
        </div>
      `);

      markerRef.current = marker;

      if (isEditable && onLocationChange) {
        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          onLocationChange(lat, lng);
        });

        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          onLocationChange(lat, lng);
        });
      }

      // Requisita recalculo de tamanho após renderizar
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (e) {}
      }, 200);

    } catch (err) {
      console.warn('Erro ao inicializar mapa Leaflet:', err);
    }

    return () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      } catch (e) {}
    };
  }, []);

  // Atualiza círculos de raio e centro quando storeLat, storeLng ou radiuses mudarem
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      // Atualiza marcador
      if (markerRef.current) {
        markerRef.current.setLatLng([storeLat, storeLng]);
      }

      // Limpa círculos antigos
      circlesRef.current.forEach(c => {
        try { map.removeLayer(c); } catch (e) {}
      });
      circlesRef.current = [];

      // Cores para os raios
      const colors = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7'];

      // Adiciona círculos de raio concêntricos
      (radiuses || []).filter(r => r && r.active).forEach((radius, idx) => {
        const color = colors[idx % colors.length];
        const km = Number(radius.maxKm) || 1;
        const fee = Number(radius.fee || 0);

        const circle = L.circle([storeLat, storeLng], {
          color: color,
          fillColor: color,
          fillOpacity: 0.12,
          weight: 2,
          radius: km * 1000 // metros
        }).addTo(map);

        circle.bindTooltip(`Raio de até ${km} km • Taxa: R$ ${fee.toFixed(2)}`, {
          permanent: false,
          direction: 'top'
        });

        circlesRef.current.push(circle);
      });
    } catch (err) {
      console.warn('Erro ao atualizar raios no mapa:', err);
    }
  }, [storeLat, storeLng, radiuses]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '360px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      {isEditable && (
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: 1000, background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', backdropFilter: 'blur(4px)' }}>
          📍 Clique no mapa ou arraste o marcador para ajustar o endereço da loja
        </div>
      )}
    </div>
  );
}
