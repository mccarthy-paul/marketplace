import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { Star, ChevronRight, Filter, X } from 'lucide-react';
import { formatPrice } from './utils/currency';
import { useTheme } from './contexts/ThemeContext.jsx';
import { apiGet, getImageUrl } from './utils/api';

const WatchList = () => {
  const { theme } = useTheme();
  const location = useLocation();
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Parse URL parameters on mount
  const getInitialFilters = () => {
    const searchParams = new URLSearchParams(location.search);
    return {
      brand: searchParams.get('brand') || '',
      model: searchParams.get('model') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      broker: searchParams.get('broker') || '',
      classifications: [] // Add classifications filter
    };
  };

  // Filter states
  const [filters, setFilters] = useState(getInitialFilters());

  // Available options for dropdowns (will be populated from data)
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [availableBrokers, setAvailableBrokers] = useState([]);
  const [allWatches, setAllWatches] = useState([]); // Store all watches for filtering models

  // Classifications options (alphabetically sorted)
  const classificationOptions = [
    'Automatic',
    'Dress',
    'Gold',
    "Men's",
    'Moon Phase',
    'Pocket',
    'Pre-Owned',
    'Skeleton',
    'Sports',
    "Women's"
  ];

  const fetchWatches = async (isInitialLoad = false) => {
    setLoading(true);

    try {
      // On initial load, fetch all watches first to populate dropdowns
      let allWatchesData = allWatches;
      if (isInitialLoad || allWatches.length === 0) {
        allWatchesData = await apiGet('/api/watches');
        setAllWatches(allWatchesData);
      }

      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.brand) queryParams.append('brand', filters.brand);
      if (filters.model) queryParams.append('model', filters.model);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      if (filters.broker) queryParams.append('broker', filters.broker);
      if (filters.classifications && filters.classifications.length > 0) {
        queryParams.append('classifications', filters.classifications.join(','));
      }

      const queryString = queryParams.toString();

      // Fetch filtered watches if there are filters, otherwise use all watches
      let data;
      if (queryString) {
        const url = `/api/watches?${queryString}`;
        data = await apiGet(url);
      } else {
        data = allWatchesData;
      }

      setWatches(data);

      // Extract unique brands and brokers for filter dropdowns from all watches
      const brands = [...new Set(allWatchesData.map(w => w.brand).filter(Boolean))].sort();
      const brokers = [...new Set(allWatchesData.map(w => w.owner?.company_name).filter(Boolean))].sort();
      setAvailableBrands(brands);
      setAvailableBrokers(brokers);

      // Update available models based on selected brand
      if (filters.brand) {
        const modelsForBrand = [...new Set(
          allWatchesData
            .filter(w => w.brand === filters.brand)
            .map(w => w.model)
            .filter(Boolean)
        )].sort();
        setAvailableModels(modelsForBrand);
      } else {
        setAvailableModels([]);
      }

      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if any filters are present from URL and show filter panel if so
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('brand') || searchParams.get('model') ||
        searchParams.get('minPrice') || searchParams.get('maxPrice') ||
        searchParams.get('broker')) {
      setShowFilters(true);
    }

    fetchWatches(true); // Initial load
  }, []); // Only fetch on mount

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));

    // If brand changed, update available models and reset model filter
    if (field === 'brand') {
      if (value) {
        const modelsForBrand = [...new Set(
          allWatches
            .filter(w => w.brand === value)
            .map(w => w.model)
            .filter(Boolean)
        )].sort();
        setAvailableModels(modelsForBrand);
      } else {
        setAvailableModels([]);
      }
      // Reset model selection when brand changes
      setFilters(prev => ({
        ...prev,
        brand: value,
        model: ''
      }));
    }
  };

  const handleClassificationChange = (classification) => {
    setFilters(prev => {
      const currentClassifications = prev.classifications || [];
      const updatedClassifications = currentClassifications.includes(classification)
        ? currentClassifications.filter(c => c !== classification)
        : [...currentClassifications, classification];
      return {
        ...prev,
        classifications: updatedClassifications
      };
    });
  };

  const applyFilters = () => {
    fetchWatches();
  };

  const clearFilters = () => {
    setFilters({
      brand: '',
      model: '',
      minPrice: '',
      maxPrice: '',
      broker: '',
      classifications: []
    });
    // Fetch watches after clearing filters
    setTimeout(() => fetchWatches(), 0);
  };

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'classifications') {
        return value && value.length > 0;
      }
      return value !== '';
    });
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-luxury-dark' : 'bg-gray-50'
      }`}>
        <div className={`text-xl font-display tracking-wider ${
          theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
        }`}>LOADING COLLECTION...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-luxury-dark' : 'bg-white'}`}>
      {/* Hero Section */}
      <div className={`relative h-64 overflow-hidden ${
        theme === 'dark' ? 'bg-luxury-charcoal' : 'bg-gradient-to-b from-gray-50 to-white'
      }`}>
        <div className={`absolute inset-0 ${
          theme === 'dark'
            ? 'bg-gradient-to-b from-luxury-dark/50 to-luxury-dark'
            : 'bg-gradient-to-b from-white/80 to-white'
        }`} />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center">
            <h1 className={`font-display text-5xl md:text-6xl mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>COLLECTION</h1>
            <div className={`w-32 h-0.5 mx-auto ${
              theme === 'dark' ? 'bg-gold' : 'bg-luxe-bronze'
            }`} />
            <p className={`mt-4 text-lg font-light ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Curated Luxury Timepieces</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter Section */}
        <div className={`mb-8 p-6 border ${
          theme === 'dark'
            ? 'bg-luxury-charcoal border-luxury-gray'
            : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-display flex items-center gap-3 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <Filter className={`w-5 h-5 ${
                theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
              }`} />
              <span className="tracking-wider">REFINE SEARCH</span>
              {hasActiveFilters() && (
                <span className={`text-xs px-3 py-1 ml-3 font-medium ${
                  theme === 'dark'
                    ? 'bg-gold text-luxury-dark'
                    : 'bg-luxe-bronze text-white'
                }`}>
                  ACTIVE
                </span>
              )}
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {showFilters ? (
                <>
                  <span className="text-sm uppercase tracking-wider">Hide</span>
                  <ChevronUpIcon className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span className="text-sm uppercase tracking-wider">Show</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Brand/Make Filter */}
                <div>
                  <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${
                    theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                  }`}>
                    Brand
                  </label>
                  <select
                    value={filters.brand}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                    className={`w-full px-4 py-3 border focus:outline-none transition-colors ${
                      theme === 'dark'
                        ? 'bg-luxury-dark border-luxury-gray text-white focus:border-gold'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-luxe-bronze'
                    }`}
                  >
                    <option value="">All Brands</option>
                    {availableBrands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                {/* Model Filter */}
                <div>
                  <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${
                    theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                  }`}>
                    Model {!filters.brand && <span className="text-gray-500 text-xs normal-case">(Select brand first)</span>}
                  </label>
                  <select
                    value={filters.model}
                    onChange={(e) => handleFilterChange('model', e.target.value)}
                    disabled={!filters.brand}
                    className={`w-full px-4 py-3 border focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      theme === 'dark'
                        ? 'bg-luxury-dark border-luxury-gray text-white focus:border-gold'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-luxe-bronze'
                    }`}
                  >
                    <option value="">All Models</option>
                    {availableModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>

                {/* Broker Filter */}
                <div>
                  <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${
                    theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                  }`}>
                    Dealer
                  </label>
                  <select
                    value={filters.broker}
                    onChange={(e) => handleFilterChange('broker', e.target.value)}
                    className={`w-full px-4 py-3 border focus:outline-none transition-colors ${
                      theme === 'dark'
                        ? 'bg-luxury-dark border-luxury-gray text-white focus:border-gold'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-luxe-bronze'
                    }`}
                  >
                    <option value="">All Dealers</option>
                    {availableBrokers.map(broker => (
                      <option key={broker} value={broker}>{broker}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Range Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${
                    theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                  }`}>
                    Min Price
                  </label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    placeholder="0"
                    min="0"
                    className={`w-full px-4 py-3 border placeholder-gray-500 focus:outline-none transition-colors ${
                      theme === 'dark'
                        ? 'bg-luxury-dark border-luxury-gray text-white focus:border-gold'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-luxe-bronze'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${
                    theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                  }`}>
                    Max Price
                  </label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="No limit"
                    min="0"
                    className={`w-full px-4 py-3 border placeholder-gray-500 focus:outline-none transition-colors ${
                      theme === 'dark'
                        ? 'bg-luxury-dark border-luxury-gray text-white focus:border-gold'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-luxe-bronze'
                    }`}
                  />
                </div>
              </div>

              {/* Classifications Filter */}
              <div>
                <label className={`block text-xs font-medium uppercase tracking-wider mb-3 ${
                  theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                }`}>
                  Classifications
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {classificationOptions.map(classification => (
                    <label
                      key={classification}
                      className={`flex items-center space-x-2 cursor-pointer p-2 border transition-colors ${
                        theme === 'dark'
                          ? 'border-luxury-gray hover:border-gold'
                          : 'border-gray-200 hover:border-luxe-bronze'
                      } ${
                        filters.classifications?.includes(classification)
                          ? theme === 'dark'
                            ? 'bg-gold/10 border-gold'
                            : 'bg-luxe-bronze/10 border-luxe-bronze'
                          : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.classifications?.includes(classification) || false}
                        onChange={() => handleClassificationChange(classification)}
                        className={`w-4 h-4 ${
                          theme === 'dark'
                            ? 'text-gold border-luxury-gray bg-luxury-dark focus:ring-gold'
                            : 'text-luxe-bronze border-gray-300 focus:ring-luxe-bronze'
                        }`}
                      />
                      <span className={`text-xs ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>{classification}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end">
                <button
                  onClick={clearFilters}
                  className={`px-6 py-2 border transition-all uppercase text-sm tracking-wider ${
                    theme === 'dark'
                      ? 'border-luxury-gray text-gray-400 hover:text-white hover:border-white'
                      : 'border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-400'
                  }`}
                >
                  Clear
                </button>
                <button
                  onClick={applyFilters}
                  className={`px-8 py-2 font-medium transition-all uppercase text-sm tracking-wider ${
                    theme === 'dark'
                      ? 'bg-gold text-luxury-dark hover:bg-gold-dark hover:text-white'
                      : 'bg-luxe-bronze text-white hover:bg-luxe-bronze/90'
                  }`}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className={`mb-8 font-light ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {watches.length === 0 ? (
            <p>No timepieces found matching your criteria.</p>
          ) : (
            <p className="text-sm uppercase tracking-wider">
              Showing {watches.length} {watches.length === 1 ? 'Result' : 'Results'}
            </p>
          )}
        </div>

        {/* Watch Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {watches.map(watch => {
            return (
              <div key={watch._id} className={`group border overflow-hidden transition-all duration-300 relative ${
                theme === 'dark'
                  ? 'bg-luxury-charcoal border-luxury-gray hover:border-gold'
                  : 'bg-white border-gray-200 hover:border-luxe-bronze hover:shadow-lg'
              }`}>
                {/* SOLD Overlay */}
                {watch.status === 'sold' && (
                  <div className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none ${
                    theme === 'dark' ? 'bg-luxury-dark/80' : 'bg-white/80'
                  }`}>
                    <div className="border-2 border-red-600 text-red-600 px-8 py-3 font-display text-2xl tracking-widest transform -rotate-12">
                      SOLD
                    </div>
                  </div>
                )}

                <Link to={`/watches/${watch._id}`} className="block">
                  <div className={`aspect-square overflow-hidden ${
                    theme === 'dark' ? 'bg-luxury-dark' : 'bg-gray-100'
                  }`}>
                    {watch.images?.[0] || watch.imageUrl ? (
                      <img
                        src={getImageUrl(watch.images?.[0] || watch.imageUrl) || `/images/watches/watch${(watch._id.charCodeAt(0) % 8) + 1}.jpg`}
                        alt={`${watch.brand} ${watch.model}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <img
                        src={`/images/watches/watch${(watch._id.charCodeAt(0) % 8) + 1}.jpg`}
                        alt={`${watch.brand} ${watch.model}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    )}
                  </div>
                  <div className="p-6">
                    <h2 className={`uppercase tracking-wider text-sm mb-1 ${
                      theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                    }`}>{watch.brand}</h2>
                    <p className={`text-lg font-light mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{watch.model}</p>
                    <p className="text-gray-500 text-xs mb-3">REF. {watch.reference_number}</p>

                    {/* Price Display */}
                    {watch.price ? (
                      <p className={`text-2xl font-display mb-3 ${
                        theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                      }`}>{formatPrice(watch.price, watch.currency)}</p>
                    ) : (
                      <p className={`text-sm mb-3 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>Price on request</p>
                    )}

                    {/* Current Bid Display */}
                    {watch.currentBid && watch.currentBid > 0 && (
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Current Bid: <span className={`${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{formatPrice(watch.currentBid, watch.currency)}</span>
                      </p>
                    )}

                    {/* Status */}
                    <div className="flex items-center justify-between mt-3">
                      <span className={`px-3 py-1 text-xs uppercase tracking-wider font-medium ${
                        watch.status === 'active' ? 'text-green-400 border border-green-400' :
                        watch.status === 'sold' ? 'text-red-400 border border-red-400' :
                        'text-yellow-400 border border-yellow-400'
                      }`}>
                        {watch.status}
                      </span>
                    </div>

                    {/* Condition */}
                    {watch.condition && (
                      <p className="text-xs text-gray-500 mt-2">
                        CONDITION: <span className="text-gray-400">{watch.condition.toUpperCase()}</span>
                      </p>
                    )}

                    {watch.owner && (
                      <div className={`mt-4 pt-4 border-t ${
                        theme === 'dark' ? 'border-luxury-gray' : 'border-gray-200'
                      }`}>
                        <Link
                          to={`/seller/${watch.owner._id}`}
                          className={`inline-flex items-center text-xs transition-colors ${
                            theme === 'dark'
                              ? 'text-gray-400 hover:text-gold'
                              : 'text-gray-500 hover:text-luxe-bronze'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="uppercase tracking-wider">{watch.owner.name || watch.owner.company_name}</span>
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Link>
                        {watch.owner.sellerStats?.averageRating > 0 && (
                          <div className="flex items-center mt-2">
                            <Star className={`w-3 h-3 fill-current ${
                              theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                            }`} />
                            <span className="text-xs text-gray-500 ml-1">
                              {watch.owner.sellerStats.averageRating.toFixed(1)} ({watch.owner.sellerStats.totalReviews})
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WatchList;