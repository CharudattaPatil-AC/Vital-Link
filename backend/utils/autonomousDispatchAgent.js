const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const BloodBank = require('../models/BloodBank');
const Reservation = require('../models/Reservation');
const {
  COMPATIBILITY_MATRIX,
  getTierForDonor,
  checkDonorEligibility
} = require('./bloodCompatibility');

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Multi-Channel Tool Calling: Simulated WhatsApp Emergency Dispatch
 */
function dispatchWhatsAppTool(donor, bloodRequest, distanceKm) {
  const hospital = bloodRequest.hospitalName || 'Emergency Medical Center';
  const units = bloodRequest.unitsNeeded;
  const bg = bloodRequest.bloodGroup;
  const distStr = distanceKm ? `${distanceKm.toFixed(1)} km` : 'nearby';

  const messageText = `🚨 *LifeLink Emergency Blood Alert*\n\nUrgent: A patient at *${hospital}* needs *${units} units* of *${bg}* blood.\nYou are *${distStr}* away and verified medically eligible.\n\n👉 *Reply YES or tap to accept:* http://localhost:3000/dashboard/donor\nEmergency Line: 📞 ${bloodRequest.contactPhone}`;

  return {
    channel: 'whatsapp',
    recipientPhone: donor.phone || '+91 98765 43210',
    recipientName: donor.name,
    distanceKm: distanceKm ? parseFloat(distanceKm.toFixed(1)) : 0,
    status: 'delivered',
    messageText,
    triggeredAt: new Date()
  };
}

/**
 * Multi-Channel Tool Calling: Simulated Automated IVR Voice Call
 */
function dispatchIVRVoiceCallTool(donor, bloodRequest, distanceKm) {
  const hospital = bloodRequest.hospitalName || 'Emergency Hospital';
  const units = bloodRequest.unitsNeeded;
  const bg = bloodRequest.bloodGroup;
  const distStr = distanceKm ? `${distanceKm.toFixed(1)} km` : '3.2 km';

  const voiceScript = `Urgent alert: A patient at ${hospital} needs ${units} units of ${bg} blood. You are ${distStr} away and eligible. Press 1 to accept.`;

  return {
    channel: 'ivr_call',
    recipientPhone: donor.phone || '+91 98765 43210',
    recipientName: donor.name,
    distanceKm: distanceKm ? parseFloat(distanceKm.toFixed(1)) : 0,
    status: 'ringing',
    messageText: voiceScript,
    triggeredAt: new Date()
  };
}

/**
 * Cross-Inventory Autonomous Hold:
 * Queries the nearest certified blood bank, places an atomic hold on compatible units,
 * and generates navigation routing for the patient/attendant.
 */
