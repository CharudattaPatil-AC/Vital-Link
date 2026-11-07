import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useSocket } from '../context/SocketContext';
import BloodRequestCard from '../components/BloodRequestCard';

const PatientDashboard = () => {
  const socket = useSocket();

  const [reservations, setReservations] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const fetchData = async () => {
    try {
      const [resData, reqData] = await Promise.all([
        API.get('/reservations'),
        API.get('/blood-requests')
      ]);
      setReservations(resData.data);
      setBloodRequests(reqData.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this emergency blood request?')) return;
    try {
      await API.put(`/blood-requests/${id}/status`, { status: 'cancelled' });
      setStatusMsg({ text: 'Blood request broadcast marked as cancelled.', type: 'info' });
      fetchData();
    } catch (err) {
      setStatusMsg({ text: 'Error cancelling blood request', type: 'danger' });
    }
  };

  const handleCancelReservation = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this emergency reservation?')) return;
    try {
      await API.put(`/reservations/${id}/status`, { status: 'cancelled' });
      setStatusMsg({ text: 'Reservation cancelled and resource returned to facility stock.', type: 'info' });
      fetchData();
    } catch (err) {
      setStatusMsg({ text: 'Error cancelling reservation', type: 'danger' });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading patient dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="fw-bold">Patient & Attendant Care Portal</h2>
        <p className="text-muted">Track your active hospital reservations, held blood units, and emergency broadcast requests.</p>
      </div>

      {statusMsg.text && (
        <div className={`alert alert-${statusMsg.type} alert-dismissible fade show`} role="alert">
          {statusMsg.text}
          <button type="button" className="btn-close" onClick={() => setStatusMsg({ text: '', type: '' })}></button>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <Link to="/search/hospitals" className="btn btn-outline-danger w-100 py-3 shadow-sm text-start">
            <div className="fw-bold fs-5">🏥 Find Hospital Beds</div>
            <div className="small text-muted">Locate ICU beds, ventilators & oxygen support</div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/search/bloodbanks" className="btn btn-outline-danger w-100 py-3 shadow-sm text-start">
            <div className="fw-bold fs-5">🩸 Check Blood Banks</div>
            <div className="small text-muted">Search 2,400+ certified banks across India</div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/blood-request/create" className="btn btn-danger w-100 py-3 shadow-sm text-start">
            <div className="fw-bold fs-5 text-white">🚨 Emergency Blood Request</div>
            <div className="small text-white-50">Smart compatibility broadcast to verified blood banks</div>
          </Link>
        </div>
      </div>

      {/* My Reservations Section */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light py-3">
          <h5 className="fw-bold mb-0">My Active Resource Reservations</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Facility</th>
                  <th>Type</th>
                  <th>Resource</th>
                  <th>Quantity</th>
                  <th>Expires / Created</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length > 0 ? (
                  reservations.map((res) => (
                    <tr key={res._id}>
                      <td className="fw-semibold">{res.facilityName || 'Facility'}</td>
                      <td>
                        <span className="badge bg-light text-dark border text-capitalize">
                          {res.facilityType}
                        </span>
                      </td>
                      <td>
                        <span className="fw-semibold text-danger">
                          {res.resourceType === 'blood' ? `Blood (${res.bloodGroup})` : res.resourceType}
                        </span>
                      </td>
                      <td className="fw-bold">{res.quantity}</td>
                      <td className="small text-muted">
                        {res.expiresAt ? new Date(res.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '1 Hour'}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            res.status === 'confirmed'
                              ? 'bg-success'
                              : res.status === 'cancelled'
                              ? 'bg-secondary'
                              : 'bg-warning text-dark'
                          }`}
                        >
                          {res.status}
                        </span>
                      </td>
                      <td className="text-end">
                        {res.status === 'pending' && (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleCancelReservation(res._id)}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No active reservations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* My Emergency Blood Requests */}
      <h5 className="fw-bold mb-3">My Emergency Blood Requests</h5>
      {bloodRequests.length > 0 ? (
        <div>
          {bloodRequests.map((req) => (
            <BloodRequestCard key={req._id} request={req} onCancel={handleCancelRequest} />
          ))}
        </div>
      ) : (
        <div className="card border-0 shadow-sm p-4 text-center">
          <p className="text-muted mb-0">No active emergency blood broadcasts posted yet.</p>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
