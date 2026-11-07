import React from 'react';
import { Link } from 'react-router-dom';

const BloodRequestCard = ({ request, onCancel }) => {
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
    matchedBloodBanks
  } = request;

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
    <div className="card shadow-sm mb-4 border-0 border-start border-4 border-danger">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="badge bg-danger fs-6 px-3 py-2">Patient Needs: {bloodGroup}</span>
            {getUrgencyBadge()}
          </div>
          <div className="d-flex align-items-center gap-2">
            {getStatusBadge()}
            {status === 'active' && onCancel && (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => onCancel(_id)}
              >
                Cancel Broadcast
              </button>
            )}
          </div>
        </div>

        {/* Compatible groups badge line */}
        {compatibleGroups && compatibleGroups.length > 0 && (
          <div className="small text-muted mb-3">
            <strong>Transfusion Compatible Groups: </strong>
            {compatibleGroups.map(bg => (
              <span key={bg} className="badge bg-light text-dark border me-1">
                {bg}
              </span>
            ))}
          </div>
        )}

        <div className="row g-2 mb-3 bg-light p-3 rounded">
          <div className="col-sm-6 col-md-3">
            <span className="text-muted small d-block">Units Needed:</span>
            <span className="fw-bold fs-5 text-danger">{unitsNeeded} Units</span>
          </div>
          <div className="col-sm-6 col-md-3">
            <span className="text-muted small d-block">Hospital / Ward:</span>
            <span className="fw-semibold">{hospitalName || 'Not specified'}</span>
          </div>
          <div className="col-sm-6 col-md-3">
            <span className="text-muted small d-block">Emergency Contact:</span>
            <span className="fw-semibold text-danger">📞 {contactPhone}</span>
          </div>
          <div className="col-sm-6 col-md-3">
            <span className="text-muted small d-block">Broadcast Time:</span>
            <span className="text-muted small">{new Date(createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Matched Blood Banks */}
        <div className="mt-3">
          <h6 className="fw-bold text-dark d-flex align-items-center justify-content-between">
            <span>🏥 Matched Blood Banks with Compatible Stock ({matchedBloodBanks?.length || 0}):</span>
          </h6>
          {matchedBloodBanks && matchedBloodBanks.length > 0 ? (
            <div className="row g-2 mt-1">
              {matchedBloodBanks.map((bank, idx) => (
                <div key={idx} className="col-md-6">
                  <div className="border rounded p-3 bg-white h-100 shadow-sm">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <h6 className="fw-bold mb-0 text-truncate" style={{ maxWidth: '70%' }}>
                        {bank.name}
                      </h6>
                      <span className={`badge ${bank.matchTier === 1 ? 'bg-success' : 'bg-primary'}`}>
                        {bank.matchLabel}
                      </span>
                    </div>
                    <div className="small text-muted mb-1 text-truncate">{bank.address}</div>
                    <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                      <div>
                        <span className="badge bg-danger me-2">
                          {bank.unitsAvailable} Units Available
                        </span>
                        {bank.distanceKm !== undefined && (
                          <span className="small text-muted">📍 ~{bank.distanceKm} km</span>
                        )}
                      </div>
                      <Link
                        to={`/bloodbanks/${bank.bloodBank?._id || bank.bloodBank}`}
                        className="btn btn-sm btn-outline-danger"
                      >
                        View Stock &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="small text-muted mb-0">No blood banks within selected radius currently report this blood group.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BloodRequestCard;