async function placeCrossInventoryHold(bloodRequest, io) {
  if (bloodRequest.autonomousHold && bloodRequest.autonomousHold.placed) {
    return bloodRequest.autonomousHold;
  }

  const coords = bloodRequest.location.coordinates; // [lng, lat]
  const reqLng = coords[0];
  const reqLat = coords[1];
  const compatibleGroups = bloodRequest.compatibleGroups || [bloodRequest.bloodGroup];

  // Find nearest certified blood bank with compatible units in stock
  const candidateBanks = await BloodBank.find({
    verified: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coords
        },
        $maxDistance: 35000 // up to 35 km search for cross-inventory hold
      }
    },
    'inventory': {
      $elemMatch: {
        bloodGroup: { $in: compatibleGroups },
        unitsAvailable: { $gt: 0 }
      }
    }
  });

  if (!candidateBanks || candidateBanks.length === 0) {
    return null;
  }

  // Pick the closest bank that can satisfy the units or highest available
  let selectedBank = null;
  let selectedGroup = bloodRequest.bloodGroup;
  let holdUnits = 0;

  for (const bank of candidateBanks) {
    // Look for exact blood group first, then compatible
    const exactItem = bank.inventory.find(
      i => i.bloodGroup === bloodRequest.bloodGroup && i.unitsAvailable > 0
    );
    if (exactItem) {
      selectedBank = bank;
      selectedGroup = exactItem.bloodGroup;
      holdUnits = Math.min(exactItem.unitsAvailable, bloodRequest.unitsNeeded);
      break;
    }

    // Otherwise compatible group
    const compatItem = bank.inventory.find(
      i => compatibleGroups.includes(i.bloodGroup) && i.unitsAvailable > 0
    );
    if (compatItem) {
      selectedBank = bank;
      selectedGroup = compatItem.bloodGroup;
      holdUnits = Math.min(compatItem.unitsAvailable, bloodRequest.unitsNeeded);
      break;
    }
  }

  if (!selectedBank) {
    return null;
  }

  const bankCoords = selectedBank.location.coordinates;
  const distKm = calculateDistance(reqLat, reqLng, bankCoords[1], bankCoords[0]);

  // Atomically deduct/hold units in the blood bank inventory
  await BloodBank.updateOne(
    { _id: selectedBank._id, 'inventory.bloodGroup': selectedGroup },
    { $inc: { 'inventory.$.unitsAvailable': -holdUnits } }
  );

  // Create confirmed emergency Reservation linked to patient
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours hold
  const reservation = await Reservation.create({
    patient: bloodRequest.patient,
    facilityId: selectedBank._id,
    facilityType: 'bloodbank',
    facilityName: selectedBank.name,
    resourceType: 'blood',
    bloodGroup: selectedGroup,
    quantity: holdUnits,
    status: 'confirmed',
    expiresAt,
    notes: `Autonomous Cross-Inventory Hold placed by LifeLink Agent for Emergency Blood Request #${bloodRequest._id.toString().slice(-6)}`
  });

  const routingUrl = `https://www.google.com/maps/dir/?api=1&destination=${bankCoords[1]},${bankCoords[0]}`;

  bloodRequest.autonomousHold = {
    placed: true,
    bloodBank: selectedBank._id,
    bloodBankName: selectedBank.name,
    reservationId: reservation._id,
    unitsHeld: holdUnits,
    bloodGroup: selectedGroup,
    pickupAddress: selectedBank.address || 'Certified Regional Blood Center',
    contactPhone: selectedBank.phone || '+91 1800 11 9999',
    distanceKm: parseFloat(distKm.toFixed(1)),
    routingUrl,
    placedAt: new Date(),
    status: 'active'
  };

  bloodRequest.escalationHistory.push({
    tier: 3,
    radius: bloodRequest.radius,
    action: 'Cross-Inventory Autonomous Hold Placed',
    summary: `Secured ${holdUnits} units of ${selectedGroup} at ${selectedBank.name} (${distKm.toFixed(1)} km away). Attendant navigation route generated.`,
    timestamp: new Date()
  });

  // Real-time notification to patient via Socket.IO
  if (io) {
    io.to(`user_${bloodRequest.patient}`).emit('autonomousHoldSecured', {
      requestId: bloodRequest._id,
      hold: bloodRequest.autonomousHold,
      message: `Cross-inventory hold secured! ${holdUnits} units of ${selectedGroup} held at ${selectedBank.name}. Route directly for emergency pickup.`
    });

    io.emit('inventoryUpdate', {
      type: 'bloodbank',
      facilityId: selectedBank._id
    });
  }

  return bloodRequest.autonomousHold;
}

/**
 * Escalate a Blood Request through the 3 Agentic Tiers:
 * Tier 1 (5 km) -> Tier 2 (15 km) -> Tier 3 (30 km + Multi-channel IVR & Cross-Inventory Hold)
 */
