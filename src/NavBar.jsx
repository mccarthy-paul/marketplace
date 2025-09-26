import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, ShoppingCart, Bell, Watch, LogOut, Sun, Moon, Search } from 'lucide-react';
import { apiGet, apiPost, apiPut } from './utils/api.js';
import { useTheme } from './contexts/ThemeContext.jsx';
import Luxe24Logo from './components/Luxe24Logo.jsx';

export default function NavBar({ navOpen, setNavOpen }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!currentUser) return;
    
    try {
      const data = await apiGet('/api/notifications/recent?limit=5');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await apiPut(`/api/notifications/${notificationId}/read`);
      fetchNotifications(); // Refresh notifications
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    await markAsRead(notification._id);
    setShowNotifications(false);
    
    // Navigate based on notification type
    if (notification.type === 'new_bid' || notification.type === 'bid_accepted' || 
        notification.type === 'bid_rejected' || notification.type === 'counter_offer') {
      navigate('/profile?tab=bids');
    } else if (notification.type === 'order_placed' || notification.type === 'order_shipped') {
      navigate('/profile?tab=orders');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const fetchCurrentUser = async () => {
      try {
        const data = await apiGet('/api/me');

        if (mounted) {
          setCurrentUser(data.user);
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

  // Fetch notifications when user is logged in
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      
      // TEMPORARILY DISABLED: Poll for new notifications every 30 seconds
      // Uncomment when ngrok limit issue is resolved
      // const interval = setInterval(fetchNotifications, 30000);
      // return () => clearInterval(interval);
    }
  }, [currentUser]);

  const menuItems = [
    { label: 'COLLECTION', href: '/watches' },
    { label: 'SELL', href: '/add-watch' },
    { label: 'MY WATCHES', href: '/profile' },
    { label: 'ABOUT', href: '/about' },
    { label: 'LUXEPAY', href: '/luxepay' }
  ];

  const handleSignOut = async () => {
    try {
      console.log('Frontend: Starting logout process...');

      // FIRST: Get the access token from backend BEFORE clearing it
      console.log('Frontend: Getting access token for direct logout...');
      let tokenData = null;
      try {
        const tokenResponse = await fetch('/auth/junopay/logout-token', {
          credentials: 'include'
        });

        if (tokenResponse.ok) {
          tokenData = await tokenResponse.json();
          if (tokenData.success && tokenData.access_token) {
            console.log('Frontend: Got access token, calling JunoPay application_logout directly...');

            // Try multiple approaches to call application_logout
            console.log('Frontend: Token received:', tokenData.access_token.substring(0, 20) + '...');

            // Approach 1: Direct fetch with proper CORS headers (most likely to work)
            console.log('Frontend: Attempting direct POST to application_logout...');
            try {
              const logoutResponse = await fetch('https://stg.junomoney.org/restapi/application_logout', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${tokenData.access_token}`
                },
                body: JSON.stringify({
                  token: tokenData.access_token,
                  client_id: 'PaulsMarketplace-cafd2e7e'
                })
              });

              console.log('Frontend: Direct POST response status:', logoutResponse.status);

              // Try to read response if possible
              if (logoutResponse.ok || logoutResponse.status === 200) {
                console.log('Frontend: application_logout successful');
              }
            } catch (corsError) {
              console.log('Frontend: CORS error on direct call:', corsError.message);

              // Fallback: Use backend proxy to bypass CORS
              try {
                console.log('Frontend: Falling back to backend proxy...');
                const proxyResponse = await fetch('/auth/junopay/application-logout-proxy', {
                  method: 'POST',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });

                if (proxyResponse.ok) {
                  const proxyData = await proxyResponse.json();
                  console.log('Frontend: Backend proxy response:', proxyData);
                }
              } catch (proxyError) {
                console.log('Frontend: Proxy error:', proxyError.message);
              }
            }

            // Approach 2: Send as beacon (fire-and-forget, won't show response but will make the call)
            if (navigator.sendBeacon) {
              console.log('Frontend: Sending application_logout via sendBeacon...');
              const beaconData = new FormData();
              beaconData.append('token', tokenData.access_token);
              beaconData.append('client_id', 'PaulsMarketplace-cafd2e7e');

              const beaconBlob = new Blob([JSON.stringify({
                token: tokenData.access_token,
                client_id: 'PaulsMarketplace-cafd2e7e'
              })], { type: 'application/json' });

              const sent = navigator.sendBeacon('https://stg.junomoney.org/restapi/application_logout', beaconBlob);
              console.log('Frontend: Beacon sent:', sent);
            }

          } else {
            console.log('Frontend: No access token available for direct logout');
          }
        } else {
          console.log('Frontend: Could not get logout token from backend');
        }
      } catch (e) {
        console.log('Frontend: Error in logout token process:', e);
      }

      // SECOND: Clear all client-side storage including PKCE values
      localStorage.clear();
      sessionStorage.clear();

      // Clear all cookies
      const cookies = document.cookie.split(";");
      const expirationDate = new Date(0).toUTCString();

      cookies.forEach((c) => {
        const cookieName = c.replace(/^ +/, "").split("=")[0];
        document.cookie = cookieName + "=; expires=" + expirationDate + "; path=/";
        document.cookie = cookieName + "=; expires=" + expirationDate + "; path=" + window.location.pathname;
        document.cookie = cookieName + "=; expires=" + expirationDate + "; domain=" + window.location.hostname;
      });

      // THIRD: Try additional logout methods (popups, iframes, etc.)
      // Approach 1: Open logout URL in popup window
      try {
        const logoutWindow = window.open(
          'https://stg.junomoney.org/logout',
          'junopay_logout',
          'width=1,height=1,left=-100,top=-100'
        );

        if (logoutWindow) {
          setTimeout(() => {
            try {
              logoutWindow.close();
            } catch (e) {
              console.log('Could not close logout window');
            }
          }, 1000);
        }
      } catch (e) {
        console.log('Popup blocked, trying iframe approach');
      }

      // Approach 2: Hidden iframe to JunoPay logout with multiple URLs
      const logoutUrls = [
        'https://stg.junomoney.org/logout',
        'https://stg.junomoney.org/oauth/logout',
        `https://stg.junomoney.org/oauth/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`,
        'https://stg.junomoney.org/restapi/application_logout'
      ];

      logoutUrls.forEach((url, index) => {
        setTimeout(() => {
          const frame = document.createElement('iframe');
          frame.style.display = 'none';
          frame.src = url;
          frame.sandbox = 'allow-same-origin allow-scripts';
          document.body.appendChild(frame);

          // Remove after a delay
          setTimeout(() => {
            try {
              document.body.removeChild(frame);
            } catch (e) {
              console.log('Frame already removed');
            }
          }, 1000);
        }, index * 200);
      });

      // Approach 3: Image tag trick (sometimes works for logout endpoints)
      const img = new Image();
      img.src = 'https://stg.junomoney.org/logout?_=' + Date.now();

      console.log('Frontend: Attempted to clear JunoPay session via multiple methods');

      // FOURTH: Now call backend logout to clear server-side session
      console.log('Frontend: Calling backend logout to clear server session...');
      const result = await apiPost('/auth/junopay/logout');
      console.log('Frontend: Backend logout response:', result);

      // Clear the current user state immediately
      setCurrentUser(null);
      setAuthChecked(true);

      // If API signals to clear storage, do it again (in case of race condition)
      if (result && result.clearStorage) {
        localStorage.clear();
        sessionStorage.clear();
      }

      console.log('Frontend: Logout complete, staying on current page');
      // Optionally redirect to home page after logout
      // window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out. Please try again.');
    }
  };

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95 ${
      theme === 'dark'
        ? 'bg-luxury-dark border-b border-luxury-gray'
        : 'bg-white border-b border-gray-200 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center group">
          <Luxe24Logo
            className="h-8 w-auto transition-transform group-hover:scale-105"
            fill={theme === 'dark' ? '#BA997D' : '#BA997D'}
          />
        </Link>

        {/* Search Bar - Light Theme Only */}
        {theme === 'light' && pathname !== '/admin/login' && (
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search luxury watches..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-bronze focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* desktop menu */}
        {pathname !== '/admin/login' && (
          <nav className="hidden md:flex items-center gap-8">
            {menuItems.map(item => (
              <Link
                key={item.label}
                to={item.href}
                className={`text-sm font-medium tracking-wider transition-all duration-300 relative group ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-gold'
                    : 'text-gray-700 hover:text-luxe-bronze'
                }`}
              >
                {item.label}
                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                  theme === 'dark' ? 'bg-gold' : 'bg-luxe-bronze'
                }`} />
              </Link>
            ))}
          </nav>
        )}

        {/* actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-luxury-gray'
                : 'hover:bg-gray-100'
            }`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className={`w-5 h-5 transition-colors ${
                theme === 'dark' ? 'text-gray-300 hover:text-gold' : 'text-gray-600 hover:text-luxe-bronze'
              }`} />
            ) : (
              <Sun className={`w-5 h-5 transition-colors ${
                theme === 'dark' ? 'text-gray-300 hover:text-gold' : 'text-gray-600 hover:text-luxe-bronze'
              }`} />
            )}
          </button>
          {authChecked && currentUser && (
            <>
              {/* Notifications Icon - Desktop */}
              <div ref={notificationRef} className="relative hidden md:block">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-luxury-gray'
                      : 'hover:bg-gray-100'
                  }`}
                  title="Notifications"
                >
                  <Bell className={`w-5 h-5 transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:text-gold'
                      : 'text-gray-600 hover:text-luxe-bronze'
                  }`} />
                  {unreadCount > 0 && (
                    <span className={`absolute -top-1 -right-1 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${
                      theme === 'dark'
                        ? 'bg-gold text-luxury-dark'
                        : 'bg-luxe-bronze text-white'
                    }`}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className={`absolute right-0 mt-2 w-80 border rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto ${
                    theme === 'dark'
                      ? 'bg-luxury-charcoal border-luxury-gray'
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className={`p-4 border-b ${
                      theme === 'dark' ? 'border-luxury-gray' : 'border-gray-200'
                    }`}>
                      <h3 className={`font-display text-lg tracking-wider ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>NOTIFICATIONS</h3>
                      {unreadCount > 0 && (
                        <p className={`text-xs uppercase tracking-wider mt-1 ${
                          theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                        }`}>{unreadCount} unread</p>
                      )}
                    </div>
                    
                    {notifications.length > 0 ? (
                      <div className={`divide-y ${
                        theme === 'dark' ? 'divide-luxury-gray' : 'divide-gray-200'
                      }`}>
                        {notifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 cursor-pointer transition-colors ${
                              theme === 'dark'
                                ? `hover:bg-luxury-gray ${!notification.read ? 'bg-luxury-gray/50' : ''}`
                                : `hover:bg-gray-50 ${!notification.read ? 'bg-gray-50' : ''}`
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 w-2 h-2 rounded-full ${
                                !notification.read
                                  ? theme === 'dark' ? 'bg-gold' : 'bg-luxe-bronze'
                                  : 'bg-transparent'
                              }`} />
                              <div className="flex-1">
                                <p className={`font-medium text-sm ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {notification.title}
                                </p>
                                <p className={`text-sm mt-1 ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className={`w-12 h-12 mx-auto mb-3 ${
                          theme === 'dark' ? 'text-luxury-gray' : 'text-gray-400'
                        }`} />
                        <p className={`${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>No notifications</p>
                      </div>
                    )}

                    {notifications.length > 0 && (
                      <div className={`p-3 border-t ${
                        theme === 'dark' ? 'border-luxury-gray' : 'border-gray-200'
                      }`}>
                        <Link
                          to="/profile?tab=notifications"
                          onClick={() => setShowNotifications(false)}
                          className={`block text-center text-xs uppercase tracking-wider transition-colors ${
                            theme === 'dark'
                              ? 'text-gold hover:text-gold-light'
                              : 'text-luxe-bronze hover:text-luxe-bronze/80'
                          }`}
                        >
                          View all notifications
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart Icon - Desktop */}
              <Link
                to="/cart"
                className={`hidden md:flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-luxury-gray'
                    : 'hover:bg-gray-100'
                }`}
                title="Shopping Cart"
              >
                <ShoppingCart className={`w-5 h-5 transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-gold'
                    : 'text-gray-600 hover:text-luxe-bronze'
                }`} />
              </Link>

              {/* Profile Avatar - Desktop */}
              <Link
                to="/profile"
                className={`hidden md:flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                  theme === 'dark'
                    ? 'hover:bg-luxury-gray'
                    : 'hover:bg-gray-100'
                }`}
                title={`Profile - ${currentUser.name}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${
                  theme === 'dark' ? 'bg-gold' : 'bg-luxe-bronze'
                }`}>
                  <User className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-luxury-dark' : 'text-white'
                  }`} />
                </div>
                <span className={`text-sm transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-300 group-hover:text-gold'
                    : 'text-gray-600 group-hover:text-luxe-bronze'
                }`}>{currentUser.name}</span>
              </Link>

              {/* Sign out button */}
              <button
                className={`hidden md:inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider border transition-all duration-300 ${
                  theme === 'dark'
                    ? 'border-luxury-gray text-gray-300 hover:text-gold hover:border-gold'
                    : 'border-gray-300 text-gray-600 hover:text-luxe-bronze hover:border-luxe-bronze'
                }`}
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </>
          )}

          {/* mobile menu button */}
          <button
            className={`md:hidden p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-luxury-gray'
                : 'hover:bg-gray-100'
            }`}
            onClick={() => setNavOpen(o => !o)}
          >
            {navOpen ? (
              <X className={`w-6 h-6 ${
                theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
              }`} />
            ) : (
              <Menu className={`w-6 h-6 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`} />
            )}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {navOpen && pathname !== '/admin/login' && (
        <nav className={`md:hidden px-6 pb-4 space-y-2 border-t ${
          theme === 'dark'
            ? 'bg-luxury-charcoal border-luxury-gray'
            : 'bg-gray-50 border-gray-200'
        }`}>
          {/* User Profile Section - Mobile */}
          {authChecked && currentUser && (
            <Link
              to="/profile"
              onClick={() => setNavOpen(false)}
              className="flex items-center gap-3 py-3 border-b border-luxury-gray mb-2"
            >
              <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-luxury-dark" />
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-display">{currentUser.name}</p>
                <p className="text-gold text-xs uppercase tracking-wider">View Profile</p>
              </div>
            </Link>
          )}

          {menuItems.map(item => (
            <Link
              key={item.label}
              to={item.href}
              className={`block py-3 text-sm uppercase tracking-wider transition-colors ${
                theme === 'dark'
                  ? 'text-gray-300 hover:text-gold'
                  : 'text-gray-600 hover:text-luxe-bronze'
              }`}
              onClick={() => setNavOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {/* Cart link for mobile */}
          {authChecked && currentUser && (
            <Link
              to="/cart"
              className={`block py-3 text-sm uppercase tracking-wider flex items-center gap-2 transition-colors ${
                theme === 'dark'
                  ? 'text-gray-300 hover:text-gold'
                  : 'text-gray-600 hover:text-luxe-bronze'
              }`}
              onClick={() => setNavOpen(false)}
            >
              <ShoppingCart className="w-4 h-4" />
              Shopping Cart
            </Link>
          )}
          {authChecked && currentUser ? (
            <button
              className={`w-full mt-4 inline-flex items-center justify-center gap-2 border px-4 py-3 text-xs uppercase tracking-wider transition-all duration-300 ${
                theme === 'dark'
                  ? 'border-luxury-gray text-gray-300 hover:text-gold hover:border-gold'
                  : 'border-gray-300 text-gray-600 hover:text-luxe-bronze hover:border-luxe-bronze'
              }`}
              onClick={() => {
                setNavOpen(false);
                handleSignOut();
              }}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          ) : (
            pathname !== '/admin/login' && (
              <a
                href={(() => {
                  const loginUrl = getApiUrl('auth/junopay/login');
                  console.log('🔗 NavBar Login URL generated:', loginUrl);
                  return loginUrl;
                })()}
                onClick={() => setNavOpen(false)}
                className={`w-full mt-4 font-bold py-3 uppercase tracking-wider text-sm flex items-center justify-center transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-gold hover:bg-gold-dark text-luxury-dark'
                    : 'bg-luxe-bronze hover:bg-luxe-bronze/90 text-white'
                }`}
              >
                Login with Juno
              </a>
            )
          )}
        </nav>
      )}
    </header>
  );
}