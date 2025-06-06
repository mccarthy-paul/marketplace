import React from 'react';
import { useLocation } from 'react-router-dom';
import NavBar from './NavBar.jsx';
import AdminNavBar from './admin/AdminNavBar.jsx';

const NavigationHandler = ({ navOpen, setNavOpen }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <AdminNavBar navOpen={navOpen} setNavOpen={setNavOpen} />;
  }

  return <NavBar navOpen={navOpen} setNavOpen={setNavOpen} />;
};

export default NavigationHandler;
