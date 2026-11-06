import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const InteractiveMap = ({
  center = [28.6139, 77.2090], // [lat, lng]
  radius = 25000, // in meters
  items = [], // array of hospital or blood bank objects
  type = 'hospital', // 'hospital' or 'bloodbank'
  onSelect
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const circleLayerRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: 11,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      const circleGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = markersGroup;
      circleLayerRef.current = circleGroup;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center, radius circle, and markers when items or center change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !circleLayerRef.current) return;

    // Pan map to new center
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, 11);

      // Redraw user location & radius circle
      circleLayerRef.current.clearLayers();

      // User location marker
      const userIcon = L.divIcon({
        className: 'user-loc-pin',
        html: `<div style="background-color:#0d6efd; width:18px; height:18px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 8px rgba(0,0,0,0.5);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      L.marker(center, { icon: userIcon })
        .bindPopup(`<strong>Your Search Origin</strong><br>Radius: ${(radius / 1000).toFixed(0)} km`)
        .addTo(circleLayerRef.current);

      // Search Radius circle
      L.circle(center, {
        color: type === 'bloodbank' ? '#dc3545' : '#0d6efd',
        fillColor: type === 'bloodbank' ? '#dc3545' : '#0d6efd',
        fillOpacity: 0.08,
        radius: parseInt(radius, 10) || 25000,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(circleLayerRef.current);
    }

    // Clear and redraw facility markers
    markersLayerRef.current.clearLayers();

    items.forEach((item) => {
      if (!item.location || !item.location.coordinates || item.location.coordinates.length < 2) return;
      const [lng, lat] = item.location.coordinates;
      if (isNaN(lat) || isNaN(lng)) return;

      const isHospital = type === 'hospital';
      const iconEmoji = isHospital ? '🏥' : '🩸';
      const bgColor = isHospital ? '#0d6efd' : '#dc3545';

      const pinIcon = L.divIcon({
        className: 'custom-facility-pin',
        html: `
          <div style="
            background-color: ${bgColor};
            color: #fff;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            border: 2px solid #fff;
          ">
            ${iconEmoji}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      let popupContent = '';
      if (isHospital) {
        popupContent = `
          <div style="font-size: 13px; max-width: 220px;">
            <strong style="color:#0d6efd; font-size:14px;">${item.name}</strong><br/>
            <span style="color:#6c757d;">📍 ${item.address || ''}</span><br/>
            <span style="color:#212529;">📞 ${item.phone || ''}</span>
            <hr style="margin: 6px 0;"/>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span>ICU Beds: <strong>${item.resources?.icuBeds?.available ?? 0}</strong></span>
              <span>Oxygen: <strong>${item.resources?.oxygenCylinders?.available ?? 0}</strong></span>
            </div>
            <a href="/hospitals/${item._id}" class="btn btn-sm btn-danger text-white w-100 mt-1" style="font-size:11px; padding:3px 6px;">
              View & Reserve Bed
            </a>
          </div>
        `;
      } else {
        const availableGroups = item.inventory
          ? item.inventory.filter(i => i.unitsAvailable > 0).map(i => `${i.bloodGroup}: ${i.unitsAvailable}`).slice(0, 4).join(', ')
          : 'Stock available';

        popupContent = `
          <div style="font-size: 13px; max-width: 220px;">
            <strong style="color:#dc3545; font-size:14px;">🩸 ${item.name}</strong><br/>
            <span style="color:#6c757d;">📍 ${item.address || ''}</span><br/>
            <span style="color:#212529;">📞 ${item.phone || ''}</span>
            <hr style="margin: 6px 0;"/>
            <div style="font-size:11px; color:#495057; margin-bottom:6px;">
              <strong>Stock on hand:</strong><br/>
              ${availableGroups || 'Inquire at bank'}
            </div>
            <a href="/bloodbanks/${item._id}" class="btn btn-sm btn-danger text-white w-100 mt-1" style="font-size:11px; padding:3px 6px;">
              View & Hold Units
            </a>
          </div>
        `;
      }

      L.marker([lat, lng], { icon: pinIcon })
        .bindPopup(popupContent)
        .addTo(markersLayerRef.current);
    });
  }, [items, center, radius, type]);

  return (
    <div className="card shadow-sm border-0 mb-4 overflow-hidden">
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '450px',
          zIndex: 1
        }}
      />
    </div>
  );
};

export default InteractiveMap;

