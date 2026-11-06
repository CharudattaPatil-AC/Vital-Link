import { jsPDF } from 'jspdf';

export const generateDonationCertificate = ({ donorName, bloodGroup, campName, venue, date, certificateId }) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const certId = certificateId || `CERT-LL-${Date.now().toString(36).toUpperCase()}`;

  // Border & Framing
  doc.setDrawColor(220, 53, 69);
  doc.setLineWidth(3);
  doc.rect(10, 10, 277, 190);

  doc.setDrawColor(255, 193, 7);
  doc.setLineWidth(1);
  doc.rect(14, 14, 269, 182);

  // Background Header
  doc.setFillColor(254, 242, 242);
  doc.rect(15, 15, 267, 35, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 53, 69);
  doc.setFontSize(26);
  doc.text('CERTIFICATE OF APPRECIATION', 148, 30, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(108, 117, 125);
  doc.setFont('helvetica', 'normal');
  doc.text('NATIONAL BLOOD TRANSFUSION & EMERGENCY HEALTHCARE NETWORK', 148, 40, { align: 'center' });

  // Body text
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.text('This is proudly presented to', 148, 65, { align: 'center' });

  // Donor Name
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 37, 41);
  doc.text(donorName || 'Valued Voluntary Blood Donor', 148, 80, { align: 'center' });

  // Blood Group & Appreciation
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  const recognitionText = `For selflessly donating a precious unit of ${bloodGroup || 'Blood'} at the`;
  doc.text(recognitionText, 148, 96, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 53, 69);
  doc.setFontSize(16);
  doc.text(campName || 'National Blood Donation Drive', 148, 108, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(70, 70, 70);
  doc.text(`Venue: ${venue || 'Regional Healthcare Centre'} | Date: ${date || new Date().toLocaleDateString()}`, 148, 118, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'italic');
  doc.text('"Every blood donor is a lifesaver. Your humanitarian contribution brings hope and vitality to patients in need."', 148, 134, { align: 'center' });

  // Signatures
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);

  doc.line(40, 165, 100, 165);
  doc.line(197, 165, 257, 165);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(33, 37, 41);
  doc.text('Medical Camp Director', 70, 172, { align: 'center' });
  doc.text('National Blood Transfusion Council', 227, 172, { align: 'center' });

  // Certificate ID & Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Certificate ID: ${certId}`, 20, 188);
  doc.text('LifeLink Verified Emergency Medical Registry • Verified Digital Record', 277, 188, { align: 'right' });

  doc.save(`LifeLink_Donation_Certificate_${donorName ? donorName.replace(/\s+/g, '_') : 'Donor'}.pdf`);
};

