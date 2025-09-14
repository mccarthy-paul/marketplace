import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const WatchAdminList = () => {
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWatches = async () => {
      try {
        const response = await axios.get('/api/admin/watches', { withCredentials: true });
        setWatches(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchWatches();
  }, []);

  const handleDelete = async (watchId) => {
    if (!window.confirm('Are you sure you want to delete this watch?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/watches/${watchId}`, { withCredentials: true });
      setWatches(watches.filter(watch => watch._id !== watchId));
    } catch (err) {
      console.error('Error deleting watch:', err);
      alert('Error deleting watch. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Error loading watches: {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Watch Management</h1>
            <p className="mt-2 text-gray-600">Manage all watches in the marketplace</p>
          </div>
          <Link
            to="/watches/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Add New Watch
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Watch Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference & Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Bid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {watches.map((watch) => (
                  <tr key={watch._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {(watch.imageUrl || watch.images?.[0]) ? (
                            <img
                              className="h-12 w-12 rounded-md object-cover"
                              src={watch.imageUrl || watch.images[0]}
                              alt={`${watch.brand} ${watch.model}`}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `
                                  <div class="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                                    <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                `;
                              }}
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {watch.brand}
                          </div>
                          <div className="text-sm text-gray-500">
                            {watch.model}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{watch.reference_number}</div>
                      <div className="text-sm text-gray-500">{watch.year}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        watch.condition === 'Mint' 
                          ? 'bg-green-100 text-green-800'
                          : watch.condition === 'Excellent'
                          ? 'bg-blue-100 text-blue-800'
                          : watch.condition === 'Very Good'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {watch.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${watch.currentBid ? watch.currentBid.toLocaleString() : 'No bids'}
                      </div>
                      {watch.startingPrice && (
                        <div className="text-sm text-gray-500">
                          Starting: ${watch.startingPrice.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {watch.owner ? watch.owner.name : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {watch.owner ? watch.owner.email : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        watch.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : watch.status === 'sold'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {watch.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/watches/edit/${watch._id}`}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(watch._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {watches.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No watches</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new watch.</p>
              <div className="mt-6">
                <Link
                  to="/watches/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add New Watch
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchAdminList;