import React from 'react';
import { Link } from 'react-router-dom';

const HospitalCard = ({ hospital }) => {
  const { name, address, phone, resources, _id, distance } = hospital;

  return (
    <div className="card h-100 shadow-sm border-0 border-top border-4 border-danger">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title text-primary mb-1 fw-bold">{name}</h5>
          {hospital.verified && (
            <span className="badge bg-success-subtle text-success border border-success">Verified</span>
          )}
        </div>
        <p className="card-text text-muted small mb-2">
          📍 {address}
        </p>
        <p className="card-text text-muted small mb-3">
          📞 {phone}
        </p>

        {distance !== undefined && (
          <p className="badge bg-info text-dark align-self-start mb-3">
            Distance: {(distance / 1000).toFixed(1)} km
          </p>
        )}

        <div className="mt-auto">
          <h6 className="fw-semibold text-secondary small text-uppercase mb-2">Resource Availability:</h6>
          <div className="row g-2 text-center small mb-3">
            <div className="col-6 col-sm-3">
              <div className={`p-2 rounded border ${resources?.icuBeds?.available > 0 ? 'bg-success-subtle border-success' : 'bg-light'}`}>
                <div className="fw-bold">{resources?.icuBeds?.available ?? 0} / {resources?.icuBeds?.total ?? 0}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>ICU Beds</div>
              </div>
            </div>
            <div className="col-6 col-sm-3">
              <div className={`p-2 rounded border ${resources?.generalBeds?.available > 0 ? 'bg-success-subtle border-success' : 'bg-light'}`}>
                <div className="fw-bold">{resources?.generalBeds?.available ?? 0} / {resources?.generalBeds?.total ?? 0}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>General Beds</div>
              </div>
            </div>
            <div className="col-6 col-sm-3">
              <div className={`p-2 rounded border ${resources?.oxygenCylinders?.available > 0 ? 'bg-success-subtle border-success' : 'bg-light'}`}>
                <div className="fw-bold">{resources?.oxygenCylinders?.available ?? 0} / {resources?.oxygenCylinders?.total ?? 0}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Oxygen</div>
              </div>
            </div>
            <div className="col-6 col-sm-3">
              <div className={`p-2 rounded border ${resources?.ventilators?.available > 0 ? 'bg-success-subtle border-success' : 'bg-light'}`}>
                <div className="fw-bold">{resources?.ventilators?.available ?? 0} / {resources?.ventilators?.total ?? 0}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Ventilators</div>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link to={`/hospitals/${_id}`} className="btn btn-outline-danger flex-grow-1 fw-semibold btn-sm">
              View Details & Reserve
            </Link>
            {hospital.location?.coordinates && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.location.coordinates[1]},${hospital.location.coordinates[0]}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary btn-sm fw-semibold text-nowrap"
                title="Get turn-by-turn driving directions in Google Maps"
              >
                🧭 Directions
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalCard;
