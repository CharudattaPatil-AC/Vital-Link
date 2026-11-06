const fs = require('fs');
const path = require('path');

function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(current.trim());
      if (row.some(field => field.length > 0)) {
        rows.push(row);
      }
      row = [];
      current = '';
    } else {
      current += char;
    }
  }
  if (current || row.length > 0) {
    row.push(current.trim());
    if (row.some(field => field.length > 0)) rows.push(row);
  }
  return rows;
}

function generateInventory(index) {
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  // Seedable deterministic pseudo-random count
  return bloodGroups.map((bg, bgIdx) => {
    const seedVal = ((index * 37) + (bgIdx * 19)) % 100;
    let units;
    if (bg === 'O+' || bg === 'B+') {
      units = 15 + (seedVal % 30); // 15 - 44 units (common)
    } else if (bg === 'A+') {
      units = 10 + (seedVal % 25); // 10 - 34 units
    } else if (bg === 'AB+' || bg === 'O-') {
      units = 4 + (seedVal % 15);  // 4 - 18 units
    } else {
      units = 2 + (seedVal % 10);  // 2 - 11 units (rare negative)
    }
    return {
      bloodGroup: bg,
      unitsAvailable: units
    };
  });
}

function convert() {
  const csvPath = path.join(__dirname, '../data/kaggle_dataset/blood-banks.csv');
  const text = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(text);

  const header = rows[0].map(h => h.trim());
  const nameIdx = header.findIndex(h => h.includes('Blood Bank Name'));
  const stateIdx = header.findIndex(h => h.includes('State'));
  const districtIdx = header.findIndex(h => h.includes('District'));
  const cityIdx = header.findIndex(h => h.includes('City'));
  const addressIdx = header.findIndex(h => h.includes('Address'));
  const pincodeIdx = header.findIndex(h => h.includes('Pincode'));
  const contactIdx = header.findIndex(h => h.includes('Contact No'));
  const mobileIdx = header.findIndex(h => h.includes('Mobile'));
  const emailIdx = header.findIndex(h => h.includes('Email'));
  const latIdx = header.findIndex(h => h.includes('Latitude'));
  const lngIdx = header.findIndex(h => h.includes('Longitude'));
  const categoryIdx = header.findIndex(h => h.includes('Category'));

  const validBloodBanks = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = r[nameIdx] ? r[nameIdx].replace(/^["']|["']$/g, '').trim() : '';
    if (!name || name.length < 3) continue;

    const lat = parseFloat(r[latIdx]);
    const lng = parseFloat(r[lngIdx]);

    // Validate India geographic bounds: Lat ~ 6°N - 38°N, Lng ~ 68°E - 98°E
    if (isNaN(lat) || isNaN(lng) || lat < 6 || lat > 38 || lng < 68 || lng > 98) {
      continue;
    }

    const state = r[stateIdx] ? r[stateIdx].trim() : 'India';
    const city = r[cityIdx] ? r[cityIdx].trim() : (r[districtIdx] ? r[districtIdx].trim() : state);
    const rawAddress = r[addressIdx] ? r[addressIdx].replace(/[\r\n]+/g, ', ').trim() : '';
    const pincode = r[pincodeIdx] ? r[pincodeIdx].trim() : '';
    const address = [rawAddress, city, state, pincode].filter(Boolean).join(', ');

    let phone = r[mobileIdx] || r[contactIdx] || '+91 1800 11 9999';
    phone = phone.replace(/[\r\n]+/g, ' ').trim();
    if (phone.length < 5 || phone.toLowerCase() === 'n/a') {
      phone = '+91 1800 11 9999';
    }

    let email = r[emailIdx] ? r[emailIdx].trim() : '';
    if (!email || !email.includes('@') || email.toLowerCase() === 'n/a') {
      const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
      email = `contact.${sanitized}@lifelink.in`;
    }

    validBloodBanks.push({
      name,
      email,
      phone,
      address,
      city,
      state,
      category: r[categoryIdx] ? r[categoryIdx].trim() : 'Certified Blood Centre',
      location: {
        type: 'Point',
        coordinates: [Number(lng.toFixed(6)), Number(lat.toFixed(6))] // [Longitude, Latitude]
      },
      verified: true,
      inventory: generateInventory(i)
    });
  }

  const outputPath = path.join(__dirname, '../data/allIndiaBloodBanks.json');
  fs.writeFileSync(outputPath, JSON.stringify(validBloodBanks, null, 2), 'utf8');

  console.log(`Successfully converted ${validBloodBanks.length} valid Indian Blood Banks to ${outputPath}`);
}

convert();

