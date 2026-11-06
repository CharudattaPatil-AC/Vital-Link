import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { generateDonationCertificate } from '../utils/generateCertificate';

const INDIAN_STATES = [
  'All States',
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
  'Chandigarh', 'Jammu and Kashmir', 'Ladakh', 'Puducherry'
];

const DonationCamps = () => {
  const { user } = useAuth();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [selectedState, setSelectedState] = useState('All States');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal for creating camp
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCamp, setNewCamp] = useState({
    name: '',
    venue: '',
    city: '',
    state: 'Delhi',
    startDate: '',
    endDate: '',
    contactPhone: '',
    targetUnits: 100,
    latitude: '',
    longitude: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCamps();
  }, [selectedState]);

  const fetchCamps = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedState !== 'All States') params.state = selectedState;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get('/camps', { params });
      setCamps(res.data);
    } catch (err) {
      console.error('Error fetching donation camps:', err);
      setError('Failed to load blood donation camps.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCamps();
  };

  const handleRSVP = async (campId) => {
    if (!user) {
      alert('Please log in as a donor or patient to RSVP for this camp.');
      return;
    }
    try {
      setError('');
      await api.post(`/camps/${campId}/rsvp`, {
        bloodGroup: user.bloodGroup || 'O+',
        phone: user.phone || ''
      });
      setSuccessMsg('🎉 You have successfully registered for the blood donation camp!');
      fetchCamps();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('RSVP error:', err);
      setError(err.response?.data?.message || 'Failed to RSVP for this camp.');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError('');
      await api.post('/camps', newCamp);
      setShowCreateModal(false);
      setSuccessMsg('Blood donation camp registered and published successfully!');
      setNewCamp({
        name: '',
        venue: '',
        city: '',
        state: 'Delhi',
        startDate: '',
        endDate: '',
        contactPhone: '',
        targetUnits: 100,
        latitude: '',
        longitude: ''
      });
      fetchCamps();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Camp create error:', err);
      setError(err.response?.data?.message || 'Failed to create camp');
    } finally {
      setCreating(false);
    }
  };

  const canCreateCamp = user && ['hospital', 'bloodbank', 'admin'].includes(user.role);

  return (
    <div className="container py-4">
      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom gap-3">
        <div>
          <h2 className="fw-bold text-danger mb-1">🩸 Voluntary Blood Donation Camps & Drives</h2>
          <p className="text-muted mb-0">
            Join nearby voluntary donation drives across India or organize community lifesaver camps.
          </p>
        </div>
        {canCreateCamp && (
          <button
            className="btn btn-danger fw-bold text-nowrap"
            onClick={() => setShowCreateModal(true)}
          >
            + Organize New Camp
          </button>
        )}
      </div>

      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="card shadow-sm mb-4 border-0 bg-light">
        <div className="card-body">
          <form onSubmit={handleSearchSubmit} className="row g-3">
            <div className="col-md-5">
              <label className="form-label small fw-bold text-secondary">Search Keyword / Venue / Organizer</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Red Cross, Bandra, Bangalore, Apollo"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold text-secondary">Filter by Indian State / Territory</label>
              <select
                className="form-select"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button type="submit" className="btn btn-primary w-100 fw-bold">
                🔍 Filter Camps
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Camps List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading camps...</span>
          </div>
          <p className="mt-3 text-muted">Loading regional donation drives...</p>
        </div>
      ) : camps.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <div className="card-body">
            <div className="display-4 text-muted mb-3">🎪</div>
            <h5 className="fw-bold text-secondary">No Donation Camps Found</h5>
            <p className="text-muted">
              No upcoming blood camps matched your selected state or filter.
            </p>
            {canCreateCamp && (
              <button
                className="btn btn-outline-danger mt-2"
                onClick={() => setShowCreateModal(true)}
              >
                Host the first camp in {selectedState}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {camps.map((camp) => {
            const hasUserRSVPed =
              user &&
              camp.registeredDonors?.some(
                (r) => r.donor?._id === user._id || r.donor === user._id
              );
            const userRegistration = user
              ? camp.registeredDonors?.find(
                  (r) => r.donor?._id === user._id || r.donor === user._id
                )
              : null;

            const percentage = Math.min(
              100,
              Math.round(((camp.collectedUnits || 0) / (camp.targetUnits || 100)) * 100)
            );

            return (
              <div key={camp._id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0 border-top border-4 border-danger">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-danger-subtle text-danger border border-danger">
                        {camp.status.toUpperCase()}
                      </span>
                      <small className="text-muted font-monospace">{camp.city}, {camp.state}</small>
                    </div>

                    <h5 className="card-title fw-bold text-dark mb-2">{camp.name}</h5>

                    <p className="small text-secondary mb-2">
                      <strong>Organized by: </strong> {camp.organizerName}
                    </p>

                    <div className="bg-light p-2 rounded small mb-3 border">
                      <div className="mb-1">
                        <strong>📍 Venue: </strong> {camp.venue}
                      </div>
                      <div className="mb-1">
                        <strong>📅 Dates: </strong>
                        {new Date(camp.startDate).toLocaleDateString()} – {new Date(camp.endDate).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>📞 Contact: </strong> {camp.contactPhone}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Target: {camp.targetUnits} units</span>
                        <span>{camp.collectedUnits || 0} collected ({percentage}%)</span>
                      </div>
                      <div className="progress" style={{ height: '8px' }}>
                        <div
                          className="progress-bar bg-danger"
                          role="progressbar"
                          style={{ width: `${percentage}%` }}
                          aria-valuenow={percentage}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>

                    <div className="small text-muted mb-3">
                      <strong>Registered Donors: </strong> {camp.registeredDonors?.length || 0} volunteers
                    </div>

                    <div className="mt-auto pt-2 border-top">
                      {userRegistration?.attended ? (
                        <button
                          className="btn btn-success btn-sm w-100 fw-bold"
                          onClick={() =>
                            generateDonationCertificate({
                              donorName: user.name,
                              bloodGroup: user.bloodGroup || 'Blood',
                              campName: camp.name,
                              venue: camp.venue,
                              date: new Date(camp.startDate).toLocaleDateString(),
                              certificateId: userRegistration.certificateId
                            })
                          }
                        >
                          🏆 Download Donation Certificate (PDF)
                        </button>
                      ) : hasUserRSVPed ? (
                        <div className="btn btn-outline-success btn-sm w-100 disabled">
                          ✓ You are Registered (RSVP Confirmed)
                        </div>
                      ) : (
                        <button
                          className="btn btn-outline-danger btn-sm w-100 fw-bold"
                          onClick={() => handleRSVP(camp._id)}
                        >
                          🙋‍♂️ RSVP & Pledge Blood Unit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Creating New Camp */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content shadow">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">🎪 Organize Blood Donation Drive / Camp</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-bold">Camp Event Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Red Cross Community Mega Blood Drive"
                        required
                        value={newCamp.name}
                        onChange={(e) => setNewCamp({ ...newCamp, name: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Start Date & Time *</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        required
                        value={newCamp.startDate}
                        onChange={(e) => setNewCamp({ ...newCamp, startDate: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">End Date & Time *</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        required
                        value={newCamp.endDate}
                        onChange={(e) => setNewCamp({ ...newCamp, endDate: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold">Venue Address *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Community Center, Sector 14"
                        required
                        value={newCamp.venue}
                        onChange={(e) => setNewCamp({ ...newCamp, venue: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">City *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. New Delhi"
                        required
                        value={newCamp.city}
                        onChange={(e) => setNewCamp({ ...newCamp, city: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">State *</label>
                      <select
                        className="form-select"
                        value={newCamp.state}
                        onChange={(e) => setNewCamp({ ...newCamp, state: e.target.value })}
                      >
                        {INDIAN_STATES.filter((s) => s !== 'All States').map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Organizer Helpline / Phone *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="+91 9876543210"
                        required
                        value={newCamp.contactPhone}
                        onChange={(e) => setNewCamp({ ...newCamp, contactPhone: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Target Blood Units</label>
                      <input
                        type="number"
                        className="form-control"
                        min="10"
                        max="2000"
                        value={newCamp.targetUnits}
                        onChange={(e) => setNewCamp({ ...newCamp, targetUnits: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small text-muted">Latitude (Optional GPS)</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="e.g. 28.6139"
                        value={newCamp.latitude}
                        onChange={(e) => setNewCamp({ ...newCamp, latitude: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small text-muted">Longitude (Optional GPS)</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="e.g. 77.2090"
                        value={newCamp.longitude}
                        onChange={(e) => setNewCamp({ ...newCamp, longitude: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger fw-bold" disabled={creating}>
                    {creating ? 'Publishing...' : '📢 Publish Blood Drive'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationCamps;
