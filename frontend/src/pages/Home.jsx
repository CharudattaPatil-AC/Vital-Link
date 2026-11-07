import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

const Home = () => {
  const [activeRequests, setActiveRequests] = useState([]);

  useEffect(() => {
    const fetchActiveRequests = async () => {
      try {
        const res = await API.get('/blood-requests/active');
        setActiveRequests(res.data.slice(0, 3));
      } catch (err) {
        console.error('Error fetching blood requests:', err);
      }
    };
    fetchActiveRequests();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-light py-5 border-bottom">
        <div className="container text-center py-4">
          <span className="badge bg-danger mb-3 px-3 py-2 fs-6">Lifesaving Seconds Matter</span>
          <h1 className="display-5 fw-bold text-dark mb-3">
            LifeLink – Emergency Healthcare Resource Network
          </h1>
          <p className="lead text-muted mx-auto" style={{ maxWidth: '750px' }}>
            Real-time tracking of ICU beds, oxygen cylinders, blood bank inventories, and an automated proximity-based emergency donor matching system.
          </p>
          <div className="d-flex justify-content-center gap-3 mt-4">
            <Link to="/search/hospitals" className="btn btn-danger btn-lg px-4 fw-bold">
              Find Hospital Beds
            </Link>
            <Link to="/search/bloodbanks" className="btn btn-outline-danger btn-lg px-4 fw-bold">
              Find Blood Units
            </Link>
            <Link to="/blood-request/create" className="btn btn-dark btn-lg px-4 fw-bold">
              🚨 Emergency Request
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="container py-5">
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card h-100 p-3 shadow-sm border-0 bg-white">
              <div className="card-body">
                <div className="fs-1 mb-2">🏥</div>
                <h5 className="card-title fw-bold">Hospital Resource Finder</h5>
                <p className="card-text text-muted">
                  Locate verified hospitals with real-time available ICU beds, general beds, oxygen support, and emergency medicines.
                </p>
                <Link to="/search/hospitals" className="btn btn-sm btn-outline-danger">
                  Search Hospitals &rarr;
                </Link>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100 p-3 shadow-sm border-0 bg-white">
              <div className="card-body">
                <div className="fs-1 mb-2">🩸</div>
                <h5 className="card-title fw-bold">Blood Bank Inventories</h5>
                <p className="card-text text-muted">
                  Check live unit availability across all 8 blood groups and hold critical units before arrival to prevent delays.
                </p>
                <Link to="/search/bloodbanks" className="btn btn-sm btn-outline-danger">
                  Search Blood Banks &rarr;
                </Link>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100 p-3 shadow-sm border-0 bg-white">
              <div className="card-body">
                <div className="fs-1 mb-2">🤝</div>
                <h5 className="card-title fw-bold">Emergency Donor Network</h5>
                <p className="card-text text-muted">
                  Automated geo-proximity matching connects patients with registered voluntary blood donors within a 5 km radius.
                </p>
                <Link to="/register" className="btn btn-sm btn-outline-danger">
                  Register as Donor &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Emergency Requests Banner */}
      {activeRequests.length > 0 && (
        <section className="bg-danger-subtle py-4 border-top border-bottom border-danger">
          <div className="container">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-bold text-danger mb-0">🚨 Active Emergency Blood Alerts</h4>
              <Link to="/blood-request/create" className="btn btn-danger btn-sm">
                Create Request
              </Link>
            </div>
            <div className="row g-3">
              {activeRequests.map((req) => (
                <div key={req._id} className="col-md-4">
                  <div className="card border-0 shadow-sm p-2">
                    <div className="card-body p-2">
                      <div className="d-flex justify-content-between">
                        <span className="badge bg-danger fs-6">{req.bloodGroup}</span>
                        <span className="badge bg-dark text-uppercase">{req.urgency}</span>
                      </div>
                      <div className="fw-semibold mt-2">{req.unitsNeeded} Units Required</div>
                      <div className="text-muted small">{req.hospitalName || 'Emergency Center'}</div>
                      <div className="text-danger small mt-1">📞 {req.contactPhone}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Informational Section */}
      <section className="container py-5 text-center">
        <h3 className="fw-bold mb-3">How LifeLink Saves Critical Golden Hours</h3>
        <div className="row g-4 mt-2 text-start">
          <div className="col-md-4">
            <div className="p-3 border rounded bg-white">
              <h6 className="fw-bold text-danger">1. Instant Geo-Discovery</h6>
              <p className="text-muted small mb-0">
                Uses MongoDB 2dsphere indexing to pinpoint facilities nearest to your current GPS coordinates.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 border rounded bg-white">
              <h6 className="fw-bold text-danger">2. Atomic Reservations</h6>
              <p className="text-muted small mb-0">
                Prevents double booking of hospital beds or rare blood units with atomic conditional checks.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 border rounded bg-white">
              <h6 className="fw-bold text-danger">3. Real-Time Socket Updates</h6>
              <p className="text-muted small mb-0">
                Live inventory synchronisation via WebSockets keeps ambulances and families informed without manual calls.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
