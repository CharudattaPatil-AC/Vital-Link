/**
 * Verified Blood Banks across all regions of India
 * Coordinates: [Longitude, Latitude] (GeoJSON standard)
 */

const indiaBloodBanks = [
  // --- 1. Delhi & NCR ---
  {
    name: 'AIIMS Main Blood Centre',
    email: 'bloodcentre@aiims.edu',
    phone: '+91 11 2658 8500',
    address: 'Ansari Nagar, Sri Aurobindo Marg, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    location: { type: 'Point', coordinates: [77.2100, 28.5672] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 42 },
      { bloodGroup: 'A-', unitsAvailable: 11 },
      { bloodGroup: 'B+', unitsAvailable: 55 },
      { bloodGroup: 'B-', unitsAvailable: 14 },
      { bloodGroup: 'AB+', unitsAvailable: 20 },
      { bloodGroup: 'AB-', unitsAvailable: 6 },
      { bloodGroup: 'O+', unitsAvailable: 68 },
      { bloodGroup: 'O-', unitsAvailable: 18 }
    ]
  },
  {
    name: 'Indian Red Cross Society National Headquarters Blood Centre',
    email: 'blood@redcrossdelhi.org',
    phone: '+91 11 2371 6441',
    address: '1 Red Cross Road, Parliament Street, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    location: { type: 'Point', coordinates: [77.2085, 28.6210] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 35 },
      { bloodGroup: 'A-', unitsAvailable: 8 },
      { bloodGroup: 'B+', unitsAvailable: 40 },
      { bloodGroup: 'B-', unitsAvailable: 10 },
      { bloodGroup: 'AB+', unitsAvailable: 16 },
      { bloodGroup: 'AB-', unitsAvailable: 4 },
      { bloodGroup: 'O+', unitsAvailable: 50 },
      { bloodGroup: 'O-', unitsAvailable: 14 }
    ]
  },
  {
    name: 'Rotary Blood Bank Tughlakabad',
    email: 'info@rotarybloodbank.org',
    phone: '+91 11 2605 9898',
    address: '56-57, Tughlakabad Institutional Area, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    location: { type: 'Point', coordinates: [77.2721, 28.5135] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 28 },
      { bloodGroup: 'A-', unitsAvailable: 6 },
      { bloodGroup: 'B+', unitsAvailable: 32 },
      { bloodGroup: 'B-', unitsAvailable: 7 },
      { bloodGroup: 'AB+', unitsAvailable: 12 },
      { bloodGroup: 'AB-', unitsAvailable: 3 },
      { bloodGroup: 'O+', unitsAvailable: 38 },
      { bloodGroup: 'O-', unitsAvailable: 9 }
    ]
  },

  // --- 2. Mumbai & Western Maharashtra ---
  {
    name: 'KEM Hospital Blood Centre',
    email: 'bloodbank@kem.edu',
    phone: '+91 22 2410 7000',
    address: 'Acharya Donde Marg, Parel, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    location: { type: 'Point', coordinates: [72.8427, 18.9996] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 38 },
      { bloodGroup: 'A-', unitsAvailable: 9 },
      { bloodGroup: 'B+', unitsAvailable: 48 },
      { bloodGroup: 'B-', unitsAvailable: 12 },
      { bloodGroup: 'AB+', unitsAvailable: 18 },
      { bloodGroup: 'AB-', unitsAvailable: 5 },
      { bloodGroup: 'O+', unitsAvailable: 60 },
      { bloodGroup: 'O-', unitsAvailable: 15 }
    ]
  },
  {
    name: 'Tata Memorial Hospital Blood Centre',
    email: 'transfusion@tmc.gov.in',
    phone: '+91 22 2417 7000',
    address: 'Dr. Ernest Borges Marg, Parel, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    location: { type: 'Point', coordinates: [72.8436, 19.0044] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 45 },
      { bloodGroup: 'A-', unitsAvailable: 12 },
      { bloodGroup: 'B+', unitsAvailable: 50 },
      { bloodGroup: 'B-', unitsAvailable: 15 },
      { bloodGroup: 'AB+', unitsAvailable: 22 },
      { bloodGroup: 'AB-', unitsAvailable: 7 },
      { bloodGroup: 'O+', unitsAvailable: 70 },
      { bloodGroup: 'O-', unitsAvailable: 20 }
    ]
  },
  {
    name: 'Samarpan Blood Centre Ghatkopar',
    email: 'samarpan@bloodcentre.org',
    phone: '+91 22 2511 2000',
    address: 'RB Kadam Marg, Ghatkopar East, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    location: { type: 'Point', coordinates: [72.9090, 19.0863] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 24 },
      { bloodGroup: 'A-', unitsAvailable: 5 },
      { bloodGroup: 'B+', unitsAvailable: 30 },
      { bloodGroup: 'B-', unitsAvailable: 8 },
      { bloodGroup: 'AB+', unitsAvailable: 10 },
      { bloodGroup: 'AB-', unitsAvailable: 2 },
      { bloodGroup: 'O+', unitsAvailable: 36 },
      { bloodGroup: 'O-', unitsAvailable: 8 }
    ]
  },

  // --- 3. Bengaluru (Karnataka) ---
  {
    name: 'Victoria Hospital & Bangalore Medical College Blood Bank',
    email: 'bloodbank@bmcri.edu.in',
    phone: '+91 80 2670 1150',
    address: 'Fort Road, Near City Market, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    location: { type: 'Point', coordinates: [77.5746, 12.9626] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 32 },
      { bloodGroup: 'A-', unitsAvailable: 7 },
      { bloodGroup: 'B+', unitsAvailable: 44 },
      { bloodGroup: 'B-', unitsAvailable: 11 },
      { bloodGroup: 'AB+', unitsAvailable: 15 },
      { bloodGroup: 'AB-', unitsAvailable: 4 },
      { bloodGroup: 'O+', unitsAvailable: 52 },
      { bloodGroup: 'O-', unitsAvailable: 12 }
    ]
  },
  {
    name: 'Rashtrotthana Blood Centre',
    email: 'bloodcentre@rashtrotthana.org',
    phone: '+91 80 2661 2737',
    address: 'Bull Temple Road, Gavipuram Guttahalli, Kempegowda Nagar, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    location: { type: 'Point', coordinates: [77.5614, 12.9463] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 40 },
      { bloodGroup: 'A-', unitsAvailable: 10 },
      { bloodGroup: 'B+', unitsAvailable: 46 },
      { bloodGroup: 'B-', unitsAvailable: 12 },
      { bloodGroup: 'AB+', unitsAvailable: 18 },
      { bloodGroup: 'AB-', unitsAvailable: 5 },
      { bloodGroup: 'O+', unitsAvailable: 58 },
      { bloodGroup: 'O-', unitsAvailable: 16 }
    ]
  },
  {
    name: 'Narayana Institute of Cardiac Sciences Blood Centre',
    email: 'bloodbank@narayanahealth.org',
    phone: '+91 80 7122 2222',
    address: '258/A, Bommasandra Industrial Area, Anekal Taluk, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    location: { type: 'Point', coordinates: [77.6917, 12.8122] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 35 },
      { bloodGroup: 'A-', unitsAvailable: 9 },
      { bloodGroup: 'B+', unitsAvailable: 42 },
      { bloodGroup: 'B-', unitsAvailable: 10 },
      { bloodGroup: 'AB+', unitsAvailable: 14 },
      { bloodGroup: 'AB-', unitsAvailable: 4 },
      { bloodGroup: 'O+', unitsAvailable: 48 },
      { bloodGroup: 'O-', unitsAvailable: 14 }
    ]
  },

  // --- 4. Chennai (Tamil Nadu) ---
  {
    name: 'Rajiv Gandhi Government General Hospital Blood Bank',
    email: 'bloodbank@rggh.tn.gov.in',
    phone: '+91 44 2530 5000',
    address: 'EVR Periyar Salai, Park Town, Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    location: { type: 'Point', coordinates: [80.2785, 13.0805] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 36 },
      { bloodGroup: 'A-', unitsAvailable: 8 },
      { bloodGroup: 'B+', unitsAvailable: 45 },
      { bloodGroup: 'B-', unitsAvailable: 10 },
      { bloodGroup: 'AB+', unitsAvailable: 17 },
      { bloodGroup: 'AB-', unitsAvailable: 4 },
      { bloodGroup: 'O+', unitsAvailable: 55 },
      { bloodGroup: 'O-', unitsAvailable: 13 }
    ]
  },
  {
    name: 'Voluntary Health Services (VHS) Blood Bank',
    email: 'bloodbank@vhschennai.org',
    phone: '+91 44 2254 1972',
    address: 'Rajiv Gandhi Salai, TTRampani, Taramani, Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    location: { type: 'Point', coordinates: [80.2443, 12.9866] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 26 },
      { bloodGroup: 'A-', unitsAvailable: 6 },
      { bloodGroup: 'B+', unitsAvailable: 34 },
      { bloodGroup: 'B-', unitsAvailable: 8 },
      { bloodGroup: 'AB+', unitsAvailable: 12 },
      { bloodGroup: 'AB-', unitsAvailable: 3 },
      { bloodGroup: 'O+', unitsAvailable: 40 },
      { bloodGroup: 'O-', unitsAvailable: 10 }
    ]
  },

  // --- 5. Kolkata (West Bengal) ---
  {
    name: 'Central Blood Bank Kolkata',
    email: 'centralbloodbank@wbhealth.gov.in',
    phone: '+91 33 2351 0619',
    address: '205, Vivekananda Road, Maniktala, Kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    location: { type: 'Point', coordinates: [88.3756, 22.5855] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 48 },
      { bloodGroup: 'A-', unitsAvailable: 12 },
      { bloodGroup: 'B+', unitsAvailable: 58 },
      { bloodGroup: 'B-', unitsAvailable: 15 },
      { bloodGroup: 'AB+', unitsAvailable: 22 },
      { bloodGroup: 'AB-', unitsAvailable: 6 },
      { bloodGroup: 'O+', unitsAvailable: 72 },
      { bloodGroup: 'O-', unitsAvailable: 18 }
    ]
  },
  {
    name: 'Medical College & Hospital Blood Bank',
    email: 'bloodbank@medicalcollegekolkata.in',
    phone: '+91 33 2255 1600',
    address: '88, College Street, Bowbazar, Kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    location: { type: 'Point', coordinates: [88.3626, 22.5735] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 30 },
      { bloodGroup: 'A-', unitsAvailable: 7 },
      { bloodGroup: 'B+', unitsAvailable: 38 },
      { bloodGroup: 'B-', unitsAvailable: 9 },
      { bloodGroup: 'AB+', unitsAvailable: 14 },
      { bloodGroup: 'AB-', unitsAvailable: 3 },
      { bloodGroup: 'O+', unitsAvailable: 46 },
      { bloodGroup: 'O-', unitsAvailable: 11 }
    ]
  },

  // --- 6. Hyderabad (Telangana) ---
  {
    name: 'Osmania General Hospital Blood Bank',
    email: 'bloodbank@osmania.ac.in',
    phone: '+91 40 2460 0121',
    address: 'Afzal Gunj, Begum Bazar, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    location: { type: 'Point', coordinates: [78.4744, 17.3753] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 35 },
      { bloodGroup: 'A-', unitsAvailable: 9 },
      { bloodGroup: 'B+', unitsAvailable: 44 },
      { bloodGroup: 'B-', unitsAvailable: 11 },
      { bloodGroup: 'AB+', unitsAvailable: 16 },
      { bloodGroup: 'AB-', unitsAvailable: 4 },
      { bloodGroup: 'O+', unitsAvailable: 54 },
      { bloodGroup: 'O-', unitsAvailable: 14 }
    ]
  },
  {
    name: 'Chiranjeevi Blood Bank & Eye Centre',
    email: 'help@chiranjeevicharitabletrust.org',
    phone: '+91 40 2355 5005',
    address: 'Road No. 1, Jubilee Hills, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    location: { type: 'Point', coordinates: [78.4069, 17.4325] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 42 },
      { bloodGroup: 'A-', unitsAvailable: 10 },
      { bloodGroup: 'B+', unitsAvailable: 50 },
      { bloodGroup: 'B-', unitsAvailable: 13 },
      { bloodGroup: 'AB+', unitsAvailable: 20 },
      { bloodGroup: 'AB-', unitsAvailable: 5 },
      { bloodGroup: 'O+', unitsAvailable: 64 },
      { bloodGroup: 'O-', unitsAvailable: 16 }
    ]
  },

  // --- 7. Ahmedabad (Gujarat) ---
  {
    name: 'Prathama Blood Centre',
    email: 'contact@prathama.org',
    phone: '+91 79 2660 0101',
    address: 'Dr. C.V. Raman Marg, Vasna, Ahmedabad',
    city: 'Ahmedabad',
    state: 'Gujarat',
    location: { type: 'Point', coordinates: [72.5463, 23.0035] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 36 },
      { bloodGroup: 'A-', unitsAvailable: 8 },
      { bloodGroup: 'B+', unitsAvailable: 46 },
      { bloodGroup: 'B-', unitsAvailable: 12 },
      { bloodGroup: 'AB+', unitsAvailable: 16 },
      { bloodGroup: 'AB-', unitsAvailable: 4 },
      { bloodGroup: 'O+', unitsAvailable: 52 },
      { bloodGroup: 'O-', unitsAvailable: 13 }
    ]
  },
  {
    name: 'Civil Hospital Blood Bank Ahmedabad',
    email: 'bloodbank@civilhospahd.org',
    phone: '+91 79 2268 0074',
    address: 'Asarwa, Near Meghaninagar, Ahmedabad',
    city: 'Ahmedabad',
    state: 'Gujarat',
    location: { type: 'Point', coordinates: [72.6033, 23.0525] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 40 },
      { bloodGroup: 'A-', unitsAvailable: 9 },
      { bloodGroup: 'B+', unitsAvailable: 50 },
      { bloodGroup: 'B-', unitsAvailable: 14 },
      { bloodGroup: 'AB+', unitsAvailable: 18 },
      { bloodGroup: 'AB-', unitsAvailable: 5 },
      { bloodGroup: 'O+', unitsAvailable: 62 },
      { bloodGroup: 'O-', unitsAvailable: 15 }
    ]
  },

  // --- 8. Pune (Maharashtra) ---
  {
    name: 'Janakalyan Raktakendra Pune',
    email: 'info@janakalyanraktakendra.org',
    phone: '+91 20 2444 4959',
    address: 'Sarasbaug Road, Shukrawar Peth, Pune',
    city: 'Pune',
    state: 'Maharashtra',
    location: { type: 'Point', coordinates: [73.8542, 18.5028] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 34 },
      { bloodGroup: 'A-', unitsAvailable: 7 },
      { bloodGroup: 'B+', unitsAvailable: 42 },
      { bloodGroup: 'B-', unitsAvailable: 10 },
      { bloodGroup: 'AB+', unitsAvailable: 15 },
      { bloodGroup: 'AB-', unitsAvailable: 4 },
      { bloodGroup: 'O+', unitsAvailable: 50 },
      { bloodGroup: 'O-', unitsAvailable: 12 }
    ]
  },
  {
    name: 'Sassoon General Hospital Blood Bank',
    email: 'bloodbank@bjmc.edu',
    phone: '+91 20 2612 8000',
    address: 'Near Pune Railway Station, Sassoon Road, Pune',
    city: 'Pune',
    state: 'Maharashtra',
    location: { type: 'Point', coordinates: [73.8732, 18.5284] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 28 },
      { bloodGroup: 'A-', unitsAvailable: 6 },
      { bloodGroup: 'B+', unitsAvailable: 36 },
      { bloodGroup: 'B-', unitsAvailable: 8 },
      { bloodGroup: 'AB+', unitsAvailable: 13 },
      { bloodGroup: 'AB-', unitsAvailable: 3 },
      { bloodGroup: 'O+', unitsAvailable: 44 },
      { bloodGroup: 'O-', unitsAvailable: 11 }
    ]
  },

  // --- 9. Jaipur (Rajasthan) ---
  {
    name: 'SMS Medical College & Hospital Blood Bank',
    email: 'bloodbank@smsjaipur.org',
    phone: '+91 141 251 8243',
    address: 'Jawahar Lal Nehru Marg, Ashok Nagar, Jaipur',
    city: 'Jaipur',
    state: 'Rajasthan',
    location: { type: 'Point', coordinates: [75.8185, 26.8917] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 38 },
      { bloodGroup: 'A-', unitsAvailable: 8 },
      { bloodGroup: 'B+', unitsAvailable: 48 },
      { bloodGroup: 'B-', unitsAvailable: 12 },
      { bloodGroup: 'AB+', unitsAvailable: 18 },
      { bloodGroup: 'AB-', unitsAvailable: 4 },
      { bloodGroup: 'O+', unitsAvailable: 56 },
      { bloodGroup: 'O-', unitsAvailable: 14 }
    ]
  },
  {
    name: 'Swasthya Kalyan Blood Bank',
    email: 'info@swasthyakalyan.org',
    phone: '+91 141 277 1777',
    address: 'RIICO Institutional Area, Sitapura, Jaipur',
    city: 'Jaipur',
    state: 'Rajasthan',
    location: { type: 'Point', coordinates: [75.8340, 26.7820] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 22 },
      { bloodGroup: 'A-', unitsAvailable: 5 },
      { bloodGroup: 'B+', unitsAvailable: 30 },
      { bloodGroup: 'B-', unitsAvailable: 7 },
      { bloodGroup: 'AB+', unitsAvailable: 10 },
      { bloodGroup: 'AB-', unitsAvailable: 2 },
      { bloodGroup: 'O+', unitsAvailable: 36 },
      { bloodGroup: 'O-', unitsAvailable: 8 }
    ]
  },

  // --- 10. Lucknow (Uttar Pradesh) ---
  {
    name: 'KGMU Shatabdi Blood Centre',
    email: 'transfusion@kgmcindia.edu',
    phone: '+91 522 225 7540',
    address: 'Shah Mina Road, Chowk, Lucknow',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    location: { type: 'Point', coordinates: [80.9158, 26.8690] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 42 },
      { bloodGroup: 'A-', unitsAvailable: 10 },
      { bloodGroup: 'B+', unitsAvailable: 52 },
      { bloodGroup: 'B-', unitsAvailable: 14 },
      { bloodGroup: 'AB+', unitsAvailable: 20 },
      { bloodGroup: 'AB-', unitsAvailable: 5 },
      { bloodGroup: 'O+', unitsAvailable: 65 },
      { bloodGroup: 'O-', unitsAvailable: 16 }
    ]
  },
  {
    name: 'SGPGIMS Department of Transfusion Medicine',
    email: 'bloodbank@sgpgi.ac.in',
    phone: '+91 522 266 8700',
    address: 'Raebareli Road, Lucknow',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    location: { type: 'Point', coordinates: [80.9385, 26.7458] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 36 },
      { bloodGroup: 'A-', unitsAvailable: 8 },
      { bloodGroup: 'B+', unitsAvailable: 44 },
      { bloodGroup: 'B-', unitsAvailable: 11 },
      { bloodGroup: 'AB+', unitsAvailable: 17 },
      { bloodGroup: 'AB-', unitsAvailable: 4 },
      { bloodGroup: 'O+', unitsAvailable: 54 },
      { bloodGroup: 'O-', unitsAvailable: 13 }
    ]
  },

  // --- 11. Chandigarh (Punjab / Haryana) ---
  {
    name: 'PGIMER Department of Transfusion Medicine',
    email: 'bloodbank@pgimer.edu.in',
    phone: '+91 172 275 6480',
    address: 'Sector 12, Chandigarh',
    city: 'Chandigarh',
    state: 'Chandigarh',
    location: { type: 'Point', coordinates: [76.7758, 30.7650] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 40 },
      { bloodGroup: 'A-', unitsAvailable: 9 },
      { bloodGroup: 'B+', unitsAvailable: 50 },
      { bloodGroup: 'B-', unitsAvailable: 13 },
      { bloodGroup: 'AB+', unitsAvailable: 19 },
      { bloodGroup: 'AB-', unitsAvailable: 5 },
      { bloodGroup: 'O+', unitsAvailable: 60 },
      { bloodGroup: 'O-', unitsAvailable: 15 }
    ]
  },
  {
    name: 'Rotary Blood Bank Resource Centre Chandigarh',
    email: 'rotarybloodchd@gmail.com',
    phone: '+91 172 269 3131',
    address: 'Sector 37-A, Chandigarh',
    city: 'Chandigarh',
    state: 'Chandigarh',
    location: { type: 'Point', coordinates: [76.7480, 30.7420] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 25 },
      { bloodGroup: 'A-', unitsAvailable: 6 },
      { bloodGroup: 'B+', unitsAvailable: 32 },
      { bloodGroup: 'B-', unitsAvailable: 8 },
      { bloodGroup: 'AB+', unitsAvailable: 12 },
      { bloodGroup: 'AB-', unitsAvailable: 3 },
      { bloodGroup: 'O+', unitsAvailable: 40 },
      { bloodGroup: 'O-', unitsAvailable: 10 }
    ]
  },

  // --- 12. Kochi & Ernakulam (Kerala) ---
  {
    name: 'Ernakulam General Hospital Blood Bank',
    email: 'bloodbank@ghekla.kerala.gov.in',
    phone: '+91 484 236 0052',
    address: 'Hospital Road, Marine Drive, Kochi',
    city: 'Kochi',
    state: 'Kerala',
    location: { type: 'Point', coordinates: [76.2798, 9.9796] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 30 },
      { bloodGroup: 'A-', unitsAvailable: 7 },
      { bloodGroup: 'B+', unitsAvailable: 38 },
      { bloodGroup: 'B-', unitsAvailable: 9 },
      { bloodGroup: 'AB+', unitsAvailable: 14 },
      { bloodGroup: 'AB-', unitsAvailable: 3 },
      { bloodGroup: 'O+', unitsAvailable: 48 },
      { bloodGroup: 'O-', unitsAvailable: 12 }
    ]
  },
  {
    name: 'Amrita Institute of Medical Sciences Blood Centre',
    email: 'transfusion@aims.amrita.edu',
    phone: '+91 484 285 1234',
    address: 'AIMS Ponekkara P.O., Edappally, Kochi',
    city: 'Kochi',
    state: 'Kerala',
    location: { type: 'Point', coordinates: [76.2917, 10.0326] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 35 },
      { bloodGroup: 'A-', unitsAvailable: 8 },
      { bloodGroup: 'B+', unitsAvailable: 42 },
      { bloodGroup: 'B-', unitsAvailable: 10 },
      { bloodGroup: 'AB+', unitsAvailable: 16 },
      { bloodGroup: 'AB-', unitsAvailable: 4 },
      { bloodGroup: 'O+', unitsAvailable: 52 },
      { bloodGroup: 'O-', unitsAvailable: 14 }
    ]
  },

  // --- 13. Bhopal & Indore (Madhya Pradesh) ---
  {
    name: 'AIIMS Bhopal Department of Transfusion Medicine',
    email: 'bloodbank@aiimsbhopal.edu.in',
    phone: '+91 755 267 2320',
    address: 'Saket Nagar, Habibganj, Bhopal',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    location: { type: 'Point', coordinates: [77.4578, 23.2080] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 32 },
      { bloodGroup: 'A-', unitsAvailable: 7 },
      { bloodGroup: 'B+', unitsAvailable: 40 },
      { bloodGroup: 'B-', unitsAvailable: 9 },
      { bloodGroup: 'AB+', unitsAvailable: 15 },
      { bloodGroup: 'AB-', unitsAvailable: 3 },
      { bloodGroup: 'O+', unitsAvailable: 48 },
      { bloodGroup: 'O-', unitsAvailable: 12 }
    ]
  },
  {
    name: 'Maharaja Yeshwantrao (MY) Hospital Model Blood Bank',
    email: 'bloodbank@mgm.edu.in',
    phone: '+91 731 252 7383',
    address: 'MY Hospital Road, Chhavani, Indore',
    city: 'Indore',
    state: 'Madhya Pradesh',
    location: { type: 'Point', coordinates: [75.8750, 22.7150] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 30 },
      { bloodGroup: 'A-', unitsAvailable: 6 },
      { bloodGroup: 'B+', unitsAvailable: 38 },
      { bloodGroup: 'B-', unitsAvailable: 9 },
      { bloodGroup: 'AB+', unitsAvailable: 14 },
      { bloodGroup: 'AB-', unitsAvailable: 3 },
      { bloodGroup: 'O+', unitsAvailable: 46 },
      { bloodGroup: 'O-', unitsAvailable: 11 }
    ]
  },

  // --- 14. Guwahati (Assam / North East) ---
  {
    name: 'Gauhati Medical College Hospital Blood Centre',
    email: 'gmchbloodbank@gmail.com',
    phone: '+91 361 252 9457',
    address: 'Narakasur Hilltop, Bhangagarh, Guwahati',
    city: 'Guwahati',
    state: 'Assam',
    location: { type: 'Point', coordinates: [91.7725, 26.1558] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 28 },
      { bloodGroup: 'A-', unitsAvailable: 6 },
      { bloodGroup: 'B+', unitsAvailable: 36 },
      { bloodGroup: 'B-', unitsAvailable: 8 },
      { bloodGroup: 'AB+', unitsAvailable: 13 },
      { bloodGroup: 'AB-', unitsAvailable: 3 },
      { bloodGroup: 'O+', unitsAvailable: 44 },
      { bloodGroup: 'O-', unitsAvailable: 10 }
    ]
  },

  // --- 15. Patna (Bihar) ---
  {
    name: 'AIIMS Patna Blood Transfusion Centre',
    email: 'bloodbank@aiimspatna.org',
    phone: '+91 612 245 1070',
    address: 'Phulwari Sharif, Patna',
    city: 'Patna',
    state: 'Bihar',
    location: { type: 'Point', coordinates: [85.0425, 25.5605] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 34 },
      { bloodGroup: 'A-', unitsAvailable: 7 },
      { bloodGroup: 'B+', unitsAvailable: 42 },
      { bloodGroup: 'B-', unitsAvailable: 10 },
      { bloodGroup: 'AB+', unitsAvailable: 15 },
      { bloodGroup: 'AB-', unitsAvailable: 4 },
      { bloodGroup: 'O+', unitsAvailable: 50 },
      { bloodGroup: 'O-', unitsAvailable: 12 }
    ]
  },

  // --- 16. Bhubaneswar (Odisha) ---
  {
    name: 'AIIMS Bhubaneswar Blood Centre',
    email: 'transfusion@aiimsbhubaneswar.edu.in',
    phone: '+91 674 247 6789',
    address: 'Sijua, Patrapada, Bhubaneswar',
    city: 'Bhubaneswar',
    state: 'Odisha',
    location: { type: 'Point', coordinates: [85.7760, 20.2310] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 32 },
      { bloodGroup: 'A-', unitsAvailable: 7 },
      { bloodGroup: 'B+', unitsAvailable: 40 },
      { bloodGroup: 'B-', unitsAvailable: 9 },
      { bloodGroup: 'AB+', unitsAvailable: 14 },
      { bloodGroup: 'AB-', unitsAvailable: 3 },
      { bloodGroup: 'O+', unitsAvailable: 48 },
      { bloodGroup: 'O-', unitsAvailable: 11 }
    ]
  },

  // --- 17. Varanasi (Uttar Pradesh) ---
  {
    name: 'Sir Sunderlal Hospital (BHU) Blood Bank',
    email: 'bloodbank@bhu.ac.in',
    phone: '+91 542 230 7500',
    address: 'Banaras Hindu University Campus, Varanasi',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    location: { type: 'Point', coordinates: [82.9990, 25.2675] },
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 28 },
      { bloodGroup: 'A-', unitsAvailable: 6 },
      { bloodGroup: 'B+', unitsAvailable: 35 },
      { bloodGroup: 'B-', unitsAvailable: 8 },
      { bloodGroup: 'AB+', unitsAvailable: 12 },
      { bloodGroup: 'AB-', unitsAvailable: 3 },
      { bloodGroup: 'O+', unitsAvailable: 42 },
      { bloodGroup: 'O-', unitsAvailable: 10 }
    ]
  }
];

module.exports = indiaBloodBanks;

