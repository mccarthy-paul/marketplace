import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { User, Package, PlusCircle, LogOut, TrendingUp, Clock, Award, Shield } from 'lucide-react';
import { useTheme } from './contexts/ThemeContext.jsx';

export default function LoggedInPage() {
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWatches: 0,
    activeBids: 0,
    salesCompleted: 0
  });

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);

          // Fetch user stats
          fetchUserStats(data.user._id);
        } else {
          // not authenticated – kick back to landing page
          window.location.replace("/");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const fetchUserStats = async (userId) => {
    try {
      // Fetch watches owned by user
      const watchRes = await fetch(`/api/watches?owner=${userId}`, { credentials: "include" });
      if (watchRes.ok) {
        const watches = await watchRes.json();
        setStats(prev => ({ ...prev, totalWatches: watches.length }));
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Effect to read id_token from URL and store in local storage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idToken = urlParams.get('id_token');

    if (idToken) {
      localStorage.setItem('id_token', idToken);
      urlParams.delete('id_token');
      window.history.replaceState({}, document.title, `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`);
    }
  }, []);

  const quickActions = [
    {
      icon: <Package className="w-8 h-8" />,
      title: 'Browse Collection',
      description: 'Explore luxury timepieces',
      link: '/watches',
      color: 'gold'
    },
    {
      icon: <PlusCircle className="w-8 h-8" />,
      title: 'List a Watch',
      description: 'Sell your timepiece',
      link: '/add-watch',
      color: 'gold'
    },
    {
      icon: <User className="w-8 h-8" />,
      title: 'My Profile',
      description: 'Manage your account',
      link: '/profile',
      color: 'gold'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Market Trends',
      description: 'View market insights',
      link: '/watches',
      color: 'gold'
    }
  ];

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure Trading',
      description: 'Protected by Juno OAuth'
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Authenticated',
      description: 'Verified luxury watches'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Quick Deals',
      description: 'Fast and efficient trading'
    }
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-luxury-dark' : 'bg-gray-50'
      }`}>
        <div className={`text-xl font-display tracking-wider animate-pulse ${
          theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
        }`}>LOADING...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-luxury-dark' : 'bg-white'}`}>
      {/* Hero Welcome Section */}
      <section className={`relative h-96 overflow-hidden ${
        theme === 'dark' ? 'bg-luxury-charcoal' : 'bg-gradient-to-b from-gray-50 to-white'
      }`}>
        <div className={`absolute inset-0 ${
          theme === 'dark'
            ? 'bg-gradient-to-b from-luxury-dark/60 via-luxury-dark/40 to-luxury-dark'
            : 'bg-gradient-to-b from-white/90 via-transparent to-white'
        }`} />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center px-4 max-w-4xl mx-auto">
            <div className="mb-4 animate-fadeIn">
              <span className={`font-medium tracking-widest uppercase text-sm ${
                theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
              }`}>
                Welcome Back
              </span>
            </div>
            <h1 className={`font-display text-5xl md:text-7xl font-bold mb-4 animate-slideUp ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {user?.name || 'COLLECTOR'}
            </h1>
            <p className={`text-lg md:text-xl font-light animate-fadeIn animation-delay-200 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Your gateway to exclusive luxury timepieces
            </p>

            {/* Quick Stats */}
            <div className="flex justify-center gap-8 mt-8 animate-fadeIn animation-delay-400">
              <div className="text-center">
                <div className={`text-3xl font-display ${
                  theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                }`}>{stats.totalWatches}</div>
                <div className={`text-xs uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>Watches Listed</div>
              </div>
              <div className={`border-l ${
                theme === 'dark' ? 'border-luxury-gray' : 'border-gray-300'
              }`} />
              <div className="text-center">
                <div className={`text-3xl font-display ${
                  theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                }`}>{stats.activeBids}</div>
                <div className={`text-xs uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>Active Bids</div>
              </div>
              <div className={`border-l ${
                theme === 'dark' ? 'border-luxury-gray' : 'border-gray-300'
              }`} />
              <div className="text-center">
                <div className={`text-3xl font-display ${
                  theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                }`}>{stats.salesCompleted}</div>
                <div className={`text-xs uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>Completed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section className={`py-16 ${
        theme === 'dark' ? 'bg-luxury-dark' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className={`font-display text-3xl md:text-4xl mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              QUICK ACTIONS
            </h2>
            <div className={`w-24 h-0.5 mx-auto ${
              theme === 'dark' ? 'bg-gold' : 'bg-luxe-bronze'
            }`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className={`group p-6 transition-all duration-300 border ${
                  theme === 'dark'
                    ? 'bg-luxury-charcoal border-luxury-gray hover:border-gold'
                    : 'bg-white border-gray-200 hover:border-luxe-bronze hover:shadow-lg'
                }`}
              >
                <div className={`mb-4 group-hover:scale-110 transition-transform ${
                  theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                }`}>
                  {action.icon}
                </div>
                <h3 className={`font-display text-xl mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {action.title}
                </h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-16 border-t ${
        theme === 'dark'
          ? 'bg-luxury-charcoal border-luxury-gray'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className={`mb-4 flex justify-center ${
                  theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                }`}>
                  {feature.icon}
                </div>
                <h3 className={`text-lg font-display mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                <p className={`text-sm font-light ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className={`py-16 ${
        theme === 'dark' ? 'bg-luxury-dark' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className={`font-display text-3xl md:text-4xl mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              YOUR MARKETPLACE
            </h2>
            <div className={`w-24 h-0.5 mx-auto mb-6 ${
              theme === 'dark' ? 'bg-gold' : 'bg-luxe-bronze'
            }`} />
            <p className={`font-light ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Manage your collection and explore new opportunities
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className={`border p-8 ${
              theme === 'dark'
                ? 'bg-luxury-charcoal border-luxury-gray'
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <h3 className={`uppercase tracking-wider text-sm mb-6 ${
                theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
              }`}>
                Quick Links
              </h3>
              <div className="space-y-4">
                <Link to="/profile" className={`flex items-center justify-between transition-colors ${
                  theme === 'dark'
                    ? 'text-white hover:text-gold'
                    : 'text-gray-700 hover:text-luxe-bronze'
                }`}>
                  <span>View Your Listings</span>
                  <span>→</span>
                </Link>
                <Link to="/watches" className={`flex items-center justify-between transition-colors ${
                  theme === 'dark'
                    ? 'text-white hover:text-gold'
                    : 'text-gray-700 hover:text-luxe-bronze'
                }`}>
                  <span>Browse New Arrivals</span>
                  <span>→</span>
                </Link>
                <Link to="/add-watch" className={`flex items-center justify-between transition-colors ${
                  theme === 'dark'
                    ? 'text-white hover:text-gold'
                    : 'text-gray-700 hover:text-luxe-bronze'
                }`}>
                  <span>List a New Watch</span>
                  <span>→</span>
                </Link>
                <Link to="/profile" className={`flex items-center justify-between transition-colors ${
                  theme === 'dark'
                    ? 'text-white hover:text-gold'
                    : 'text-gray-700 hover:text-luxe-bronze'
                }`}>
                  <span>Account Settings</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            <div className={`border p-8 ${
              theme === 'dark'
                ? 'bg-luxury-charcoal border-luxury-gray'
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <h3 className={`uppercase tracking-wider text-sm mb-6 ${
                theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
              }`}>
                Market Highlights
              </h3>
              <div className={`space-y-4 text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <p>• New Rolex Submariner collection now available</p>
                <p>• Patek Philippe Nautilus in high demand</p>
                <p>• Vintage Omega Speedmaster trending up 15%</p>
                <p>• Authentication services now available</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 border-t ${
        theme === 'dark'
          ? 'bg-luxury-charcoal border-luxury-gray'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className={`font-display text-3xl md:text-5xl mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            START TRADING TODAY
          </h2>
          <p className={`text-lg mb-10 font-light ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Join thousands of collectors in the premier luxury watch marketplace
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/watches"
              className={`inline-block px-8 py-4 font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-gold text-luxury-dark hover:bg-gold-dark hover:text-white'
                  : 'bg-luxe-bronze text-white hover:bg-luxe-bronze/90'
              }`}
            >
              EXPLORE COLLECTION
            </Link>
            <Link
              to="/add-watch"
              className={`inline-block px-8 py-4 border-2 font-semibold transition-all ${
                theme === 'dark'
                  ? 'border-white text-white hover:bg-white hover:text-luxury-dark'
                  : 'border-luxe-bronze text-luxe-bronze hover:bg-luxe-bronze hover:text-white'
              }`}
            >
              LIST YOUR WATCH
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}