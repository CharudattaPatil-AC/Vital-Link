import React from 'react';
import { useAuth } from '../context/AuthContext';

const BloodRequestCard = ({ request, isDonorView, onRespond }) => {
  const { user } = useAuth();
  const {
    _id,
    bloodGroup,
    compatibleGroups,
    unitsNeeded,
    urgency,
    hospitalName,
    contactPhone,
    status,
    createdAt,
    matchedDonors
  } = request;

  // If in donor view, find this donor's specific match entry
  const myMatch = isDonorView && matchedDonors
    ? matchedDonors.find(m => (m.donor?._id || m.donor) === user?._id)
    : null;

  const getUrgencyBadge = () => {
    switch (urgency) {
      case 'critical':
        return <span className="badge bg-danger">CRITICAL (Immediate)</span>;
      case 'urgent':
        return <span className="badge bg-warning text-dark">URGENT</span>;
      case 'normal':
      default:
        return <span className="badge bg-info text-dark">NORMAL</span>;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return <span className="badge bg-primary">Active Alert</span>;
      case 'fulfilled':
        return <span className="badge bg-success">Fulfilled</span>;
      case 'cancelled':
        return <span className="badge bg-secondary">Cancelled</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="card shadow-sm mb-3 border-0 border-start border-4 border-danger">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="badge bg-danger fs-6">Patient Needs: {bloodGroup}</span>
            {getUrgencyBadge()}
            {myMatch && myMatch.matchLabel && (
              <span className="badge bg-success-subtle text-success border border-success">
                🎯 {myMatch.matchLabel}
              </span>
            )}
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Compatible groups badge line */}
        {compatibleGroups && compatibleGroups.length > 1 && !isDonorView && (
          <div className="small text-muted mb-2">
            <strong>Transfusion Compatible Donors: </strong>
            {compatibleGroups.map(bg => (
              <span key={bg} className="badge bg-light text-dark border me-1">
                {bg}
              </span>
            ))}
          </div>
        )}

        <div className="row my-3 g-2">
          <div className="col-sm-6">
            <span className="text-muted small d-block">Units Needed:</span>
            <span className="fw-bold fs-5">{unitsNeeded} Units</span>
          </div>
          <div className="col-sm-6">
            <span className="text-muted small d-block">Hospital / Ward:</span>
            <span className="fw-semibold">{hospitalName || 'Not specified'}</span>
          </div>
          <div className="col-sm-6">
            <span className="text-muted small d-block">Emergency Contact:</span>
            <span className="fw-semibold text-danger">📞 {contactPhone}</span>
          </div>
          <div className="col-sm-6">
            <span className="text-muted small d-block">Broadcast Time:</span>
            <span className="text-muted">{new Date(createdAt).toLocaleString()}</span>
          </div>
        </div>

        {matchedDonors && matchedDonors.length > 0 && !isDonorView && (
          <div className="mt-2 p-2 bg-light rounded small">
            <strong>Donors Dispatched ({matchedDonors.length}): </strong>
            <span className="text-muted">
              {matchedDonors.filter(d => d.status === 'accepted').length} Accepted,{' '}
              {matchedDonors.filter(d => d.status === 'declined').length} Declined,{' '}
              {matchedDonors.filter(d => d.status === 'pending').length} Pending
            </span>
          </div>
        )}

        {isDonorView && status === 'active' && onRespond && (
          <div>
            {myMatch?.status === 'accepted' ? (
              <div className="alert alert-success py-2 mb-0 mt-3 small fw-bold">
                ✓ You accepted this donation request. Please proceed to {hospitalName || 'the emergency center'} or call 📞 {contactPhone}.
              </div>
            ) : myMatch?.status === 'declined' ? (
              <div className="alert alert-secondary py-2 mb-0 mt-3 small text-muted">
                You declined this donation request.
              </div>
            ) : (
              <div className="d-flex gap-2 mt-3 pt-2 border-top">
                <button
                  className="btn btn-success btn-sm flex-grow-1 fw-bold"
                  onClick={() => onRespond(_id, 'accepted')}
                >
                  ✓ Accept & Help Patient
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => onRespond(_id, 'declined')}
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BloodRequestCard;
