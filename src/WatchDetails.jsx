import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiGet } from './utils/api.js';

const WatchDetails = () => {
  const { id } = useParams();
  const [watch, setWatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [comment, setComment] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [purchasing, setPurchasing] = useState(false);


  useEffect(() => {
    // Fetch watch details
    fetch(`/api/watches/${id}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setWatch(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
      });

    // Fetch current user
    const fetchCurrentUser = async () => {
      try {
        const response = await apiGet('/api/me');
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, [id]);

const handlePlaceBid = async () => {
  if (!bidAmount || parseFloat(bidAmount) <= (watch?.currentBid || 0)) {
    alert('Please enter a valid bid amount higher than the current bid.');
    return;
  }

  try {
    const response = await fetch(`/api/bids/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if needed
      },
      body: JSON.stringify({ amount: parseFloat(bidAmount), comment }),
      credentials: 'include', // Include cookies
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to place bid');
    }

    // Update watch state with new bid information
    setWatch(prevWatch => ({
      ...prevWatch,
      currentBid: data.bid.amount,
      buyer: data.bid.bidder, // Assuming the backend returns the bidder's ID
    }));

    setBidAmount('');
    alert('Bid placed successfully!');
  } catch (error) {
    console.error('Error placing bid:', error);
    alert(`Error placing bid: ${error.message}`);
  }
};

const handleBuyNow = async () => {
  console.log('NEW VERSION - Buy Now clicked for watch:', watch);
  console.log('Watch price:', watch?.price);
  console.log('Watch currentBid:', watch?.currentBid);
  
  // For testing purposes, use currentBid if no fixed price is set
  const buyPrice = watch?.price || watch?.currentBid;
  
  if (!buyPrice || buyPrice <= 0) {
    console.log('No price or current bid set - showing alert');
    alert('This watch does not have a price set. Please contact the seller.');
    return;
  }
  
  console.log('Proceeding with transaction for price:', buyPrice);

  const priceText = watch?.price ? 'fixed price' : 'current bid';
  const confirmMessage = `Are you sure you want to buy this ${watch.brand} ${watch.model} for $${buyPrice.toLocaleString()} (${priceText})?`;
  
  if (window.confirm(confirmMessage)) {
    setPurchasing(true);
    try {
      // First, get the seller's JunoPay client ID
      console.log('Fetching watch data for ID:', id);
      const watchResponse = await fetch(`/api/watches/${id}`, {
        credentials: 'include'
      });
      
      console.log('Watch response status:', watchResponse.status);
      const watchData = await watchResponse.json();
      console.log('Watch data received:', watchData);
      
      if (!watchData.owner?.junopay_client_id) {
        throw new Error('Seller is not configured for JunoPay transactions');
      }

      // Initiate JunoPay transaction
      console.log('Initiating JunoPay transaction...');
      const transactionPayload = {
        sellerClientId: watchData.owner.junopay_client_id,
        productName: `${watch.brand} ${watch.model}`,
        productCode: watch.reference_number || watch._id,
        currency: 'USD',
        purchasePrice: buyPrice.toString(),
        shippingPrice: '0',
        totalPrice: buyPrice.toString(),
        buyerNote: `Purchase of ${watch.brand} ${watch.model} - Ref: ${watch.reference_number}`
      };
      console.log('Transaction payload:', transactionPayload);
      
      const transactionResponse = await fetch('/api/junopay/transaction/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionPayload),
        credentials: 'include'
      });

      console.log('Transaction response status:', transactionResponse.status);
      console.log('Transaction response headers:', transactionResponse.headers);
      
      const transactionData = await transactionResponse.json();
      console.log('JunoPay transaction response:', transactionData);

      if (!transactionResponse.ok) {
        console.error('Transaction failed with status:', transactionResponse.status);
        if (transactionData.reauth) {
          alert('Your JunoPay session has expired. Please log in again to continue.');
          window.location.href = '/auth/junopay/login';
          return;
        }
        throw new Error(transactionData.error || 'Failed to initiate transaction');
      }

      // Transaction initiated successfully
      const transaction = transactionData.transaction;
      console.log('Transaction details:', transaction);
      
      // The JunoPay API should return an application transaction ID
      const applicationTransactionId = transaction.applicationTransactionId || transaction.transactionId || transaction.id;
      
      alert(`Transaction initiated successfully! 
Application Transaction ID: ${applicationTransactionId}
Status: ${transaction.status || 'initiated'}

You will receive further instructions for payment completion.`);

      // Optionally update watch status to indicate pending transaction
      // You could create a new status like 'pending_payment'
      
    } catch (error) {
      console.error('Error initiating purchase:', error);
      alert(`Error initiating purchase: ${error.message}`);
    } finally {
      setPurchasing(false);
    }
  }
};


