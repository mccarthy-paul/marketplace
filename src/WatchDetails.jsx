import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, User, Star } from 'lucide-react';
import { apiGet } from './utils/api.js';

const WatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [watch, setWatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [bids, setBids] = useState([]);
  const [activeBid, setActiveBid] = useState(null);
  const [counterOfferAmount, setCounterOfferAmount] = useState('');
  const [counterOfferMessage, setCounterOfferMessage] = useState('');
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetchWatchAndBids();
    fetchCurrentUser();
  }, [id]);

  const fetchWatchAndBids = async () => {
    try {
      // Fetch watch details
      const watchRes = await fetch(`/api/watches/${id}`);
      if (!watchRes.ok) {
        throw new Error(`HTTP error! status: ${watchRes.status}`);
      }
      const watchData = await watchRes.json();
      setWatch(watchData);

      // Fetch bids for this watch
      const bidsRes = await fetch(`/api/bids/${id}`, { credentials: 'include' });
      if (bidsRes.ok) {
        const bidsData = await bidsRes.json();
        setBids(bidsData);
        
        // Find active bid for current user
        if (currentUser) {
          const userActiveBid = bidsData.find(
            bid => bid.bidder === currentUser._id && 
            ['offered', 'negotiating', 'counter_offer'].includes(bid.status)
          );
          setActiveBid(userActiveBid);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/users/me', { credentials: 'include' });
      console.log('User fetch response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('User data received:', data);
        setCurrentUser(data.user || data);
      } else {
        console.log('User not logged in or session expired, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const handlePlaceBid = async () => {
    const bid = parseFloat(bidAmount);
    
    if (!bidAmount || isNaN(bid) || bid <= 0) {
      alert('Please enter a valid bid amount.');
      return;
    }

    // Check if bid is lower than listed price (if there is one)
    if (watch.price && bid >= watch.price) {
      alert(`Your bid must be lower than the listed price of $${watch.price.toLocaleString()}. Use "Buy Now" to purchase at the listed price.`);
      return;
    }

    try {
      const response = await fetch(`/api/bids/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          amount: bid, 
          comment: bidMessage || `Initial bid of $${bid.toLocaleString()}` 
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to place bid');
      }

      alert('Bid placed successfully! The seller will review your offer.');
      setBidAmount('');
      setBidMessage('');
      fetchWatchAndBids(); // Refresh data
    } catch (error) {
      console.error('Error placing bid:', error);
      alert(`Error placing bid: ${error.message}`);
    }
  };

  const handleCounterOffer = async (bidId) => {
    const amount = parseFloat(counterOfferAmount);
    
    if (!counterOfferAmount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid counter offer amount.');
      return;
    }

    try {
      const response = await fetch(`/api/bids/${bidId}/counter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          amount, 
          message: counterOfferMessage 
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send counter offer');
      }

      alert('Counter offer sent successfully!');
      setCounterOfferAmount('');
      setCounterOfferMessage('');
      setShowNegotiationModal(false);
      fetchWatchAndBids(); // Refresh data
    } catch (error) {
      console.error('Error sending counter offer:', error);
      alert(`Error sending counter offer: ${error.message}`);
    }
  };

  const handleAcceptBid = async (bidId, amount) => {
    if (!window.confirm(`Are you sure you want to accept this bid for $${amount.toLocaleString()}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/bids/${bidId}/accept`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept bid');
      }

      alert('Bid accepted! The buyer can now proceed with the purchase.');
      fetchWatchAndBids(); // Refresh data
    } catch (error) {
      console.error('Error accepting bid:', error);
      alert(`Error accepting bid: ${error.message}`);
    }
  };

  const handleRejectBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to reject this bid?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bids/${bidId}/reject`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reject bid');
      }

      alert('Bid rejected.');
      fetchWatchAndBids(); // Refresh data
    } catch (error) {
      console.error('Error rejecting bid:', error);
      alert(`Error rejecting bid: ${error.message}`);
    }
  };

  const handleBuyAtAgreedPrice = async (bidId, agreedPrice) => {
    if (!window.confirm(`Add this watch to your cart at the agreed price of $${agreedPrice.toLocaleString()}?`)) {
      return;
    }

    setPurchasing(true);
    try {
      // Add item to cart from accepted bid
      const response = await fetch('/api/cart/add-from-bid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidId: bidId
        }),
        credentials: 'include'
      });
      
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          alert('Please log in to add items to your cart.');
          navigate('/');
          return;
        }
        throw new Error(data.message || 'Failed to add to cart');
      }

      alert('Watch added to cart successfully at the agreed price!');
      // Navigate to cart
      navigate('/cart');
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(`Error adding to cart: ${error.message}`);
    } finally {
      setPurchasing(false);
    }
  };

  const handleBuyNow = async () => {
    if (!watch?.price || watch.price <= 0) {
      alert('This watch does not have a fixed price. Please place a bid instead.');
      return;
    }
    
    setPurchasing(true);
    try {
      // Add item to cart
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          watchId: watch._id,
          price: watch.price
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          alert('Please log in to add items to your cart.');
          navigate('/');
          return;
        }
        throw new Error(data.message || 'Failed to add to cart');
      }

      alert('Watch added to cart successfully!');
      // Navigate to cart
      navigate('/cart');
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(`Error adding to cart: ${error.message}`);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return <div className="text-center text-xl mt-8 text-gray-700">Loading watch details...</div>;
  }

  if (!watch) {
    return <div className="text-center text-xl mt-8 text-red-600">Watch not found.</div>;
  }

  // Check if current user owns this watch
  // Get the user ID in a consistent format
  const userId = currentUser?._id || currentUser?.id;
  
  // Get the owner/seller IDs in a consistent format
  const ownerId = watch.owner?._id || watch.owner?.id || watch.owner;
  const sellerId = watch.seller?._id || watch.seller?.id || watch.seller;
  
  // Simple ownership check
  const isOwnWatch = !!(currentUser && (
    String(ownerId) === String(userId) ||
    String(sellerId) === String(userId)
  ));
  
  // Enhanced debug logging
  console.log('Ownership debug:', {
    currentUserId: userId,
    watchOwnerId: ownerId,
    watchSellerId: sellerId,
    stringComparison: {
      'String(ownerId) === String(userId)': String(ownerId) === String(userId),
      'String(sellerId) === String(userId)': String(sellerId) === String(userId),
    },
    finalResult: isOwnWatch
  });
  
  // Debug logging
  console.log('Watch purchase debug:', {
    watchStatus: watch.status,
    isOwnWatch,
    currentUser: currentUser ? { id: currentUser._id || currentUser.id, name: currentUser.name } : null,
    watchOwner: watch.owner,
    watchSeller: watch.seller,
    showPurchaseOptions: watch.status === 'active' && !isOwnWatch && currentUser,
    statusCheck: watch.status === 'active',
    ownershipCheck: !isOwnWatch,
    userCheck: !!currentUser,
    allConditionsMet: watch.status === 'active' && !isOwnWatch && currentUser
  });

  // Get user's active negotiations (including accepted ones that need completion)
  const userNegotiations = bids.filter(
    bid => currentUser && 
    bid.bidder._id === currentUser._id && 
    ['offered', 'negotiating', 'counter_offer', 'accepted'].includes(bid.status)
  );

  // Get bids for seller to review (if they own the watch)
  const bidsToReview = isOwnWatch ? 
    bids.filter(bid => ['offered', 'counter_offer', 'negotiating'].includes(bid.status)) : 
    [];

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-center text-gray-800 mb-8">Watch Details</h1>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden p-6 md:flex md:gap-8">
          {/* Watch Image Gallery */}
          <div className="md:flex-shrink-0 md:w-1/2">
            {/* Get all images - combine legacy imageUrl with new images array */}
            {(() => {
              const allImages = [];
              if (watch.images && watch.images.length > 0) {
                allImages.push(...watch.images);
              } else if (watch.imageUrl) {
                allImages.push(watch.imageUrl);
              }
              
              if (allImages.length > 0) {
                const handlePreviousImage = () => {
                  setSelectedImageIndex((prev) => 
                    prev === 0 ? allImages.length - 1 : prev - 1
                  );
                };

                const handleNextImage = () => {
                  setSelectedImageIndex((prev) => 
                    prev === allImages.length - 1 ? 0 : prev + 1
                  );
                };

                return (
                  <div>
                    {/* Main Image with Navigation Arrows */}
                    <div className="relative mb-4 group">
                      <img 
                        src={allImages[selectedImageIndex]} 
                        alt={`${watch.brand} ${watch.model} - Image ${selectedImageIndex + 1}`} 
                        className="w-full h-96 object-cover rounded-md"
                      />
                      
                      {/* Navigation Arrows - Only show if multiple images */}
                      {allImages.length > 1 && (
                        <>
                          {/* Previous Arrow */}
                          <button
                            onClick={handlePreviousImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                          
                          {/* Next Arrow */}
                          <button
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label="Next image"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                          
                          {/* Image Counter */}
                          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                            {selectedImageIndex + 1} / {allImages.length}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Thumbnail Gallery */}
                    {allImages.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {allImages.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex-shrink-0 border-2 rounded overflow-hidden transition-all ${
                              selectedImageIndex === index 
                                ? 'border-[#3ab54a] shadow-lg scale-105' 
                                : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                            }`}
                          >
                            <img
                              src={image}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-20 h-20 object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div className="w-full h-96 bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-semibold rounded-md">
                    No Images Available
                  </div>
                );
              }
            })()}
          </div>

          {/* Watch Details */}
          <div className="mt-6 md:mt-0 md:flex-grow">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">{watch.brand} - {watch.model}</h2>
            
            {/* SOLD Status Badge */}
            {watch.status === 'sold' && (
              <div className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-lg mb-4">
                SOLD - This watch is no longer available
              </div>
            )}
            
            {/* PENDING Status Badge */}
            {watch.status === 'pending' && (
              <div className="inline-block bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold text-lg mb-4">
                SALE PENDING - Transaction in progress
              </div>
            )}
            
            <p className="text-gray-700 mb-2"><strong>Reference Number:</strong> {watch.reference_number}</p>
            <p className="text-gray-700 mb-2"><strong>Year:</strong> {watch.year}</p>
            <p className="text-gray-700 mb-2"><strong>Condition:</strong> {watch.condition}</p>
            
            {/* Pricing Information */}
            <div className="bg-gray-50 p-4 rounded-lg my-4">
              {watch.price && (
                <p className="text-2xl font-bold text-green-600 mb-2">
                  Listed Price: {
                    watch.currency === 'EUR' ? '€' :
                    watch.currency === 'GBP' ? '£' :
                    watch.currency === 'JPY' ? '¥' :
                    watch.currency === 'CHF' ? 'CHF ' :
                    '$'
                  }{watch.price.toLocaleString()} {watch.currency || 'USD'}
                </p>
              )}
              {watch.currentBid > 0 && (
                <p className="text-lg text-gray-700">
                  Current Bid: {
                    watch.currency === 'EUR' ? '€' :
                    watch.currency === 'GBP' ? '£' :
                    watch.currency === 'JPY' ? '¥' :
                    watch.currency === 'CHF' ? 'CHF ' :
                    '$'
                  }{watch.currentBid.toLocaleString()} {watch.currency || 'USD'}
                </p>
              )}
              {!watch.price && !watch.currentBid && (
                <p className="text-gray-500">Price: Make an offer</p>
              )}
            </div>

            {watch.owner && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-700 text-sm mb-1"><strong>Seller:</strong> {watch.owner.name}</p>
                    <p className="text-gray-700 text-sm mb-2"><strong>Company:</strong> {watch.owner.company_name}</p>
                    {watch.owner.sellerStats && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">
                            {watch.owner.sellerStats.averageRating?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">
                          {watch.owner.sellerStats.totalSales || 0} sales
                        </span>
                      </div>
                    )}
                  </div>
                  <Link
                    to={`/seller/${watch.owner._id}`}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors text-sm font-medium"
                  >
                    <User className="w-4 h-4" />
                    View Profile
                  </Link>
                </div>
              </div>
            )}

            <p className="text-gray-700 mt-4"><strong>Description:</strong> {watch.description}</p>

            {/* Status Badge */}
            <div className="mt-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                watch.status === 'active' ? 'bg-green-100 text-green-800' :
                watch.status === 'sold' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {watch.status.charAt(0).toUpperCase() + watch.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Section - Only show if watch is active and user is not the owner */}
        {watch.status === 'active' && !isOwnWatch && currentUser && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Purchase Options</h3>
            
            {/* Buy Now Option - Only show if there's a fixed price */}
            {watch.price && (
              <div className="mb-6 p-4 border border-green-200 rounded-lg bg-green-50">
                <h4 className="font-semibold text-green-800 mb-2">Buy at Listed Price</h4>
                <p className="text-gray-700 mb-3">
                  Purchase immediately at the listed price of ${watch.price.toLocaleString()}
                </p>
                <button
                  onClick={handleBuyNow}
                  disabled={purchasing}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing ? 'Processing...' : `Buy Now for $${watch.price.toLocaleString()}`}
                </button>
              </div>
            )}

            {/* Make an Offer Section */}
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <h4 className="font-semibold text-blue-800 mb-2">Make an Offer</h4>
              <p className="text-gray-700 mb-3">
                {watch.price ? 
                  `Propose a price lower than $${watch.price.toLocaleString()}. The seller can accept, reject, or counter your offer.` :
                  'Make an offer to the seller. They can accept, reject, or counter your offer.'
                }
              </p>
              
              {/* Show existing negotiation if any */}
              {userNegotiations.length > 0 ? (
                <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                  <p className="font-semibold text-yellow-800 mb-2">You have an active negotiation:</p>
                  {userNegotiations.map(negotiation => (
                    <div key={negotiation._id} className="mb-2">
                      <p className="text-sm">
                        Current offer: ${negotiation.amount.toLocaleString()} - 
                        Status: <span className="font-medium">{negotiation.status}</span>
                      </p>
                      {negotiation.status === 'accepted' && (
                        <button
                          onClick={() => handleBuyAtAgreedPrice(negotiation._id, negotiation.agreedPrice || negotiation.amount)}
                          className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                        >
                          Complete Purchase at Agreed Price
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <input
                    type="number"
                    placeholder="Enter your offer amount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Add a message (optional)"
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                  />
                  <button
                    onClick={handlePlaceBid}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Submit Offer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Seller's View - Manage Bids */}
        {isOwnWatch && bidsToReview.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Manage Offers</h3>
            <div className="space-y-4">
              {bidsToReview.map(bid => (
                <div key={bid._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">
                        Offer from {bid.bidderName || bid.bidder.name}: ${bid.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Status: {bid.status}</p>
                      {bid.comments && bid.comments.length > 0 && (
                        <p className="text-sm text-gray-700 mt-1">
                          Message: {bid.comments[bid.comments.length - 1].text}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Negotiation History */}
                  {bid.negotiationHistory && bid.negotiationHistory.length > 0 && (
                    <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                      <p className="font-medium mb-1">Negotiation History:</p>
                      {bid.negotiationHistory.map((item, idx) => (
                        <div key={idx} className="text-gray-600">
                          {item.proposedByRole}: ${item.amount.toLocaleString()}
                          {item.message && ` - ${item.message}`}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptBid(bid._id, bid.amount)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                    >
                      Accept Offer
                    </button>
                    <button
                      onClick={() => {
                        setActiveBid(bid);
                        setShowNegotiationModal(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                    >
                      Counter Offer
                    </button>
                    <button
                      onClick={() => handleRejectBid(bid._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Counter Offer Modal */}
        {showNegotiationModal && activeBid && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">Send Counter Offer</h3>
              <p className="text-gray-700 mb-4">
                Current offer: ${activeBid.amount.toLocaleString()}
              </p>
              <input
                type="number"
                placeholder="Your counter offer amount"
                value={counterOfferAmount}
                onChange={(e) => setCounterOfferAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Message (optional)"
                value={counterOfferMessage}
                onChange={(e) => setCounterOfferMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleCounterOffer(activeBid._id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Send Counter Offer
                </button>
                <button
                  onClick={() => {
                    setShowNegotiationModal(false);
                    setCounterOfferAmount('');
                    setCounterOfferMessage('');
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View All Bids Link */}
        {watch.status === 'active' && (
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate(`/watch-bids/${id}`)}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              View All Bids & Negotiations
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchDetails;