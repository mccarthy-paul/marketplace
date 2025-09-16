import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { Star, ChevronRight } from 'lucide-react';
import { formatPrice } from './utils/currency';

const WatchList = () => {
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    brand: '',
    model: '',
    minPrice: '',
    maxPrice: '',
    broker: ''
  });
  
  // Available options for dropdowns (will be populated from data)
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [availableBrokers, setAvailableBrokers] = useState([]);
  const [allWatches, setAllWatches] = useState([]); // Store all watches for filtering models

  const fetchWatches = async () => {
    setLoading(true);
    
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters.brand) queryParams.append('brand', filters.brand);
    if (filters.model) queryParams.append('model', filters.model);
    if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
    if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
    if (filters.broker) queryParams.append('broker', filters.broker);
    
    const queryString = queryParams.toString();
    const url = `/api/watches${queryString ? `?${queryString}` : ''}`;
    
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setWatches(data);
      
      // If this is the initial load (no filters), store all watches
      if (!queryString) {
        setAllWatches(data);
      }
      
      // Extract unique brands and brokers for filter dropdowns
      const brands = [...new Set((queryString ? allWatches : data).map(w => w.brand).filter(Boolean))].sort();
      const brokers = [...new Set((queryString ? allWatches : data).map(w => w.owner?.company_name).filter(Boolean))].sort();
      setAvailableBrands(brands);
      setAvailableBrokers(brokers);
      
      // Update available models based on selected brand
      if (filters.brand) {
        const modelsForBrand = [...new Set(
          allWatches
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
    fetchWatches();
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

  const applyFilters = () => {
    fetchWatches();
  };

  const clearFilters = () => {
    setFilters({
      brand: '',
      model: '',
      minPrice: '',
      maxPrice: '',
      broker: ''
    });
    // Fetch watches after clearing filters
    setTimeout(() => fetchWatches(), 0);
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '');
  };

  if (loading) {
    return <div className="text-center text-xl mt-8 text-gray-700">Loading watches...</div>;
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-center text-gray-800 mb-8">Watch Marketplace</h1>
        
        {/* Filter Section */}
        <div className="mb-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              Search Filters
              {hasActiveFilters() && (
                <span className="text-sm bg-[#3ab54a] text-white px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {showFilters ? (
                <>
                  <span>Hide</span>
                  <ChevronUpIcon className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Show</span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Make (Brand)
                  </label>
                  <select
                    value={filters.brand}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                  >
                    <option value="">All Brands</option>
                    {availableBrands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                {/* Model Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model {!filters.brand && <span className="text-gray-400 text-xs">(Select Make first)</span>}
                  </label>
                  <select
                    value={filters.model}
                    onChange={(e) => handleFilterChange('model', e.target.value)}
                    disabled={!filters.brand}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">All Models</option>
                    {availableModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>

                {/* Broker Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Broker
                  </label>
                  <select
                    value={filters.broker}
                    onChange={(e) => handleFilterChange('broker', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                  >
                    <option value="">All Brokers</option>
                    {availableBrokers.map(broker => (
                      <option key={broker} value={broker}>{broker}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Range Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Price/Bid <span className="text-gray-400 text-xs">(Show ≥ this amount)</span>
                  </label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Price/Bid <span className="text-gray-400 text-xs">(Show ≤ this amount)</span>
                  </label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="No limit"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Clear Filters
                </button>
                <button
                  onClick={applyFilters}
                  className="px-6 py-2 bg-[#3ab54a] text-white rounded-lg hover:bg-[#32a042] transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          {watches.length === 0 ? (
            <p>No watches found matching your criteria.</p>
          ) : (
            <p>Found {watches.length} {watches.length === 1 ? 'watch' : 'watches'}</p>
          )}
        </div>

        {/* Watch Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {watches.map(watch => {
            console.log("Watch imageUrl:", watch.imageUrl); // Log imageUrl
            return (
              <div key={watch._id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 relative">
                {/* SOLD Overlay */}
                {watch.status === 'sold' && (
                  <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center pointer-events-none">
                    <div className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold text-xl transform -rotate-12 shadow-2xl">
                      SOLD
                    </div>
                  </div>
                )}
                
                <Link to={`/watches/${watch._id}`}>
                  {watch.imageUrl ? (
                    <img src={watch.imageUrl} alt={`${watch.brand} ${watch.model}`} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-semibold">
                      No Image Available
                    </div>
                  )}
                  <div className="p-4">
                    <h2 className="text-xl font-semibold text-gray-800 mb-1">{watch.brand}</h2>
                    <p className="text-gray-700 mb-2">{watch.model}</p>
                    <p className="text-sm text-gray-600 mb-2">Ref: {watch.reference_number}</p>
                    
                    {/* Price Display */}
                    {watch.price ? (
                      <p className="text-xl font-bold text-[#3ab54a] mb-2">{formatPrice(watch.price, watch.currency)}</p>
                    ) : (
                      <p className="text-sm text-gray-500 mb-2">Price: Contact seller</p>
                    )}

                    {/* Current Bid Display */}
                    {watch.currentBid && watch.currentBid > 0 && (
                      <p className="text-sm text-blue-600">
                        Current Bid: {formatPrice(watch.currentBid, watch.currency)}
                      </p>
                    )}

                    {/* Status */}
                    <div className="flex items-center justify-between mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        watch.status === 'active' ? 'bg-green-100 text-green-800' :
                        watch.status === 'sold' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {watch.status.charAt(0).toUpperCase() + watch.status.slice(1)}
                      </span>
                    </div>

                    {/* Condition */}
                    {watch.condition && (
                      <p className="text-sm text-gray-600 mt-1">
                        Condition: <span className="font-medium">{watch.condition}</span>
                      </p>
                    )}

                    {watch.owner && (
                      <div className="mt-2 pt-2 border-t">
                        <Link
                          to={`/seller/${watch.owner._id}`}
                          className="inline-flex items-center text-sm text-[#0b3d2e] hover:text-[#164d3a] font-medium transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="mr-1">Sold by:</span>
                          <span className="underline">{watch.owner.name || watch.owner.company_name}</span>
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                        {watch.owner.sellerStats?.averageRating > 0 && (
                          <div className="flex items-center mt-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600 ml-1">
                              {watch.owner.sellerStats.averageRating.toFixed(1)} ({watch.owner.sellerStats.totalReviews} reviews)
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