import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, X, MessageSquare } from 'lucide-react';

const AdminBidDetailPage = () => {
  const { bidId } = useParams();
  const [bid, setBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBidDetails();
  }, [bidId]);

  const fetchBidDetails = async () => {
    try {
      const response = await fetch(`/api/admin/bids/${bidId}`, { 
        credentials: 'include' 
      });
      
      if (response.ok) {
        const data = await response.json();
        setBid(data.bid);
      } else {
        setError('Failed to load bid details');
      }
    } catch (error) {
      console.error('Error fetching bid details:', error);
      setError('Error loading bid details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'offered': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading bid details...</div>
      </div>
    );
  }

  if (error || !bid) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error || 'Bid not found'}</div>
          <Link to="/admin/bids" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
            Back to Bids
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/bids"
              className="bg-gray-600 text-white p-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bid Details</h1>
              <p className="text-gray-600 mt-1">
                Bid ID: {bid._id}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bid Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Bid Information</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(bid.status)}`}>
                  {bid.status?.charAt(0).toUpperCase() + bid.status?.slice(1)}
                </span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Bid Amount</span>
                <span className="font-bold text-2xl text-blue-600">${bid.amount?.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Watch List Price</span>
                <span className="font-medium text-gray-900">
                  ${bid.watch?.price?.toLocaleString() || 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Bid Date</span>
                <span className="font-medium text-gray-900">
                  {new Date(bid.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium text-gray-900">
                  {new Date(bid.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Watch Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Watch Information</h2>
            
            {bid.watch ? (
              <div className="space-y-4">
                {bid.watch.imageUrl && (
                  <div className="flex justify-center">
                    <img 
                      src={bid.watch.imageUrl} 
                      alt={`${bid.watch.brand} ${bid.watch.model}`}
                      className="w-48 h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Brand</span>
                  <span className="font-medium text-gray-900">{bid.watch.brand}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Model</span>
                  <span className="font-medium text-gray-900">{bid.watch.model}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Reference</span>
                  <span className="font-medium text-gray-900">{bid.watch.reference_number}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Condition</span>
                  <span className="font-medium text-gray-900">{bid.watch.condition}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Year</span>
                  <span className="font-medium text-gray-900">{bid.watch.year || 'N/A'}</span>
                </div>

                <div className="pt-4">
                  <Link
                    to={`/watches/${bid.watch._id}`}
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Watch Listing
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                Watch information not available
              </div>
            )}
          </div>

          {/* Bidder Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Bidder Information</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Name</span>
                <span className="font-medium text-gray-900">{bid.bidder?.name || 'Unknown'}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Email</span>
                <span className="font-medium text-gray-900">{bid.bidder?.email || 'No email'}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Company</span>
                <span className="font-medium text-gray-900">{bid.bidder?.company_name || 'No company'}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">User Type</span>
                <span className="font-medium text-gray-900">
                  {bid.bidder?.is_admin ? 'Administrator' : 'Standard User'}
                </span>
              </div>
            </div>
          </div>

          {/* Watch Owner Information */}
          {bid.watch?.owner && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Watch Owner Information</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Name</span>
                  <span className="font-medium text-gray-900">{bid.watch.owner.name || 'Unknown'}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium text-gray-900">{bid.watch.owner.email || 'No email'}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Company</span>
                  <span className="font-medium text-gray-900">{bid.watch.owner.company_name || 'No company'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Comments */}
        {bid.comments && bid.comments.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comments
            </h2>
            
            <div className="space-y-4">
              {bid.comments.map((comment, index) => (
                <div key={index} className="bg-gray-50 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{comment.user || 'Bidder'}</span>
                    <span className="text-sm text-gray-500">
                      {comment.date ? new Date(comment.date).toLocaleDateString() : 'Date unknown'}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {bid.status === 'offered' && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Actions</h2>
            <div className="flex gap-4">
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2">
                <Check className="w-4 h-4" />
                Accept Bid
              </button>
              <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2">
                <X className="w-4 h-4" />
                Reject Bid
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBidDetailPage;