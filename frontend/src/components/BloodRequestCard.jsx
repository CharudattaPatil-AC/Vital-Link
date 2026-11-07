import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const BloodRequestCard = ({ request, isDonorView, onRespond, onRefresh }) => {
  const { user } = useAuth();
  const [escalating, setEscalating] = useState(false);
  const [showDispatchLog, setShowDispatchLog] = useState(false);
  const [ivrActionLoading, setIvrActionLoading] = useState(false);
  const [localMsg, setLocalMsg] = useState('');

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
    matchedDonors,
    escalationTier = 1,
    radius = 5000,
    escalationHistory = [],
    dispatchedChannels = [],
    autonomousHold
  } = request;

  // If in donor view, find this donor's specific match entry
  const myMatch = isDonorView && matchedDonors
    ? matchedDonors.find(m => (m.donor?._id || m.donor) === user?._id)
    : null;

  // Donor's dispatched channel entry (WhatsApp or IVR)
  const myChannelDispatch = isDonorView && dispatchedChannels
    ? dispatchedChannels.find(c => c.recipientPhone === user?.phone)
    : null;

  const handleEscalate = async () => {
    setEscalating(true);
    setLocalMsg('');
    try {
      const res = await API.post(`/blood-requests/${_id}/escalate`);
      setLocalMsg(res.data.actionSummary || 'Autonomous Agent escalated request to next tier!');
      if (onRefresh) onRefresh();
    } catch (err) {
      setLocalMsg(err.response?.data?.message || 'Error triggering agent escalation');
    } finally {
      setEscalating(false);
    }
  };

  const handleIVRAccept = async (channelType) => {
    setIvrActionLoading(true);
    try {
      await API.post(`/blood-requests/${_id}/ivr-action`, {
        action: 'accept',
        channel: channelType
      });
      setLocalMsg(`✓ Accepted via ${channelType === 'whatsapp' ? 'WhatsApp' : 'Interactive IVR'}!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      setLocalMsg('Failed to process IVR/WhatsApp response');
    } finally {
      setIvrActionLoading(false);
    }
  };

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

  const getTierBadge = () => {
    switch (escalationTier) {
      case 3:
        return (
          <span className="badge bg-danger text-white border border-danger shadow-sm py-1 px-2">
            🚨 Agent Tier 3: 30 km (IVR Voice + Cross-Hold)
          </span>
        );
      case 2:
        return (
          <span className="badge bg-warning text-dark border border-warning shadow-sm py-1 px-2">
            ⚡ Agent Tier 2: 15 km (WhatsApp Active)
          </span>
        );
      case 1:
      default:
        return (
          <span className="badge bg-success-subtle text-success border border-success py-1 px-2">
            🟢 Agent Tier 1: 5 km (Monitoring Loop)
          </span>
        );
    }
  };

  return (
    <div className="card shadow-sm mb-3 border-0 border-start border-4 border-danger">
      <div className="card-body">
        {/* Header Badges */}
        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="badge bg-danger fs-6">Patient Needs: {bloodGroup}</span>
            {getUrgencyBadge()}
            {getTierBadge()}
            {myMatch && myMatch.matchLabel && (
              <span className="badge bg-success-subtle text-success border border-success">
                🎯 {myMatch.matchLabel}
              </span>
            )}
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {localMsg && (
          <div className="alert alert-info py-2 px-3 small my-2 mb-3">
            🤖 {localMsg}
          </div>
        )}

        {/* Compatible Groups */}
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

        {/* Key Details Grid */}
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
            <span className="text-muted small d-block">Broadcast Radius:</span>
            <span className="fw-bold text-dark">{(radius / 1000).toFixed(0)} km</span>
            <span className="text-muted small ms-2">({new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CROSS-INVENTORY AUTONOMOUS HOLD BANNER                         */}
        {/* ------------------------------------------------------------- */}
        {autonomousHold && autonomousHold.placed && (
          <div className="p-3 mb-3 rounded-3 bg-danger-subtle border border-danger">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
              <div className="fw-bold text-danger fs-6 d-flex align-items-center gap-1">
                <span>🏥</span> Cross-Inventory Autonomous Hold Secured!
              </div>
              <span className="badge bg-success">
                ● {autonomousHold.unitsHeld} Units Atomic Hold Active
              </span>
            </div>

            <div className="row g-2 small mb-2 text-dark">
              <div className="col-md-6">
                <strong>Certified Facility:</strong> {autonomousHold.bloodBankName} ({autonomousHold.distanceKm} km away)
              </div>
              <div className="col-md-6">
                <strong>Blood Reserved:</strong> {autonomousHold.bloodGroup} ({autonomousHold.unitsHeld} Units)
              </div>
              <div className="col-md-12">
                <strong>Pickup Location:</strong> {autonomousHold.pickupAddress} • 📞 {autonomousHold.contactPhone}
              </div>
            </div>

            <div className="d-flex gap-2 flex-wrap align-items-center pt-2 border-top border-danger-subtle">
              <a
                href={autonomousHold.routingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-danger fw-bold"
              >
                🗺️ Route Attendant Directly (Google Maps)
              </a>
              <span className="small text-muted">
                ⚡ Priority emergency hold active for 2 hours.
              </span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* DONORS DISPATCHED & MULTI-CHANNEL LOG                         */}
        {/* ------------------------------------------------------------- */}
        {matchedDonors && matchedDonors.length > 0 && !isDonorView && (
          <div className="mt-2 p-2 bg-light rounded small">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Donors Dispatched ({matchedDonors.length}): </strong>
                <span className="text-muted">
                  {matchedDonors.filter(d => d.status === 'accepted').length} Accepted,{' '}
                  {matchedDonors.filter(d => d.status === 'declined').length} Declined,{' '}
                  {matchedDonors.filter(d => d.status === 'pending').length} Pending
                </span>
              </div>
              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none p-0"
                onClick={() => setShowDispatchLog(!showDispatchLog)}
              >
                {showDispatchLog ? 'Hide Channels ▲' : 'View Multi-Channel Dispatches ▼'}
              </button>
            </div>

            {/* Expandable Multi-Channel Tool Dispatch History */}
            {showDispatchLog && (
              <div className="mt-2 pt-2 border-top">
                <div className="fw-semibold text-secondary mb-1">
                  🤖 Agent Multi-Channel Contact Orchestration:
                </div>
                {dispatchedChannels && dispatchedChannels.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {dispatchedChannels.map((ch, idx) => (
                      <div key={idx} className="list-group-item bg-transparent px-0 py-1 d-flex justify-content-between align-items-start">
                        <div>
                          <span className={`badge me-2 ${
                            ch.channel === 'ivr_call'
                              ? 'bg-warning text-dark'
                              : ch.channel === 'whatsapp'
                              ? 'bg-success'
                              : 'bg-primary'
                          }`}>
                            {ch.channel === 'ivr_call' ? '📞 IVR Voice Call' : ch.channel === 'whatsapp' ? '💬 WhatsApp' : '⚡ Push'}
                          </span>
                          <span className="fw-medium">{ch.recipientName || ch.recipientPhone}</span>
                          {ch.distanceKm > 0 && <span className="text-muted ms-1">({ch.distanceKm} km)</span>}
                          <div className="small text-muted fst-italic mt-1" style={{ fontSize: '0.78rem' }}>
                            "{ch.messageText}"
                          </div>
                        </div>
                        <span className={`badge ${ch.status === 'accepted' ? 'bg-success' : 'bg-secondary'}`}>
                          {ch.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted small">Initial Tier 1 WebSocket broadcasts sent.</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ESCALATION ACTION FOR PATIENT / ATTENDANT                      */}
        {/* ------------------------------------------------------------- */}
        {!isDonorView && status === 'active' && escalationTier < 3 && (
          <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
            <span className="small text-muted">
              🤖 <strong>Autonomous Agent Loop:</strong> Scans every 3 mins. Auto-expands radius & triggers IVR calls if responses stall.
            </span>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm fw-bold"
              disabled={escalating}
              onClick={handleEscalate}
            >
              {escalating ? 'Escalating Agent...' : `⚡ Force Escalate to Tier ${escalationTier + 1} Now`}
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* DONOR INTERACTIVE ACTIONS (IVR & WHATSAPP SIMULATION)          */}
        {/* ------------------------------------------------------------- */}
        {isDonorView && status === 'active' && onRespond && (
          <div>
            {/* IVR Voice Call Trigger Alert for Donor */}
            {escalationTier >= 2 && myMatch?.status !== 'accepted' && myMatch?.status !== 'declined' && (
              <div className="alert alert-warning py-2 px-3 mt-3 mb-2 small border-warning">
                <div className="fw-bold mb-1">
                  📞 Incoming Automated IVR Voice Prompt / WhatsApp Urgent Alert:
                </div>
                <div className="fst-italic text-dark mb-2">
                  "Urgent alert: A patient at {hospitalName || 'Apollo Hospital'} needs {unitsNeeded} units of {bloodGroup} blood. You are eligible and within radius. Press 1 to accept."
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    className="btn btn-sm btn-dark fw-bold"
                    disabled={ivrActionLoading}
                    onClick={() => handleIVRAccept('ivr_call')}
                  >
                    📞 Press 1 to Accept (IVR Voice)
                  </button>
                  <button
                    className="btn btn-sm btn-success fw-bold"
                    disabled={ivrActionLoading}
                    onClick={() => handleIVRAccept('whatsapp')}
                  >
                    💬 Accept via WhatsApp
                  </button>
                </div>
              </div>
            )}

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
