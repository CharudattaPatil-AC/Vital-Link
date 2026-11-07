import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import NavbarComponent from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SearchHospitals from './pages/SearchHospitals';
import SearchBloodBanks from './pages/SearchBloodBanks';
import HospitalDetail from './pages/HospitalDetail';
import BloodBankDetail from './pages/BloodBankDetail';
import HospitalDashboard from './pages/HospitalDashboard';
import BloodBankDashboard from './pages/BloodBankDashboard';
import PatientDashboard from './pages/PatientDashboard';
import CreateBloodRequest from './pages/CreateBloodRequest';
import AdminDashboard from './pages/AdminDashboard';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <NavbarComponent />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/search/hospitals" element={<SearchHospitals />} />
            <Route path="/hospitals" element={<SearchHospitals />} />
            <Route path="/search/bloodbanks" element={<SearchBloodBanks />} />
            <Route path="/bloodbanks" element={<SearchBloodBanks />} />
            <Route path="/hospitals/:id" element={<HospitalDetail />} />
            <Route path="/bloodbanks/:id" element={<BloodBankDetail />} />
            <Route
              path="/dashboard/hospital"
              element={
                <PrivateRoute roles={['hospital']}>
                  <HospitalDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/bloodbank"
              element={
                <PrivateRoute roles={['bloodbank']}>
                  <BloodBankDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/patient"
              element={
                <PrivateRoute roles={['patient']}>
                  <PatientDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <PrivateRoute roles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/blood-request/create"
              element={
                <PrivateRoute>
                  <CreateBloodRequest />
                </PrivateRoute>
              }
            />
            <Route
              path="/blood-requests/new"
              element={
                <PrivateRoute>
                  <CreateBloodRequest />
                </PrivateRoute>
              }
            />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
