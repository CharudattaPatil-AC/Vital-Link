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
    bloodGroup: 'O+'
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

      const user = await register(payload);

      switch (user.role) {
        case 'hospital':
          navigate('/dashboard/hospital');
          break;
        case 'bloodbank':
          navigate('/dashboard/bloodbank');
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
                <p className="text-muted small">Join the emergency healthcare network as a patient or healthcare facility</p>
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
