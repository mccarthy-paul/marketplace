import React from 'react';
import { useLocation } from 'react-router-dom';
import NavBar from './NavBar.jsx';

const ConditionalNavBar = ({ navOpen, setNavOpen }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return null; // Don't render NavBar on admin routes
  }

  return <NavBar navOpen={navOpen} setNavOpen={setNavOpen} />;
};

export default ConditionalNavBar;
