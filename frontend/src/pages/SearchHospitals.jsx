import React, { useState, useEffect } from 'react';
import API from '../services/api';
import HospitalCard from '../components/HospitalCard';
import InteractiveMap from '../components/InteractiveMap';
import GoogleMapView from '../components/GoogleMapView';
import { useSocket } from '../context/SocketContext';

const SearchHospitals = () => {
  const socket = useSocket();

  const [lat, setLat] = useState('28.6139');
  const [lng, setLng] = useState('77.2090');
  const [radius, setRadius] = useState('25000'); // 25 km
  const [resource, setResource] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locMsg, setLocMsg] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'map'

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      let url = `/hospitals?radius=${radius}`;
      if (lat && lng) {
        url += `&lat=${lat}&lng=${lng}`;
      }
      if (resource) {
        url += `&resource=${resource}`;
      }
      const res = await API.get(url);
      setHospitals(res.data);
    } catch (err) {
      console.error('Error fetching hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  // Listen for real-time inventory updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (data) => {
      if (data.type === 'hospital') {
        setHospitals((prev) =>
          prev.map((h) => (h._id === data.facilityId ? { ...h, resources: data.resources } : h))
        );
      }
    };
    socket.on('inventoryUpdate', handleUpdate);
    return () => socket.off('inventoryUpdate', handleUpdate);
  }, [socket]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocMsg('Geolocation not supported by browser.');
      return;
    }
    setLocMsg('Detecting location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocMsg('Location retrieved!');
      },
      (err) => {
        setLocMsg(`Location error: ${err.message}. Using current inputs.`);
      }
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHospitals();
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">🏥 Emergency Hospitals & Bed Finder</h2>
          <p className="text-muted mb-0">
            Real-time tracking of available ICU beds, oxygen, and emergency care near you.
          </p>
        </div>
        {/* View Toggle */}
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'cards' ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => setViewMode('cards')}
          >
            📋 Grid Cards
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'map' ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => setViewMode('map')}
          >
            🗺️ Leaflet Map
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'google' ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => setViewMode('google')}
          >
            📍 Google Maps
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="card shadow-sm border-0 mb-4 bg-light">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label small fw-semibold">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-control form-control-sm"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="e.g. 28.6139"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-semibold">Longitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-control form-control-sm"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="e.g. 77.2090"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-semibold">Search Radius</label>
                <select
                  className="form-select form-select-sm"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                >
                  <option value="5000">5 km</option>
                  <option value="10000">10 km</option>
                  <option value="25000">25 km</option>
                  <option value="50000">50 km</option>
                  <option value="100000">100 km</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-semibold">Resource Filter</label>
                <select
                  className="form-select form-select-sm"
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                >
                  <option value="">All Resources</option>
                  <option value="icuBeds">ICU Beds Available</option>
                  <option value="generalBeds">General Beds Available</option>
                  <option value="oxygenCylinders">Oxygen Available</option>
                  <option value="ventilators">Ventilators Available</option>
                </select>
              </div>
              <div className="col-md-2 d-flex gap-1">
                <button type="submit" className="btn btn-danger btn-sm w-100 fw-bold">
                  Search
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 mt-3">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={handleGetLocation}
              >
                📍 Use My Current Location
              </button>
              {locMsg && <span className="small text-muted">{locMsg}</span>}
            </div>
          </form>
        </div>
      </div>

      {/* Map Views */}
      {viewMode === 'map' && (
        <InteractiveMap
          center={[parseFloat(lat) || 28.6139, parseFloat(lng) || 77.2090]}
          radius={parseInt(radius, 10)}
          items={hospitals}
          type="hospital"
        />
      )}

      {viewMode === 'google' && (
        <GoogleMapView
          center={[parseFloat(lat) || 28.6139, parseFloat(lng) || 77.2090]}
          radius={parseInt(radius, 10)}
          items={hospitals}
          type="hospital"
        />
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading hospitals...</span>
          </div>
        </div>
      ) : hospitals.length > 0 ? (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-semibold text-muted">Found {hospitals.length} hospital(s)</span>
            <span className="badge bg-success-subtle text-success border border-success">
              Live updates enabled
            </span>
          </div>
          <div className="row g-4">
            {hospitals.map((hospital) => (
              <div key={hospital._id} className="col-md-6 col-lg-4">
                <HospitalCard hospital={hospital} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="alert alert-warning text-center py-4" role="alert">
          <h5>No hospitals found matching your criteria</h5>
          <p className="mb-0 text-muted small">
            Try expanding your search radius or changing resource filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchHospitals;
