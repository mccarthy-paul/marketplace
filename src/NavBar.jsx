import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { apiGet, apiPost } from './utils/api.js';

export default function NavBar({ navOpen, setNavOpen }) {
  const { pathname } = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const fetchCurrentUser = async () => {
      try {
        const response = await apiGet('/api/me');
        
        if (mounted) {
          if (response.ok) {
            const data = await response.json();
            setCurrentUser(data.user);
          } else {
            setCurrentUser(null);
          }
          setAuthChecked(true);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error fetching current user in NavBar:', err);
          setCurrentUser(null);
          setAuthChecked(true);
        }
      }
    };

    fetchCurrentUser();
    
    return () => {
      mounted = false;
    };
  }, []);

  const menuItems = [
    { label: 'Marketplace', href: '/watches' },
    { label: 'Watch Brands', href: '#' },
    { label: 'Sell a Watch', href: '#' },
    { label: 'Magazine', href: '#' },
    { label: 'Watch Collection', href: '/watches' },
    { label: 'Bids', href: '/my-watch-bids' },
    { label: 'Profile', href: '/profile' }
  ];

  const handleSignOut = async () => {
    try {
      console.log('Frontend: Starting logout process...');
      
      localStorage.clear();

      const cookies = document.cookie.split(";");
      const expirationDate = new Date(0).toUTCString();

      cookies.forEach((c) => {
        const cookieName = c.replace(/^ +/, "").split("=")[0];
        document.cookie = cookieName + "=; expires=" + expirationDate + "; path=/";
        document.cookie = cookieName + "=; expires=" + expirationDate + "; path=" + window.location.pathname;
      });

      console.log('Frontend: Calling logout API...');
      const response = await apiPost("/auth/junopay/logout");
      const result = await response.json();
      console.log('Frontend: Logout API response:', result);
      
      // Clear the current user state immediately
      setCurrentUser(null);
      setAuthChecked(true);
      
      console.log('Frontend: Logout complete, staying on current page');
      // Don't redirect immediately - let user stay on current page
      // The NavBar will update to show login state
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out. Please try again.');
    }
  };

  return (
    <header className="bg-[#2a2a29] text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-bold tracking-tight">Luxe24.1 Marketplace</Link>

        {/* desktop menu */}
        {pathname !== '/admin/login' && (
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
          {authChecked && currentUser && (
            <>
              {/* Profile Avatar - Desktop */}
              <Link
                to="/profile"
                className="hidden md:flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                title={`Profile - ${currentUser.name}`}
              >
                <div className="w-8 h-8 bg-[#3ab54a] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">{currentUser.name}</span>
              </Link>

              {/* Sign out button */}
              <button
                className="hidden md:inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-800"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </>
          )}

          {/* mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => setNavOpen(o => !o)}
          >
            {navOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {navOpen && pathname !== '/admin/login' && (
        <nav className="md:hidden bg-[#2a2a29] border-t border-white/10 px-6 pb-4 space-y-2">
          {/* User Profile Section - Mobile */}
          {authChecked && currentUser && (
            <Link
              to="/profile"
              onClick={() => setNavOpen(false)}
              className="flex items-center gap-3 py-3 border-b border-white/10 mb-2"
            >
              <div className="w-10 h-10 bg-[#3ab54a] rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">{currentUser.name}</p>
                <p className="text-white/60 text-sm">View Profile</p>
              </div>
            </Link>
          )}

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
          {authChecked && currentUser ? (
            <button
              className="w-full mt-2 inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-800"
              onClick={() => {
                setNavOpen(false);
                handleSignOut();
              }}
            >
              Sign out
            </button>
          ) : (
            pathname !== '/admin/login' && (
              <Link
                to="/"
                onClick={() => setNavOpen(false)}
                className="w-full mt-2 bg-[#3ab54a] hover:bg-[#32a042] text-white font-semibold py-2 rounded-xl shadow-lg flex items-center justify-center"
              >
                Login with Juno
              </Link>
            )
          )}
        </nav>
      )}
    </header>
  );
}