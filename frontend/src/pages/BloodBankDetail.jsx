import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import ReservationModal from '../components/ReservationModal';
import { useSocket } from '../context/SocketContext';

const BloodBankDetail = () => {
  const { id } = useParams();
  const socket = useSocket();

  const [bloodBank, setBloodBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');
  const [reserveSuccess, setReserveSuccess] = useState('');

  const fetchBloodBank = async () => {
    try {
      const res = await API.get(`/bloodbanks/${id}`);
      setBloodBank(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Blood bank not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBloodBank();
  }, [id]);

  useEffect(() => {
    if (!socket || !bloodBank) return;
    const handleUpdate = (data) => {
      if (data.type === 'bloodbank' && data.facilityId === bloodBank._id) {
        setBloodBank((prev) => ({
          ...prev,
          inventory: data.inventory
        }));
      }
    };
    socket.on('inventoryUpdate', handleUpdate);
    return () => socket.off('inventoryUpdate', handleUpdate);
  }, [socket, bloodBank]);

  const handleOpenReservation = (group) => {
    setSelectedBloodGroup(group);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading blood bank details...</span>
        </div>
      </div>
    );
  }

  if (error || !bloodBank) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error || 'Blood bank not found'}</div>
        <Link to="/search/bloodbanks" className="btn btn-outline-danger">Back to Blood Banks</Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <Link to="/search/bloodbanks" className="btn btn-outline-secondary btn-sm mb-3">
        &larr; Back to Search
      </Link>

      {reserveSuccess && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {reserveSuccess}
          <button type="button" className="btn-close" onClick={() => setReserveSuccess('')}></button>
        </div>
      )}

      {/* Header */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h2 className="fw-bold text-danger mb-1">🩸 {bloodBank.name}</h2>
              <p className="text-muted mb-2">📍 {bloodBank.address}</p>
              <div className="d-flex flex-wrap gap-3 text-muted small align-items-center">
                <span>📞 Phone: <strong>{bloodBank.phone}</strong></span>
                <span>✉️ Email: <strong>{bloodBank.email}</strong></span>
                {bloodBank.location?.coordinates && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${bloodBank.location.coordinates[1]},${bloodBank.location.coordinates[0]}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm text-white fw-bold py-1 px-3"
                  >
                    🧭 Navigate with Google Maps
                  </a>
                )}
              </div>
            </div>
            {bloodBank.verified && (
              <span className="badge bg-success-subtle text-success border border-success px-3 py-2 fs-6">
                ✓ Certified Blood Bank
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Blood Inventory Table */}
      <h4 className="fw-bold mb-3">Available Blood Inventory</h4>
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Blood Group</th>
                  <th>Units Available</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {bloodBank.inventory && bloodBank.inventory.length > 0 ? (
                  bloodBank.inventory.map((item) => (
                    <tr key={item.bloodGroup}>
                      <td>
                        <span className="badge bg-danger fs-6 px-3">{item.bloodGroup}</span>
                      </td>
                      <td className="fw-bold fs-5">{item.unitsAvailable} Units</td>
                      <td>
                        {item.unitsAvailable > 5 ? (
                          <span className="badge bg-success">Adequate Stock</span>
                        ) : item.unitsAvailable > 0 ? (
                          <span className="badge bg-warning text-dark">Low Stock</span>
                        ) : (
                          <span className="badge bg-secondary">Out of Stock</span>
                        )}
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-danger fw-semibold"
                          disabled={item.unitsAvailable <= 0}
                          onClick={() => handleOpenReservation(item.bloodGroup)}
                        >
                          {item.unitsAvailable > 0 ? 'Reserve Units' : 'Unavailable'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-3">
                      No inventory listed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      <ReservationModal
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        facility={bloodBank}
        facilityType="bloodbank"
        resourceType="blood"
        bloodGroup={selectedBloodGroup}
        onReserved={() => {
          setReserveSuccess('Your blood unit reservation has been held for 1 hour!');
          fetchBloodBank();
        }}
      />
    </div>
  );
};

export default BloodBankDetail;
