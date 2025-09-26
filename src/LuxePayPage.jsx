import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext.jsx';

const LuxePayPage = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-luxury-dark' : 'bg-white'}`}>
      {/* Hero Section with Image */}
      <div className="relative h-[80vh] overflow-hidden">
        <img
          src="/luxe24/Luxe 24 luxepay_files/luxepay-1.jpg"
          alt="LuxePay Premium Banking"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-display mb-6">
            LUXEPAY
          </h1>
          <div className="w-32 h-0.5 bg-gold mb-6" />
          <h2 className="text-3xl font-light mb-4 max-w-3xl">
            Luxury Deserves More Than Ordinary Banking
          </h2>
          <p className="text-xl font-light opacity-90 max-w-3xl">
            In the world of luxury, every detail matters.
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-6">
        {/* Introduction Section */}
        <div className="py-20 text-center">
          <p className={`text-xl md:text-2xl leading-relaxed font-light max-w-4xl mx-auto ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            A handcrafted watch, a bespoke suit, a rare piece of art - each represent craftsmanship,
            heritage, and precision. Yet when it comes to payments, many businesses and clients are
            still forced to rely on outdated, restrictive systems that fail to match the
            sophistication of the goods they accompany.
          </p>
        </div>

        {/* Second Image Section with Text */}
        <div className="relative mb-20 rounded-lg overflow-hidden">
          <img
            src="/luxe24/Luxe 24 luxepay_files/luxepay-2.jpg"
            alt="Luxury Financial Services"
            className="w-full h-[600px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            <p className="text-lg md:text-xl font-light max-w-4xl mx-auto text-center">
              That is why we created a payment gateway and banking platform designed exclusively
              for the luxury sector. For years, we have worked alongside high-net-worth clients
              and boutique stores, facilitating transactions for fine timepieces, rare collectables,
              exclusive experiences, and high-value services. We understand the nuances: the need
              for absolute discretion, instant approvals, and the ability to transact globally
              without limits.
            </p>
          </div>
        </div>

        {/* Services Grid */}
        <div className="py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* For Businesses */}
            <div className={`p-10 rounded-lg ${
              theme === 'dark' ? 'bg-luxury-charcoal' : 'bg-gray-50'
            }`}>
              <h3 className={`text-2xl md:text-3xl font-display mb-6 ${
                theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
              }`}>
                FOR BUSINESSES
              </h3>
              <p className={`text-lg font-light leading-relaxed ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Our solution is simple: we remove the barriers that frustrate your clients.
                No more declined cards, delayed payments, or limits that undermine the sale.
                Instead, we give you a seamless, secure portal that protects your brand
                reputation and enhances the buying experience.
              </p>
            </div>

            {/* For Clients */}
            <div className={`p-10 rounded-lg ${
              theme === 'dark' ? 'bg-luxury-charcoal' : 'bg-gray-50'
            }`}>
              <h3 className={`text-2xl md:text-3xl font-display mb-6 ${
                theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
              }`}>
                FOR CLIENTS
              </h3>
              <p className={`text-lg font-light leading-relaxed ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                We offer a new standard of banking, one where payments move at the pace of
                your lifestyle. Whether you're securing an investment piece in Geneva, booking
                a private villa in Dubai, or acquiring art in London, our platform ensures
                every transaction is effortless, discreet, and stress-free.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20">
          <h2 className={`text-3xl md:text-4xl font-display text-center mb-16 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Premium Banking Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`text-center p-8 ${
              theme === 'dark' ? 'bg-luxury-dark border border-luxury-gray' : 'bg-white border border-gray-200'
            }`}>
              <div className={`text-5xl mb-4 ${theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'}`}>
                ∞
              </div>
              <h4 className={`text-xl font-display mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                NO LIMITS
              </h4>
              <p className={`font-light ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Transaction limits that match your lifestyle, not restrict it
              </p>
            </div>

            <div className={`text-center p-8 ${
              theme === 'dark' ? 'bg-luxury-dark border border-luxury-gray' : 'bg-white border border-gray-200'
            }`}>
              <div className={`text-5xl mb-4 ${theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'}`}>
                ⚡
              </div>
              <h4 className={`text-xl font-display mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                INSTANT APPROVAL
              </h4>
              <p className={`font-light ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Real-time transaction processing without delays
              </p>
            </div>

            <div className={`text-center p-8 ${
              theme === 'dark' ? 'bg-luxury-dark border border-luxury-gray' : 'bg-white border border-gray-200'
            }`}>
              <div className={`text-5xl mb-4 ${theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'}`}>
                🔒
              </div>
              <h4 className={`text-xl font-display mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                ABSOLUTE PRIVACY
              </h4>
              <p className={`font-light ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Complete discretion with bank-grade security
              </p>
            </div>
          </div>
        </div>

        {/* Final Image Section */}
        <div className="relative mb-20 rounded-lg overflow-hidden">
          <img
            src="/luxe24/Luxe 24 luxepay_files/about-4.jpg"
            alt="Financial Craftsmanship"
            className="w-full h-[600px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            <h3 className="text-2xl md:text-3xl font-display text-center mb-6 max-w-4xl mx-auto">
              This is not everyday banking. This is financial craftsmanship, tailored for
              the world of luxury.
            </h3>
            <p className="text-lg font-light text-center max-w-3xl mx-auto">
              With us, you don't just make payments, you unlock the freedom to enjoy
              life's finest experiences without compromise.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className={`text-center py-16 px-8 mb-20 ${
          theme === 'dark' ? 'bg-luxury-charcoal' : 'bg-gray-50'
        }`}>
          <h2 className={`text-3xl md:text-4xl font-display mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Experience Premium Banking
          </h2>
          <p className={`text-lg font-light mb-8 max-w-2xl mx-auto ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Join the exclusive network of luxury businesses and discerning clients who
            have elevated their financial experience with LuxePay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/profile"
              className={`inline-flex items-center justify-center gap-3 px-8 py-4 text-sm uppercase tracking-wider transition-all ${
                theme === 'dark'
                  ? 'bg-gold text-luxury-dark hover:bg-gold-dark'
                  : 'bg-luxe-bronze text-white hover:bg-luxe-bronze/90'
              }`}
            >
              Apply for LuxePay
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="#"
              className={`inline-flex items-center justify-center gap-3 px-8 py-4 text-sm uppercase tracking-wider transition-all border-2 ${
                theme === 'dark'
                  ? 'border-gold text-gold hover:bg-gold hover:text-luxury-dark'
                  : 'border-luxe-bronze text-luxe-bronze hover:bg-luxe-bronze hover:text-white'
              }`}
            >
              Learn More
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuxePayPage;