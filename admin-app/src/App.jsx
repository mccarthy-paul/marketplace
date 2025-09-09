import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import WatchAdminList from './components/WatchAdminList';
import WatchAdminEdit from './components/WatchAdminEdit';
import WatchAdminAdd from './components/WatchAdminAdd';
import UserAdminList from './components/UserAdminList';
import UserAdminEdit from './components/UserAdminEdit';
import OrderAdminList from './components/OrderAdminList';
import BidAdminList from './components/BidAdminList';
import AdminRoute from './components/AdminRoute';
import AdminNavBar from './components/AdminNavBar';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public login route */}
          <Route path="/login" element={<AdminLogin />} />
          
          {/* Protected admin routes */}
          <Route path="/dashboard" element={
            <AdminRoute>
              <AdminNavBar />
              <AdminDashboard />
            </AdminRoute>
          } />
          
          <Route path="/watches" element={
            <AdminRoute>
              <AdminNavBar />
              <WatchAdminList />
            </AdminRoute>
          } />
          
          <Route path="/watches/new" element={
            <AdminRoute>
              <AdminNavBar />
              <WatchAdminAdd />
            </AdminRoute>
          } />
          
          <Route path="/watches/edit/:id" element={
            <AdminRoute>
              <AdminNavBar />
              <WatchAdminEdit />
            </AdminRoute>
          } />
          
          <Route path="/users" element={
            <AdminRoute>
              <AdminNavBar />
              <UserAdminList />
            </AdminRoute>
          } />
          
          <Route path="/users/edit/:id" element={
            <AdminRoute>
              <AdminNavBar />
              <UserAdminEdit />
            </AdminRoute>
          } />
          
          <Route path="/orders" element={
            <AdminRoute>
              <AdminNavBar />
              <OrderAdminList />
            </AdminRoute>
          } />
          
          <Route path="/bids" element={
            <AdminRoute>
              <AdminNavBar />
              <BidAdminList />
            </AdminRoute>
          } />
          
          {/* Default redirect to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;