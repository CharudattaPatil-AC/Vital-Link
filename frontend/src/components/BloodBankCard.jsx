import React from 'react';
import { Link } from 'react-router-dom';

const BloodBankCard = ({ bloodBank }) => {
  const { name, address, phone, inventory, _id, distance } = bloodBank;

  return (
    <div className="card h-100 shadow-sm border-0 border-top border-4 border-danger">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title text-danger mb-1 fw-bold">🩸 {name}</h5>
          {bloodBank.verified && (
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
          <h6 className="fw-semibold text-secondary small text-uppercase mb-2">Blood Inventory:</h6>
          <div className="d-flex flex-wrap gap-1 mb-3">
            {inventory && inventory.length > 0 ? (
              inventory.map((item) => (
                <span
                  key={item.bloodGroup}
                  className={`badge px-2 py-1 ${
                    item.unitsAvailable > 0 ? 'bg-danger' : 'bg-light text-muted border'
                  }`}
                  style={{ fontSize: '0.8rem' }}
                >
                  {item.bloodGroup}: {item.unitsAvailable}
                </span>
              ))
            ) : (
              <span className="text-muted small">No inventory reported</span>
            )}
          </div>

          <div className="d-flex gap-2">
            <Link to={`/bloodbanks/${_id}`} className="btn btn-outline-danger flex-grow-1 fw-semibold btn-sm">
              View Inventory & Request Units
            </Link>
            {bloodBank.location?.coordinates && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${bloodBank.location.coordinates[1]},${bloodBank.location.coordinates[0]}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary btn-sm fw-semibold text-nowrap"
                title="Get driving directions in Google Maps"
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

export default BloodBankCard;
