import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const WatchDetails = () => {
  const { id } = useParams();
  const [watch, setWatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [comment, setComment] = useState('');


  useEffect(() => {
    fetch(`http://localhost:8001/api/watches/${id}`)
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
}, [id]);

const handlePlaceBid = async () => {
  if (!bidAmount || parseFloat(bidAmount) <= (watch?.currentBid || 0)) {
    alert('Please enter a valid bid amount higher than the current bid.');
    return;
  }

  try {
    const response = await fetch(`http://localhost:8001/api/bids/${id}`, {
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
  if (window.confirm('Are you sure you want to buy this watch?')) {
    try {
      const response = await fetch(`/api/watches/${id}/buy`, { // New endpoint for buying
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to buy watch');
      }

      // Update watch state with new status and buyer
      setWatch(prevWatch => ({
        ...prevWatch,
        status: data.watch.status,
        buyer: data.watch.buyer,
      }));

      alert('Watch purchased successfully!');
    } catch (error) {
      console.error('Error buying watch:', error);
      alert(`Error buying watch: ${error.message}`);
    }
  }
};


if (loading) {
    return <div className="text-center text-xl mt-8 text-gray-700">Loading watch details...</div>;
  }

  if (!watch) {
    return <div className="text-center text-xl mt-8 text-red-600">Watch not found.</div>;
  }

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
              <p className="text-gray-700 mb-4"><strong>Status:</strong> {watch.status}</p>

              {watch.status === 'active' && (
                <div className="flex flex-col gap-4">
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
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 w-full"
                    onClick={handleBuyNow}
                  >
                    Buy Now
                  </button>
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
