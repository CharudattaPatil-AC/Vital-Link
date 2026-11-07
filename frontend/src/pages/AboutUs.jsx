import React from 'react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  const teamMembers = [
    {
      name: 'Charudatta Patil',
      phone: '7798615673',
      email: 'charudatta.patil.cmaug26@gmail.com'
    },
    {
      name: 'Divyashish Negi',
      phone: '7357644803',
      email: 'divyashish.negi.cmaug26@gmail.com'
    },
    {
      name: 'Bhavesh Wagh',
      phone: '9373162282',
      email: 'bhavesh.wagh.cmaug26@gmail.com'
    }
  ];

  return (
    <div className="py-5 bg-light">
      <div className="container">
        {/* Hero Section */}
        <div className="text-center mb-5">
          <span className="badge bg-danger px-3 py-2 fs-6 mb-3">WPT Mini Project</span>
          <h1 className="fw-bold display-5 mb-3 text-dark">
            About <span className="text-danger">LifeLink</span>
          </h1>
          <p className="lead text-muted mx-auto" style={{ maxWidth: '800px' }}>
            A centralized, real-time emergency healthcare resource coordination and rare blood matching platform
            built to solve the critical <strong>"Golden Hour"</strong> bottleneck during life-threatening medical emergencies.
          </p>
        </div>

        {/* Vision & Mission Cards */}
        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm p-3">
              <div className="card-body">
                <div className="fs-1 text-danger mb-3">🎯</div>
                <h5 className="fw-bold">Our Mission</h5>
                <p className="text-muted small mb-0">
                  To eliminate delay and panic during medical emergencies by providing instant, verified visibility
                  into ICU beds, oxygen, ventilators, and rare blood units.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm p-3">
              <div className="card-body">
                <div className="fs-1 text-danger mb-3">🏥</div>
                <h5 className="fw-bold">Emergency Bed Network</h5>
                <p className="text-muted small mb-0">
                  Enables patients and attendants to view live hospital capacities and place 1-click bed reservations
                  that are held until patient triage admission.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm p-3">
              <div className="card-body">
                <div className="fs-1 text-danger mb-3">🩸</div>
                <h5 className="fw-bold">Rare Blood Matching</h5>
                <p className="text-muted small mb-0">
                  Maps patient emergency blood needs against 2,439+ verified certified blood banks with live inventory
                  across all 8 blood groups including rare Rh-negative types.
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* Meet the Developers Section */}
        <div className="text-center mb-4">
          <h2 className="fw-bold text-dark mb-2">👥 Meet Our Project Team</h2>
          <p className="text-muted">Web Programming Technologies (WPT) Mini Project Developers</p>
        </div>

        <div className="row g-4 justify-content-center mb-5">
          {teamMembers.map((member, idx) => (
            <div key={idx} className="col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center p-3 border-top border-4 border-danger">
                <div className="card-body">
                  <h5 className="fw-bold mb-3 text-dark">{member.name}</h5>

                  <div className="p-3 bg-light rounded small text-start">
                    <div className="mb-2">
                      <strong>📞 Phone: </strong>
                      <a href={`tel:${member.phone}`} className="text-decoration-none text-dark fw-semibold">
                        +91 {member.phone}
                      </a>
                    </div>
                    <div>
                      <strong>✉️ Email: </strong>
                      <a href={`mailto:${member.email}`} className="text-decoration-none text-danger fw-semibold text-break">
                        {member.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="bg-danger text-white rounded p-4 text-center shadow-sm">
          <h4 className="fw-bold mb-2">Have questions or feedback about our project?</h4>
          <p className="mb-3 opacity-75">
            Feel free to reach out to our team via our Contact Us portal.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/contact" className="btn btn-light text-danger fw-bold">
              Contact Our Team &rarr;
            </Link>
            <Link to="/search/hospitals" className="btn btn-outline-light fw-bold">
              Explore Hospitals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;

