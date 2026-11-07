import React, { useState } from 'react';
import API from '../services/api';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const res = await API.post('/contact', formData);
      setStatusMsg({
        text: res.data.message || 'Thank you! Your message has been sent to our project team.',
        type: 'success'
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      setStatusMsg({
        text: err.response?.data?.message || 'Error sending message. Please try again.',
        type: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const developers = [
    {
      name: 'Bhavesh Wagh',
      phone: '9373162282',
      email: 'bhavesh.wagh.cmaug26@gmail.com',
      role: 'Database & Backend Integration'
    },
    {
      name: 'Divyashish Negi',
      phone: '7357644803',
      email: 'divyashish.negi.cmaug26@gmail.com',
      role: 'Frontend & UI Architecture'
    },
    {
      name: 'Charudatta Patil',
      phone: '7798615673',
      email: 'charudatta.patil.cmaug26@gmail.com',
      role: 'Project Lead & Full-Stack Systems'
    }
  ];

  return (
    <div className="py-5 bg-light">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-5">
          <span className="badge bg-danger px-3 py-2 fs-6 mb-2">Get in Touch</span>
          <h1 className="fw-bold display-5 text-dark">
            Contact <span className="text-danger">Our Team</span>
          </h1>
          <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
            Have questions regarding the LifeLink WPT Project implementation or evaluation?
            Reach out directly to any of our team members or submit a message below.
          </p>
        </div>

        <div className="row g-4 justify-content-center">
          {/* Left Column: Direct Developer Contact Cards */}
          <div className="col-lg-5">
            <h4 className="fw-bold mb-3 text-dark">📞 Core Team Contacts</h4>
            <div className="d-flex flex-column gap-3 mb-4">
              {developers.map((dev, idx) => (
                <div key={idx} className="card border-0 shadow-sm p-3 border-start border-4 border-danger">
                  <div className="card-body p-1">
                    <h5 className="fw-bold mb-1 text-dark">{dev.name}</h5>
                    <div className="small text-danger fw-semibold mb-2">{dev.role}</div>
                    <div className="small text-muted mb-1">
                      <strong>Phone: </strong>
                      <a href={`tel:${dev.phone}`} className="text-decoration-none text-dark fw-bold">
                        +91 {dev.phone}
                      </a>
                    </div>
                    <div className="small text-muted">
                      <strong>Email: </strong>
                      <a href={`mailto:${dev.email}`} className="text-decoration-none text-danger fw-semibold text-break">
                        {dev.email}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card border-0 shadow-sm p-4 bg-danger text-white">
              <h5 className="fw-bold mb-2">🚨 Emergency Helpline Support</h5>
              <p className="small mb-0 opacity-75">
                LifeLink is built for medical emergency resource discovery. For national emergency medical assistance in India, dial <strong>108 (Ambulance)</strong> or <strong>112 (National Emergency)</strong>.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Contact Form */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm p-4 bg-white">
              <h4 className="fw-bold mb-3 text-dark">✉️ Send Us a Message</h4>
              <p className="text-muted small mb-4">
                Fill out the form below. Your query will be recorded in our database and routed to our team.
              </p>

              {statusMsg.text && (
                <div className={`alert alert-${statusMsg.type} py-3 mb-4`}>
                  {statusMsg.type === 'success' ? '✓ ' : '✕ '}
                  {statusMsg.text}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Your Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Subject</label>
                    <input
                      type="text"
                      className="form-control"
                      name="subject"
                      required
                      placeholder="e.g. Project Query / Facility Onboarding"
                      value={formData.subject}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold">Your Message / Feedback</label>
                  <textarea
                    className="form-control"
                    rows="5"
                    name="message"
                    required
                    placeholder="Type your message here..."
                    value={formData.message}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn btn-danger w-100 fw-bold py-2"
                  disabled={loading}
                >
                  {loading ? 'Sending Message...' : '🚀 Submit Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
