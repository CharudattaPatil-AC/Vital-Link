/**
 * LifeLink Smart Universal Blood Compatibility Engine
 * Encodes WHO / Red Cross transfusion standards, tiered donor prioritization,
 * donor cooldown protection, and cross-inventory checks.
 */

// 1. Red Blood Cell Transfusion Compatibility Matrix
const COMPATIBILITY_MATRIX = {
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'], // Universal Recipient
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+':  ['O+', 'O-'],
  'O-':  ['O-'] // Universal Donor (can only receive from O-)
};

// 2. Tiered Priority Matching Table
// Tier 1: Exact Match (Always preferred)
// Tier 2: Compatible Same Group / Rh- Sibling
// Tier 3: Universal Positive / Group Compatible
// Tier 4: Universal Lifesaver O- (Protected Reserve)
const getTierForDonor = (patientGroup, donorGroup) => {
  if (patientGroup === donorGroup) {
    return { tier: 1, label: `Exact Match (${donorGroup})` };
  }

  // If donor is O-, they are universal reserve
  if (donorGroup === 'O-') {
    return { tier: 4, label: `Universal Lifesaver Reserve (O-)` };
  }

  // If donor is O+ for any positive patient
  if (donorGroup === 'O+' && patientGroup.endsWith('+')) {
    return { tier: 3, label: `Universal Rh+ Donor (O+)` };
  }

  // Same letter group but Rh negative (e.g. B- for B+, or A- for A+)
  if (patientGroup.slice(0, -1) === donorGroup.slice(0, -1) && donorGroup.endsWith('-')) {
    return { tier: 2, label: `Compatible Rh- Sibling (${donorGroup})` };
  }

  // Other compatible combinations (e.g. A+ or B+ for AB+)
  return { tier: 2, label: `Compatible Group Donor (${donorGroup})` };
};

// 3. Medical Safety & Eligibility Verification
const checkDonorEligibility = (donor) => {
  const reasons = [];

  // Availability toggle
  if (!donor.isAvailable) {
    return { eligible: false, reason: 'Donor marked unavailable' };
  }

  // 90-day cooldown interval (whole blood donation rule)
  if (donor.lastDonationDate) {
    const daysSince = (Date.now() - new Date(donor.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 90) {
      const daysLeft = Math.ceil(90 - daysSince);
      return { eligible: false, reason: `In 90-day medical cooldown (${daysLeft} days remaining)` };
    }
  }

  // Age limits: 18 - 65
  if (donor.dateOfBirth) {
    const age = Math.floor((Date.now() - new Date(donor.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    if (age < 18 || age > 65) {
      return { eligible: false, reason: `Age ${age} outside permitted range (18-65)` };
    }
  }

  return { eligible: true };
};

module.exports = {
  COMPATIBILITY_MATRIX,
  getTierForDonor,
  checkDonorEligibility
};

