import React, { useState, useEffect } from 'react';
import API from '../services/api';

const AdminDashboard = () => {
  const [hospitals, setHospitals] = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchAdminData = async () => {
    try {
      const [hospRes, bbRes, resRes] = await Promise.all([
        API.get('/hospitals'),
        API.get('/bloodbanks'),
        API.get('/reservations')
      ]);
      setHospitals(hospRes.data);
      setBloodBanks(bbRes.data);
      setReservations(resRes.data);
    } catch (err) {
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleVerifyHospital = async (id) => {
    try {
      const res = await API.put(`/hospitals/${id}/verify`);
      setHospitals(hospitals.map(h => h._id === id ? res.data : h));
      setMsg(`Updated verification status for hospital: ${res.data.name}`);
    } catch (err) {
      setMsg('Error updating hospital verification.');
    }
  };

  const handleToggleVerifyBloodBank = async (id) => {
    try {
      const res = await API.put(`/bloodbanks/${id}/verify`);
      setBloodBanks(bloodBanks.map(b => b._id === id ? res.data : b));
      setMsg(`Updated verification status for blood bank: ${res.data.name}`);
    } catch (err) {
      setMsg('Error updating blood bank verification.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading admin console...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="fw-bold">🛡️ LifeLink System Administration</h2>
        <p className="text-muted">Network resource overview and facility authorization control</p>
      </div>

      {msg && (
        <div className="alert alert-info alert-dismissible fade show py-2" role="alert">
          {msg}
          <button type="button" className="btn-close" onClick={() => setMsg('')}></button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 bg-primary text-white p-3">
            <h6 className="text-uppercase small mb-1 opacity-75">Registered Hospitals</h6>
            <h2 className="fw-bold mb-0">{hospitals.length}</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 bg-danger text-white p-3">
            <h6 className="text-uppercase small mb-1 opacity-75">Blood Banks</h6>
            <h2 className="fw-bold mb-0">{bloodBanks.length}</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 bg-dark text-white p-3">
            <h6 className="text-uppercase small mb-1 opacity-75">Total System Reservations</h6>
            <h2 className="fw-bold mb-0">{reservations.length}</h2>
          </div>
        </div>
      </div>

      {/* Hospitals List */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light py-3">
          <h5 className="fw-bold mb-0">Hospitals In Network</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Hospital Name</th>
                  <th>Contact</th>
                  <th>ICU Available</th>
                  <th>Oxygen Available</th>
                  <th>Status</th>
                  <th className="text-end">Verification Control</th>
                </tr>
              </thead>
              <tbody>
                {hospitals.map((h) => (
                  <tr key={h._id}>
                    <td className="fw-semibold">{h.name}</td>
                    <td className="small">{h.phone}</td>
                    <td>{h.resources?.icuBeds?.available ?? 0} / {h.resources?.icuBeds?.total ?? 0}</td>
                    <td>{h.resources?.oxygenCylinders?.available ?? 0}</td>
                    <td>
                      {h.verified ? (
                        <span className="badge bg-success">Verified</span>
                      ) : (
                        <span className="badge bg-warning text-dark">Pending</span>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        className={`btn btn-sm ${h.verified ? 'btn-outline-danger' : 'btn-success'}`}
                        onClick={() => handleToggleVerifyHospital(h._id)}
                      >
                        {h.verified ? 'Revoke Verification' : 'Verify Facility'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Blood Banks List */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-light py-3">
          <h5 className="fw-bold mb-0">Blood Banks In Network</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Blood Bank Name</th>
                  <th>Address</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th className="text-end">Verification Control</th>
                </tr>
              </thead>
              <tbody>
                {bloodBanks.map((b) => (
                  <tr key={b._id}>
                    <td className="fw-semibold">{b.name}</td>
                    <td className="small text-muted">{b.address}</td>
                    <td className="small">{b.phone}</td>
                    <td>
                      {b.verified ? (
                        <span className="badge bg-success">Verified</span>
                      ) : (
                        <span className="badge bg-warning text-dark">Pending</span>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        className={`btn btn-sm ${b.verified ? 'btn-outline-danger' : 'btn-success'}`}
                        onClick={() => handleToggleVerifyBloodBank(b._id)}
                      >
                        {b.verified ? 'Revoke Verification' : 'Verify Facility'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
