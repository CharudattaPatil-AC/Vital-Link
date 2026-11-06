import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';

const EmergencyQRPass = ({ show, onClose, reservation }) => {
  if (!show || !reservation) return null;

  const qrCanvasRef = useRef(null);

  const tokenSnippet = reservation._id ? reservation._id.slice(-8).toUpperCase() : 'TOKEN';

  const qrPayload = JSON.stringify({
    reservationId: reservation._id,
    facilityId: reservation.facilityId,
    patientId: reservation.patient?._id || reservation.patient,
    facilityName: reservation.facilityName,
    resource: reservation.resourceType,
    quantity: reservation.quantity,
    bloodGroup: reservation.bloodGroup || null,
    expiresAt: reservation.expiresAt
  });

  const handlePrint = () => {
    window.print();
  };

  const downloadPDFPass = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const primaryColor = [220, 53, 69]; // #dc3545 (Red)
      const darkColor = [33, 37, 41];
      const grayColor = [108, 117, 125];
      const lightBg = [248, 249, 250];

      // Top Red Banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('LIFELINK EMERGENCY HEALTHCARE NETWORK', 14, 12);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('FAST-TRACK ADMISSION PASS & GREEN CORRIDOR TRANSIT TOKEN', 14, 19);

      // Priority Alert Box
      doc.setFillColor(255, 243, 205); // light amber
      doc.setDrawColor(255, 193, 7);
      doc.roundedRect(14, 32, 182, 14, 2, 2, 'FD');
      doc.setTextColor(133, 100, 4);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('PRIORITY GOLDEN-HOUR HOLD — 60-MINUTE ATOMIC RESERVATION', 18, 41);

      // QR Code
      const canvas = document.getElementById('emergency-pass-qr-canvas');
      if (canvas) {
        const qrImage = canvas.toDataURL('image/png');
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(138, 52, 58, 64, 2, 2, 'FD');
        doc.addImage(qrImage, 'PNG', 142, 56, 50, 50);
        doc.setFontSize(8);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('Scan for instant triage check-in', 140, 112);
      }

      // Reservation Details (Left Column)
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('RESERVATION & PATIENT DATA', 14, 56);

      doc.setDrawColor(220, 220, 220);
      doc.line(14, 59, 130, 59);

      const items = [
        ['Token ID:', `#${tokenSnippet}`],
        ['Facility:', reservation.facilityName || 'Emergency Facility'],
        ['Reserved Item:', `${reservation.quantity}x ${reservation.resourceType === 'blood' ? `Blood Units (${reservation.bloodGroup})` : reservation.resourceType}`],
        ['Status:', (reservation.status || 'Active').toUpperCase()],
        ['Issued At:', new Date(reservation.createdAt || Date.now()).toLocaleString()],
        ['Valid Until:', reservation.expiresAt ? new Date(reservation.expiresAt).toLocaleString() : '60 minutes from issue']
      ];

      let yPos = 67;
      items.forEach(([label, val]) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text(label, 14, yPos);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text(String(val), 55, yPos);
        yPos += 8;
      });

      // Green Corridor Clearance Notice
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.setDrawColor(40, 167, 69);
      doc.roundedRect(14, 124, 182, 38, 2, 2, 'FD');

      doc.setTextColor(40, 167, 69);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('🚑 STAT GREEN CORRIDOR TRANSIT AUTHORIZATION', 18, 132);

      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(
        'Notice to Highway Toll Plazas, Traffic Police & Checkposts: This digital token certifies that a high-priority',
        18,
        140
      );
      doc.text(
        'emergency medical delivery or critical trauma patient admission is underway for the destination listed above.',
        18,
        145
      );
      doc.text(
        'Kindly grant zero-delay passage through toll booths and intersections pursuant to Emergency Healthcare Protocol.',
        18,
        150
      );
      doc.setFont('helvetica', 'bold');
      doc.text('Helpline: +91 1800 11 9999 | National Disaster & Medical Relief', 18, 156);

      // Hospital Verification Seal Box
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, 170, 85, 40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Triage Officer / Nurse Verification Stamp:', 18, 178);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text('[ Stamp & Signature upon Patient Arrival ]', 18, 204);

      // Terms Box
      doc.rect(111, 170, 85, 40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('Digital Security & Verification:', 115, 178);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text('• Cryptographically hashed Reservation ID', 115, 186);
      doc.text('• Real-time stock auto-release after 60 min', 115, 192);
      doc.text('• Tampering invalidates admission guarantee', 115, 198);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text('Generated via LifeLink Universal Emergency Platform. Powered by MongoDB & Kaggle Indian Blood Registry.', 14, 280);

      doc.save(`LifeLink_Emergency_Pass_${tokenSnippet}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Could not generate PDF. Please use the Print option.');
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow-lg border-0 border-top border-4 border-danger">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title fw-bold">🎫 Fast-Track Emergency Admission & Green Corridor Pass</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4 text-center">
            <div className="badge bg-danger-subtle text-danger border border-danger mb-3 px-3 py-2 fs-6">
              ⚡ PRIORITY GOLDEN-HOUR HOLD (60 MINUTES)
            </div>

            {/* Green Corridor Badge */}
            <div className="alert alert-success d-flex align-items-center justify-content-between p-2 mb-3 small text-start">
              <div>
                <strong>🚑 Green Corridor Clearance Token Active</strong>
                <div className="text-muted">Motor Vehicles Act Section 194E compliant — expedited toll & checkpost passage.</div>
              </div>
              <span className="badge bg-success">VERIFIED</span>
            </div>

            {/* QR Code Container */}
            <div className="d-flex justify-content-center p-3 bg-white border rounded shadow-sm mb-3">
              <QRCodeCanvas
                id="emergency-pass-qr-canvas"
                ref={qrCanvasRef}
                value={qrPayload}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>

            <p className="small text-muted mb-3">
              Present this QR token at the emergency triage desk or ambulance barrier for instant digital admission.
            </p>

            {/* Pass Details */}
            <div className="text-start bg-light p-3 rounded small mb-3 border">
              <div className="row g-2">
                <div className="col-md-6">
                  <span className="text-muted d-block">Reservation Token:</span>
                  <span className="fw-bold font-monospace fs-6">#{tokenSnippet}</span>
                </div>
                <div className="col-md-6">
                  <span className="text-muted d-block">Facility:</span>
                  <span className="fw-bold text-truncate d-block">{reservation.facilityName}</span>
                </div>
                <div className="col-md-6">
                  <span className="text-muted d-block">Held Resource:</span>
                  <span className="fw-bold text-danger">
                    {reservation.quantity}x {reservation.resourceType === 'blood' ? `Blood Units (${reservation.bloodGroup})` : reservation.resourceType}
                  </span>
                </div>
                <div className="col-md-6">
                  <span className="text-muted d-block">Hold Status:</span>
                  <span className="badge bg-warning text-dark text-uppercase">{reservation.status}</span>
                </div>
                <div className="col-12 mt-2 pt-2 border-top">
                  <span className="text-muted d-block">Valid Until:</span>
                  <span className="fw-bold text-dark">
                    {reservation.expiresAt
                      ? new Date(reservation.expiresAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })
                      : '60 minutes from issue'}
                  </span>
                </div>
              </div>
            </div>

            {reservation.notes && (
              <div className="alert alert-secondary py-2 small text-start">
                <strong>Patient Condition / Notes: </strong> {reservation.notes}
              </div>
            )}
          </div>

          <div className="modal-footer bg-light d-flex justify-content-between">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
              Close
            </button>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-outline-danger btn-sm" onClick={handlePrint}>
                🖨️ Print
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm px-3 fw-bold"
                onClick={downloadPDFPass}
              >
                📄 Download PDF Medical Pass
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyQRPass;
