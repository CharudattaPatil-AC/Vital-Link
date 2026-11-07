# LifeLink – Emergency Healthcare Resource & Rare Blood Matching Network

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-green.svg)](https://mongodb.com)
[![Socket.IO](https://img.shields.io/badge/RealTime-Socket.IO-black.svg)](https://socket.io)
[![Kaggle Verified Data](https://img.shields.io/badge/Dataset-2%2C439%20Blood%20Banks-red.svg)](https://kaggle.com)
[![Geospatial](https://img.shields.io/badge/Spatial-MongoDB%202dsphere-blue.svg)](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-geospatial/)
[![Documentation Sync](https://img.shields.io/badge/Docs-Automated%20Sync%20Verified-success.svg)](#-documentation-synchronization)

LifeLink is a centralized, real-time emergency healthcare resource coordination and rare blood matching platform designed to solve the critical "Golden Hour" bottleneck during medical emergencies. It provides instant visibility into life-saving resources (ICU beds, oxygen cylinders, ventilators, emergency medicines, and blood units) across India, connecting patients, hospitals, certified blood banks, and voluntary donors in real time.

---

## 📑 Table of Contents
1. [System Architecture Flowchart](#-system-architecture-flowchart)
2. [End-to-End Operational Flowcharts](#-end-to-end-operational-flowcharts)
   - [A. Emergency Resource Reservation Workflow](#a-emergency-resource-reservation-workflow)
   - [B. Smart 4-Tier Universal Blood Compatibility Engine](#b-smart-4-tier-universal-blood-compatibility-engine)
3. [Key Features Overview](#-key-features-overview)
4. [Complete Project Directory Structure](#-complete-project-directory-structure)
5. [Database Schemas & Data Models](#-database-schemas--data-models)
6. [REST API Endpoints Reference](#-rest-api-endpoints-reference)
7. [Real-Time WebSocket Events Reference](#-real-time-websocket-events-reference)
8. [Technology Stack](#-technology-stack)
9. [Installation & Quickstart Guide](#-installation--quickstart-guide)
10. [MongoDB Compass Setup & Exploration](#-mongodb-compass-setup--exploration)
11. [Demo Accounts & Role Access Matrix](#-demo-accounts--role-access-matrix)
12. [Documentation Synchronization](#-documentation-synchronization)

---

## 🏛️ System Architecture Flowchart

```mermaid
flowchart TD
    subgraph ClientLayer["🖥️ Frontend Client (React 18 + Vite + Bootstrap 5)"]
        UI_Home["Landing & Alert Portal"]
        UI_Search["Geospatial Discovery (Hospitals & Blood Banks)"]
        UI_DualMap["Dual Map Switcher (Leaflet OSM & Google Maps)"]
        UI_Dashboards["Role Dashboards (Patient / Hospital / BloodBank / Donor / Admin)"]
    end

    subgraph APILayer["⚙️ Backend Application Server (Node.js + Express.js)"]
        Router["Express REST Router (/api)"]
        AuthMiddleware["JWT Auth & Role-Based RBAC Guards"]
        CompatEngine["Universal Blood Compatibility Engine (WHO Transfusion Rules)"]
        SocketServer["Socket.IO Real-Time Dispatch Server"]
        CleanupDaemon["60-Second Auto-Restock Expiration Daemon"]
    end

    subgraph DataLayer["💾 Persistence & Geospatial Indexing (MongoDB)"]
        DB_Users[("Users Collection")]
        DB_Hospitals[("Hospitals Collection (2dsphere)")]
        DB_BloodBanks[("Blood Banks Collection (2,439 Verified Kaggle Centers)")]
        DB_Reservations[("Reservations Collection (Atomic Operations)")]
        DB_BloodRequests[("Blood Requests Collection (Tiered Broadcast)")]
    end

    subgraph ExternalServices["🌐 External Services & Datasets"]
        Kaggle["Kaggle National Blood Bank Dataset (India)"]
        GMaps["Google Maps Platform (Turn-by-Turn GPS Navigation)"]
        OSM["OpenStreetMap & Leaflet Tiles (No-Key Fallback)"]
    end

    %% Connections
    ClientLayer <-->|"REST API (Axios + Session Tokens)"| Router
    ClientLayer <-->|"Bi-directional WebSockets (ws://)"| SocketServer
    Router --> AuthMiddleware
    AuthMiddleware --> CompatEngine
    CompatEngine --> DB_BloodBanks
    CompatEngine --> DB_Users
    Router --> DataLayer
    CleanupDaemon -->|"Periodic 60s Check & Restock"| DB_Reservations
    CleanupDaemon -.->|"Restock Broadcast"| SocketServer
    Kaggle -->|"One-time ETL / Seeding"| DB_BloodBanks
    UI_DualMap --> GMaps
    UI_DualMap --> OSM
```

---

## 🔄 End-to-End Operational Flowcharts

### A. Emergency Resource Reservation Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Patient as 🚑 Patient / Attendant
    participant Frontend as 💻 LifeLink React UI
    participant Backend as ⚙️ Express Backend API
    participant MongoDB as 💾 MongoDB Database
    participant Daemon as ⏱️ Auto-Restock Daemon
    actor Triage as 🏥 Hospital Triage Desk

    Patient->>Frontend: Search nearby emergency facilities (GPS coordinates)
    Frontend->>Backend: GET /api/hospitals?lat=...&lng=...&radius=25000
    Backend->>MongoDB: Geospatial $near query (2dsphere)
    MongoDB-->>Backend: Sorted facilities by closest proximity
    Backend-->>Frontend: Return list of hospitals with live bed/O2 stock

    Patient->>Frontend: Click "Reserve Resource" (e.g. 1x ICU Bed)
    Frontend->>Backend: POST /api/reservations (resource: 'icuBeds', qty: 1)
    Note over Backend,MongoDB: Atomic findOneAndUpdate check (stock >= 1)
    Backend->>MongoDB: Deduct 1 bed & insert Reservation (expiresAt: now + 60 min)
    Backend-->>Frontend: Reservation Confirmed (Token #ABC12345)

    alt Patient arrives within 60 minutes
        Patient->>Triage: Present Reservation Token at admission desk
        Triage->>Backend: PUT /api/reservations/:id/confirm
        Backend->>MongoDB: Status -> "admitted"
        Backend-->>Triage: Patient Admitted
    else Timer expires (No arrival in 60 minutes)
        Daemon->>MongoDB: Find expired reservations (status: 'active' AND expiresAt < now)
        Daemon->>MongoDB: Restore 1x ICU Bed to hospital inventory & mark 'expired'
        Daemon-->>Frontend: Emit Socket.IO 'inventoryUpdate' event
    end
```

---

### B. Smart 4-Tier Universal Blood Compatibility Engine

```mermaid
flowchart TD
    Start["🚨 Emergency Blood Request Initiated (e.g., Patient Blood Group: B+)"] --> Matrix["Medical Transfusion Compatibility Matrix (WHO / Red Cross)"]

    Matrix --> Tier1["Tier 1: Exact Match\n(Identical: B+)"]
    Matrix --> Tier2["Tier 2: Compatible Same Group / Rh- Sibling\n(Compatible: B-)"]
    Matrix --> Tier3["Tier 3: Universal Rh+ Donor\n(Compatible: O+)"]
    Matrix --> Tier4["Tier 4: Universal Lifesaver Reserve\n(Protected Emergency Reserve: O-)"]

    Tier1 --> ColdStorageCheck["Check 2,439 Blood Banks Cold Storage"]
    Tier2 --> ColdStorageCheck
    Tier3 --> ColdStorageCheck
    Tier4 --> ColdStorageCheck

    ColdStorageCheck -->|"Units Found"| ReserveUnits["Instant 60-Minute Cold Storage Reservation"]
    ColdStorageCheck -->|"Insufficient Units"| DonorQuery["Simultaneous Spatial Donor Dispatch (MongoDB 2dsphere)"]

    DonorQuery --> FilterGuards{"Medical Safety Guards"}
    FilterGuards -->|"Age: 18 - 65"| CheckCooldown{"90-Day Donation Cooldown"}
    FilterGuards -->|"Ineligible"| ExcludeDonor["Excluded"]
    CheckCooldown -->|"Passed (> 90 days)"| ActiveStatus{"Is Available?"}
    CheckCooldown -->|"Failed (< 90 days)"| ExcludeDonor
    ActiveStatus -->|"Yes"| SocketPush["⚡ Real-Time Socket.IO Alert Push to Donor Devices"]
    ActiveStatus -->|"No"| ExcludeDonor

    SocketPush --> DonorDecision{"Donor Response"}
    DonorDecision -->|"Accepts"| NotifyHosp["Hospital & Patient Notified with Donor Contact"]
    DonorDecision -->|"Declines / Timeout"| CascadeNext["Cascade Dispatch to Next Proximity Radius Tier"]
```

---

## 🌟 Key Features Overview

### 1. 🇮🇳 All-India Official Blood Bank Directory (2,439+ Verified Centers)
- **Kaggle National Registry:** Ingested verified records for **2,439 official blood banks** across India with exact GPS coordinates.
- **Pan-India Coverage:** Spans all **36 States and Union Territories** (Delhi, Maharashtra, Karnataka, Tamil Nadu, West Bengal, Telangana, Gujarat, Rajasthan, Uttar Pradesh, Punjab, Kerala, Bihar, Assam, Odisha, and more).
- **Interactive City Jump Selector:** Jump instantly to any major Indian city/state or use live GPS to find certified blood banks closest to your coordinates.
- **Search by Name/Facility:** Filter by keyword (e.g., *AIIMS*, *Red Cross*, *Rotary*, *Civil Hospital*, *Tata Memorial*) with live distance calculations.
- **Live Inventory by Blood Group:** Real-time unit counts across all 8 blood groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`).

### 2. 🧠 Smart Universal Blood Compatibility Engine
- **Medical Transfusion Rules:** Encodes WHO / Red Cross compatibility matrices (e.g., `B+` patients safely receive `B+`, `B-`, `O+`, and `O-`).
- **4-Tier Prioritized Cascading Dispatch:**
  - **Tier 1:** Exact Match (identical blood group)
  - **Tier 2:** Compatible Same Group / Rh- Sibling
  - **Tier 3:** Universal Rh+ Donor (`O+`)
  - **Tier 4:** Universal Lifesaver Reserve (`O-` protected reserve)
- **Medical Safety Guards:** Enforces the mandatory **90-day cooldown interval** between whole blood donations and verifies donor age (18–65).
- **Cross-Inventory Hybrid Checking:** Simultaneously queries certified blood banks for existing compatible cold storage units and pre-alerts nearby voluntary donors.

### 3. 🗺️ Dual Map Engine (Google Maps & OpenStreetMap / Leaflet)
- **Multi-Provider View Switcher:** Toggle freely between:
  - **`📋 Grid Cards`**
  - **`🗺️ Leaflet / OpenStreetMap`** (100% free, no API keys needed)
  - **`📍 Google Maps`** (interactive live view + directions)
- **Turn-by-Turn Driving Navigation:** Every hospital and blood bank card includes a direct **`🧭 Directions`** button that opens real-time Google Maps GPS navigation to the facility gate.
- **Custom Facility Pins:** Interactive markers displaying available ICU beds, oxygen, and blood stock in clickable popups.

### 4. 🏥 Pan-India Official Hospital Directory (10,672+ Verified Centers)
- **National Registry Ingestion:** Ingested the official National Hospital Directory containing **10,672 verified geocoded hospitals** across all 36 States and Union Territories.
- **Direct All-India Directory Access:** Directly browse and search verified hospitals nationwide with live bed counters, oxygen status, and emergency medicines without radius locks.
- **Pan-India Multi-Filter:** Filter across all 36 States & UTs, search by keyword/city/hospital name, or filter by critical resource need (ICU beds, general emergency beds, oxygen cylinders, ventilators).
- **Critical Resource & Medicine Standby:** Live tracking of hospital capacity alongside standby life-saving medicines (Epinephrine, Atropine, Amiodarone, Norepinephrine).
- **Dedicated Hospital Portal:** Facility admins update stock in real-time, confirm incoming reservations, and restock beds upon discharge.

### 5. 🔒 Atomic Concurrency & Auto-Restock Mechanism
- **Atomic Operations:** Uses MongoDB atomic updates (`findOneAndUpdate` with conditional checks like `$gte` and `$inc`) to prevent race conditions and double-booking during emergency traffic spikes.
- **Auto-Expiration Background Cleanup:** An automated background daemon reviews pending holds every 60 seconds; any unconfirmed reservation exceeding its expiry window is automatically marked `expired` and inventory is restocked to the facility in real time.

### 6. 🛡️ System Administration & Facility Verification
- Dedicated Admin dashboard with total network metrics (hospitals, blood banks, reservations).
- Interactive facility verification control to grant or revoke verified badges.

### 7. ⚡ Automated Low-Stock Replenishment & Donor Auto-Dispatch
- **Autonomous Deficit Detection:** Continuously monitors unit reserves across all 8 blood groups during inventory updates and reservation checkouts.
- **Smart Safety Thresholds:** Triggers automatic replenishment when units fall to or below clinical safety thresholds ($\le 4$ units for rare negative groups `O-`, `AB-`, `B-`, `A-`, and $\le 5$ units for common groups).
- **Automated Emergency Request Generation:** Instantly creates an emergency `BloodRequest` on behalf of the blood bank with `isAutoGenerated: true` and calculates the units needed to restore a safe 12-unit buffer.
- **Cascading Proximity Donor Alerts:** Integrates with the WHO compatibility engine to immediately locate eligible, registered voluntary donors within a 15 km radius and pushes instant Socket.IO notifications to their devices.
- **Facility Low-Stock Control Center:** Blood bank managers can inspect active replenishment broadcasts, view stock deficit warnings, and trigger manual stock scans directly from their dashboard.

---

## 📁 Complete Project Directory Structure

```text
VitalLink/
├── backend/
│   ├── controllers/
│   │   ├── authController.js           # Registration, login, profile & JWT issuance
│   │   ├── bloodBankController.js      # Blood bank search, inventory & scarcity analytics
│   │   ├── bloodRequestController.js   # Emergency compatibility broadcasts & responses
│   │   ├── donorController.js          # Donor availability, proximity & GPS updates
│   │   ├── hospitalController.js       # Hospital resource tracking & admin verify
│   │   └── reservationController.js    # Atomic holds & 60-min auto-restock daemon
│   ├── data/
│   │   ├── kaggle_dataset/
│   │   │   └── blood-banks.csv         # Raw national registry from Kaggle
│   │   └── allIndiaBloodBanks.json     # Cleaned 2,439 geocoded blood banks dataset
│   ├── middleware/
│   │   ├── auth.js                     # JWT verification & user injection
│   │   └── roleCheck.js                # Role-based access control (RBAC)
│   ├── models/
│   │   ├── BloodBank.js                # Blood bank model with 2dsphere index
│   │   ├── BloodRequest.js             # Blood broadcast model with matched tiers
│   │   ├── Hospital.js                 # Hospital resources (ICU, O2, beds, medicines)
│   │   ├── Reservation.js              # Atomic reservation holds with expiration
│   │   └── User.js                     # Multi-role user accounts & donor data
│   ├── routes/
│   │   ├── auth.js                     # /api/auth routes
│   │   ├── bloodBanks.js               # /api/bloodbanks routes (includes /analytics/scarcity)
│   │   ├── bloodRequests.js            # /api/blood-requests routes
│   │   ├── donors.js                   # /api/donors routes
│   │   ├── hospitals.js                # /api/hospitals routes
│   │   └── reservations.js             # /api/reservations routes
│   ├── scripts/
│   │   ├── convertKaggleData.js        # ETL script parsing Kaggle CSV into validated JSON
│   │   └── syncReadme.js               # Documentation coverage validator
│   ├── socket/
│   │   └── index.js                    # Socket.IO connection handling & rooms
│   ├── utils/
│   │   └── bloodCompatibility.js       # Transfusion matrix, tiers & cooldown guards
│   ├── .env                            # Backend configuration (PORT, MONGO_URI, JWT_SECRET)
│   ├── package.json                    # Backend dependencies & npm scripts
│   ├── seed.js                         # Database seeder (2,439 blood banks, camps, users)
│   └── server.js                       # Express application bootstrap & WebSocket server
│
├── frontend/
│   ├── public/                         # Static assets & icons
│   ├── src/
│   │   ├── components/
│   │   │   ├── BloodBankCard.jsx       # Blood bank card with stock badges & navigation
│   │   │   ├── BloodRequestCard.jsx    # Alert card for emergency blood requests
│   │   │   ├── GoogleMapView.jsx       # Interactive Google Maps view with directions
│   │   │   ├── HospitalCard.jsx        # Hospital card with resource gauges & directions
│   │   │   ├── InteractiveMap.jsx      # Leaflet OpenStreetMap view with custom pins
│   │   │   ├── Navbar.jsx              # Responsive navigation header with role badge
│   │   │   ├── PrivateRoute.jsx        # Role-based route guard
│   │   │   └── ReservationModal.jsx    # Modal dialog for booking beds, oxygen & blood
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # User auth context backed by sessionStorage
│   │   │   └── SocketContext.jsx       # Global Socket.IO client connection context
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx      # Admin metrics & facility verification toggles
│   │   │   ├── BloodBankDashboard.jsx  # Inventory management for blood bank managers
│   │   │   ├── BloodBankDetail.jsx     # Detail view with blood unit reserve matrix
│   │   │   ├── CreateBloodRequest.jsx  # Blood request creator with compatibility preview
│   │   │   ├── DonorDashboard.jsx      # Donor portal with availability & cooldown guards
│   │   │   ├── Home.jsx                # Landing page with active emergencies & quick links
│   │   │   ├── HospitalDashboard.jsx   # Resource manager for hospital administrators
│   │   │   ├── HospitalDetail.jsx      # Hospital resources, emergency medicines & holds
│   │   │   ├── Login.jsx               # One-click demo credentials login page
│   │   │   ├── PatientDashboard.jsx    # Patient holds, active requests & QR pass viewer
│   │   │   ├── Register.jsx            # Multi-role registration with GPS detection
│   │   │   ├── SearchBloodBanks.jsx    # All-India blood bank search with city jump & map
│   │   │   └── SearchHospitals.jsx     # Hospital discovery with Card and Map views
│   │   ├── services/
│   │   │   └── api.js                  # Axios instance with auth token interceptor
│   │   ├── App.jsx                     # Route definitions & application root
│   │   └── main.jsx                    # Vite application entry point
│   ├── package.json                    # Frontend dependencies (React, Vite, Bootstrap, jsPDF)
│   └── vite.config.js                  # Vite build & development server configuration
│
├── package.json                        # Root workspace manager (concurrent scripts)
└── README.md                           # Master project documentation
```

---

## 🗄️ Database Schemas & Data Models

| Model | Collection | Primary Attributes | Key Indexes |
|---|---|---|---|
| **User** | `users` | `name`, `email`, `password`, `phone`, `role` (`patient`, `donor`, `hospital`, `bloodbank`, `admin`), `bloodGroup`, `isAvailable`, `lastDonationDate`, `location` | `email: 1`, `location: '2dsphere'` |
| **Hospital** | `hospitals` | `name`, `email`, `phone`, `address`, `location`, `resources` (`icuBeds`, `generalBeds`, `oxygenCylinders`, `ventilators`), `emergencyMedicines`, `verified`, `managedBy` | `location: '2dsphere'`, `verified: 1` |
| **BloodBank** | `bloodbanks` | `name`, `email`, `phone`, `address`, `location`, `inventory` (`bloodGroup`, `unitsAvailable`), `verified`, `managedBy` | `location: '2dsphere'`, `inventory.bloodGroup: 1` |
| **Reservation** | `reservations` | `patient`, `facilityId`, `facilityModel` (`Hospital`/`BloodBank`), `facilityName`, `resourceType`, `bloodGroup`, `quantity`, `status` (`active`, `confirmed`, `cancelled`, `expired`), `expiresAt` (60 min) | `patient: 1`, `facilityId: 1`, `status: 1`, `expiresAt: 1` |
| **BloodRequest** | `bloodrequests` | `patient`, `hospitalName`, `bloodGroup`, `urgency` (`normal`, `critical`), `unitsRequired`, `status` (`pending`, `fulfilled`, `cancelled`), `matchedDonors` (`donor`, `tier`, `status`), `location` | `location: '2dsphere'`, `status: 1` |

---

## 🔌 REST API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account (`patient`, `donor`, `hospital`, `bloodbank`).
- `POST /api/auth/login` — Login with credentials and receive a JWT.
- `GET /api/auth/me` — Retrieve current authenticated user profile (`Protected`).

### Hospitals (`/api/hospitals`)
- `GET /api/hospitals` — Discover hospitals nearby via `$near` (`?lat=&lng=&radius=&search=`).
- `GET /api/hospitals/:id` — Retrieve comprehensive hospital resource details.
- `GET /api/hospitals/my` — Get hospital facility managed by logged-in hospital admin (`Hospital/Admin`).
- `POST /api/hospitals` — Create a new hospital facility (`Hospital/Admin`).
- `PUT /api/hospitals/:id/resources` — Update live bed, oxygen, and medicine stock (`Hospital/Admin`).
- `PUT /api/hospitals/:id/verify` — Toggle verified hospital status (`Admin Only`).

### Blood Banks (`/api/bloodbanks`)
- `GET /api/bloodbanks` — Discover blood banks across India (`?lat=&lng=&radius=&bloodGroup=&search=&limit=`).
- `GET /api/bloodbanks/:id` — Get blood bank facility details and unit inventory.
- `GET /api/bloodbanks/:id/auto-requests` — Retrieve automated low-stock replenishment requests (`Protected`).
- `POST /api/bloodbanks/:id/auto-check` — Trigger manual stock scan & raise auto-replenishment requests (`BloodBank/Admin`).
- `GET /api/bloodbanks/my` — Get blood bank managed by logged-in manager (`BloodBank/Admin`).
- `POST /api/bloodbanks` — Create a new blood bank (`BloodBank/Admin`).
- `PUT /api/bloodbanks/:id/inventory` — Update units available per blood group (`BloodBank/Admin`).
- `PUT /api/bloodbanks/:id/verify` — Toggle verified blood bank status (`Admin Only`).

### Voluntary Donation Camps (`/api/camps`)
- `GET /api/camps` — Browse donation drives (`?state=&city=&status=&search=`).
- `GET /api/camps/:id` — Get detailed camp info and donor registrations.
- `POST /api/camps` — Organize and publish a new blood camp (`Hospital/BloodBank/Admin`).
- `POST /api/camps/:id/rsvp` — Pledge a blood unit as a voluntary donor (`Protected`).
- `PATCH /api/camps/:id/attendance` — Mark donor attendance and issue certificate ID (`Hospital/BloodBank/Admin`).
- `PATCH /api/camps/:id/status` — Update camp status (`upcoming`, `ongoing`, `completed`, `cancelled`).

### Donors (`/api/donors`)
- `GET /api/donors/nearby` — Find nearby available voluntary donors (`?lat=&lng=&bloodGroup=&radius=`).
- `PUT /api/donors/availability` — Toggle donor ready-to-donate availability status (`Donor Only`).
- `PUT /api/donors/location` — Update donor live GPS coordinates (`Donor Only`).

### Reservations (`/api/reservations`)
- `POST /api/reservations` — Create atomic resource reservation with 60-minute holding timer (`Patient`).
- `GET /api/reservations/my` — List all reservations made by the logged-in patient (`Patient`).
- `GET /api/reservations/facility` — List reservations incoming to a hospital or blood bank (`Facility Admin`).
- `PUT /api/reservations/:id/confirm` — Mark reservation admitted upon patient arrival (`Facility Admin`).
- `PUT /api/reservations/:id/cancel` — Cancel hold and immediately release inventory back to facility.

### Emergency Blood Requests (`/api/blood-requests`)
- `POST /api/blood-requests` — Broadcast emergency blood need with 4-tier compatibility matching (`Patient`).
- `GET /api/blood-requests` — Get active broadcasts matching current donor profile (`Protected`).
- `GET /api/blood-requests/:id` — Get blood request status and donor responses (`Protected`).
- `PUT /api/blood-requests/:id/respond` — Accept or decline an emergency blood request (`Donor Only`).

---

## ⚡ Real-Time WebSocket Events Reference

LifeLink uses Socket.IO to provide instant peer-to-peer and broadcast emergency synchronization:

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `bloodRequest` | Server $\to$ Matching Donors | `{ requestId, patientName, hospitalName, bloodGroup, urgency, location }` | Emitted when an emergency blood broadcast is posted; sent to nearby compatible donors. |
| `donorResponse` | Server $\to$ Requesting Patient | `{ requestId, donorId, donorName, decision: 'accepted'/'declined' }` | Notifies the patient and triage staff when a voluntary donor accepts an emergency request. |
| `inventoryUpdate` | Server $\to$ All Connected Clients | `{ type: 'hospital'/'bloodbank', facilityId, inventory/resources }` | Real-time broadcast whenever bed or blood stock changes or an expired hold auto-restocks. |
| `reservationCreated` | Server $\to$ Facility Room | `{ reservationId, facilityId, resourceType, quantity, patientName }` | Alerts hospital triage reception that a critical resource has been reserved. |
| `reservationStatus` | Server $\to$ Patient Room | `{ reservationId, status: 'confirmed'/'cancelled'/'expired' }` | Updates the patient's dashboard in real time when triage marks them admitted or hold expires. |

---

## 🛠️ Technology Stack

| Category | Technologies | Description |
|---|---|---|
| **Frontend Framework** | React 18, Vite | High-performance SPA with fast HMR |
| **Routing & Navigation** | React Router v7 | Nested, role-guarded client routing |
| **UI Components** | Bootstrap 5, React-Bootstrap | Clean, accessible, standardized design |
| **Mapping Engines** | Leaflet, OpenStreetMap, Google Maps JS API | Dual mapping engine with turn-by-turn driving navigation |
| **Documents & Passes** | jsPDF, QRCode.react | Client-side vector PDF passes & Appreciation Certificates |
| **Backend Runtime** | Node.js, Express.js | Asynchronous RESTful service tier |
| **Real-Time Layer** | Socket.IO Client & Server | Sub-second emergency broadcasts & inventory synchronization |
| **Database & GIS** | MongoDB, Mongoose ODM | Document store with native `2dsphere` geospatial indexing |
| **Security & Sessions** | JWT, bcryptjs, `sessionStorage` | Multi-window independent testing without cookie/token collision |

---

## 🚀 Installation & Quickstart Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB Server**: Running locally on `mongodb://localhost:27017` (or remote MongoDB Atlas URI)

### Step 1: Clone and Install Dependencies

```powershell
# In project root:
npm install

# Install backend dependencies:
cd backend
npm install

# Install frontend dependencies:
cd ../frontend
npm install

# Return to root:
cd ..
```

### Step 2: Configure Environment Variables

Verify that `backend/.env` exists and contains:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/lifelink
JWT_SECRET=lifelink_super_secret_jwt_key_2026
```

### Step 3: Seed Database with 2,439 Verified Blood Banks

```powershell
# Run the database seeder from root:
npm run seed
```
*This populates all 2,439 verified Indian blood banks, 3 sample emergency hospitals, voluntary donation drives, and pre-configured demo user accounts.*

### Step 4: Start the Application

You can start both backend and frontend concurrently with a single command:

```powershell
# From root directory:
npm run dev
```

Or start them individually in separate terminal windows:
```powershell
# Terminal 1 - Backend API (Port 5000):
npm run server

# Terminal 2 - React Frontend (Port 5173 / 3000):
npm run client
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🧭 MongoDB Compass Setup & Exploration

1. Open **MongoDB Compass**.
2. Connect to the local instance using:
   ```text
   mongodb://localhost:27017
   ```
3. In the sidebar, select the **`lifelink`** database.
4. Explore the collections:
   - `bloodbanks`: 2,439 verified centers with live stock and GPS coordinates.
   - `hospitals`: Emergency facilities with ICU, oxygen, and medicine reserves.
   - `donationcamps`: Active voluntary donation drives across India.
   - `reservations`: Atomic holds and fast-track admission records.

#### Useful Compass Filter Queries:
- **Search by City or State:**
  ```json
  { "address": { "$regex": "Mumbai", "$options": "i" } }
  ```
- **Find Rare O- Blood Stock:**
  ```json
  { "inventory": { "$elemMatch": { "bloodGroup": "O-", "unitsAvailable": { "$gt": 5 } } } }
  ```
- **Find Certified Red Cross Centers:**
  ```json
  { "name": { "$regex": "Red Cross", "$options": "i" } }
  ```

---

## 🔑 Demo Accounts & Role Access Matrix

All pre-seeded demo accounts use the standard password: **`password123`**

| Role | Email | Password | Primary Capabilities |
|---|---|---|---|
| **National Admin** | `admin@lifelink.org` | `password123` | System overview, verify/revoke facilities |
| **Hospital Admin** | `hospital@apollo.com` | `password123` | Live ICU beds, oxygen, and medicine stock management; admit incoming patients |
| **Blood Bank Admin** | `bloodbank@city.org` | `password123` | Manage units for all 8 blood groups; stock replenishment monitoring |
| **Voluntary Donor (O+)** | `rahul.donor@example.com` | `password123` | Toggle donation availability, receive proximity alerts, accept emergency requests |
| **Universal Donor (O-)** | `vikram.donor@example.com` | `password123` | Protected universal lifesaver tier; emergency compatibility alerts |
| **Patient / Attendant** | `patient@example.com` | `password123` | Discover facilities, reserve beds/blood, broadcast emergency blood requests |

> [!TIP]
> LifeLink uses `sessionStorage` for auth tokens. You can open multiple private/incognito windows or tabs to test simultaneous real-time interactions between a **Patient**, a **Hospital Admin**, and a **Donor** at the same time!

---

## 👥 Contributors & Core Team

| Name / GitHub | Role & Department | Core Ownership |
|---|---|---|
| **[Charudatta Patil](https://github.com/CharudattaPatil-AC)** | **Project Lead & Backend / Real-Time Systems Lead** | Server architecture, atomic concurrency engine, 60s auto-restock daemon, and WebSocket rooms |
| **Team Member 2** | **Data Engineering & Clinical Algorithms Lead** | Kaggle 2,439 blood banks dataset ingestion, MongoDB `2dsphere` spatial indexing, 4-tier WHO compatibility engine, and scarcity analytics |
| **Team Member 3** | **Frontend Architecture & GIS / Document Lead** | React 18 SPA, dual map engine (Leaflet + Google Maps), QR fast-track pass, client-side vector PDF generator, and donation drives |

---

## 🔄 Documentation Synchronization

To ensure documentation integrity, run the automated codebase audit tool whenever changes are made:

```powershell
npm run doc:sync
```

This verifies that all backend routes, Mongoose models, frontend pages, UI components, and dependencies match `README.md` with 100% coverage.
