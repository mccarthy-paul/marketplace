import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext.jsx';

const AboutSection = () => {
  const { theme } = useTheme();

  return (
    <section className={`py-24 ${
      theme === 'dark' ? 'bg-luxury-dark' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Title Section */}
        <div className="text-center mb-16">
          <h2 className={`font-display text-4xl md:text-5xl mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            THE MARKETPLACE REDEFINING LUXURY
          </h2>
          <div className={`w-32 h-0.5 mx-auto mb-8 ${
            theme === 'dark' ? 'bg-gold' : 'bg-luxe-bronze'
          }`} />
          <p className={`text-xl font-light max-w-3xl mx-auto ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            The world of luxury is built on rarity.
          </p>
        </div>

        {/* Hero Image with Text Overlay */}
        <div className="relative mb-20 rounded-lg overflow-hidden">
          <img
            src="/luxe24/Luxe 24 about_files/rolex_1.png"
            alt="Luxury Watch"
            className="w-full h-[600px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            <h3 className="text-3xl md:text-4xl font-display mb-4">
              Connecting Excellence
            </h3>
            <p className="text-lg font-light max-w-3xl">
              A watch with heritage reference, a handbag no longer in production, a diamond of perfect clarity -
              these are not items you buy; they are treasures to be found.
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-20">
          {/* Left Column - Image */}
          <div className="relative rounded-lg overflow-hidden">
            <img
              src="/luxe24/Luxe 24 about_files/frame_427321394.jpg"
              alt="Global Marketplace"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Column - Content */}
          <div className="flex flex-col justify-center">
            <h3 className={`text-2xl md:text-3xl font-display mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Global Marketplace
            </h3>
            <p className={`text-lg font-light mb-6 leading-relaxed ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              We have created a global marketplace specifically designed for the luxury industry -
              a platform where trusted dealers from every corner of the world come together to
              showcase their inventory.
            </p>
            <p className={`text-lg font-light mb-8 leading-relaxed ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              From highly sought-after staples to rare, investment-grade pieces, everything is
              now available within one ecosystem, backed by the same trust and discretion that
              defines the luxury sector.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          <div className={`p-8 border-2 ${
            theme === 'dark'
              ? 'border-luxury-gray bg-luxury-charcoal'
              : 'border-gray-200 bg-gray-50'
          }`}>
            <h4 className={`text-xl font-display mb-4 ${
              theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
            }`}>
              LOW FRICTION
            </h4>
            <p className={`font-light leading-relaxed ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Unlike conventional platforms weighed down by excessive costs and inefficiencies,
              ours is designed with the market in mind: low fees, high transparency, and seamless access.
              New dealers are joining daily, strengthening the network.
            </p>
          </div>

          <div className={`p-8 border-2 ${
            theme === 'dark'
              ? 'border-luxury-gray bg-luxury-charcoal'
              : 'border-gray-200 bg-gray-50'
          }`}>
            <h4 className={`text-xl font-display mb-4 ${
              theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
            }`}>
              FOR DEALERS
            </h4>
            <p className={`font-light leading-relaxed ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              A streamlined channel to move inventory efficiently, expand into new markets,
              and reach serious buyers without the barriers of traditional distribution.
              Peace of mind with access to a trusted network where supply meets demand.
            </p>
          </div>
        </div>

        {/* Final Image Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Left Column - Content */}
          <div className="flex flex-col justify-center order-2 md:order-1">
            <h3 className={`text-2xl md:text-3xl font-display mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              More Than a Marketplace
            </h3>
            <p className={`text-lg font-light mb-8 leading-relaxed ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              This is not just a marketplace, it is a solution to one of luxury's greatest challenges:
              connecting the right people to the right products, at the right moment. Whether you are
              fulfilling a client's request for a rare investment piece or seeking to elevate your
              own portfolio, our platform provides the confidence and clarity you need to act with certainty.
            </p>
            <Link
              to="/watches"
              className={`inline-flex items-center gap-3 px-8 py-4 text-sm uppercase tracking-wider transition-all border-2 w-fit ${
                theme === 'dark'
                  ? 'border-gold text-gold hover:bg-gold hover:text-luxury-dark'
                  : 'border-luxe-bronze text-luxe-bronze hover:bg-luxe-bronze hover:text-white'
              }`}
            >
              Explore Collection
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Right Column - Image */}
          <div className="relative rounded-lg overflow-hidden order-1 md:order-2">
            <img
              src="/luxe24/Luxe 24 about_files/about-5.jpg"
              alt="Luxury Experience"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;