if (loading) {
    return <div className="text-center text-xl mt-8 text-gray-700">Loading watch details...</div>;
  }

  if (!watch) {
    return <div className="text-center text-xl mt-8 text-red-600">Watch not found.</div>;
  }

  // Check if current user owns this watch
  const isOwnWatch = currentUser && (
    watch.seller === currentUser._id || 
    watch.owner === currentUser._id ||
    (watch.seller && watch.seller._id === currentUser._id) ||
    (watch.owner && watch.owner._id === currentUser._id)
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-center text-gray-800 mb-8">Watch Details</h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden p-6 md:flex md:gap-8">
          <div className="md:flex-shrink-0 md:w-1/2">
            {watch.imageUrl ? (
              <img src={watch.imageUrl} alt={`${watch.brand} ${watch.model}`} className="w-full h-64 object-cover rounded-md" />
            ) : (
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-semibold rounded-md">
                No Image Available
              </div>
            )}
          </div>
          <div className="mt-6 md:mt-0 md:flex-grow">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">{watch.brand} - {watch.model}</h2>
            <p className="text-gray-700 mb-2"><strong>Reference Number:</strong> {watch.reference_number}</p>
            <p className="text-gray-700 mb-2"><strong>Year:</strong> {watch.year}</p>
            <p className="text-gray-700 mb-2"><strong>Condition:</strong> {watch.condition}</p>
            {watch.price && (
              <p className="text-gray-700 mb-2"><strong>Price:</strong> ${watch.price.toLocaleString()}</p>
            )}
            {watch.owner && (
              <>
                <p className="text-gray-700 mb-2"><strong>Owner Email:</strong> {watch.owner.email}</p>
                <p className="text-gray-700 mb-2"><strong>Owner Name:</strong> {watch.owner.name}</p>
                <p className="text-gray-700 mb-2"><strong>Owner Company:</strong> {watch.owner.company_name}</p>
              </>
            )}
            <p className="text-gray-700 mt-4"><strong>Description:</strong> {watch.description}</p>
            {/* Add more watch details here as needed */}
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Auction Details</h3>
              <p className="text-gray-700 mb-2"><strong>Current Bid:</strong> ${watch.currentBid ? watch.currentBid.toFixed(2) : 'No bids yet'}</p>
              <div className="flex items-center gap-2 mb-4">
                <strong className="text-gray-700">Status:</strong>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  watch.status === 'active' ? 'bg-green-100 text-green-800' :
                  watch.status === 'sold' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {watch.status.charAt(0).toUpperCase() + watch.status.slice(1)}
                </span>
              </div>

              {watch.status === 'active' && (
                <div className="flex flex-col gap-4">
                  {isOwnWatch ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <p className="text-blue-800 font-medium mb-2">This is your listing</p>
                      <p className="text-blue-600 text-sm">You cannot bid on your own watch. You can edit this listing from your profile.</p>
                      <button
                        onClick={() => window.location.href = `/admin/edit-watch/${watch._id}`}
                        className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Edit Listing
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="number"
                        placeholder="Enter your bid"
                        className="px-4 py-2 border rounded-md w-full"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                      <textarea
                        placeholder="Add a comment (optional)"
                        className="px-4 py-2 border rounded-md w-full"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      ></textarea>
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 w-full"
                        onClick={handlePlaceBid}
                      >
                        Place Bid
                      </button>
                      <button
                        className={`${purchasing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded-md w-full transition-colors`}
                        onClick={handleBuyNow}
                        disabled={purchasing}
                      >
                        {purchasing ? 'Processing...' : 'Buy Now'}
                      </button>
                    </>
                  )}
                </div>
              )}
              {/* Add Buy Now button later */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchDetails;
