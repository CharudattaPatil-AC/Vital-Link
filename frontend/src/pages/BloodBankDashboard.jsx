import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useSocket } from '../context/SocketContext';

const BloodBankDashboard = () => {
  const socket = useSocket();

  const [bloodBank, setBloodBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [autoRequests, setAutoRequests] = useState([]);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // Blood bank registration form state
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    lat: '28.6139',
    lng: '77.2090'
  });

  // Inventory array
  const [inventory, setInventory] = useState([]);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const fetchMyBloodBank = async () => {
    try {
      const res = await API.get('/bloodbanks/my');
      setBloodBank(res.data);
      if (res.data.inventory && res.data.inventory.length > 0) {
        setInventory(res.data.inventory);
      } else {
        setInventory(bloodGroups.map((bg) => ({ bloodGroup: bg, unitsAvailable: 0 })));
      }
      fetchAutoRequests(res.data._id);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Error fetching blood bank:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await API.get('/reservations');
      setReservations(res.data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  };

  const fetchAutoRequests = async (bbId = bloodBank?._id) => {
    if (!bbId) return;
    try {
      const res = await API.get(`/bloodbanks/${bbId}/auto-requests`);
      setAutoRequests(res.data);
    } catch (err) {
      console.error('Error fetching automated requests:', err);
    }
  };

  useEffect(() => {
    fetchMyBloodBank();
    fetchReservations();
  }, []);

  useEffect(() => {
    if (!socket || !bloodBank) return;

    const handleNewRes = (data) => {
      if (data.facilityId === bloodBank._id) {
        fetchReservations();
        setStatusMsg({ text: 'New blood reservation received!', type: 'info' });
      }
    };

    const handleLowStockAlert = (data) => {
      fetchAutoRequests(bloodBank._id);
      setStatusMsg({
        text: `⚡ Automated donor request raised for ${data.bloodGroup} (Stock: ${data.currentUnits} units)!`,
        type: 'warning'
      });
    };

    socket.on('reservationCreated', handleNewRes);
    socket.on('lowStockAutoRequest', handleLowStockAlert);

    return () => {
      socket.off('reservationCreated', handleNewRes);
      socket.off('lowStockAutoRequest', handleLowStockAlert);
    };
  }, [socket, bloodBank]);

  const handleRegisterBloodBank = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: regData.name,
        email: regData.email,
        phone: regData.phone,
        address: regData.address,
        location: {
          coordinates: [parseFloat(regData.lng), parseFloat(regData.lat)]
        }
      };
      const res = await API.post('/bloodbanks', payload);
      setBloodBank(res.data);
      setInventory(res.data.inventory);
      setStatusMsg({ text: 'Blood Bank created successfully!', type: 'success' });
      fetchAutoRequests(res.data._id);
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.message || 'Error registering blood bank', type: 'danger' });
    }
  };

  const handleInventoryChange = (group, units) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.bloodGroup === group ? { ...item, unitsAvailable: parseInt(units, 10) || 0 } : item
      )
    );
  };

  const handleUpdateInventory = async (e) => {
    e.preventDefault();
    try {
      const res = await API.put(`/bloodbanks/${bloodBank._id}/inventory`, {
        inventory
      });
      setBloodBank(res.data.bloodBank || res.data);

      if (res.data.autoRaisedCount > 0) {
        setStatusMsg({
          text: `Live stock updated! ⚡ System automatically raised ${res.data.autoRaisedCount} emergency donor request(s) for low-stock blood groups.`,
          type: 'warning'
        });
        fetchAutoRequests(bloodBank._id);
      } else {
        setStatusMsg({ text: 'Live blood stock updated and broadcasted!', type: 'success' });
      }
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.message || 'Failed to update stock', type: 'danger' });
    }
  };

  const handleReservationStatus = async (resId, newStatus) => {
    try {
      await API.put(`/reservations/${resId}/status`, { status: newStatus });
      fetchReservations();
      fetchMyBloodBank();
      setStatusMsg({ text: `Reservation updated to ${newStatus}`, type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.message || 'Failed to update reservation', type: 'danger' });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // If no blood bank profile yet
  if (!bloodBank) {
    return (
      <div className="container py-4">
        <h3 className="fw-bold mb-3">Register Your Blood Bank Facility</h3>
        <p className="text-muted">Register to post live unit quantities for local hospitals and patients in need.</p>

        {statusMsg.text && (
          <div className={`alert alert-${statusMsg.type} py-2`}>{statusMsg.text}</div>
        )}

        <div className="card shadow-sm border-0 p-4">
          <form onSubmit={handleRegisterBloodBank}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Blood Bank Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Contact Phone</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={regData.phone}
                  onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Official Email</label>
                <input
                  type="email"
                  className="form-control"
                  required
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Address</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={regData.address}
                  onChange={(e) => setRegData({ ...regData, address: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={regData.lat}
                  onChange={(e) => setRegData({ ...regData, lat: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Longitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={regData.lng}
                  onChange={(e) => setRegData({ ...regData, lng: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-danger mt-4 fw-bold">
              Complete Blood Bank Setup
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-danger mb-1">🩸 Blood Bank Dashboard</h2>
          <p className="text-muted mb-0">{bloodBank.name} – {bloodBank.address}</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          {bloodBank.verified ? (
            <span className="badge bg-success px-3 py-2">✓ Verified Blood Bank</span>
          ) : (
            <span className="badge bg-warning text-dark px-3 py-2">Pending Admin Verification</span>
          )}
        </div>
      </div>

      {statusMsg.text && (
        <div className={`alert alert-${statusMsg.type} alert-dismissible fade show`} role="alert">
          {statusMsg.text}
          <button type="button" className="btn-close" onClick={() => setStatusMsg({ text: '', type: '' })}></button>
        </div>
      )}

      {/* Automated Low-Stock Warning Banner */}
      <div className="card shadow-sm border-0 mb-4 border-start border-4 border-warning bg-light">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
            <h5 className="fw-bold text-dark mb-0">⚡ Automated Low-Stock Replenishment System</h5>
            <span className="badge bg-danger">SMART AUTO-DISPATCH ACTIVE</span>
          </div>
          <p className="small text-muted mb-3">
            Whenever units for any blood group drop below the safety threshold ( $\le 4$ units for rare negative groups, $\le 5$ units for common groups), LifeLink automatically broadcasts emergency donor requests to nearby compatible registered donors within 15 km.
          </p>

          <div className="row g-2">
            {bloodGroups.map((bg) => {
              const currentItem = inventory.find((i) => i.bloodGroup === bg) || { unitsAvailable: 0 };
              const units = currentItem.unitsAvailable;
              const hasActiveAutoReq = autoRequests.some(
                (r) => r.bloodGroup === bg && r.status === 'active'
              );

              let badgeColor = 'bg-success';
              let statusLabel = 'Healthy Stock';

              if (units <= 2) {
                badgeColor = 'bg-danger';
                statusLabel = 'Critical Deficit';
              } else if (units <= 5) {
                badgeColor = 'bg-warning text-dark';
                statusLabel = 'Low Stock Buffer';
              }

              return (
                <div key={bg} className="col-6 col-sm-3 col-md">
                  <div className={`p-2 rounded border bg-white text-center ${units <= 4 ? 'border-danger' : ''}`}>
                    <div className="fw-bold fs-6 text-danger">{bg}</div>
                    <div className="fw-bold fs-5 text-dark">{units} units</div>
                    <span className={`badge ${badgeColor} d-block mt-1`} style={{ fontSize: '10px' }}>
                      {statusLabel}
                    </span>
                    {hasActiveAutoReq && (
                      <span className="badge bg-danger-subtle text-danger border border-danger d-block mt-1" style={{ fontSize: '9px' }}>
                        ⚡ Request Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Inventory Management Table */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light py-3 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">Live Blood Inventory Management</h5>
          <small className="text-muted">Updating stock will automatically trigger donor requests if units fall low.</small>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleUpdateInventory}>
            <div className="row g-3 mb-4">
              {bloodGroups.map((bg) => {
                const currentItem = inventory.find((i) => i.bloodGroup === bg) || { unitsAvailable: 0 };
                return (
                  <div key={bg} className="col-6 col-md-3">
                    <div className="p-3 border rounded text-center">
                      <span className="badge bg-danger fs-5 mb-2">{bg}</span>
                      <label className="form-label small text-muted d-block">Units Available</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control text-center fw-bold fs-5"
                        value={currentItem.unitsAvailable}
                        onChange={(e) => handleInventoryChange(bg, e.target.value)}
                      />
                      {currentItem.unitsAvailable <= 4 && (
                        <small className="text-danger fw-bold d-block mt-1">⚠️ Low Stock Trigger</small>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <button type="submit" className="btn btn-danger fw-bold">
                Update Live Stock & Scan Thresholds
              </button>
              <small className="text-muted">Thresholds: $\le 4$ units for rare groups, $\le 5$ for others</small>
            </div>
          </form>
        </div>
      </div>

      {/* Active Automated Replenishment Requests */}
      {autoRequests.length > 0 && (
        <div className="card shadow-sm border-0 mb-4 border-top border-4 border-danger">
          <div className="card-header bg-danger text-white py-2 d-flex justify-content-between align-items-center">
            <h5 className="fw-bold mb-0 fs-6">📢 Active Automated Donor Replenishment Broadcasts ({autoRequests.length})</h5>
            <span className="badge bg-white text-danger fw-bold">Auto-Raised</span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Blood Group</th>
                    <th>Deficit / Needed</th>
                    <th>Urgency</th>
                    <th>Stock When Raised</th>
                    <th>Donors Dispatched</th>
                    <th>Broadcast Status</th>
                    <th>Triggered At</th>
                  </tr>
                </thead>
                <tbody>
                  {autoRequests.map((req) => (
                    <tr key={req._id}>
                      <td>
                        <span className="badge bg-danger fs-6">{req.bloodGroup}</span>
                      </td>
                      <td className="fw-bold text-danger">{req.unitsNeeded} units</td>
                      <td>
                        <span className={`badge ${req.urgency === 'critical' ? 'bg-danger' : 'bg-warning text-dark'} text-uppercase`}>
                          {req.urgency}
                        </span>
                      </td>
                      <td>{req.currentStockWhenRaised ?? 'Low'} units</td>
                      <td>
                        <span className="badge bg-info text-dark">
                          {req.matchedDonors?.length || 0} donors notified
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-success text-uppercase">{req.status}</span>
                      </td>
                      <td className="small text-muted">{new Date(req.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Blood Reservations Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-light py-3">
          <h5 className="fw-bold mb-0">Incoming Blood Unit Reservations</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Patient Name</th>
                  <th>Contact</th>
                  <th>Blood Group</th>
                  <th>Units Reserved</th>
                  <th>Notes</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length > 0 ? (
                  reservations.map((res) => (
                    <tr key={res._id}>
                      <td className="fw-semibold">{res.patient?.name || 'Anonymous'}</td>
                      <td>{res.patient?.phone || 'N/A'}</td>
                      <td>
                        <span className="badge bg-danger fs-6">{res.bloodGroup}</span>
                      </td>
                      <td className="fw-bold">{res.quantity} Units</td>
                      <td className="small text-muted">{res.notes || 'None'}</td>
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
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-success"
                              onClick={() => handleReservationStatus(res._id, 'confirmed')}
                            >
                              Confirm
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleReservationStatus(res._id, 'cancelled')}
                            >
                              Cancel & Restock
                            </button>
                          </div>
                        )}
                        {res.status === 'confirmed' && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleReservationStatus(res._id, 'completed')}
                          >
                            Mark Dispensed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No blood reservations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodBankDashboard;
