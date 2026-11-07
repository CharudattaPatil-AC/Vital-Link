import React, { useState, useEffect } from 'react';
import API from '../services/api';
import HospitalCard from '../components/HospitalCard';
import InteractiveMap from '../components/InteractiveMap';
import GoogleMapView from '../components/GoogleMapView';
import { useSocket } from '../context/SocketContext';

const INDIAN_STATES = [
  'All India',
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const SearchHospitals = () => {
  const socket = useSocket();

  // Search & Filter State
  const [selectedState, setSelectedState] = useState('All India');
  const [searchTerm, setSearchTerm] = useState('');
  const [resource, setResource] = useState('');

  // GPS Mode State
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('25000'); // 25 km
  const [locMsg, setLocMsg] = useState('');

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'map', 'google'

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const params = {};

      if (isGpsActive && lat && lng) {
        params.lat = lat;
        params.lng = lng;
        params.radius = radius;
      }

      if (selectedState && selectedState !== 'All India') {
        params.state = selectedState;
      }

      if (resource) {
        params.resource = resource;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      params.limit = 120;

      const res = await API.get('/hospitals', { params });
      setHospitals(res.data);
    } catch (err) {
      console.error('Error fetching hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [selectedState, resource, isGpsActive, radius]);

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

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setLocMsg('Geolocation is not supported by your browser.');
      return;
    }
    setLocMsg('Detecting live GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude.toFixed(6);
        const userLng = pos.coords.longitude.toFixed(6);
        setLat(userLat);
        setLng(userLng);
        setIsGpsActive(true);
        setLocMsg('✓ Live GPS location locked! Filtering nearby hospitals.');
      },
      (err) => {
        setLocMsg(`GPS Notice: ${err.message}. Showing All-India registry.`);
        setIsGpsActive(false);
      }
    );
  };

  const handleClearGPS = () => {
    setIsGpsActive(false);
    setLat('');
    setLng('');
    setLocMsg('');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHospitals();
  };

  // Center coordinates for map view: use GPS if active, otherwise India centroid
  const mapCenter = isGpsActive && lat && lng
    ? [parseFloat(lat), parseFloat(lng)]
    : [20.5937, 78.9629];

  return (
    <div className="container py-4">
      {/* Header Banner */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1 text-danger">🏥 All-India Hospital & Emergency Bed Directory</h2>
          <p className="text-muted mb-0">
            Real-time tracking of verified hospitals with ICU beds, oxygen cylinders, ventilators, and emergency care.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="d-flex align-items-center gap-2">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'cards' ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={() => setViewMode('cards')}
            >
              📋 Cards
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
      </div>

      {/* Main Search & Filter Card */}
      <div className="card shadow-sm border-0 mb-4 bg-light">
        <div className="card-body">
          <form onSubmit={handleSearchSubmit}>
            <div className="row g-3 align-items-end">
              {/* Keyword / Facility Name Search */}
              <div className="col-md-4">
                <label className="form-label small fw-semibold text-secondary">Search Keyword / City / Hospital</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Apollo, AIIMS, Fortis, Mumbai, Civil..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* State Filter */}
              <div className="col-md-3">
                <label className="form-label small fw-semibold text-secondary">Indian State / Union Territory</label>
                <select
                  className="form-select form-select-sm fw-bold border-danger"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                >
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state === 'All India' ? '🇮🇳 All India (All States & UTs)' : state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resource Filter */}
              <div className="col-md-3">
                <label className="form-label small fw-semibold text-secondary">Required Emergency Resource</label>
                <select
                  className="form-select form-select-sm"
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                >
                  <option value="">All Critical Resources</option>
                  <option value="icuBeds">ICU Beds Available</option>
                  <option value="generalBeds">General Emergency Beds</option>
                  <option value="oxygenCylinders">Oxygen Cylinders Standby</option>
                  <option value="ventilators">Ventilators Active</option>
                </select>
              </div>

              {/* Search Action Button */}
              <div className="col-md-2">
                <button type="submit" className="btn btn-danger btn-sm w-100 fw-bold">
                  🔍 Filter Hospitals
                </button>
              </div>
            </div>

            {/* GPS Radius Controls */}
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3 pt-3 border-top">
              <div className="d-flex align-items-center gap-2">
                {!isGpsActive ? (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleUseGPS}
                  >
                    📍 Filter Near My Live GPS Location
                  </button>
                ) : (
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success py-2 px-3">
                      📍 Live GPS Active ({lat}, {lng})
                    </span>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: '130px' }}
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                    >
                      <option value="10000">10 km radius</option>
                      <option value="25000">25 km radius</option>
                      <option value="50000">50 km radius</option>
                      <option value="100000">100 km radius</option>
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={handleClearGPS}
                    >
                      ✕ Reset to All India
                    </button>
                  </div>
                )}
                {locMsg && <span className="small text-muted">{locMsg}</span>}
              </div>

              <div className="text-muted small">
                Region: <span className="fw-bold text-dark">{selectedState}</span>
                {resource && <span> • Filtered by <strong>{resource}</strong></span>}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Map Views */}
      {viewMode === 'map' && (
        <div className="mb-4">
          <InteractiveMap
            center={mapCenter}
            radius={isGpsActive ? parseInt(radius, 10) : 500000}
            items={hospitals}
            type="hospital"
          />
        </div>
      )}

      {viewMode === 'google' && (
        <div className="mb-4">
          <GoogleMapView
            center={mapCenter}
            radius={isGpsActive ? parseInt(radius, 10) : 500000}
            items={hospitals}
            type="hospital"
          />
        </div>
      )}

      {/* Results Section */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading hospitals...</span>
          </div>
          <p className="mt-3 text-muted">Retrieving all-India emergency hospital directory...</p>
        </div>
      ) : hospitals.length > 0 ? (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-semibold text-muted">
              Displaying <strong>{hospitals.length}</strong> verified hospitals across {selectedState === 'All India' ? 'India' : selectedState}
            </span>
            <span className="badge bg-success-subtle text-success border border-success">
              ● Live bed counters active
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
        <div className="alert alert-warning text-center py-5 shadow-sm border-0" role="alert">
          <div className="display-6 mb-2">🏥</div>
          <h5 className="fw-bold">No emergency hospitals found with the selected criteria</h5>
          <p className="mb-3 text-muted small">
            Try choosing "All India", clearing the keyword filter, or choosing "All Critical Resources".
          </p>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => {
              setSelectedState('All India');
              setSearchTerm('');
              setResource('');
              handleClearGPS();
            }}
          >
            Reset Filters & View All India
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchHospitals;
