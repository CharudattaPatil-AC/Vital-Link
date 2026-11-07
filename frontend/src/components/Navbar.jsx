import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'hospital':
        return '/dashboard/hospital';
      case 'bloodbank':
        return '/dashboard/bloodbank';
      case 'donor':
        return '/dashboard/donor';
      case 'admin':
        return '/dashboard/admin';
      case 'patient':
      default:
        return '/dashboard/patient';
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-danger shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold fs-4 d-flex align-items-center" to="/">
          <span className="me-2">🏥</span> LifeLink
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link text-white" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/search/hospitals">Hospitals</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/search/bloodbanks">Blood Banks</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/camps">Donation Camps</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white fw-semibold" to="/blood-request/create">
                🚨 Emergency Request
              </Link>
            </li>
          </ul>

          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
            {isAuthenticated ? (
              <>
                <li className="nav-item me-3">
                  <span className="badge bg-light text-dark text-uppercase px-2 py-1 me-2">
                    {user?.role}
                  </span>
                  <span className="text-white fw-medium">{user?.name}</span>
                </li>
                <li className="nav-item me-2">
                  <Link className="btn btn-outline-light btn-sm" to={getDashboardPath()}>
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <button className="btn btn-light btn-sm text-danger fw-bold" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item me-2">
                  <Link className="btn btn-outline-light btn-sm" to="/login">Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-light btn-sm text-danger fw-bold" to="/register">Register</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