async function escalateBloodRequest(requestId, io, forceNextTier = false) {
  const bloodRequest = await BloodRequest.findById(requestId).populate('patient', 'name phone email');
  if (!bloodRequest || bloodRequest.status !== 'active') {
    return { success: false, message: 'Request is not active' };
  }

  // Count accepted responses
  const acceptedCount = (bloodRequest.matchedDonors || []).filter(d => d.status === 'accepted').length;
  if (acceptedCount >= bloodRequest.unitsNeeded) {
    return {
      success: true,
      message: 'Request already has sufficient accepted donors',
      bloodRequest
    };
  }

  const currentTier = bloodRequest.escalationTier || 1;
  const targetTier = forceNextTier ? Math.min(3, currentTier + 1) : (currentTier >= 3 ? 3 : currentTier + 1);

  const reqCoords = bloodRequest.location.coordinates;
  const reqLng = reqCoords[0];
  const reqLat = reqCoords[1];
  const compatibleGroups = bloodRequest.compatibleGroups || [bloodRequest.bloodGroup];

  let newRadius = bloodRequest.radius;
  let actionSummary = '';

  if (targetTier === 2) {
    // -------------------------------------------------------------
    // TIER 2: Expand to 15 km & Orchestrate WhatsApp Emergency Alerts
    // -------------------------------------------------------------
    newRadius = 15000;
    bloodRequest.escalationTier = 2;
    bloodRequest.radius = newRadius;

    // Find donors between 5 km and 15 km
    const alreadyMatchedIds = (bloodRequest.matchedDonors || []).map(m => m.donor.toString());

    const tier2Candidates = await User.find({
      _id: { $nin: alreadyMatchedIds },
      role: 'donor',
      isAvailable: true,
      bloodGroup: { $in: compatibleGroups },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: reqCoords
          },
          $maxDistance: newRadius
        }
      }
    }).select('-password');

    let newEligibleCount = 0;
    for (const donor of tier2Candidates) {
      const eligibility = checkDonorEligibility(donor);
      if (eligibility.eligible) {
        const { tier, label } = getTierForDonor(bloodRequest.bloodGroup, donor.bloodGroup);
        const donorCoords = donor.location.coordinates;
        const distKm = calculateDistance(reqLat, reqLng, donorCoords[1], donorCoords[0]);

        bloodRequest.matchedDonors.push({
          donor: donor._id,
          donorBloodGroup: donor.bloodGroup,
          matchTier: tier,
          matchLabel: `${label} (Tier 2 - 15km)`,
          status: 'pending'
        });

        // Multi-channel tool call: WhatsApp
        const waDispatch = dispatchWhatsAppTool(donor, bloodRequest, distKm);
        bloodRequest.dispatchedChannels.push(waDispatch);

        newEligibleCount++;

        // Real-time socket notify
        if (io) {
          io.to(`user_${donor._id}`).emit('bloodRequest', {
            requestId: bloodRequest._id,
            requestedBloodGroup: bloodRequest.bloodGroup,
            donorBloodGroup: donor.bloodGroup,
            matchLabel: `${label} (15km Escalation)`,
            matchTier: tier,
            unitsNeeded: bloodRequest.unitsNeeded,
            urgency: bloodRequest.urgency,
            hospitalName: bloodRequest.hospitalName,
            contactPhone: bloodRequest.contactPhone
          });
        }
      }
    }

    actionSummary = `Radius expanded autonomously to 15 km. Dispatched ${newEligibleCount} new compatible donors via WhatsApp and WebSocket.`;
    bloodRequest.escalationHistory.push({
      tier: 2,
      radius: newRadius,
      action: 'Tier 2 Dynamic Radius Expansion (15 km)',
      summary: actionSummary,
      timestamp: new Date()
    });

  } else if (targetTier === 3) {
    // -------------------------------------------------------------
    // TIER 3: Expand to 30 km, Multi-Channel IVR Voice Calls & Cross-Inventory Hold
    // -------------------------------------------------------------
    newRadius = 30000;
    bloodRequest.escalationTier = 3;
    bloodRequest.radius = newRadius;

    const alreadyMatchedIds = (bloodRequest.matchedDonors || []).map(m => m.donor.toString());

    const tier3Candidates = await User.find({
      _id: { $nin: alreadyMatchedIds },
      role: 'donor',
      isAvailable: true,
      bloodGroup: { $in: compatibleGroups },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: reqCoords
          },
          $maxDistance: newRadius
        }
      }
    }).select('-password');

    let ivrCallsTriggered = 0;
    for (const donor of tier3Candidates) {
      const eligibility = checkDonorEligibility(donor);
      if (eligibility.eligible) {
        const { tier, label } = getTierForDonor(bloodRequest.bloodGroup, donor.bloodGroup);
        const donorCoords = donor.location.coordinates;
        const distKm = calculateDistance(reqLat, reqLng, donorCoords[1], donorCoords[0]);

        bloodRequest.matchedDonors.push({
          donor: donor._id,
          donorBloodGroup: donor.bloodGroup,
          matchTier: tier,
          matchLabel: `${label} (Tier 3 - 30km)`,
          status: 'pending'
        });

        // Multi-channel tool call: IVR Voice Call
        const ivrDispatch = dispatchIVRVoiceCallTool(donor, bloodRequest, distKm);
        bloodRequest.dispatchedChannels.push(ivrDispatch);
        ivrCallsTriggered++;

        // Real-time socket notify
        if (io) {
          io.to(`user_${donor._id}`).emit('bloodRequest', {
            requestId: bloodRequest._id,
            requestedBloodGroup: bloodRequest.bloodGroup,
            donorBloodGroup: donor.bloodGroup,
            matchLabel: `${label} (30km IVR Call)`,
            matchTier: tier,
            unitsNeeded: bloodRequest.unitsNeeded,
            urgency: 'critical',
            hospitalName: bloodRequest.hospitalName,
            contactPhone: bloodRequest.contactPhone,
            ivrScript: ivrDispatch.messageText
          });
        }
      }
    }

    // Trigger cross-inventory hold from nearest certified blood bank
    const holdResult = await placeCrossInventoryHold(bloodRequest, io);

    actionSummary = `Radius expanded to 30 km. Triggered ${ivrCallsTriggered} automated IVR phone alerts. ${
      holdResult
        ? `Secured atomic cross-inventory hold for ${holdResult.unitsHeld} units at ${holdResult.bloodBankName}!`
        : 'Cross-inventory search scanned regional banks.'
    }`;

    bloodRequest.escalationHistory.push({
      tier: 3,
      radius: newRadius,
      action: 'Tier 3 Multi-Channel IVR & Cross-Inventory Hold',
      summary: actionSummary,
      timestamp: new Date()
    });
  }

  bloodRequest.lastEscalatedAt = new Date();
  await bloodRequest.save();

  if (io) {
    io.to(`user_${bloodRequest.patient._id || bloodRequest.patient}`).emit('agentEscalationUpdate', {
      requestId: bloodRequest._id,
      escalationTier: bloodRequest.escalationTier,
      radius: bloodRequest.radius,
      autonomousHold: bloodRequest.autonomousHold,
      summary: actionSummary
    });
  }

  return {
    success: true,
    escalationTier: bloodRequest.escalationTier,
    radius: bloodRequest.radius,
    actionSummary,
    bloodRequest
  };
}

