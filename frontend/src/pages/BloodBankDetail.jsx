import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { useSocket } from '../context/SocketContext';

const BloodBankDetail = () => {
  const { id } = useParams();
  const socket = useSocket();

  const [bloodBank, setBloodBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    if (!socket || !id) return;
    const handleUpdate = (data) => {
      if (data.type === 'bloodbank' && data.facilityId === id) {
        setBloodBank((prev) => (prev ? { ...prev, inventory: data.inventory } : prev));
      }
    };
    socket.on('inventoryUpdate', handleUpdate);
    return () => socket.off('inventoryUpdate', handleUpdate);
  }, [socket, id]);

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
      <div className="container py-5 text-center">
        <div className="alert alert-danger">{error || 'Blood bank not found'}</div>
        <Link to="/search/bloodbanks" className="btn btn-outline-danger">
          Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <Link to="/search/bloodbanks" className="btn btn-outline-secondary btn-sm mb-3">
        &larr; Back to Search
      </Link>

      {/* Header */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h2 className="fw-bold text-danger mb-1">🩸 {bloodBank.name}</h2>
              <p className="text-muted mb-2">{bloodBank.address}</p>
              <div className="d-flex gap-3 text-muted small">
                <span>📞 {bloodBank.phone || 'N/A'}</span>
                <span>✉️ {bloodBank.email || 'N/A'}</span>
              </div>
            </div>
            {bloodBank.verified && (
              <span className="badge bg-success-subtle text-success border border-success px-3 py-2 fs-6">
                ✓ Verified Blood Bank
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Live Inventory List */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-light py-3 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">Live Blood Inventory</h5>
          <span className="badge bg-danger">Real-time sync</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Blood Group</th>
                  <th>Units Available</th>
                  <th className="text-end">Status</th>
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
                      <td className="text-end">
                        {item.unitsAvailable > 5 ? (
                          <span className="badge bg-success">Adequate Stock</span>
                        ) : item.unitsAvailable > 0 ? (
                          <span className="badge bg-warning text-dark">Low Stock</span>
                        ) : (
                          <span className="badge bg-secondary">Out of Stock</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center text-muted py-3">
                      No inventory listed.
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

export default BloodBankDetail;
