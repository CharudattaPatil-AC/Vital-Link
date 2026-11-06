import React, { useEffect, useRef, useState } from 'react';

const GoogleMapView = ({
  center = [28.6139, 77.2090], // [lat, lng]
  radius = 25000,
  items = [],
  type = 'hospital'
}) => {
  const mapContainerRef = useRef(null);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const lat = center[0];
  const lng = center[1];

  // Try loading Google Maps JS API if API key exists
  useEffect(() => {
    if (!apiKey) return;

    // Check if already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => setLoadError(true);
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setMapLoaded(true));
    }
  }, [apiKey]);

  // Render Google Map with markers when JS API is ready
  useEffect(() => {
    if (!mapLoaded || !window.google || !window.google.maps || !mapContainerRef.current) return;

    const mapCenter = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const map = new window.google.maps.Map(mapContainerRef.current, {
      center: mapCenter,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true
    });

    // Draw user location marker
    new window.google.maps.Marker({
      position: mapCenter,
      map: map,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: '#0d6efd',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3
      }
    });

    // Draw search radius circle
    new window.google.maps.Circle({
      strokeColor: type === 'bloodbank' ? '#dc3545' : '#0d6efd',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: type === 'bloodbank' ? '#dc3545' : '#0d6efd',
      fillOpacity: 0.1,
      map: map,
      center: mapCenter,
      radius: parseInt(radius, 10) || 25000
    });

    const infoWindow = new window.google.maps.InfoWindow();

    // Add facility markers
    items.forEach((item) => {
      if (!item.location || !item.location.coordinates || item.location.coordinates.length < 2) return;
      const [itemLng, itemLat] = item.location.coordinates;
      if (isNaN(itemLat) || isNaN(itemLng)) return;

      const markerColor = type === 'bloodbank' ? '#dc3545' : '#0d6efd';
      const marker = new window.google.maps.Marker({
        position: { lat: itemLat, lng: itemLng },
        map: map,
        title: item.name,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      marker.addListener('click', () => {
        let content = '';
        if (type === 'hospital') {
          content = `
            <div style="font-family:sans-serif; max-width:240px; padding:4px;">
              <h6 style="color:#0d6efd; margin-bottom:4px; font-weight:bold;">${item.name}</h6>
              <p style="font-size:12px; color:#6c757d; margin-bottom:4px;">📍 ${item.address || ''}</p>
              <p style="font-size:12px; margin-bottom:6px;">📞 ${item.phone || ''}</p>
              <div style="font-size:12px; margin-bottom:8px;">
                <strong>ICU Beds:</strong> ${item.resources?.icuBeds?.available ?? 0}<br/>
                <strong>Oxygen:</strong> ${item.resources?.oxygenCylinders?.available ?? 0} units
              </div>
              <div style="display:flex; gap:6px;">
                <a href="/hospitals/${item._id}" style="display:inline-block; padding:4px 8px; background:#dc3545; color:#fff; text-decoration:none; border-radius:4px; font-size:11px; font-weight:bold;">
                  Reserve Bed
                </a>
                <a href="https://www.google.com/maps/dir/?api=1&destination=${itemLat},${itemLng}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:4px 8px; background:#0d6efd; color:#fff; text-decoration:none; border-radius:4px; font-size:11px; font-weight:bold;">
                  🧭 Navigate
                </a>
              </div>
            </div>
          `;
        } else {
          content = `
            <div style="font-family:sans-serif; max-width:240px; padding:4px;">
              <h6 style="color:#dc3545; margin-bottom:4px; font-weight:bold;">🩸 ${item.name}</h6>
              <p style="font-size:12px; color:#6c757d; margin-bottom:4px;">📍 ${item.address || ''}</p>
              <p style="font-size:12px; margin-bottom:6px;">📞 ${item.phone || ''}</p>
              <div style="display:flex; gap:6px; margin-top:6px;">
                <a href="/bloodbanks/${item._id}" style="display:inline-block; padding:4px 8px; background:#dc3545; color:#fff; text-decoration:none; border-radius:4px; font-size:11px; font-weight:bold;">
                  View Stock
                </a>
                <a href="https://www.google.com/maps/dir/?api=1&destination=${itemLat},${itemLng}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:4px 8px; background:#0d6efd; color:#fff; text-decoration:none; border-radius:4px; font-size:11px; font-weight:bold;">
                  🧭 Navigate
                </a>
              </div>
            </div>
          `;
        }
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      });
    });
  }, [mapLoaded, lat, lng, radius, items, type]);

  // Embed Mode (when no API key is set)
  if (!apiKey || loadError) {
    const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=12&output=embed`;
    const fullDirectionsUrl = `https://www.google.com/maps/search/hospitals/@${lat},${lng},13z`;

    return (
      <div className="card shadow-sm border-0 mb-4 overflow-hidden">
        {/* Top bar with quick directions link */}
        <div className="bg-light p-2 px-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="small">
            <span className="badge bg-danger me-2">Google Maps Live Embed</span>
            <span className="text-muted">Centred on [{parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}]</span>
          </div>
          <a
            href={fullDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-danger btn-sm fw-semibold"
          >
            🧭 Open Full Google Maps in New Tab &rarr;
          </a>
        </div>

        {/* Responsive Google Maps Embed iframe */}
        <iframe
          title="Google Maps Location View"
          src={embedUrl}
          width="100%"
          height="450"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>

        {/* Quick List of Nearby Facilities with Instant Google Maps Direction Buttons */}
        {items.length > 0 && (
          <div className="card-footer bg-white p-3">
            <h6 className="fw-bold small text-uppercase text-muted mb-2">
              Instant Google Maps Turn-by-Turn GPS Directions ({items.length} in range):
            </h6>
            <div className="row g-2">
              {items.slice(0, 6).map((item) => {
                if (!item.location?.coordinates) return null;
                const [iLng, iLat] = item.location.coordinates;
                const directionsLink = `https://www.google.com/maps/dir/?api=1&destination=${iLat},${iLng}&travelmode=driving`;

                return (
                  <div key={item._id} className="col-md-6 col-lg-4">
                    <div className="p-2 border rounded d-flex justify-content-between align-items-center bg-light small">
                      <div className="text-truncate me-2">
                        <strong className="d-block text-truncate">{item.name}</strong>
                        <span className="text-muted" style={{ fontSize: '11px' }}>{item.address}</span>
                      </div>
                      <a
                        href={directionsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-primary text-nowrap fw-bold"
                        style={{ fontSize: '11px' }}
                      >
                        🧭 Directions
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 mb-4 overflow-hidden">
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '450px'
        }}
      />
    </div>
  );
};

export default GoogleMapView;

