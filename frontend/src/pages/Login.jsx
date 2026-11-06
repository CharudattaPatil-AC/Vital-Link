import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      // Redirect based on role
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
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <span className="fs-1">🏥</span>
                <h3 className="fw-bold mt-2">Sign In to LifeLink</h3>
                <p className="text-muted small">Access facility management, donor portal, or emergency requests</p>
              </div>

              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-danger w-100 fw-bold py-2 mt-2"
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <div className="text-center mt-4">
                <p className="small text-muted mb-1">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-danger fw-semibold">Register here</Link>
                </p>
              </div>

              {/* Demo Credentials hint */}
              <div className="mt-4 pt-3 border-top small text-muted">
                <div className="fw-bold mb-2">Demo Credentials (click to fill, pass: password123):</div>
                <div className="d-flex flex-wrap gap-1">
                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm py-0 px-2"
                    onClick={() => { setEmail('admin@lifelink.org'); setPassword('password123'); }}
                  >
                    Admin: admin@lifelink.org
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm py-0 px-2"
                    onClick={() => { setEmail('hospital@apollo.com'); setPassword('password123'); }}
                  >
                    Hospital: hospital@apollo.com
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm py-0 px-2"
                    onClick={() => { setEmail('bloodbank@city.org'); setPassword('password123'); }}
                  >
                    Blood Bank: bloodbank@city.org
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm py-0 px-2"
                    onClick={() => { setEmail('rahul.donor@example.com'); setPassword('password123'); }}
                  >
                    Donor: rahul.donor@example.com
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm py-0 px-2"
                    onClick={() => { setEmail('patient@example.com'); setPassword('password123'); }}
                  >
                    Patient: patient@example.com
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