/**
 * Autonomous Monitoring Loop (Runs in background every 60–180 seconds):
 * Scans active blood requests. If responses are 0 or below needed after 3–5 minutes,
 * autonomously escalates through Tier 2 (15km) and Tier 3 (30km + IVR + Cross-Inventory Hold).
 */
async function runAutonomousMonitoringLoop(io) {
  try {
    const activeRequests = await BloodRequest.find({
      status: 'active',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // last 24h
    });

    const now = Date.now();

    for (const req of activeRequests) {
      const acceptedCount = (req.matchedDonors || []).filter(d => d.status === 'accepted').length;
      if (acceptedCount >= req.unitsNeeded) {
        continue;
      }

      const elapsedSinceLastCheck = (now - new Date(req.lastEscalatedAt || req.createdAt).getTime()) / (60 * 1000); // in minutes
      const currentTier = req.escalationTier || 1;

      // Escalate if 3 or more minutes have passed without sufficient donor acceptance
      if (currentTier === 1 && elapsedSinceLastCheck >= 3) {
        console.log(`[Agentic AI Loop] Auto-escalating Request #${req._id.toString().slice(-6)}: Tier 1 -> Tier 2 (15 km)`);
        await escalateBloodRequest(req._id, io, true);
      } else if (currentTier === 2 && elapsedSinceLastCheck >= 3) {
        console.log(`[Agentic AI Loop] Auto-escalating Request #${req._id.toString().slice(-6)}: Tier 2 -> Tier 3 (30 km + IVR + Cross-Hold)`);
        await escalateBloodRequest(req._id, io, true);
      } else if (currentTier === 3 && (!req.autonomousHold || !req.autonomousHold.placed)) {
        // Ensure cross-inventory hold is attempted if still missing
        await placeCrossInventoryHold(req, io);
        await req.save();
      }
    }
  } catch (err) {
    console.error('Error in runAutonomousMonitoringLoop:', err);
  }
}

module.exports = {
  calculateDistance,
  dispatchWhatsAppTool,
  dispatchIVRVoiceCallTool,
  placeCrossInventoryHold,
  escalateBloodRequest,
  runAutonomousMonitoringLoop
};

