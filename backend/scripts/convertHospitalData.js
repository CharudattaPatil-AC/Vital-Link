const fs = require('fs');
const path = require('path');
const readline = require('readline');

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

const COMMON_MEDICINES = [
  { name: 'Adrenaline / Epinephrine', available: true, quantity: 40 },
  { name: 'Atropine', available: true, quantity: 30 },
  { name: 'Amiodarone', available: true, quantity: 20 },
  { name: 'Norepinephrine', available: true, quantity: 25 },
  { name: 'Hydrocortisone', available: true, quantity: 50 },
  { name: 'Dopamine', available: true, quantity: 18 }
];

async function convertHospitals() {
  const csvPath = path.join(__dirname, '../data/hospital_dataset/hospital_directory.csv');
  const outPath = path.join(__dirname, '../data/allIndiaHospitals.json');

  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found at:', csvPath);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let headers = null;
  let latLngIdx = -1;
  let nameIdx = -1;
  let stateIdx = -1;
  let districtIdx = -1;
  let addressIdx = -1;
  let pincodeIdx = -1;
  let phoneIdx = -1;
  let mobileIdx = -1;
  let emergencyIdx = -1;
  let emailIdx = -1;
  let bedsIdx = -1;

  const validHospitals = [];
  let rowIndex = 0;

  for await (const line of rl) {
    if (!line || !line.trim()) continue;
    const cols = parseCSVLine(line);

    if (!headers) {
      headers = cols.map(h => h.replace(/^["']|["']$/g, '').trim());
      latLngIdx = headers.indexOf('Location_Coordinates');
      nameIdx = headers.indexOf('Hospital_Name');
      stateIdx = headers.indexOf('State');
      districtIdx = headers.indexOf('District');
      addressIdx = headers.indexOf('Address_Original_First_Line');
      pincodeIdx = headers.indexOf('Pincode');
      phoneIdx = headers.indexOf('Telephone');
      mobileIdx = headers.indexOf('Mobile_Number');
      emergencyIdx = headers.indexOf('Emergency_Num');
      emailIdx = headers.indexOf('Hospital_Primary_Email_Id');
      bedsIdx = headers.indexOf('Total_Num_Beds');

      console.log('Headers detected successfully.');
      continue;
    }

    rowIndex++;

    const rawCoords = cols[latLngIdx] ? cols[latLngIdx].replace(/^["']|["']$/g, '').trim() : '';
    if (!rawCoords || rawCoords === '0' || !rawCoords.includes(',')) continue;

    const parts = rawCoords.split(',');
    if (parts.length < 2) continue;

    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());

    // Validate India geographical bounds: Lat ~ 6°N - 38°N, Lng ~ 68°E - 98°E
    if (isNaN(lat) || isNaN(lng) || lat < 6 || lat > 38 || lng < 68 || lng > 98) {
      continue;
    }

    const name = cols[nameIdx] ? cols[nameIdx].replace(/^["']|["']$/g, '').trim() : '';
    if (!name || name === '0' || name.length < 3) continue;

    const state = cols[stateIdx] ? cols[stateIdx].replace(/^["']|["']$/g, '').trim() : 'India';
    const district = cols[districtIdx] ? cols[districtIdx].replace(/^["']|["']$/g, '').trim() : '';
    const rawAddress = cols[addressIdx] ? cols[addressIdx].replace(/^["']|["']$/g, '').trim() : '';
    const pincode = cols[pincodeIdx] ? cols[pincodeIdx].replace(/^["']|["']$/g, '').trim() : '';

    const addressParts = [];
    if (rawAddress && rawAddress !== '0') addressParts.push(rawAddress);
    if (district && district !== '0' && district !== rawAddress) addressParts.push(district);
    if (state && state !== '0') addressParts.push(state);
    if (pincode && pincode !== '0') addressParts.push(pincode);
    const address = addressParts.join(', ') || `${district || state}, India`;

    let phone = cols[emergencyIdx] || cols[mobileIdx] || cols[phoneIdx] || '+91 1800 11 9999';
    phone = phone.replace(/^["']|["']$/g, '').trim();
    if (!phone || phone === '0' || phone.length < 6) {
      phone = '+91 1800 11 9999';
    }

    let email = cols[emailIdx] ? cols[emailIdx].replace(/^["']|["']$/g, '').trim() : '';
    if (!email || email === '0' || !email.includes('@')) {
      const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
      email = `emergency.${sanitized}@hospital.in`;
    }

    let totalBeds = cols[bedsIdx] ? parseInt(cols[bedsIdx].replace(/^["']|["']$/g, '').trim(), 10) : 0;
    if (isNaN(totalBeds) || totalBeds <= 0) {
      // Seed realistic emergency beds based on hash
      totalBeds = 40 + ((rowIndex * 29) % 160); // 40 - 200 beds
    }

    const icuTotal = Math.max(6, Math.floor(totalBeds * 0.18));
    const icuAvail = Math.max(1, Math.floor(icuTotal * 0.35));

    const genTotal = Math.max(20, Math.floor(totalBeds * 0.7));
    const genAvail = Math.max(3, Math.floor(genTotal * 0.4));

    const o2Total = Math.max(15, Math.floor(totalBeds * 0.45));
    const o2Avail = Math.max(4, Math.floor(o2Total * 0.45));

    const ventTotal = Math.max(4, Math.floor(icuTotal * 0.5));
    const ventAvail = Math.max(1, Math.floor(ventTotal * 0.35));

    validHospitals.push({
      name,
      email,
      phone,
      address,
      state: state || 'India',
      district: district || '',
      location: {
        type: 'Point',
        coordinates: [lng, lat] // GeoJSON: [longitude, latitude]
      },
      resources: {
        icuBeds: { total: icuTotal, available: icuAvail },
        generalBeds: { total: genTotal, available: genAvail },
        oxygenCylinders: { total: o2Total, available: o2Avail },
        ventilators: { total: ventTotal, available: ventAvail }
      },
      emergencyMedicines: COMMON_MEDICINES,
      operatingHours: '24/7',
      verified: true
    });
  }

  console.log(`\nFound ${validHospitals.length} valid geocoded hospitals within India from ${rowIndex} records.`);

  // Write to JSON
  fs.writeFileSync(outPath, JSON.stringify(validHospitals, null, 2), 'utf8');
  console.log(`Successfully generated ${outPath} (${(fs.statSync(outPath).size / (1024 * 1024)).toFixed(2)} MB).`);
}

convertHospitals().catch(err => {
  console.error('Error converting hospital data:', err);
  process.exit(1);
});

