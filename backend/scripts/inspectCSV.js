const fs = require('fs');

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

const content = fs.readFileSync('c:/Users/lenovo/Downloads/VitalLink/backend/data/kaggle_dataset/blood-banks.csv', 'utf8');
const rows = parseCSV(content);

console.log('Total records parsed (including header):', rows.length);
console.log('Header columns (count =', rows[0].length, '):', rows[0]);

let validCoordCount = 0;
let invalidCoordCount = 0;
const states = new Set();

const header = rows[0].map(h => h.trim());
const nameIdx = header.findIndex(h => h.includes('Blood Bank Name'));
const stateIdx = header.findIndex(h => h.includes('State'));
const cityIdx = header.findIndex(h => h.includes('City'));
const addressIdx = header.findIndex(h => h.includes('Address'));
const contactIdx = header.findIndex(h => h.includes('Contact No'));
const mobileIdx = header.findIndex(h => h.includes('Mobile'));
const emailIdx = header.findIndex(h => h.includes('Email'));
const latIdx = header.findIndex(h => h.includes('Latitude'));
const lngIdx = header.findIndex(h => h.includes('Longitude'));

console.log('Indices:', { nameIdx, stateIdx, cityIdx, addressIdx, contactIdx, mobileIdx, emailIdx, latIdx, lngIdx });

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const state = r[stateIdx];
  if (state) states.add(state);

  const lat = parseFloat(r[latIdx]);
  const lng = parseFloat(r[lngIdx]);

  // Check if valid coordinates in/near India
  if (!isNaN(lat) && !isNaN(lng) && lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98) {
    validCoordCount++;
  } else {
    invalidCoordCount++;
  }
}

console.log('Valid India Coordinates Count:', validCoordCount);
console.log('Invalid/Missing Coordinates Count:', invalidCoordCount);
console.log('States Found (count =', states.size, '):', Array.from(states).sort());

