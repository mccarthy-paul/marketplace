import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { Menu, X } from 'lucide-react';

// Assuming clientId, redirectUri, scope, authorizeUrl, generateRandomString, generateCodeChallenge are defined elsewhere or imported

function beginAuth() {
  const state = generateRandomString(16); // Assuming generateRandomString is available
  const verifier = generateRandomString(64); // Assuming generateRandomString is available
  sessionStorage.setItem('pkce_state', state);
  sessionStorage.setItem('pkce_verifier', verifier);
  generateCodeChallenge(verifier).then(challenge => { // Assuming generateCodeChallenge is available
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId, // Assuming clientId is available
      redirect_uri: redirectUri, // Assuming redirectUri is available
      scope, // Assuming scope is available
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    });
    window.location = `${authorizeUrl}?${params.toString()}`; // Assuming authorizeUrl is available
  });
}

export default function NavBar({ navOpen, setNavOpen }) {
  const { pathname } = useLocation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('http://localhost:8001/api/users/me', { withCredentials: true });
        setCurrentUser(response.data.user);
      } catch (err) {
        console.error('Error fetching current user in NavBar:', err);
        setCurrentUser(null); // Ensure user is null if fetching fails (e.g., not logged in)
      }
    };

    fetchCurrentUser();
  }, [pathname]); // Refetch user if pathname changes (e.g., login/logout)

  const menuItems = [
    { label: 'Marketplace', href: '/watches' }, // Link to watches list
    { label: 'Watch Brands', href: '#' },
    { label: 'Sell a Watch', href: '#' },
    { label: 'Magazine', href: '#' },
    { label: 'Watch Collection', href: '/watches' }, // Link to watches list
    { label: 'Bids', href: '/my-watch-bids' }
  ];

  const handleSignOut = async () => {
    try {
      // Clear local storage
      localStorage.clear();

      // Attempt to clear cookies for localhost for root path and current path
      const cookies = document.cookie.split(";");
      const expirationDate = new Date(0).toUTCString(); // Set expiration to a past date

      cookies.forEach((c) => {
        const cookieName = c.replace(/^ +/, "").split("=")[0];
        // Clear for root path
        document.cookie = cookieName + "=; expires=" + expirationDate + "; path=/";
        // Clear for current path
        document.cookie = cookieName + "=; expires=" + expirationDate + "; path=" + window.location.pathname;
      });

      // Call the logout API endpoint
      await fetch("http://localhost:8001/auth/logout", { method: "POST", credentials: "include" }); // Use fetch for logout

      // Redirect to the home page
      window.location.replace("/");
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out. Please try again.');
    }
  };


  return (
    <header className="bg-[#2a2a29] text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-bold tracking-tight">Luxe24.1 Marketplace</Link> {/* Use Link for internal navigation */}

        {/* desktop menu */}
        {pathname !== '/admin/login' && (
          <nav className="hidden md:flex gap-6 text-sm lg:text-base">
            {menuItems.map(item => (
              <Link key={item.label} to={item.href} className="hover:text-[#3ab54a] transition-colors"> {/* Use Link */}
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* actions */}
        <div className="flex items-center gap-4">
          {currentUser ? (
            // Show Sign out button if logged in
            <button
              className="mt-6 inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          ) : (
            // Show Login button if not logged in and not on login page
            pathname !== '/admin/login' && (
              <button
                onClick={beginAuth}
                className="hidden sm:inline-flex bg-[#3ab54a] hover:bg-[#32a042] text-white font-semibold py-2 px-5 rounded-xl shadow-lg transition-colors"
              >
                Login with Juno
              </button>
            )
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
           {currentUser ? (
            // Show Sign out button in mobile menu if logged in
            <button
              className="w-full mt-2 inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
              onClick={() => {
                setNavOpen(false);
                handleSignOut();
              }}
            >
              Sign out
            </button>
          ) : (
            // Show Login button in mobile menu if not logged in and not on login page
            pathname !== '/admin/login' && (
              <button
                onClick={() => {
                  setNavOpen(false);
                  beginAuth();
                }}
                className="w-full mt-2 bg-[#3ab54a] hover:bg-[#32a042] text-white font-semibold py-2 rounded-xl shadow-lg"
              >
                Login with Juno button
              </button>
            )
          )}
        </nav>
      )}
    </header>
  );
}
