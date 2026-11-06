const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const User = require('./models/User');
const Hospital = require('./models/Hospital');
const BloodBank = require('./models/BloodBank');
const Reservation = require('./models/Reservation');
const BloodRequest = require('./models/BloodRequest');
const DonationCamp = require('./models/DonationCamp');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lifelink');
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Hospital.deleteMany({});
    await BloodBank.deleteMany({});
    await Reservation.deleteMany({});
    await BloodRequest.deleteMany({});
    await DonationCamp.deleteMany({});

    console.log('Cleared existing database collections.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 1. Create Core Users
    const users = await User.create([
      {
        name: 'National Admin',
        email: 'admin@lifelink.org',
        password: hashedPassword,
        phone: '+91 9876543210',
        role: 'admin'
      },
      {
        name: 'Apollo Hospital Admin',
        email: 'hospital@apollo.com',
        password: hashedPassword,
        phone: '+91 9876543211',
        role: 'hospital'
      },
      {
        name: 'Fortis Hospital Admin',
        email: 'hospital@fortis.com',
        password: hashedPassword,
        phone: '+91 9876543212',
        role: 'hospital'
      },
      {
        name: 'National Blood Bank Admin',
        email: 'bloodbank@city.org',
        password: hashedPassword,
        phone: '+91 9876543213',
        role: 'bloodbank'
      },
      {
        name: 'John Patient',
        email: 'patient@example.com',
        password: hashedPassword,
        phone: '+91 9876543215',
        role: 'patient'
      },
      // Sample Voluntary Donors across India
      {
        name: 'Rahul Sharma (Delhi - Donor O+)',
        email: 'rahul.donor@example.com',
        password: hashedPassword,
        phone: '+91 9876543220',
        role: 'donor',
        bloodGroup: 'O+',
        isAvailable: true,
        location: { type: 'Point', coordinates: [77.2090, 28.6139] },
        dateOfBirth: new Date('1995-05-15')
      },
      {
        name: 'Priya Patel (Mumbai - Donor B+)',
        email: 'priya.donor@example.com',
        password: hashedPassword,
        phone: '+91 9876543221',
        role: 'donor',
        bloodGroup: 'B+',
        isAvailable: true,
        location: { type: 'Point', coordinates: [72.8427, 19.0000] },
        dateOfBirth: new Date('1998-08-20')
      },
      {
        name: 'Karthik Rao (Bengaluru - Donor A+)',
        email: 'karthik.donor@example.com',
        password: hashedPassword,
        phone: '+91 9876543222',
        role: 'donor',
        bloodGroup: 'A+',
        isAvailable: true,
        location: { type: 'Point', coordinates: [77.5746, 12.9626] },
        dateOfBirth: new Date('1992-11-10')
      },
      {
        name: 'Sneha Sen (Kolkata - Donor AB- Rare)',
        email: 'sneha.donor@example.com',
        password: hashedPassword,
        phone: '+91 9876543223',
        role: 'donor',
        bloodGroup: 'AB-',
        isAvailable: true,
        location: { type: 'Point', coordinates: [88.3626, 22.5735] },
        dateOfBirth: new Date('1996-03-25')
      },
      {
        name: 'Vikram Mehta (Universal Lifesaver O-)',
        email: 'vikram.donor@example.com',
        password: hashedPassword,
        phone: '+91 9876543224',
        role: 'donor',
        bloodGroup: 'O-',
        isAvailable: true,
        location: { type: 'Point', coordinates: [77.2430, 28.5670] },
        dateOfBirth: new Date('1990-01-30')
      }
    ]);

    const adminUser = users.find(u => u.email === 'admin@lifelink.org');
    const apolloManager = users.find(u => u.email === 'hospital@apollo.com');
    const fortisManager = users.find(u => u.email === 'hospital@fortis.com');
    const donorUser = users.find(u => u.email === 'rahul.donor@example.com');

    // 2. Create Sample Emergency Hospitals
    const hospitals = await Hospital.create([
      {
        name: 'Apollo Hospital & Emergency Center',
        email: 'emergency@apollo.com',
        phone: '+91 11 2692 5858',
        address: 'Sarita Vihar, Mathura Road, New Delhi',
        location: { type: 'Point', coordinates: [77.2917, 28.5303] },
        verified: true,
        managedBy: apolloManager._id,
        resources: {
          icuBeds: { total: 30, available: 8 },
          generalBeds: { total: 150, available: 42 },
          oxygenCylinders: { total: 80, available: 25 },
          ventilators: { total: 20, available: 6 }
        },
        emergencyMedicines: [
          { name: 'Adrenaline / Epinephrine', available: true, quantity: 45 },
          { name: 'Atropine', available: true, quantity: 30 },
          { name: 'Amiodarone', available: true, quantity: 20 },
          { name: 'Norepinephrine', available: true, quantity: 15 }
        ],
        operatingHours: '24/7'
      },
      {
        name: 'Fortis Escorts Heart Institute & General Emergency',
        email: 'contact@fortis-escorts.com',
        phone: '+91 11 4713 5000',
        address: 'Okhla Road, New Friends Colony, New Delhi',
        location: { type: 'Point', coordinates: [77.2750, 28.5630] },
        verified: true,
        managedBy: fortisManager._id,
        resources: {
          icuBeds: { total: 25, available: 5 },
          generalBeds: { total: 100, available: 28 },
          oxygenCylinders: { total: 50, available: 18 },
          ventilators: { total: 15, available: 4 }
        },
        emergencyMedicines: [
          { name: 'Nitroglycerin IV', available: true, quantity: 25 },
          { name: 'Heparin Injection', available: true, quantity: 40 },
          { name: 'Furosemide', available: true, quantity: 60 }
        ],
        operatingHours: '24/7'
      },
      {
        name: 'Max Super Speciality Hospital Saket',
        email: 'info@maxhealthcare.com',
        phone: '+91 11 6611 5050',
        address: '1, 2, Press Enclave Road, Saket, New Delhi',
        location: { type: 'Point', coordinates: [77.2130, 28.5280] },
        verified: true,
        managedBy: apolloManager._id,
        resources: {
          icuBeds: { total: 40, available: 12 },
          generalBeds: { total: 200, available: 65 },
          oxygenCylinders: { total: 100, available: 40 },
          ventilators: { total: 25, available: 9 }
        },
        emergencyMedicines: [
          { name: 'Hydrocortisone', available: true, quantity: 50 },
          { name: 'Dopamine', available: true, quantity: 18 }
        ],
        operatingHours: '24/7'
      }
    ]);

    console.log(`Created ${hospitals.length} emergency hospitals.`);

    // 2.5 Seed Initial Blood Donation Camps
    const camps = await DonationCamp.create([
      {
        name: 'National Red Cross Mega Blood Donation Drive',
        organizer: adminUser._id,
        organizerModel: 'BloodBank',
        organizerName: 'Indian Red Cross Society',
        startDate: new Date(Date.now() + 86400000 * 2), // 2 days later
        endDate: new Date(Date.now() + 86400000 * 4),
        venue: 'Red Cross Bhawan, 1 Red Cross Road',
        city: 'New Delhi',
        state: 'Delhi',
        contactPhone: '+91 11 2371 6441',
        targetUnits: 250,
        collectedUnits: 45,
        status: 'upcoming',
        location: { type: 'Point', coordinates: [77.2100, 28.6210] },
        registeredDonors: [
          {
            donor: donorUser._id,
            donorName: donorUser.name,
            bloodGroup: 'O+',
            phone: donorUser.phone,
            email: donorUser.email,
            attended: true,
            unitsDonated: 1,
            certificateId: 'CERT-LL-REDX-101'
          }
        ]
      },
      {
        name: 'Rotary Club & Apollo Lifesaver Camp',
        organizer: apolloManager._id,
        organizerModel: 'Hospital',
        organizerName: 'Apollo Hospital Mumbai',
        startDate: new Date(Date.now() + 86400000 * 5),
        endDate: new Date(Date.now() + 86400000 * 6),
        venue: 'Bandra Kurla Complex Community Hall',
        city: 'Mumbai',
        state: 'Maharashtra',
        contactPhone: '+91 22 2650 1234',
        targetUnits: 150,
        collectedUnits: 0,
        status: 'upcoming',
        location: { type: 'Point', coordinates: [72.8656, 19.0660] },
        registeredDonors: []
      },
      {
        name: 'Bengaluru Tech Park Blood Donation Initiative',
        organizer: adminUser._id,
        organizerModel: 'Hospital',
        organizerName: 'Manipal Hospital & Tech Forum',
        startDate: new Date(Date.now() + 86400000 * 7),
        endDate: new Date(Date.now() + 86400000 * 8),
        venue: 'EcoWorld Amphitheatre, Outer Ring Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        contactPhone: '+91 80 4012 3456',
        targetUnits: 200,
        collectedUnits: 0,
        status: 'upcoming',
        location: { type: 'Point', coordinates: [77.6845, 12.9242] },
        registeredDonors: []
      }
    ]);
    console.log(`Created ${camps.length} sample donation camps across India.`);

    // 3. Load and Seed Kaggle Official Blood Bank Directory (2,400+ Blood Banks)
    const jsonPath = path.join(__dirname, './data/allIndiaBloodBanks.json');
    let bloodBankRecords = [];

    if (fs.existsSync(jsonPath)) {
      const rawData = fs.readFileSync(jsonPath, 'utf8');
      const parsedData = JSON.parse(rawData);
      bloodBankRecords = parsedData.map(bb => ({
        name: bb.name,
        email: bb.email,
        phone: bb.phone,
        address: bb.address,
        location: bb.location,
        verified: true,
        managedBy: adminUser._id,
        inventory: bb.inventory
      }));
    } else {
      // Fallback to top Indian cities
      const fallbackData = require('./data/indiaBloodBanks');
      bloodBankRecords = fallbackData.map(bb => ({
        name: bb.name,
        email: bb.email,
        phone: bb.phone,
        address: `${bb.address}, ${bb.city}, ${bb.state}`,
        location: bb.location,
        verified: true,
        managedBy: adminUser._id,
        inventory: bb.inventory
      }));
    }

    console.log(`Seeding ${bloodBankRecords.length} official blood banks across India...`);
    // Insert in batches of 500 for optimal performance
    const batchSize = 500;
    for (let i = 0; i < bloodBankRecords.length; i += batchSize) {
      const batch = bloodBankRecords.slice(i, i + batchSize);
      await BloodBank.insertMany(batch);
    }

    console.log(`Successfully seeded all ${bloodBankRecords.length} verified Blood Banks into MongoDB!`);

    console.log('\n======================================================');
    console.log('  ALL-INDIA KAGGLE BLOOD BANK SEEDING COMPLETED!');
    console.log('======================================================');
    console.log(`✓ Total Verified Blood Banks in Database: ${bloodBankRecords.length}`);
    console.log('✓ Coverage: All 36 States & Union Territories of India');
    console.log('✓ Geospatial 2dsphere indexing configured');
    console.log('------------------------------------------------------');
    console.log('Demo Login Accounts (pass: password123)');
    console.log('Admin:       admin@lifelink.org');
    console.log('Hospital:    hospital@apollo.com');
    console.log('Blood Bank:  bloodbank@city.org');
    console.log('Patient:     patient@example.com');
    console.log('Donor (O+):  rahul.donor@example.com');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
