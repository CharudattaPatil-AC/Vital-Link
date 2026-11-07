import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import BloodRequestCard from '../components/BloodRequestCard';

const DonorDashboard = () => {
  const { user } = useAuth();
  const socket = useSocket();

  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [locStatus, setLocStatus] = useState('');

  const fetchDonorData = async () => {
    try {
      const meRes = await API.get('/auth/me');
      setIsAvailable(meRes.data.isAvailable);

      const reqRes = await API.get('/blood-requests');
      setBloodRequests(reqRes.data);
    } catch (err) {
      console.error('Error fetching donor requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonorData();
  }, []);

  // Real-time listener for incoming matching blood requests & agent escalation
  useEffect(() => {
    if (!socket) return;
    const handleIncomingRequest = (data) => {
      const isIVR = data.ivrScript ? ' • 📞 Automated IVR Call Triggered' : '';
      setStatusMsg({
        text: `🚨 URGENT BLOOD ALERT: ${data.requestedBloodGroup || data.bloodGroup} needed at ${data.hospitalName || 'Emergency Hospital'}${isIVR}!`,
        type: 'danger'
      });
      fetchDonorData();
    };

    socket.on('bloodRequest', handleIncomingRequest);
    return () => socket.off('bloodRequest', handleIncomingRequest);
  }, [socket]);

  const handleToggleAvailability = async () => {
    try {
      const res = await API.put('/donors/availability');
      setIsAvailable(res.data.isAvailable);
      setStatusMsg({
        text: `Status updated: You are now marked as ${res.data.isAvailable ? 'Available to Donate' : 'Unavailable'}`,
        type: 'info'
      });
    } catch (err) {
      setStatusMsg({ text: 'Error updating availability', type: 'danger' });
    }
  };

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus('Geolocation not supported by your browser.');
      return;
    }
    setLocStatus('Acquiring GPS location...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await API.put('/donors/location', {
            coordinates: [pos.coords.longitude, pos.coords.latitude]
          });
          setLocStatus(`Updated GPS location: [${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}]`);
          setStatusMsg({ text: 'GPS location saved for nearby emergency alerts!', type: 'success' });
        } catch (err) {
          setLocStatus('Failed to update location on server.');
        }
      },
      (err) => {
        setLocStatus(`Location Error: ${err.message}`);
      }
    );
  };

  const handleRespondToRequest = async (requestId, decision) => {
    try {
      await API.put(`/blood-requests/${requestId}/respond`, { status: decision });
      setStatusMsg({
        text: `You have ${decision} this blood donation request.`,
        type: decision === 'accepted' ? 'success' : 'secondary'
      });
      fetchDonorData();
    } catch (err) {
      setStatusMsg({ text: 'Failed to record response', type: 'danger' });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading donor profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">🩸 Voluntary Donor Portal</h2>
          <p className="text-muted mb-0">Help patients during urgent medical emergencies near you.</p>
        </div>
        <div>
          <span className={`badge px-3 py-2 fs-6 ${isAvailable ? 'bg-success' : 'bg-secondary'}`}>
            {isAvailable ? '● Available to Donate' : '○ Unavailable'}
          </span>
        </div>
      </div>

      {statusMsg.text && (
        <div className={`alert alert-${statusMsg.type} alert-dismissible fade show`} role="alert">
          {statusMsg.text}
          <button type="button" className="btn-close" onClick={() => setStatusMsg({ text: '', type: '' })}></button>
        </div>
      )}

      {/* Donor Profile & Actions Card */}
      <div className="card shadow-sm border-0 mb-4 bg-light">
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-7">
              <h4 className="fw-bold">{user?.name}</h4>
              <div className="d-flex flex-wrap gap-2 my-2">
                <span className="badge bg-danger fs-6 px-3">Blood Group: {user?.bloodGroup}</span>
                <span className="badge bg-dark fs-6 px-3">Role: Registered Donor</span>
                {user?.lastDonationDate && (Date.now() - new Date(user.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24) < 90 ? (
                  <span className="badge bg-warning text-dark fs-6 px-3">
                    ⏳ 90-Day Cooldown ({Math.ceil(90 - (Date.now() - new Date(user.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24))} days left)
                  </span>
                ) : (
                  <span className="badge bg-success-subtle text-success border border-success fs-6 px-3">
                    ✓ Medically Eligible to Donate
                  </span>
                )}
              </div>
              <p className="text-muted small mb-0">
                Contact: {user?.phone} | Email: {user?.email}
              </p>
            </div>
            <div className="col-md-5 d-flex flex-column gap-2 mt-3 mt-md-0">
              <button
                className={`btn fw-bold ${isAvailable ? 'btn-outline-danger' : 'btn-success'}`}
                onClick={handleToggleAvailability}
              >
                {isAvailable ? 'Mark as Temporarily Unavailable' : 'Mark as Available to Donate'}
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={handleUpdateLocation}
              >
                📍 Update My GPS Proximity
              </button>
              {locStatus && <span className="small text-muted text-center">{locStatus}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Donation Drives Banner */}
      <div className="card shadow-sm border-0 mb-4 bg-danger-subtle border-start border-4 border-danger">
        <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h5 className="fw-bold text-danger mb-1">🎪 Regional Blood Donation Drives & Camps</h5>
            <p className="small text-secondary mb-0">
              Pledge a blood unit at nearby community drives across India, get medical checkups, and receive verified digital appreciation certificates.
            </p>
          </div>
          <Link to="/camps" className="btn btn-danger fw-bold text-nowrap">
            View Blood Camps & Drives
          </Link>
        </div>
      </div>

      {/* Matched Blood Requests */}
      <h4 className="fw-bold mb-3">Emergency Blood Requests Matched to You</h4>
      {bloodRequests.length > 0 ? (
        <div>
          {bloodRequests.map((req) => (
            <BloodRequestCard
              key={req._id}
              request={req}
              isDonorView={true}
              onRespond={handleRespondToRequest}
              onRefresh={fetchDonorData}
            />
          ))}
        </div>
      ) : (
        <div className="card border-0 shadow-sm p-4 text-center">
          <h5 className="text-muted">No pending emergency blood requests near you right now.</h5>
          <p className="text-muted small mb-0">
            Keep your location and availability active. When a hospital or patient within your area requests {user?.bloodGroup} blood, you'll receive an instant notification here.
          </p>
        </div>
      )}
    </div>
  );
};

export default DonorDashboard;
