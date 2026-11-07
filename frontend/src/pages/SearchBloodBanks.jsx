import React, { useState, useEffect } from 'react';
import API from '../services/api';
import BloodBankCard from '../components/BloodBankCard';
import InteractiveMap from '../components/InteractiveMap';
import { useSocket } from '../context/SocketContext';

const INDIAN_CITIES = [
  { name: 'Delhi / NCR', lat: '28.6139', lng: '77.2090' },
  { name: 'Mumbai', lat: '19.0760', lng: '72.8777' },
  { name: 'Bengaluru', lat: '12.9716', lng: '77.5946' },
  { name: 'Chennai', lat: '13.0827', lng: '80.2707' },
  { name: 'Kolkata', lat: '22.5726', lng: '88.3639' },
  { name: 'Hyderabad', lat: '17.3850', lng: '78.4867' },
  { name: 'Ahmedabad', lat: '23.0225', lng: '72.5714' },
  { name: 'Pune', lat: '18.5204', lng: '73.8567' },
  { name: 'Jaipur', lat: '26.9124', lng: '75.7873' },
  { name: 'Lucknow', lat: '26.8467', lng: '80.9462' },
  { name: 'Chandigarh', lat: '30.7333', lng: '76.7794' },
  { name: 'Kochi (Kerala)', lat: '9.9312', lng: '76.2673' },
  { name: 'Bhopal (MP)', lat: '23.2599', lng: '77.4126' },
  { name: 'Indore (MP)', lat: '22.7196', lng: '75.8577' },
  { name: 'Guwahati (Assam)', lat: '26.1445', lng: '91.7362' },
  { name: 'Patna (Bihar)', lat: '25.5941', lng: '85.1376' },
  { name: 'Bhubaneswar (Odisha)', lat: '20.2961', lng: '85.8245' },
  { name: 'Varanasi (UP)', lat: '25.3176', lng: '82.9739' },
];

const SearchBloodBanks = () => {
  const socket = useSocket();

  const [lat, setLat] = useState('28.6139');
  const [lng, setLng] = useState('77.2090');
  const [selectedCity, setSelectedCity] = useState('Delhi / NCR');
  const [radius, setRadius] = useState('25000'); // 25 km
  const [bloodGroup, setBloodGroup] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locMsg, setLocMsg] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'map'

  const fetchBloodBanks = async (
    targetLat = lat,
    targetLng = lng,
    targetRadius = radius,
    targetGroup = bloodGroup,
    targetSearch = searchTerm
  ) => {
    setLoading(true);
    try {
      let url = `/bloodbanks?radius=${targetRadius}`;
      if (targetLat && targetLng) {
        url += `&lat=${targetLat}&lng=${targetLng}`;
      }
      if (targetGroup) {
        url += `&bloodGroup=${encodeURIComponent(targetGroup)}`;
      }
      if (targetSearch) {
        url += `&search=${encodeURIComponent(targetSearch)}`;
      }
      const res = await API.get(url);
      setBloodBanks(res.data);
    } catch (err) {
      console.error('Error fetching blood banks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBloodBanks();
  }, []);

  // Listen for real-time inventory updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (data) => {
      if (data.type === 'bloodbank') {
        setBloodBanks((prev) =>
          prev.map((b) => (b._id === data.facilityId ? { ...b, inventory: data.inventory } : b))
        );
      }
    };
    socket.on('inventoryUpdate', handleUpdate);
    return () => socket.off('inventoryUpdate', handleUpdate);
  }, [socket]);

  const handleCityChange = (e) => {
    const cityName = e.target.value;
    setSelectedCity(cityName);
    const city = INDIAN_CITIES.find(c => c.name === cityName);
    if (city) {
      setLat(city.lat);
      setLng(city.lng);
      setLocMsg(`Jumped to ${city.name}`);
      fetchBloodBanks(city.lat, city.lng, radius, bloodGroup, searchTerm);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocMsg('Geolocation not supported.');
      return;
    }
    setLocMsg('Detecting GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude.toFixed(6);
        const userLng = pos.coords.longitude.toFixed(6);
        setLat(userLat);
        setLng(userLng);
        setSelectedCity('');
        setLocMsg('Live GPS location acquired!');
        fetchBloodBanks(userLat, userLng, radius, bloodGroup, searchTerm);
      },
      (err) => {
        setLocMsg(`GPS Error: ${err.message}. Showing selected city.`);
      }
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBloodBanks();
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">🩸 All-India Blood Bank Directory (2,400+ Centers)</h2>
          <p className="text-muted mb-0">
            Real-time stock across verified blood banks covering all 36 States and UTs of India.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* View Toggle */}
          <div className="btn-group me-2" role="group">
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
              🗺️ Map View
            </button>
          </div>

          <label className="small fw-semibold text-muted text-nowrap">Jump to City:</label>
          <select
            className="form-select form-select-sm fw-bold border-danger"
            value={selectedCity}
            onChange={handleCityChange}
            style={{ width: '180px' }}
          >
            <option value="">-- Choose City --</option>
            {INDIAN_CITIES.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Form */}
      <div className="card shadow-sm border-0 mb-4 bg-light">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label small fw-semibold">Search by Name / Keyword</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Red Cross, AIIMS, Rotary..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-semibold">Search Radius</label>
                <select
                  className="form-select form-select-sm"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                >
                  <option value="10000">10 km</option>
                  <option value="25000">25 km</option>
                  <option value="50000">50 km</option>
                  <option value="100000">100 km</option>
                  <option value="500000">500 km (State)</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-semibold">Blood Group</label>
                <select
                  className="form-select form-select-sm"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                >
                  <option value="">All Blood Groups</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-semibold">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-control form-control-sm"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-semibold">Longitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-control form-control-sm"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                />
              </div>
              <div className="col-md-1">
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
                📍 Use My Live GPS Location
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
          items={bloodBanks}
          type="bloodbank"
        />
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading blood banks...</span>
          </div>
        </div>
      ) : bloodBanks.length > 0 ? (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-semibold text-muted">Found {bloodBanks.length} certified blood bank(s) in range</span>
            <span className="badge bg-success-subtle text-success border border-success">
              Live updates active
            </span>
          </div>
          <div className="row g-4">
            {bloodBanks.map((bank) => (
              <div key={bank._id} className="col-md-6 col-lg-4">
                <BloodBankCard bloodBank={bank} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="alert alert-warning text-center py-4" role="alert">
          <h5>No blood banks found with the selected criteria</h5>
          <p className="mb-0 text-muted small">
            Try expanding the search radius or choosing a different city or blood group.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchBloodBanks;
