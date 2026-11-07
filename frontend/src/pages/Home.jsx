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
            Real-time tracking of ICU beds, oxygen cylinders, ventilators, blood bank inventories, and smart emergency blood compatibility matching.
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
                  Locate verified hospitals with real-time available ICU beds, general beds, oxygen support, and ventilators.
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
                <div className="fs-1 mb-2">🩸</div>
                <h5 className="card-title fw-bold">Rare Blood Matching</h5>
                <p className="card-text text-muted">
                  Smart compatibility engine maps patient emergency requests to nearby verified blood banks holding compatible units.
                </p>
                <Link to="/blood-request/create" className="btn btn-sm btn-outline-danger">
                  Request Emergency Blood &rarr;
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


    </div>
  );
};

export default Home;
