import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext.jsx';

const AboutPage = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-luxury-dark' : 'bg-white'}`}>
      {/* Hero Section */}
      <div className="relative h-[70vh] overflow-hidden">
        <img
          src="/luxe24/Luxe 24 about_files/rolex_1.png"
          alt="Luxury Watch"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-display mb-6">
            ABOUT LUXE 24
          </h1>
          <div className="w-32 h-0.5 bg-gold mb-6" />
          <p className="text-2xl font-light max-w-3xl">
            The Marketplace Redefining Luxury Sourcing
          </p>
          <p className="text-lg font-light mt-4 max-w-3xl opacity-90">
            The world of luxury is built on rarity.
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Introduction */}
        <div className={`max-w-4xl mx-auto text-center mb-24 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <p className="text-xl leading-relaxed font-light mb-8">
            A watch with a heritage reference, a handbag no longer in production, a diamond of perfect clarity -
            these are not items you buy; they are treasures to be found. Yet for dealers, brokers, and clients alike,
            the challenge has always been the same: how do you reliably access such pieces without navigating a maze
            of fragmented networks, opaque pricing, and endless waiting?
          </p>
        </div>

        {/* Global Marketplace Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
          <div className="relative rounded-lg overflow-hidden">
            <img
              src="/luxe24/Luxe 24 about_files/frame_427321394.jpg"
              alt="Global Marketplace"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className={`text-3xl md:text-4xl font-display mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              A Global Ecosystem
            </h2>
            <p className={`text-lg font-light leading-relaxed mb-6 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              We have created a global marketplace specifically designed for the luxury industry -
              a platform where trusted dealers from every corner of the world come together to showcase their inventory.
              From highly sought-after staples to rare, investment-grade pieces, everything is now available within
              one ecosystem, backed by the same trust and discretion that defines the luxury sector.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className={`py-20 ${
          theme === 'dark' ? 'bg-luxury-charcoal' : 'bg-gray-50'
        } -mx-6 px-6 mb-24`}>
          <h2 className={`text-3xl md:text-4xl font-display text-center mb-16 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Our Advantages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className={`p-8 ${
              theme === 'dark' ? 'bg-luxury-dark' : 'bg-white'
            }`}>
              <h3 className={`text-xl font-display mb-4 ${
                theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
              }`}>
                LOW FRICTION
              </h3>
              <p className={`font-light leading-relaxed ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Unlike conventional platforms weighed down by excessive costs and inefficiencies,
                ours is designed with the market in mind: low fees, high transparency, and seamless access.
                New dealers are joining daily, strengthening the network and ensuring that both businesses
                and clients benefit from an ever-expanding choice of extraordinary goods.
              </p>
            </div>

            <div className={`p-8 ${
              theme === 'dark' ? 'bg-luxury-dark' : 'bg-white'
            }`}>
              <h3 className={`text-xl font-display mb-4 ${
                theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
              }`}>
                FOR DEALERS
              </h3>
              <p className={`font-light leading-relaxed ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                This means a streamlined channel to move inventory efficiently, expand into new markets,
                and reach serious buyers without the barriers of traditional distribution. For brokers and
                high-net-worth clients, it means something even more valuable: peace of mind. Access a
                trusted network where supply meets demand, discreetly and securely.
              </p>
            </div>

            <div className={`p-8 ${
              theme === 'dark' ? 'bg-luxury-dark' : 'bg-white'
            }`}>
              <h3 className={`text-xl font-display mb-4 ${
                theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
              }`}>
                SECURE AUTHENTICATION
              </h3>
              <p className={`font-light leading-relaxed ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Protected by Juno OAuth 2.1, our platform ensures that every transaction is secure
                and every user is verified. We combine cutting-edge technology with the traditional
                values of trust and discretion that have always defined the luxury market.
              </p>
            </div>

            <div className={`p-8 ${
              theme === 'dark' ? 'bg-luxury-dark' : 'bg-white'
            }`}>
              <h3 className={`text-xl font-display mb-4 ${
                theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
              }`}>
                INSTANT VERIFICATION
              </h3>
              <p className={`font-light leading-relaxed ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                All watches are authenticated by experts before listing. Our rigorous verification process
                ensures that every piece meets our exacting standards, giving buyers complete confidence
                in their acquisitions.
              </p>
            </div>
          </div>
        </div>

        {/* Solution Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
          <div className="flex flex-col justify-center order-2 md:order-1">
            <h2 className={`text-3xl md:text-4xl font-display mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              More Than a Marketplace
            </h2>
            <p className={`text-lg font-light leading-relaxed mb-6 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              This is not just a marketplace, it is a solution to one of luxury's greatest challenges:
              connecting the right people to the right products, at the right moment.
            </p>
            <p className={`text-lg font-light leading-relaxed mb-8 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Whether you are fulfilling a client's request for a rare investment piece or seeking to
              elevate your own portfolio, our platform provides the confidence and clarity you need to
              act with certainty.
            </p>
          </div>
          <div className="relative rounded-lg overflow-hidden order-1 md:order-2">
            <img
              src="/luxe24/Luxe 24 about_files/about-5.jpg"
              alt="Solution"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Call to Action */}
        <div className={`text-center py-16 px-8 ${
          theme === 'dark' ? 'bg-luxury-charcoal' : 'bg-gray-50'
        }`}>
          <h2 className={`text-3xl md:text-4xl font-display mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Start Your Journey
          </h2>
          <p className={`text-lg font-light mb-8 max-w-2xl mx-auto ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Join the world's premier luxury watch marketplace and discover extraordinary timepieces
            from trusted dealers worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/watches"
              className={`inline-flex items-center justify-center gap-3 px-8 py-4 text-sm uppercase tracking-wider transition-all ${
                theme === 'dark'
                  ? 'bg-gold text-luxury-dark hover:bg-gold-dark'
                  : 'bg-luxe-bronze text-white hover:bg-luxe-bronze/90'
              }`}
            >
              Browse Collection
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/profile"
              className={`inline-flex items-center justify-center gap-3 px-8 py-4 text-sm uppercase tracking-wider transition-all border-2 ${
                theme === 'dark'
                  ? 'border-gold text-gold hover:bg-gold hover:text-luxury-dark'
                  : 'border-luxe-bronze text-luxe-bronze hover:bg-luxe-bronze hover:text-white'
              }`}
            >
              Sell Your Watch
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;