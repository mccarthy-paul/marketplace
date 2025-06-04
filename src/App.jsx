import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import LoggedInPage from './LoggedInPage.jsx';
import HomePage from './HomePage.jsx'; // ⬅ create from the hero JSX
import NavBar from './NavBar.jsx'; // ⬅ extract the header
import Footer from './Footer.jsx'; // ⬅ extract the footer
import DashboardPage from './DashboardPage.jsx';
import WatchList from './WatchList.jsx';
import ListingList from './ListingList.jsx';
import OrderList from './OrderList.jsx';
import WatchDetails from './WatchDetails.jsx';
import ListingDetails from './ListingDetails.jsx';
import OrderDetails from './OrderDetails.jsx';
import WatchAdminList from './admin/WatchAdminList.jsx';
import WatchAdminAdd from './admin/WatchAdminAdd.jsx';
import WatchAdminEdit from './admin/WatchAdminEdit.jsx';
import AdminLogin from './admin/AdminLogin.jsx'; // Import AdminLogin
import UserAdminList from './admin/UserAdminList.jsx'; // Import UserAdminList
import UserAdminAdd from './admin/UserAdminAdd.jsx'; // Import UserAdminAdd
import UserAdminEdit from './admin/UserAdminEdit.jsx'; // Import UserAdminEdit
import AdminDashboard from './admin/AdminDashboard.jsx'; // Import AdminDashboard
import { Navigate } from 'react-router-dom'; // Import Navigate
import './index.css';
import axios from 'axios'; // Import axios

axios.defaults.withCredentials = true; // Configure axios to send cookies

// Simple Admin Route Wrapper
const AdminRoute = ({ children }) => {
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await axios.get('http://localhost:8001/api/admin/status');
        if (response.status === 200 && response.data.isAuthenticatedAdmin) {
          setIsAuthenticatedAdmin(true);
        } else {
          setIsAuthenticatedAdmin(false);
        }
      } catch (err) {
        setIsAuthenticatedAdmin(false);
        console.error('Admin status check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (loading) {
    return <div>Loading authentication status...</div>; // Loading indicator
  }

  if (!isAuthenticatedAdmin) {
    // Redirect to admin login if not authenticated or not admin
    return <Navigate to="/admin/login" replace />;
  }

  return children; // Render the protected component if authenticated admin
};

function beginAuth() {
  const state = generateRandomString(16);
  const verifier = generateRandomString(64);
  sessionStorage.setItem('pkce_state', state);
  sessionStorage.setItem('pkce_verifier', verifier);
  generateCodeChallenge(verifier).then(challenge => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    });
    window.location = `${authorizeUrl}?${params.toString()}`;
  });
}

export default function App() {
  const [navOpen, setNavOpen] = useState(false);

  /* --- PKCE callback logic stays here (unchanged) --- */

  return (
    <BrowserRouter>
      <NavBar navOpen={navOpen} setNavOpen={setNavOpen} />

      <Routes>
        <Route path="/" element={<HomePage beginAuth={beginAuth} />} />
        <Route path="/loggedin" element={<LoggedInPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/watches" element={<WatchList />} />
        <Route path="/listings" element={<ListingList />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/watches/:id" element={<WatchDetails />} />
        <Route path="/listings/:id" element={<ListingDetails />} />
        <Route path="/orders/:id" element={<OrderDetails />} />
        {/* Admin Routes */}
        {/* Admin Login Route */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin Dashboard Route */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin/watches"
          element={
            <AdminRoute>
              <WatchAdminList />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/watches/new"
          element={
            <AdminRoute>
              <WatchAdminAdd />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/watches/edit/:id"
          element={
            <AdminRoute>
              <WatchAdminEdit />
            </AdminRoute>
          }
        />
        {/* Admin User Routes */}
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <UserAdminList />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users/new"
          element={
            <AdminRoute>
              <UserAdminAdd />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users/edit/:id"
          element={
            <AdminRoute>
              <UserAdminEdit />
            </AdminRoute>
          }
        />
        {/* add more routes here */}
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}
