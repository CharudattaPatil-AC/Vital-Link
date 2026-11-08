import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../services/api';

const CreateBloodRequest = () => {
  const navigate = useNavigate();
  const locationHook = useLocation();
  const searchParams = new URLSearchParams(locationHook.search);
  const initialGroup = searchParams.get('group') || 'B+';

  const [formData, setFormData] = useState({
    bloodGroup: initialGroup,
    unitsNeeded: 2,
    urgency: 'critical',
    hospitalName: '',
    contactPhone: '',
    radius: 5000
  });

  const [location, setLocation] = useState({
    lat: '28.6139',
    lng: '77.2090'
  });

  const [locStatus, setLocStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus('Geolocation is not supported by your browser.');
      return;
    }
    setLocStatus('Detecting current GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6)
        });
        setLocStatus(`GPS acquired: [${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}]`);
      },
      (err) => {
        setLocStatus(`GPS error: ${err.message}. Using default coordinates.`);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        unitsNeeded: parseInt(formData.unitsNeeded, 10),
        radius: parseInt(formData.radius, 10),
        location: {
          coordinates: [parseFloat(location.lng), parseFloat(location.lat)]
        }
      };

      const res = await API.post('/blood-requests', payload);
      setSuccessResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to broadcast emergency blood request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm border-0 border-top border-4 border-danger">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <span className="fs-1 me-3">🚨</span>
                <div>
                  <h3 className="fw-bold mb-0 text-danger">Emergency Blood Request Broadcast</h3>
                  <p className="text-muted small mb-0">
                    Instantly searches and alerts nearby verified blood banks holding stock for your requested blood group.
                  </p>
                </div>
              </div>

              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              {successResult ? (
                <div>
                  <div className="alert alert-success p-4 mb-4">
                    <h4 className="fw-bold text-success mb-2">✓ Broadcast Dispatched Successfully!</h4>
                    <p className="mb-2">
                      Matched <strong>{successResult.matchedBanksCount || 0} verified blood bank(s)</strong> within{' '}
                      {formData.radius / 1000} km with available units on hand for <strong>{formData.bloodGroup}</strong>.
                    </p>
                  </div>

                  {/* Matched Blood Banks */}
                  {successResult.matchedBloodBanks && successResult.matchedBloodBanks.length > 0 && (
                    <div className="card border-0 shadow-sm mb-4 bg-light">
                      <div className="card-header bg-danger text-white py-2">
                        <h6 className="fw-bold mb-0">🏥 Matched Blood Banks with {formData.bloodGroup} in Stock:</h6>
                      </div>
                      <div className="card-body p-3">
                        <div className="list-group">
                          {successResult.matchedBloodBanks.map((bank, idx) => (
                            <div key={idx} className="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2">
                              <div>
                                <div className="d-flex align-items-center gap-2">
                                  <h6 className="fw-bold mb-0">{bank.name}</h6>
                                  <span className={`badge ${bank.matchTier === 1 ? 'bg-success' : 'bg-primary'}`}>
                                    {bank.matchLabel}
                                  </span>
                                </div>
                                <div className="small text-muted">{bank.address} | 📞 {bank.phone}</div>
                                <div className="mt-1 d-flex gap-2 align-items-center">
                                  <span className="badge bg-danger">
                                    {bank.unitsAvailable} Units Available
                                  </span>
                                  {bank.distanceKm !== undefined && (
                                    <span className="small text-muted">📍 ~{bank.distanceKm} km away</span>
                                  )}
                                </div>
                              </div>
                              <Link to={`/bloodbanks/${bank.bloodBank?._id || bank.bloodBank}?requested=${encodeURIComponent(formData.bloodGroup)}`} className="btn btn-sm btn-outline-danger">
                                View Stock &rarr;
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-center mt-3">
                    <button
                      className="btn btn-danger fw-bold px-4 py-2"
                      onClick={() => navigate('/dashboard/patient')}
                    >
                      Go to Patient Dashboard &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Patient's Blood Group</label>
                      <select
                        className="form-select fw-bold text-danger fs-5"
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                        required
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+ (Universal Recipient)</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O- (Universal Donor)</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Units Needed</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        className="form-control"
                        name="unitsNeeded"
                        value={formData.unitsNeeded}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Urgency Level</label>
                      <select
                        className="form-select"
                        name="urgency"
                        value={formData.urgency}
                        onChange={handleChange}
                      >
                        <option value="critical">Critical (Immediate / Life Threatening)</option>
                        <option value="urgent">Urgent (Within 2-4 Hours)</option>
                        <option value="normal">Normal (Within 24 Hours)</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Broadcast Radius</label>
                      <select
                        className="form-select"
                        name="radius"
                        value={formData.radius}
                        onChange={handleChange}
                      >
                        <option value="3000">3 km (Immediate Neighborhood)</option>
                        <option value="5000">5 km (Standard City Radius)</option>
                        <option value="10000">10 km (Wider City Area)</option>
                        <option value="25000">25 km (Metropolitan Area)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Hospital / Facility Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="hospitalName"
                      placeholder="e.g. Apollo Hospital ICU Ward 3"
                      value={formData.hospitalName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Attendant / Emergency Contact Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="contactPhone"
                      placeholder="e.g. +91 9876543210"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Location Picker */}
                  <div className="p-3 bg-light rounded mb-3 border">
                    <label className="form-label fw-semibold mb-1">Emergency GPS Coordinates</label>
                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="small text-muted">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          className="form-control form-control-sm"
                          value={location.lat}
                          onChange={(e) => setLocation({ ...location, lat: e.target.value })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="small text-muted">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          className="form-control form-control-sm"
                          value={location.lng}
                          onChange={(e) => setLocation({ ...location, lng: e.target.value })}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={handleGetLocation}
                    >
                      📍 Auto-Detect Current GPS Coordinates
                    </button>
                    {locStatus && <div className="text-muted small mt-1">{locStatus}</div>}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-danger w-100 fw-bold py-2 fs-5"
                    disabled={loading}
                  >
                    {loading ? 'Running Compatibility Engine...' : '🚀 Broadcast Smart Emergency Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBloodRequest;
