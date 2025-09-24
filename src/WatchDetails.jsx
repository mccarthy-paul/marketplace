import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, User, Star, ArrowLeft, Shield, Award, Clock, Heart, Share2, Package, TrendingUp } from 'lucide-react';
import { apiGet, apiPost, apiPut, getImageUrl } from './utils/api.js';
import { useTheme } from './contexts/ThemeContext.jsx';

const WatchDetails = () => {
  const { theme } = useTheme();
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
      const watchData = await apiGet(`/api/watches/${id}`);
      setWatch(watchData);

      const bidsRes = await apiGet(`/api/bids/${id}`);
      if (bidsRes) {
        setBids(bidsRes);

        if (currentUser) {
          const userActiveBid = bidsRes.find(
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
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user || data);
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
      fetchWatchAndBids();
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
      fetchWatchAndBids();
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
      fetchWatchAndBids();
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
      fetchWatchAndBids();
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
      navigate('/cart');

    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(`Error adding to cart: ${error.message}`);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-luxury-dark' : 'bg-gray-50'
      }`}>
        <div className={`text-xl font-display tracking-wider animate-pulse ${
          theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
        }`}>LOADING...</div>
      </div>
    );
  }

  if (!watch) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-luxury-dark' : 'bg-gray-50'
      }`}>
        <div className="text-red-500 text-xl">Watch not found.</div>
      </div>
    );
  }

  const userId = currentUser?._id || currentUser?.id;
  const ownerId = watch.owner?._id || watch.owner?.id || watch.owner;
  const sellerId = watch.seller?._id || watch.seller?.id || watch.seller;
  const isOwnWatch = !!(currentUser && (
    String(ownerId) === String(userId) ||
    String(sellerId) === String(userId)
  ));

  const userNegotiations = bids.filter(
    bid => currentUser &&
    bid.bidder._id === currentUser._id &&
    ['offered', 'negotiating', 'counter_offer', 'accepted'].includes(bid.status)
  );

  const bidsToReview = isOwnWatch ?
    bids.filter(bid => ['offered', 'counter_offer', 'negotiating'].includes(bid.status)) :
    [];

  // Get all images with proper URLs
  const allImages = [];
  if (watch.images && watch.images.length > 0) {
    allImages.push(...watch.images.map(img => getImageUrl(img)).filter(Boolean));
  } else if (watch.imageUrl) {
    const imageUrl = getImageUrl(watch.imageUrl);
    if (imageUrl) allImages.push(imageUrl);
  }

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

  const formatCurrency = (amount) => {
    const symbol = watch.currency === 'EUR' ? '€' :
                  watch.currency === 'GBP' ? '£' :
                  watch.currency === 'JPY' ? '¥' :
                  watch.currency === 'CHF' ? 'CHF ' :
                  '$';
    return `${symbol}${amount.toLocaleString()}`;
  };

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-luxury-dark' : 'bg-white'
    }`}>
      {/* Back Button and Breadcrumb */}
      <div className={`border-b ${
        theme === 'dark'
          ? 'bg-luxury-charcoal border-luxury-gray'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 transition-colors text-sm uppercase tracking-wider ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-gold'
                : 'text-gray-600 hover:text-luxe-bronze'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Collection
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            {allImages.length > 0 ? (
              <div>
                {/* Main Image */}
                <div className={`relative rounded-lg overflow-hidden group ${
                  theme === 'dark' ? 'bg-luxury-charcoal' : 'bg-gray-100'
                }`}>
                  <img
                    src={allImages[selectedImageIndex]}
                    alt={`${watch.brand} ${watch.model}`}
                    className="w-full h-[600px] object-cover"
                  />

                  {/* Navigation Arrows */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={handlePreviousImage}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                          theme === 'dark'
                            ? 'bg-luxury-dark/80 hover:bg-luxury-dark text-gold'
                            : 'bg-white/90 hover:bg-white text-luxe-bronze shadow-lg'
                        }`}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>

                      <button
                        onClick={handleNextImage}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                          theme === 'dark'
                            ? 'bg-luxury-dark/80 hover:bg-luxury-dark text-gold'
                            : 'bg-white/90 hover:bg-white text-luxe-bronze shadow-lg'
                        }`}
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>

                      <div className={`absolute bottom-4 right-4 px-3 py-1 rounded text-sm ${
                        theme === 'dark'
                          ? 'bg-luxury-dark/80 text-gold'
                          : 'bg-white/90 text-luxe-bronze shadow'
                      }`}>
                        {selectedImageIndex + 1} / {allImages.length}
                      </div>
                    </>
                  )}

                  {/* Status Badges */}
                  {watch.status === 'sold' && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 uppercase tracking-wider text-sm font-bold">
                      SOLD
                    </div>
                  )}
                  {watch.status === 'pending' && (
                    <div className="absolute top-4 left-4 bg-yellow-600 text-white px-4 py-2 uppercase tracking-wider text-sm font-bold">
                      SALE PENDING
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button className={`p-3 rounded-full transition-all ${
                      theme === 'dark'
                        ? 'bg-luxury-dark/80 hover:bg-luxury-dark text-gold'
                        : 'bg-white/90 hover:bg-white text-luxe-bronze shadow-lg'
                    }`}>
                      <Heart className="w-5 h-5" />
                    </button>
                    <button className={`p-3 rounded-full transition-all ${
                      theme === 'dark'
                        ? 'bg-luxury-dark/80 hover:bg-luxury-dark text-gold'
                        : 'bg-white/90 hover:bg-white text-luxe-bronze shadow-lg'
                    }`}>
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Thumbnail Gallery */}
                {allImages.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {allImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 border-2 rounded overflow-hidden transition-all ${
                          selectedImageIndex === index
                            ? theme === 'dark' ? 'border-gold shadow-lg' : 'border-luxe-bronze shadow-lg'
                            : theme === 'dark' ? 'border-luxury-gray hover:border-gold/50' : 'border-gray-300 hover:border-luxe-bronze/50'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-24 h-24 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={`rounded-lg h-[600px] flex items-center justify-center ${
                theme === 'dark' ? 'bg-luxury-charcoal' : 'bg-gray-100'
              }`}>
                <div className="text-gray-500 text-lg">No Images Available</div>
              </div>
            )}
          </div>

          {/* Watch Details */}
          <div>
            {/* Title and Reference */}
            <div className="mb-6">
              <h1 className="font-display text-4xl text-white mb-2">
                {watch.brand}
              </h1>
              <h2 className="text-2xl text-gold mb-4">{watch.model}</h2>
              <div className="flex items-center gap-4 text-gray-400 text-sm">
                <span>REF. {watch.reference_number}</span>
                <span>•</span>
                <span>{watch.year}</span>
                <span>•</span>
                <span className="uppercase">{watch.condition}</span>
              </div>
            </div>

            {/* Price Section */}
            <div className="bg-luxury-charcoal border border-luxury-gray p-6 rounded-lg mb-6">
              {watch.price ? (
                <div>
                  <div className="text-3xl font-display text-gold mb-2">
                    {formatCurrency(watch.price)}
                  </div>
                  <p className="text-gray-400 text-sm uppercase tracking-wider">Listed Price</p>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-display text-gray-400 mb-2">
                    Price on Request
                  </div>
                  <p className="text-gray-500 text-sm">Make an offer to the seller</p>
                </div>
              )}

              {watch.currentBid > 0 && (
                <div className="mt-4 pt-4 border-t border-luxury-gray">
                  <div className="text-xl text-white">
                    {formatCurrency(watch.currentBid)}
                  </div>
                  <p className="text-gray-400 text-sm uppercase tracking-wider">Current Bid</p>
                </div>
              )}
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-luxury-charcoal border border-luxury-gray p-4 rounded-lg text-center">
                <Shield className="w-6 h-6 text-gold mx-auto mb-2" />
                <p className="text-xs text-gray-400 uppercase tracking-wider">Authenticated</p>
              </div>
              <div className="bg-luxury-charcoal border border-luxury-gray p-4 rounded-lg text-center">
                <Package className="w-6 h-6 text-gold mx-auto mb-2" />
                <p className="text-xs text-gray-400 uppercase tracking-wider">Insured Shipping</p>
              </div>
              <div className="bg-luxury-charcoal border border-luxury-gray p-4 rounded-lg text-center">
                <Award className="w-6 h-6 text-gold mx-auto mb-2" />
                <p className="text-xs text-gray-400 uppercase tracking-wider">Warranty</p>
              </div>
            </div>

            {/* Seller Information */}
            {watch.owner && (
              <div className="bg-luxury-charcoal border border-luxury-gray p-6 rounded-lg mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-gold uppercase tracking-wider text-sm mb-3">Seller Information</h3>
                    <p className="text-white font-display text-lg">{watch.owner.name}</p>
                    <p className="text-gray-400 text-sm">{watch.owner.company_name}</p>

                    {watch.owner.sellerStats && (
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-gold fill-current" />
                          <span className="text-white ml-1">
                            {watch.owner.sellerStats.averageRating?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                        <span className="text-luxury-gray">•</span>
                        <span className="text-gray-400 text-sm">
                          {watch.owner.sellerStats.totalSales || 0} sales
                        </span>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/seller/${watch.owner._id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gold text-gold hover:bg-gold hover:text-luxury-dark transition-all duration-300 text-sm uppercase tracking-wider"
                  >
                    <User className="w-4 h-4" />
                    View Profile
                  </Link>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-gold uppercase tracking-wider text-sm mb-3">Description</h3>
              <p className="text-gray-300 leading-relaxed">{watch.description}</p>
            </div>

            {/* Purchase Options - Only show if watch is active and user is not the owner */}
            {watch.status === 'active' && !isOwnWatch && currentUser && (
              <div className="space-y-4">
                {/* Buy Now Button */}
                {watch.price && (
                  <button
                    onClick={handleBuyNow}
                    disabled={purchasing}
                    className="w-full bg-gold text-luxury-dark py-4 font-bold uppercase tracking-wider hover:bg-gold-dark transition-all duration-300 disabled:opacity-50"
                  >
                    {purchasing ? 'Processing...' : `Buy Now - ${formatCurrency(watch.price)}`}
                  </button>
                )}

                {/* Make an Offer */}
                {userNegotiations.length === 0 ? (
                  <div className="bg-luxury-charcoal border border-luxury-gray p-6 rounded-lg">
                    <h4 className="text-gold uppercase tracking-wider text-sm mb-4">Make an Offer</h4>
                    <div className="space-y-3">
                      <input
                        type="number"
                        placeholder="Enter your offer amount"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-luxury-dark border border-luxury-gray text-white focus:border-gold transition-colors"
                      />
                      <textarea
                        placeholder="Add a message (optional)"
                        value={bidMessage}
                        onChange={(e) => setBidMessage(e.target.value)}
                        className="w-full px-4 py-3 bg-luxury-dark border border-luxury-gray text-white focus:border-gold transition-colors"
                        rows="2"
                      />
                      <button
                        onClick={handlePlaceBid}
                        className="w-full border border-gold text-gold py-3 uppercase tracking-wider hover:bg-gold hover:text-luxury-dark transition-all duration-300"
                      >
                        Submit Offer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-luxury-charcoal border border-gold p-6 rounded-lg">
                    <h4 className="text-gold uppercase tracking-wider text-sm mb-3">Active Negotiation</h4>
                    {userNegotiations.map(negotiation => (
                      <div key={negotiation._id}>
                        <p className="text-white">
                          Current offer: {formatCurrency(negotiation.amount)}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          Status: <span className="text-gold">{negotiation.status}</span>
                        </p>
                        {negotiation.status === 'accepted' && (
                          <button
                            onClick={() => handleBuyAtAgreedPrice(negotiation._id, negotiation.agreedPrice || negotiation.amount)}
                            className="mt-4 w-full bg-gold text-luxury-dark py-3 uppercase tracking-wider hover:bg-gold-dark transition-all duration-300"
                          >
                            Complete Purchase at Agreed Price
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Seller's View - Manage Bids */}
            {isOwnWatch && bidsToReview.length > 0 && (
              <div className="bg-luxury-charcoal border border-luxury-gray p-6 rounded-lg">
                <h3 className="text-gold uppercase tracking-wider text-sm mb-4">Manage Offers</h3>
                <div className="space-y-4">
                  {bidsToReview.map(bid => (
                    <div key={bid._id} className="border border-luxury-gray p-4 rounded">
                      <div className="mb-3">
                        <p className="text-white font-display text-lg">
                          {formatCurrency(bid.amount)}
                        </p>
                        <p className="text-gray-400 text-sm">
                          From {bid.bidderName || bid.bidder.name} • {bid.status}
                        </p>
                        {bid.comments && bid.comments.length > 0 && (
                          <p className="text-gray-300 text-sm mt-2">
                            "{bid.comments[bid.comments.length - 1].text}"
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptBid(bid._id, bid.amount)}
                          className="px-4 py-2 bg-gold text-luxury-dark text-sm uppercase tracking-wider hover:bg-gold-dark transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => {
                            setActiveBid(bid);
                            setShowNegotiationModal(true);
                          }}
                          className="px-4 py-2 border border-gold text-gold text-sm uppercase tracking-wider hover:bg-gold hover:text-luxury-dark transition-colors"
                        >
                          Counter
                        </button>
                        <button
                          onClick={() => handleRejectBid(bid._id)}
                          className="px-4 py-2 border border-red-500 text-red-500 text-sm uppercase tracking-wider hover:bg-red-500 hover:text-white transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View All Bids Link */}
            {watch.status === 'active' && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate(`/watch-bids/${id}`)}
                  className="text-gold hover:text-gold-light text-sm uppercase tracking-wider transition-colors"
                >
                  View All Bids & Negotiations →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Counter Offer Modal */}
      {showNegotiationModal && activeBid && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-luxury-charcoal border border-luxury-gray rounded-lg p-6 max-w-md w-full">
            <h3 className="font-display text-2xl text-white mb-4">Counter Offer</h3>
            <p className="text-gray-400 mb-6">
              Current offer: {formatCurrency(activeBid.amount)}
            </p>
            <input
              type="number"
              placeholder="Your counter offer amount"
              value={counterOfferAmount}
              onChange={(e) => setCounterOfferAmount(e.target.value)}
              className="w-full px-4 py-3 bg-luxury-dark border border-luxury-gray text-white mb-3 focus:border-gold transition-colors"
            />
            <textarea
              placeholder="Message (optional)"
              value={counterOfferMessage}
              onChange={(e) => setCounterOfferMessage(e.target.value)}
              className="w-full px-4 py-3 bg-luxury-dark border border-luxury-gray text-white mb-6 focus:border-gold transition-colors"
              rows="3"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleCounterOffer(activeBid._id)}
                className="flex-1 bg-gold text-luxury-dark py-3 uppercase tracking-wider hover:bg-gold-dark transition-colors"
              >
                Send Counter
              </button>
              <button
                onClick={() => {
                  setShowNegotiationModal(false);
                  setCounterOfferAmount('');
                  setCounterOfferMessage('');
                }}
                className="flex-1 border border-luxury-gray text-gray-400 py-3 uppercase tracking-wider hover:text-white hover:border-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchDetails;