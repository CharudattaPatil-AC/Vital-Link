import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import API from '../services/api';
import { useSocket } from '../context/SocketContext';

const COMPATIBILITY_MAP = {
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+':  ['O+', 'O-'],
  'O-':  ['O-']
};

const BloodBankDetail = () => {
  const { id } = useParams();
  const socket = useSocket();
  const [searchParams] = useSearchParams();
  const requestedGroup = searchParams.get('requested') || searchParams.get('group');

  const [bloodBank, setBloodBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllGroups, setShowAllGroups] = useState(false);

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

      {/* Patient Specific Request & Clinical Compatibility Assistant */}
      {requestedGroup && (
        <div className="alert alert-danger bg-white border border-danger shadow-sm p-4 mb-4 rounded">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <span className="badge bg-danger fs-6 px-3 py-2">Patient Need: {requestedGroup}</span>
                <span className="badge bg-secondary">Emergency Transfusion Protocol</span>
              </div>
              <p className="small text-muted mb-2">
                Showing exact match (<strong>{requestedGroup}</strong>) and clinically compatible donor groups (
                {(COMPATIBILITY_MAP[requestedGroup] || [requestedGroup]).join(', ')}).
              </p>
              <div className="small text-danger fw-semibold" style={{ fontSize: '0.8rem' }}>
                ⚕️ <strong>Clinical Verification Notice:</strong> Compatibility matching provides software-assisted emergency discovery. Actual blood transfusion is strictly subject to laboratory cross-matching and clinical clearance by attending doctors.
              </div>
            </div>
            <button
              className="btn btn-outline-danger btn-sm text-nowrap fw-bold align-self-start align-self-md-center"
              onClick={() => setShowAllGroups(!showAllGroups)}
            >
              {showAllGroups ? '🎯 Show Compatible Only' : '📋 Show All 8 Groups'}
            </button>
          </div>
        </div>
      )}

      {/* Live Inventory List */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-light py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h5 className="fw-bold mb-0">Live Blood Inventory</h5>
            <span className="badge bg-danger">Real-time sync</span>
          </div>
          <Link to="/blood-request/create" className="btn btn-danger btn-sm fw-bold">
            🩸 Raise Emergency Blood Request
          </Link>
        </div>
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
                {(() => {
                  const compatibleGroups = requestedGroup ? (COMPATIBILITY_MAP[requestedGroup] || [requestedGroup]) : null;
                  const visibleInventory = (requestedGroup && !showAllGroups && bloodBank.inventory)
                    ? bloodBank.inventory.filter((item) => compatibleGroups.includes(item.bloodGroup))
                    : bloodBank.inventory;

                  return visibleInventory && visibleInventory.length > 0 ? (
                    visibleInventory.map((item) => {
                      const isExact = item.bloodGroup === requestedGroup;
                      const isCompatible = compatibleGroups && compatibleGroups.includes(item.bloodGroup);

                      return (
                        <tr key={item.bloodGroup} className={isExact ? 'table-warning' : ''}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-danger fs-6 px-3">{item.bloodGroup}</span>
                              {isExact && <span className="badge bg-success">⭐ Exact Requested Match</span>}
                              {!isExact && isCompatible && <span className="badge bg-info text-dark">Clinically Compatible</span>}
                            </div>
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
                            <Link
                              to={`/blood-request/create?group=${encodeURIComponent(item.bloodGroup)}`}
                              className={`btn btn-sm ${item.unitsAvailable > 0 ? 'btn-danger' : 'btn-outline-secondary'}`}
                            >
                              🩸 Request {item.bloodGroup}
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        {requestedGroup && !showAllGroups
                          ? `No units currently reported in stock for ${requestedGroup} or compatible groups (${(COMPATIBILITY_MAP[requestedGroup] || []).join(', ')}). Click 'Show All 8 Groups' to view other inventory.`
                          : 'No inventory listed.'}
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodBankDetail;
