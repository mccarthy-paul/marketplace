import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext.jsx';
import AboutSection from './AboutSection.jsx';
import { getApiUrl, apiGet, getImageUrl } from './utils/api.js';

export default function HomePage() {
  const { theme } = useTheme();
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [featuredWatches, setFeaturedWatches] = useState([]);
  const [allFeaturedWatches, setAllFeaturedWatches] = useState([]);
  const [featuredStartIndex, setFeaturedStartIndex] = useState(0);

  const heroImages = [
    '/images/luxe24/homepage-frame-2.jpg',
    '/images/luxe24/hero02.png',
    '/images/luxe24/hero03.png'
  ].map(getImageUrl);

  const brandLogos = [
    { name: 'Rolex', logo: getImageUrl('/images/luxe24/rolex-logo.png') },
    { name: 'Patek Philippe', logo: getImageUrl('/images/luxe24/patek-philippe-logo.png') },
    { name: 'Richard Mille', logo: getImageUrl('/images/luxe24/richard-mille-logo.png') },
    { name: 'Breitling', logo: getImageUrl('/images/luxe24/breitling-logo.png') },
    { name: 'Tudor', logo: getImageUrl('/images/luxe24/tudor-logo.svg') },
    { name: 'Panerai', logo: getImageUrl('/images/luxe24/panerai-logo.svg') },
    { name: 'Audemars Piguet', logo: getImageUrl('/images/luxe24/audemars-piguet.png') },
    { name: 'Bulgari', logo: getImageUrl('/images/luxe24/bulgari-logo.png') },
    { name: 'Breguet', logo: getImageUrl('/images/luxe24/breguet-watch-logo_1.png') }
  ];

  const categories = [
    {
      title: 'Sport Watches',
      image: getImageUrl('/images/luxe24/cat01.png'),
      description: 'Built for adventure and precision'
    },
    {
      title: 'Dress Watches',
      image: getImageUrl('/images/luxe24/cat02.png'),
      description: 'Elegant timepieces for special occasions'
    },
    {
      title: 'Vintage Collection',
      image: getImageUrl('/images/luxe24/cat03.png'),
      description: 'Classic watches with timeless appeal'
    }
  ];

  const features = [
    {
      icon: '🔒',
      title: 'Secure Authentication',
      description: 'Protected by Juno OAuth 2.1'
    },
    {
      icon: '⚡',
      title: 'Instant Verification',
      description: 'All watches authenticated by experts'
    },
    {
      icon: '🌍',
      title: 'Global Marketplace',
      description: 'Buy and sell worldwide'
    },
    {
      icon: '💎',
      title: 'Premium Selection',
      description: 'Curated luxury timepieces'
    }
  ];

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/me', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
        setAuthChecked(true);
      } catch (err) {
        console.error('Error fetching current user:', err);
        setAuthChecked(true);
      }
    };

    const fetchFeaturedWatches = async () => {
      try {
        const data = await apiGet('/api/watches/featured');
        const watches = data.watches || [];
        setAllFeaturedWatches(watches);

        // If we have featured watches, show the first 3
        if (watches.length > 0) {
          setFeaturedWatches(watches.slice(0, Math.min(3, watches.length)));
        }
      } catch (err) {
        console.error('Error fetching featured watches:', err);
        // Fallback to regular watches if featured endpoint fails
        try {
          const data = await apiGet('/api/watches');
          const watches = data.watches || data || [];
          setFeaturedWatches(watches.slice(0, 3));
        } catch (fallbackErr) {
          console.error('Error fetching fallback watches:', fallbackErr);
        }
      }
    };

    fetchCurrentUser();
    fetchFeaturedWatches();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rotate featured watches if more than 3
  useEffect(() => {
    if (allFeaturedWatches.length > 3) {
      const interval = setInterval(() => {
        setFeaturedStartIndex((prev) => {
          const nextIndex = (prev + 3) % allFeaturedWatches.length;
          const endIndex = nextIndex + 3;

          // Get the next 3 watches, wrapping around if necessary
          const nextWatches = [];
          for (let i = nextIndex; i < Math.min(endIndex, nextIndex + 3); i++) {
            nextWatches.push(allFeaturedWatches[i % allFeaturedWatches.length]);
          }

          setFeaturedWatches(nextWatches);
          return nextIndex;
        });
      }, 6000); // Rotate every 6 seconds

      return () => clearInterval(interval);
    }
  }, [allFeaturedWatches]);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-luxury-dark' : 'bg-gray-50'}`}>
      {/* Promotional Top Bar - Light Theme Only */}
      {theme === 'light' && (
        <div className="bg-luxe-bronze text-white text-center py-2 text-sm font-medium">
          Have you tried the JUNO app? Discover now!
        </div>
      )}

      {/* Hero Section */}
      <section className={`relative ${theme === 'dark' ? 'h-screen' : 'h-[80vh]'} flex items-center justify-center overflow-hidden`}>
        {/* Background Images with Fade Effect */}
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentHeroIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt="Luxury watch"
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 ${
              theme === 'dark'
                ? 'bg-gradient-to-b from-luxury-dark/60 via-luxury-dark/40 to-luxury-dark'
                : 'bg-gradient-to-b from-black/30 via-black/20 to-white/10'
            }`} />
          </div>
        ))}

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          {authChecked && currentUser && (
            <div className="mb-6 animate-fadeIn">
              <span className={`font-medium tracking-widest uppercase text-sm ${
                theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
              }`}>
                Welcome Back, {currentUser.name}
              </span>
            </div>
          )}

          <h3 className="text-gold uppercase tracking-[0.3em] text-sm font-semibold mb-4 animate-fadeIn">FEATURED</h3>
          <h1 className={`font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-slideUp ${
            theme === 'dark' ? 'text-white' : 'text-white'
          }`}>
            Discover Your Dream<br/>
            Timepiece From <span className="text-gold">Rolex</span>
          </h1>

          <p className={`text-lg md:text-xl mb-10 max-w-3xl mx-auto font-light animate-fadeIn animation-delay-200 ${
            theme === 'dark' ? 'text-gray-300' : 'text-white'
          }`}>
            Experience the premier marketplace for luxury watches.<br/>
            Authenticated, verified, and delivered with confidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeIn animation-delay-400">
            {!currentUser ? (
              <>
                <a
                  href={(() => {
                    const loginUrl = getApiUrl('auth/junopay/login');
                    console.log('🔗 HomePage Login URL generated:', loginUrl);
                    return loginUrl;
                  })()}
                  className={`group relative px-8 py-4 font-semibold rounded-none overflow-hidden transition-all ${
                    theme === 'dark'
                      ? 'bg-gold text-luxury-dark hover:text-white'
                      : 'bg-luxe-bronze text-white hover:bg-luxe-bronze/90'
                  }`}
                >
                  <span className="relative z-10">LOGIN WITH JUNO</span>
                  {theme === 'dark' && (
                    <div className="absolute inset-0 bg-gold-dark transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  )}
                </a>
                <Link
                  to="/watches"
                  className={`px-8 py-4 border-2 font-semibold transition-all ${
                    theme === 'dark'
                      ? 'border-white text-white hover:bg-white hover:text-luxury-dark'
                      : 'border-white text-white hover:bg-white hover:text-luxe-bronze'
                  }`}
                >
                  BROWSE COLLECTION
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/watches"
                  className={`group relative px-8 py-4 font-semibold rounded-none overflow-hidden transition-all ${
                    theme === 'dark'
                      ? 'bg-gold text-luxury-dark hover:text-white'
                      : 'bg-luxe-bronze text-white hover:bg-luxe-bronze/90'
                  }`}
                >
                  <span className="relative z-10">EXPLORE WATCHES</span>
                  {theme === 'dark' && (
                    <div className="absolute inset-0 bg-gold-dark transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  )}
                </Link>
                <Link
                  to="/add-watch"
                  className={`px-8 py-4 border-2 font-semibold transition-all ${
                    theme === 'dark'
                      ? 'border-white text-white hover:bg-white hover:text-luxury-dark'
                      : 'border-white text-white hover:bg-white hover:text-luxe-bronze'
                  }`}
                >
                  LIST YOUR WATCH
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce ${
          theme === 'dark' ? 'text-white' : 'text-white'
        }`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Brand Logos Section */}
      <section className={`py-20 ${
        theme === 'dark'
          ? 'bg-luxury-charcoal border-y border-luxury-gray'
          : 'bg-white'
      }`}>
        <div className="w-full px-8">
          <div className="flex justify-between items-center mb-12 max-w-7xl mx-auto">
            <h3 className={`text-3xl font-display uppercase tracking-wider ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>EXPLORE BRANDS</h3>
            <a href="/watches" className={`flex items-center gap-2 text-sm uppercase tracking-wider ${
              theme === 'dark' ? 'text-gold hover:text-gold-dark' : 'text-luxe-bronze hover:text-luxe-bronze-dark'
            } transition-colors`}>
              <span>View All</span>
              <svg width="6" height="9" viewBox="0 0 6 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4.5L0 8.5L0 0.5L6 4.5Z" fill="currentColor"/>
              </svg>
            </a>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-12 items-center justify-items-center">
            {brandLogos.map((brand, index) => (
              <Link
                key={index}
                to={`/watches?brand=${encodeURIComponent(brand.name)}`}
                className={`transition-all cursor-pointer flex items-center justify-center ${
                  theme === 'dark'
                    ? 'hover:scale-110 grayscale hover:grayscale-0'
                    : 'hover:scale-110 opacity-70 hover:opacity-100'
                }`}
                title={`View ${brand.name} watches`}
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="h-12 md:h-14 lg:h-16 w-auto object-contain max-w-[120px] md:max-w-[140px] lg:max-w-[160px]"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Category Section */}
      <section className={`py-20 ${
        theme === 'dark' ? 'bg-luxury-dark' : 'bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className={`font-display text-3xl md:text-4xl mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              BROWSE BY STYLE
            </h2>
            <div className={`w-24 h-0.5 mx-auto ${
              theme === 'dark' ? 'bg-gold' : 'bg-luxe-bronze'
            }`} />
            <p className={`mt-4 text-lg font-light ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Find your perfect timepiece by category
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { name: "Men's", icon: '👔' },
              { name: 'Sports', icon: '⚽' },
              { name: 'Dress', icon: '🎩' },
              { name: 'Gold', icon: '✨' },
              { name: 'Pre-Owned', icon: '🕐' }
            ].map(category => (
              <Link
                key={category.name}
                to={`/watches?classifications=${encodeURIComponent(category.name)}`}
                className={`group border-2 p-6 text-center transition-all ${
                  theme === 'dark'
                    ? 'border-luxury-gray hover:border-gold bg-luxury-charcoal hover:bg-gold/10'
                    : 'border-gray-200 hover:border-luxe-bronze bg-white hover:bg-luxe-bronze/5'
                }`}
              >
                <div className="text-3xl mb-3">{category.icon}</div>
                <h3 className={`font-medium uppercase tracking-wider text-sm ${
                  theme === 'dark'
                    ? 'text-gray-300 group-hover:text-gold'
                    : 'text-gray-700 group-hover:text-luxe-bronze'
                }`}>
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/watches"
              className={`inline-flex items-center gap-2 text-sm uppercase tracking-wider transition-colors ${
                theme === 'dark'
                  ? 'text-gold hover:text-gold-dark'
                  : 'text-luxe-bronze hover:text-luxe-bronze/80'
              }`}
            >
              View All Categories
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section - Light Theme Only */}
      {theme === 'light' && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl text-gray-900 mb-4">
                EXPLORE COLLECTIONS
              </h2>
              <div className="w-24 h-0.5 bg-luxe-bronze mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {categories.map((category, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-luxe-bronze uppercase tracking-wider text-sm mb-2 font-semibold">
                      {category.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {category.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Watches */}
      {featuredWatches.length > 0 && (
        <section className={`py-24 ${
          theme === 'dark' ? 'bg-luxury-dark' : 'bg-white'
        }`}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className={`font-display text-4xl md:text-5xl mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                FEATURED TIMEPIECES
              </h2>
              <div className={`w-24 h-0.5 mx-auto ${
                theme === 'dark' ? 'bg-gold' : 'bg-luxe-bronze'
              }`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredWatches.map((watch) => (
                <Link
                  key={watch._id}
                  to={`/watches/${watch._id}`}
                  className={`group relative overflow-hidden ${
                    theme === 'dark' ? 'bg-luxury-charcoal' : 'bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-2xl'
                  } transition-all duration-300`}
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={getImageUrl((watch.images && watch.images.length > 0) ? watch.images[0] : watch.imageUrl) || getImageUrl(`/images/watches/watch${(watch._id.charCodeAt(0) % 8) + 1}.jpg`)}
                      alt={`${watch.brand} ${watch.model}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className={`uppercase tracking-wider text-sm mb-2 ${
                      theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                    }`}>
                      {watch.brand}
                    </h3>
                    <p className={`text-lg font-light mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {watch.model}
                    </p>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Ref. {watch.reference_number}
                    </p>
                    {watch.price && (
                      <p className={`text-xl mt-4 font-display ${
                        theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                      }`}>
                        ${watch.price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                to="/watches"
                className={`inline-block px-8 py-3 border transition-all ${
                  theme === 'dark'
                    ? 'border-gold text-gold hover:bg-gold hover:text-luxury-dark'
                    : 'border-luxe-bronze text-luxe-bronze hover:bg-luxe-bronze hover:text-white'
                }`}
              >
                VIEW ALL WATCHES
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <AboutSection />

      {/* Features Section */}
      <section className={`py-24 ${
        theme === 'dark' ? 'bg-luxury-charcoal' : 'bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className={`text-xl font-display mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                <p className={`font-light ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-32 relative overflow-hidden ${
        theme === 'dark' ? 'bg-luxury-dark' : 'bg-luxe-bronze'
      }`}>
        {theme === 'dark' && (
          <div className="absolute inset-0 opacity-10">
            <img
              src={getImageUrl("/images/watches/watch6.jpg")}
              alt="Background"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <h2 className={`font-display text-4xl md:text-6xl mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-white'
          }`}>
            START YOUR COLLECTION
          </h2>
          <p className={`text-xl mb-10 font-light ${
            theme === 'dark' ? 'text-gray-300' : 'text-white/90'
          }`}>
            Join thousands of collectors trading luxury timepieces with confidence
          </p>
          {!currentUser ? (
            <a
              href={(() => {
                const loginUrl = getApiUrl('auth/junopay/login');
                console.log('🔗 HomePage CTA Login URL generated:', loginUrl);
                return loginUrl;
              })()}
              className={`inline-block px-10 py-4 font-semibold text-lg transition-all ${
                theme === 'dark'
                  ? 'bg-gold text-luxury-dark hover:bg-gold-dark hover:text-white'
                  : 'bg-white text-luxe-bronze hover:bg-gray-100'
              }`}
            >
              GET STARTED
            </a>
          ) : (
            <Link
              to="/add-watch"
              className={`inline-block px-10 py-4 font-semibold text-lg transition-all ${
                theme === 'dark'
                  ? 'bg-gold text-luxury-dark hover:bg-gold-dark hover:text-white'
                  : 'bg-white text-luxe-bronze hover:bg-gray-100'
              }`}
            >
              LIST YOUR FIRST WATCH
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}