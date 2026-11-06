import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useSocket } from '../context/SocketContext';

const BloodBankDashboard = () => {
  const socket = useSocket();

  const [bloodBank, setBloodBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
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
    socket.on('reservationCreated', handleNewRes);
    return () => socket.off('reservationCreated', handleNewRes);
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
      setBloodBank(res.data);
      setStatusMsg({ text: 'Live blood stock updated and broadcasted!', type: 'success' });
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-danger mb-1">🩸 Blood Bank Dashboard</h2>
          <p className="text-muted mb-0">{bloodBank.name} – {bloodBank.address}</p>
        </div>
        <div>
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

      {/* Inventory Management Table */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light py-3">
          <h5 className="fw-bold mb-0">Live Blood Inventory Management</h5>
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
                    </div>
                  </div>
                );
              })}
            </div>

            <button type="submit" className="btn btn-danger fw-bold">
              Update Live Stock
            </button>
          </form>
        </div>
      </div>

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
