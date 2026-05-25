import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoggerProvider } from './context/LoggerContext';
import Checkout from './pages/Checkout';
import DrugDetail from './pages/DrugDetail';
import Home from './pages/Home';
import Login from './pages/Login';
import PharmacistDashboard from './pages/PharmacistDashboard';
import Profile from './pages/Profile';
import Registration from './pages/Registration';
import SearchPage from './pages/SearchPage';
import UploadResep from './pages/UploadResep';

function App() {
  return (
    <LoggerProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/login" element={<Login />} />
          
          {/* Main App Routes */}
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/drug/:drugId" element={<DrugDetail />} />
          <Route path="/upload-resep" element={<UploadResep />} />
          <Route path="/cart" element={<Checkout />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Pharmacist Routes */}
          <Route path="/pharmacist" element={<PharmacistDashboard />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/register" replace />} />
        </Routes>
      </BrowserRouter>
    </LoggerProvider>
  );
}

export default App

