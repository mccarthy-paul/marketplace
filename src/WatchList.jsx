import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const WatchList = () => {
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/watches', { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setWatches(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center text-xl mt-8 text-gray-700">Loading watches...</div>;
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-center text-gray-800 mb-8">Watch Marketplace</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {watches.map(watch => {
            console.log("Watch imageUrl:", watch.imageUrl); // Log imageUrl
            return (
              <div key={watch._id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
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
                      <p className="text-xl font-bold text-[#3ab54a] mb-2">${watch.price.toLocaleString()}</p>
                    ) : (
                      <p className="text-sm text-gray-500 mb-2">Price: Contact seller</p>
                    )}

                    {/* Current Bid Display */}
                    {watch.currentBid && watch.currentBid > 0 && (
                      <p className="text-sm text-blue-600">
                        Current Bid: ${watch.currentBid.toLocaleString()}
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
                      <>
                        <p className="text-sm text-gray-700 mt-2">Owner: {watch.owner.name}</p>
                        <p className="text-sm text-gray-700">Company: {watch.owner.company_name}</p>
                      </>
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
