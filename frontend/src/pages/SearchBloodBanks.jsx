import React, { useState, useEffect } from 'react';
import API from '../services/api';
import BloodBankCard from '../components/BloodBankCard';
import { useSocket } from '../context/SocketContext';

const SearchBloodBanks = () => {
  const socket = useSocket();

  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('25000'); // 25 km
  const [bloodGroup, setBloodGroup] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locMsg, setLocMsg] = useState('');
  const [isGpsActive, setIsGpsActive] = useState(false);

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
      url += '&limit=120';
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
  }, [bloodGroup]);

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

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocMsg('Geolocation not supported by your browser.');
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
        setLocMsg('✓ Live GPS location locked! Filtering nearby blood banks.');
        fetchBloodBanks(userLat, userLng, radius, bloodGroup, searchTerm);
      },
      (err) => {
        setLocMsg(`GPS Error: ${err.message}. Showing All-India registry.`);
        setIsGpsActive(false);
      }
    );
  };

  const handleClearGPS = () => {
    setIsGpsActive(false);
    setLat('');
    setLng('');
    setLocMsg('');
    fetchBloodBanks('', '', radius, bloodGroup, searchTerm);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBloodBanks();
  };

  return (
    <div className="container py-4">
      {/* Header Banner */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1 text-danger">🩸 All-India Blood Bank Directory (2,400+ Centers)</h2>
        <p className="text-muted mb-0">
          Real-time stock across verified blood banks covering all 36 States and UTs of India.
        </p>
      </div>

      {/* Filter Form */}
      <div className="card shadow-sm border-0 mb-4 bg-light">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="row g-3 align-items-end">
              <div className="col-md-5">
                <label className="form-label small fw-semibold">Search by Name / City / State</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Red Cross, Mumbai, AIIMS, Rotary, Delhi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">Filter by Blood Group</label>
                <select
                  className="form-select form-select-sm fw-bold text-danger"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                >
                  <option value="">All 8 Blood Groups</option>
                  <option value="A+">A+</option>
                  <option value="A-">A- (Rare)</option>
                  <option value="B+">B+</option>
                  <option value="B-">B- (Rare)</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB- (Rare)</option>
                  <option value="O+">O+</option>
                  <option value="O-">O- (Universal Donor / Rare)</option>
                </select>
              </div>

              <div className="col-md-3">
                <button type="submit" className="btn btn-danger btn-sm w-100 fw-bold">
                  🔍 Search Blood Banks
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 mt-3 flex-wrap">
              {!isGpsActive ? (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleGetLocation}
                >
                  📍 Filter by My Current Location
                </button>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success-subtle text-success border border-success">
                    📍 GPS Active: [{lat}, {lng}]
                  </span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: '130px' }}
                    value={radius}
                    onChange={(e) => {
                      setRadius(e.target.value);
                      fetchBloodBanks(lat, lng, e.target.value, bloodGroup, searchTerm);
                    }}
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
          </form>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading blood banks...</span>
          </div>
          <p className="mt-3 text-muted">Retrieving all-India blood bank inventory...</p>
        </div>
      ) : bloodBanks.length > 0 ? (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-semibold text-muted">
              Displaying <strong>{bloodBanks.length}</strong> certified blood banks across India
            </span>
            <span className="badge bg-success-subtle text-success border border-success">
              ● Live stock active
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
        <div className="text-center py-5">
          <h5 className="text-muted">No blood banks found matching your criteria.</h5>
          <button
            className="btn btn-outline-danger btn-sm mt-2"
            onClick={() => {
              setSearchTerm('');
              setBloodGroup('');
              handleClearGPS();
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBloodBanks;
