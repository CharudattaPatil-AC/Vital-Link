import React, { useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ReservationModal = ({ show, onClose, facility, facilityType, resourceType, bloodGroup, onReserved }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!show || !facility) return null;

  const getResourceTitle = () => {
    switch (resourceType) {
      case 'icuBed': return 'ICU Bed';
      case 'generalBed': return 'General Bed';
      case 'oxygenCylinder': return 'Oxygen Cylinder';
      case 'ventilator': return 'Ventilator';
      case 'blood': return `Blood Units (${bloodGroup})`;
      default: return resourceType;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        facilityId: facility._id,
        facilityType,
        resourceType,
        quantity: parseInt(quantity, 10),
        notes
      };
      if (bloodGroup) {
        payload.bloodGroup = bloodGroup;
      }

      const res = await API.post('/reservations', payload);
      setSuccess('Reservation created successfully! The resource is held for 1 hour.');
      setTimeout(() => {
        if (onReserved) onReserved(res.data);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to make reservation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow border-0">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title fw-bold">Emergency Reservation</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              {success && <div className="alert alert-success py-2 small">{success}</div>}

              <div className="mb-3 p-3 bg-light rounded">
                <div className="text-muted small">Facility:</div>
                <div className="fw-bold">{facility.name}</div>
                <div className="text-muted small mt-2">Resource:</div>
                <div className="fw-semibold text-danger">{getResourceTitle()}</div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Quantity / Units Required</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
                <div className="form-text small">
                  Emergency holding limit is subject to facility confirmation. Holds expire in 60 minutes.
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Patient Condition / Notes (Optional)</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="e.g. Critical condition, arriving by ambulance in 15 mins..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-danger btn-sm px-4 fw-semibold" disabled={loading}>
                {loading ? 'Holding Resource...' : 'Confirm Reservation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReservationModal;
