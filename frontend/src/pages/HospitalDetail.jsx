import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import ReservationModal from '../components/ReservationModal';
import { useSocket } from '../context/SocketContext';

const HospitalDetail = () => {
  const { id } = useParams();
  const socket = useSocket();

  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedResourceType, setSelectedResourceType] = useState('');
  const [reserveSuccess, setReserveSuccess] = useState('');

  const fetchHospital = async () => {
    try {
      const res = await API.get(`/hospitals/${id}`);
      setHospital(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Hospital not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospital();
  }, [id]);

  useEffect(() => {
    if (!socket || !hospital) return;
    const handleUpdate = (data) => {
      if (data.type === 'hospital' && data.facilityId === hospital._id) {
        setHospital((prev) => ({
          ...prev,
          resources: data.resources,
          emergencyMedicines: data.emergencyMedicines || prev.emergencyMedicines
        }));
      }
    };
    socket.on('inventoryUpdate', handleUpdate);
    return () => socket.off('inventoryUpdate', handleUpdate);
  }, [socket, hospital]);

  const handleOpenReservation = (resourceType) => {
    setSelectedResourceType(resourceType);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading details...</span>
        </div>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error || 'Hospital not found'}</div>
        <Link to="/search/hospitals" className="btn btn-outline-danger">Back to Hospitals</Link>
      </div>
    );
  }

  const { resources, emergencyMedicines } = hospital;

  return (
    <div className="container py-4">
      <Link to="/search/hospitals" className="btn btn-outline-secondary btn-sm mb-3">
        &larr; Back to Search
      </Link>

      {reserveSuccess && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {reserveSuccess}
          <button type="button" className="btn-close" onClick={() => setReserveSuccess('')}></button>
        </div>
      )}

      {/* Hospital Header */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h2 className="fw-bold text-primary mb-1">{hospital.name}</h2>
              <p className="text-muted mb-2">📍 {hospital.address}</p>
              <div className="d-flex flex-wrap gap-3 text-muted small align-items-center">
                <span>📞 Phone: <strong>{hospital.phone}</strong></span>
                <span>✉️ Email: <strong>{hospital.email}</strong></span>
                <span>🕒 Hours: <strong>{hospital.operatingHours || '24/7'}</strong></span>
                {hospital.location?.coordinates && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.location.coordinates[1]},${hospital.location.coordinates[0]}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm text-white fw-bold py-1 px-3"
                  >
                    🧭 Navigate with Google Maps
                  </a>
                )}
              </div>
            </div>
            {hospital.verified && (
              <span className="badge bg-success-subtle text-success border border-success px-3 py-2 fs-6">
                ✓ Verified Facility
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Critical Resources Grid */}
      <h4 className="fw-bold mb-3">Critical Care Resource Availability</h4>
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 text-center">
            <h6 className="text-muted small text-uppercase">ICU Beds</h6>
            <h2 className={`fw-bold my-2 ${resources?.icuBeds?.available > 0 ? 'text-success' : 'text-danger'}`}>
              {resources?.icuBeds?.available || 0}
            </h2>
            <div className="text-muted small mb-3">Total Capacity: {resources?.icuBeds?.total || 0}</div>
            <button
              className="btn btn-sm btn-danger fw-semibold"
              disabled={!resources?.icuBeds?.available || resources.icuBeds.available <= 0}
              onClick={() => handleOpenReservation('icuBed')}
            >
              {resources?.icuBeds?.available > 0 ? 'Reserve ICU Bed' : 'Full'}
            </button>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 text-center">
            <h6 className="text-muted small text-uppercase">General Emergency Beds</h6>
            <h2 className={`fw-bold my-2 ${resources?.generalBeds?.available > 0 ? 'text-success' : 'text-danger'}`}>
              {resources?.generalBeds?.available || 0}
            </h2>
            <div className="text-muted small mb-3">Total Capacity: {resources?.generalBeds?.total || 0}</div>
            <button
              className="btn btn-sm btn-danger fw-semibold"
              disabled={!resources?.generalBeds?.available || resources.generalBeds.available <= 0}
              onClick={() => handleOpenReservation('generalBed')}
            >
              {resources?.generalBeds?.available > 0 ? 'Reserve Bed' : 'Full'}
            </button>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 text-center">
            <h6 className="text-muted small text-uppercase">Oxygen Cylinders</h6>
            <h2 className={`fw-bold my-2 ${resources?.oxygenCylinders?.available > 0 ? 'text-success' : 'text-danger'}`}>
              {resources?.oxygenCylinders?.available || 0}
            </h2>
            <div className="text-muted small mb-3">Total Units: {resources?.oxygenCylinders?.total || 0}</div>
            <button
              className="btn btn-sm btn-danger fw-semibold"
              disabled={!resources?.oxygenCylinders?.available || resources.oxygenCylinders.available <= 0}
              onClick={() => handleOpenReservation('oxygenCylinder')}
            >
              {resources?.oxygenCylinders?.available > 0 ? 'Reserve Oxygen' : 'Out of Stock'}
            </button>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 text-center">
            <h6 className="text-muted small text-uppercase">Ventilators</h6>
            <h2 className={`fw-bold my-2 ${resources?.ventilators?.available > 0 ? 'text-success' : 'text-danger'}`}>
              {resources?.ventilators?.available || 0}
            </h2>
            <div className="text-muted small mb-3">Total Units: {resources?.ventilators?.total || 0}</div>
            <button
              className="btn btn-sm btn-danger fw-semibold"
              disabled={!resources?.ventilators?.available || resources.ventilators.available <= 0}
              onClick={() => handleOpenReservation('ventilator')}
            >
              {resources?.ventilators?.available > 0 ? 'Reserve Ventilator' : 'Unavailable'}
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Medicines */}
      <h4 className="fw-bold mb-3">Emergency Medicine Stock</h4>
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Medicine Name</th>
                  <th>Status</th>
                  <th>Quantity on Hand</th>
                </tr>
              </thead>
              <tbody>
                {emergencyMedicines && emergencyMedicines.length > 0 ? (
                  emergencyMedicines.map((med, idx) => (
                    <tr key={idx}>
                      <td className="fw-semibold">{med.name}</td>
                      <td>
                        {med.available ? (
                          <span className="badge bg-success">In Stock</span>
                        ) : (
                          <span className="badge bg-danger">Out of Stock</span>
                        )}
                      </td>
                      <td>{med.quantity ?? '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-muted text-center py-3">
                      No specific emergency medicines reported.
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
        facility={hospital}
        facilityType="hospital"
        resourceType={selectedResourceType}
        onReserved={() => {
          setReserveSuccess('Your emergency reservation request has been placed! Held for 1 hour.');
          fetchHospital();
        }}
      />
    </div>
  );
};

export default HospitalDetail;
