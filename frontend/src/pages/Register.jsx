import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'patient',
    bloodGroup: 'O+',
    dateOfBirth: '',
  });

  const [location, setLocation] = useState({ lng: 77.2090, lat: 28.6139 });
  const [locStatus, setLocStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus('Geolocation is not supported by your browser');
      return;
    }
    setLocStatus('Detecting GPS location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        });
        setLocStatus(`Located: [${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}]`);
      },
      (err) => {
        setLocStatus(`GPS Error: ${err.message}. Defaulting to city center.`);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { ...formData };
      if (formData.role === 'donor') {
        payload.location = {
          coordinates: [parseFloat(location.lng), parseFloat(location.lat)]
        };
      }

      const user = await register(payload);

      switch (user.role) {
        case 'hospital':
          navigate('/dashboard/hospital');
          break;
        case 'bloodbank':
          navigate('/dashboard/bloodbank');
          break;
        case 'donor':
          navigate('/dashboard/donor');
          break;
        case 'admin':
          navigate('/dashboard/admin');
          break;
        case 'patient':
        default:
          navigate('/dashboard/patient');
          break;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <span className="fs-1">📝</span>
                <h3 className="fw-bold mt-2">Create a LifeLink Account</h3>
                <p className="text-muted small">Join the emergency healthcare network as a user, donor, or facility</p>
              </div>

              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Account Role</label>
                  <select
                    className="form-select"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="patient">Patient / Attendant (General User)</option>
                    <option value="donor">Voluntary Blood Donor</option>
                    <option value="hospital">Hospital Administrator</option>
                    <option value="bloodbank">Blood Bank Administrator</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Full Name / Organization Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Donor-specific fields */}
                {formData.role === 'donor' && (
                  <div className="p-3 bg-light rounded border border-danger-subtle mb-3">
                    <h6 className="fw-bold text-danger mb-3">🩸 Blood Donor Information</h6>
                    <div className="row g-2 mb-2">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Blood Group</label>
                        <select
                          className="form-select form-select-sm"
                          name="bloodGroup"
                          value={formData.bloodGroup}
                          onChange={handleChange}
                          required
                        >
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
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Date of Birth</label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="mt-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={handleGetLocation}
                      >
                        📍 Capture Current Location (for Proximity Alerts)
                      </button>
                      {locStatus && <div className="text-muted small mt-1">{locStatus}</div>}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-danger w-100 fw-bold py-2 mt-2"
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </form>

              <div className="text-center mt-4">
                <p className="small text-muted mb-0">
                  Already have an account?{' '}
                  <Link to="/login" className="text-danger fw-semibold">Sign in</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
