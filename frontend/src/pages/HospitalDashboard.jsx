import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useSocket } from '../context/SocketContext';

const HospitalDashboard = () => {
  const socket = useSocket();

  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // Hospital Registration Form state (if no hospital exists yet)
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    lat: '28.6139',
    lng: '77.2090',
  });

  // Resources form state
  const [resources, setResources] = useState({
    icuBeds: { total: 0, available: 0 },
    generalBeds: { total: 0, available: 0 },
    oxygenCylinders: { total: 0, available: 0 },
    ventilators: { total: 0, available: 0 }
  });

  const fetchMyHospital = async () => {
    try {
      const res = await API.get('/hospitals/my');
      setHospital(res.data);
      if (res.data.resources) setResources(res.data.resources);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Error fetching hospital:', err);
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
    fetchMyHospital();
    fetchReservations();
  }, []);

  // Socket for real-time reservation notifications
  useEffect(() => {
    if (!socket || !hospital) return;
    const handleNewRes = (data) => {
      if (data.facilityId === hospital._id) {
        fetchReservations();
        setStatusMsg({ text: 'New emergency reservation received!', type: 'info' });
      }
    };
    socket.on('reservationCreated', handleNewRes);
    return () => socket.off('reservationCreated', handleNewRes);
  }, [socket, hospital]);

  const handleRegisterHospital = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: regData.name,
        email: regData.email,
        phone: regData.phone,
        address: regData.address,
        location: {
          coordinates: [parseFloat(regData.lng), parseFloat(regData.lat)]
        },
        resources
      };
      const res = await API.post('/hospitals', payload);
      setHospital(res.data);
      setStatusMsg({ text: 'Hospital profile created successfully!', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.message || 'Error registering hospital', type: 'danger' });
    }
  };

  const handleUpdateInventory = async (e) => {
    e.preventDefault();
    try {
      const res = await API.put(`/hospitals/${hospital._id}/inventory`, {
        resources
      });
      setHospital(res.data);
      setStatusMsg({ text: 'Inventory updated and broadcasted in real time!', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.message || 'Failed to update inventory', type: 'danger' });
    }
  };

  const handleReservationStatus = async (resId, newStatus) => {
    try {
      await API.put(`/reservations/${resId}/status`, { status: newStatus });
      fetchReservations();
      fetchMyHospital();
      setStatusMsg({ text: `Reservation marked as ${newStatus}`, type: 'success' });
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

  // If no hospital is linked to this account yet
  if (!hospital) {
    return (
      <div className="container py-4">
        <h3 className="fw-bold mb-3">Register Your Hospital Facility</h3>
        <p className="text-muted">Fill out the basic information to manage your emergency care inventory on LifeLink.</p>

        {statusMsg.text && (
          <div className={`alert alert-${statusMsg.type} py-2`}>{statusMsg.text}</div>
        )}

        <div className="card shadow-sm border-0 p-4">
          <form onSubmit={handleRegisterHospital}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Hospital Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Emergency Contact Phone</label>
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
                <label className="form-label fw-semibold">Physical Address</label>
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
              Complete Hospital Setup
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
          <h2 className="fw-bold mb-1">🏥 Hospital Management Dashboard</h2>
          <p className="text-muted mb-0">{hospital.name} – {hospital.address}</p>
        </div>
        <div>
          {hospital.verified ? (
            <span className="badge bg-success px-3 py-2">✓ Verified Hospital</span>
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

      {/* Inventory Management Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light py-3">
          <h5 className="fw-bold mb-0">Live Resource Inventory Management</h5>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleUpdateInventory}>
            <div className="row g-4 mb-4">
              {/* ICU Beds */}
              <div className="col-md-3">
                <div className="p-3 border rounded">
                  <h6 className="fw-bold text-danger">ICU Beds</h6>
                  <div className="mb-2">
                    <label className="form-label small text-muted">Available</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={resources.icuBeds.available}
                      onChange={(e) =>
                        setResources({
                          ...resources,
                          icuBeds: { ...resources.icuBeds, available: parseInt(e.target.value, 10) || 0 }
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label small text-muted">Total Capacity</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={resources.icuBeds.total}
                      onChange={(e) =>
                        setResources({
                          ...resources,
                          icuBeds: { ...resources.icuBeds, total: parseInt(e.target.value, 10) || 0 }
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* General Beds */}
              <div className="col-md-3">
                <div className="p-3 border rounded">
                  <h6 className="fw-bold text-danger">General Beds</h6>
                  <div className="mb-2">
                    <label className="form-label small text-muted">Available</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={resources.generalBeds.available}
                      onChange={(e) =>
                        setResources({
                          ...resources,
                          generalBeds: { ...resources.generalBeds, available: parseInt(e.target.value, 10) || 0 }
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label small text-muted">Total Capacity</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={resources.generalBeds.total}
                      onChange={(e) =>
                        setResources({
                          ...resources,
                          generalBeds: { ...resources.generalBeds, total: parseInt(e.target.value, 10) || 0 }
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Oxygen Cylinders */}
              <div className="col-md-3">
                <div className="p-3 border rounded">
                  <h6 className="fw-bold text-danger">Oxygen Cylinders</h6>
                  <div className="mb-2">
                    <label className="form-label small text-muted">Available Units</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={resources.oxygenCylinders.available}
                      onChange={(e) =>
                        setResources({
                          ...resources,
                          oxygenCylinders: { ...resources.oxygenCylinders, available: parseInt(e.target.value, 10) || 0 }
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label small text-muted">Total Stock</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={resources.oxygenCylinders.total}
                      onChange={(e) =>
                        setResources({
                          ...resources,
                          oxygenCylinders: { ...resources.oxygenCylinders, total: parseInt(e.target.value, 10) || 0 }
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Ventilators */}
              <div className="col-md-3">
                <div className="p-3 border rounded">
                  <h6 className="fw-bold text-danger">Ventilators</h6>
                  <div className="mb-2">
                    <label className="form-label small text-muted">Available Units</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={resources.ventilators.available}
                      onChange={(e) =>
                        setResources({
                          ...resources,
                          ventilators: { ...resources.ventilators, available: parseInt(e.target.value, 10) || 0 }
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label small text-muted">Total Units</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={resources.ventilators.total}
                      onChange={(e) =>
                        setResources({
                          ...resources,
                          ventilators: { ...resources.ventilators, total: parseInt(e.target.value, 10) || 0 }
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-danger fw-bold">
              Broadcast Inventory Changes
            </button>
          </form>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-light py-3">
          <h5 className="fw-bold mb-0">Incoming Patient Reservations</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Patient Name</th>
                  <th>Contact</th>
                  <th>Resource Requested</th>
                  <th>Quantity</th>
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
                        <span className="badge bg-secondary">{res.resourceType}</span>
                      </td>
                      <td className="fw-bold">{res.quantity}</td>
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
                              Reject & Restock
                            </button>
                          </div>
                        )}
                        {res.status === 'confirmed' && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleReservationStatus(res._id, 'completed')}
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No incoming reservations found.
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

export default HospitalDashboard;
