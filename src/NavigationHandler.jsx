import React from 'react';
import NavBar from './NavBar.jsx';

const NavigationHandler = ({ navOpen, setNavOpen }) => {
  return <NavBar navOpen={navOpen} setNavOpen={setNavOpen} />;
};

export default NavigationHandler;
