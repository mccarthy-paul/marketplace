import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, ShoppingCart, Bell } from 'lucide-react';
import { apiGet, apiPost, apiPut } from './utils/api.js';

export default function NavBar({ navOpen, setNavOpen }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
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
      const response = await apiGet('/api/notifications/recent?limit=5');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
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
    { label: 'Marketplace', href: '/watches' },
    { label: 'Watch Brands', href: '#' },
    { label: 'Sell a Watch', href: '#' },
    { label: 'Magazine', href: '#' },
    { label: 'Watch Collection', href: '/watches' }
  ];

  const handleSignOut = async () => {
    try {
      console.log('Frontend: Starting logout process...');
      
      // Clear all client-side storage including PKCE values
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

      console.log('Frontend: Calling logout API...');
      const response = await apiPost("/auth/junopay/logout");
      const result = await response.json();
      console.log('Frontend: Logout API response:', result);
      
      // Try multiple approaches to clear JunoPay's session
      console.log('Frontend: Attempting to clear JunoPay web session...');
      
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
      
      // Clear the current user state immediately
      setCurrentUser(null);
      setAuthChecked(true);
      
      // If API signals to clear storage, do it again (in case of race condition)
      if (result.clearStorage) {
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
    <header className="bg-[#2a2a29] text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-bold tracking-tight">Luxe24.1 Marketplace</Link>

        {/* desktop menu */}
        {pathname !== '/admin/login' && (
          <nav className="hidden md:flex items-center gap-6 text-sm lg:text-base">
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
              {/* Notifications Icon - Desktop */}
              <div ref={notificationRef} className="relative hidden md:block">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-6 h-6 text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <p className="text-sm text-gray-500">{unreadCount} unread</p>
                      )}
                    </div>
                    
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 hover:bg-gray-50 cursor-pointer ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 w-2 h-2 rounded-full ${
                                !notification.read ? 'bg-blue-500' : 'bg-transparent'
                              }`} />
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No notifications</p>
                      </div>
                    )}
                    
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-gray-200">
                        <Link
                          to="/profile?tab=notifications"
                          onClick={() => setShowNotifications(false)}
                          className="block text-center text-sm text-[#3ab54a] hover:text-[#32a042]"
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
                className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition-colors"
                title="Shopping Cart"
              >
                <ShoppingCart className="w-6 h-6 text-white" />
              </Link>

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
          {/* Cart link for mobile */}
          {authChecked && currentUser && (
            <Link
              to="/cart"
              className="block py-2 text-sm text-white/90 hover:text-[#3ab54a] flex items-center gap-2"
              onClick={() => setNavOpen(false)}
            >
              <ShoppingCart className="w-4 h-4" />
              Shopping Cart
            </Link>
          )}
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