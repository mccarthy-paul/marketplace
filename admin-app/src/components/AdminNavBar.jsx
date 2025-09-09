import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import axios from 'axios';

export default function AdminNavBar({ navOpen, setNavOpen }) {
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await axios.get('/api/admin/status');
        if (response.status === 200 && response.data.isAuthenticatedAdmin) {
          setIsAuthenticatedAdmin(true);
        } else {
          setIsAuthenticatedAdmin(false);
        }
      } catch (err) {
        setIsAuthenticatedAdmin(false);
        console.error('Admin status check failed in AdminNavBar:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  const menuItems = [
    { label: 'User Admin', href: '/users' },
    { label: 'Watch Admin', href: '/watches' },
  ];

  const handleSignOut = async () => {
    try {
      // Clear local storage
      localStorage.clear();

      // Attempt to clear cookies for localhost
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Call the logout API endpoint
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" }); // Use fetch for logout

      // Redirect to the admin login page
      window.location.replace("/login");
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out. Please try again.');
    }
  };


  if (loading) {
    return <div>Loading admin status...</div>; // Optional loading indicator
  }

  return (
    <header className="bg-[#2a2a29] text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/dashboard" className="text-2xl font-bold tracking-tight">Admin Dashboard</Link> {/* Link to Admin Dashboard */}

        {/* desktop menu */}
        {isAuthenticatedAdmin && (
          <nav className="hidden md:flex gap-6 text-sm lg:text-base">
            {menuItems.map(item => (
              <Link key={item.label} to={item.href} className="hover:text-[#3ab54a] transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* actions */}
        <div className="flex items-center gap-4">
          {isAuthenticatedAdmin && (
            <button
              className="mt-6 inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          )}

          {/* mobile menu button */}
          {isAuthenticatedAdmin && (
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
              onClick={() => setNavOpen(o => !o)}
            >
              {navOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>

      {/* mobile menu */}
      {navOpen && isAuthenticatedAdmin && (
        <nav className="md:hidden bg-[#2a2a29] border-t border-white/10 px-6 pb-4 space-y-2">
          {menuItems.map(item => (
            <Link
              key={item.label}
              to={item.href}
              className="block py-2 text-sm text-white/90 hover:text-[#3ab54a]"
              onClick={() => setNavOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <button
            className="w-full mt-2 inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => {
              setNavOpen(false);
              handleSignOut();
            }}
          >
            Sign out
          </button>
        </nav>
      )}
    </header>
  );
}
