import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserWatchBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // State to store logged-in user

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('http://localhost:8001/api/users/me', { withCredentials: true });
        setCurrentUser(response.data.user);
        return response.data.user; // Return user data
      } catch (err) {
        console.error('Error fetching current user:', err);
        // Handle error, maybe redirect to login if not authenticated
        return null; // Return null if fetching failed
      }
    };

    const fetchUserWatchBids = async (user) => {
      try {
        console.log('Fetching user watch bids...'); // Add console log
        // Use user information if needed for the API call, although current API uses session
        const response = await axios.get('http://localhost:8001/api/bids/user/watches', { withCredentials: true });
        setBids(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchCurrentUser().then(user => {
      if (user) {
        fetchUserWatchBids(user);
      } else {
        setLoading(false); // Stop loading if user fetching failed
      }
    });

  }, []);

  // Move handleUpdateBidStatus outside of map
  const handleUpdateBidStatus = async (bidId, newStatus) => {
    try {
      await axios.put(`http://localhost:8001/api/bids/${bidId}/status`, { status: newStatus }, { withCredentials: true });
      // Refresh bids after successful update
      // TODO: Find a better way to refresh bids than refetching all
      const response = await axios.get('http://localhost:8001/api/bids/user/watches', { withCredentials: true });
      setBids(response.data);
    } catch (err) {
      console.error(`Error updating bid status to ${newStatus}:`, err);
      alert(`Error updating bid status: ${err.response?.data?.message || err.message}`);
    }
  };


  if (loading) {
    return <div>Loading bids...</div>;
  }

  if (error) {
    return <div>Error loading bids: {error.message}</div>;
  }

  return (
    <div className="bg-white">

      {bids.length === 0 ? (
        <p>No bids found for your watches.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Watch Model</th>
              <th>Watch Price</th>
              <th>Bid Amount</th>
              <th>Bidder Email</th>
              <th>Status</th>
              <th>Bid Type</th>
              <th>Owner Email</th>
              <th>Owner Name</th>
              <th>Owner Company</th>
              <th>Bid Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((bid) => {
              const isOwner = currentUser && bid.ownerEmail === currentUser.email;
              const isBidder = currentUser && bid.bidder?._id === currentUser._id;
              const bidType = isOwner ? 'Received' : 'Placed'; // Determine bid type

              return (
                <tr key={bid._id}>
                  <td>{bid.watch ? bid.watch.model : 'N/A'}</td>
                  <td>{bid.watch ? `$${bid.watch.price.toLocaleString()}` : 'N/A'}</td>
                  <td>${bid.amount.toLocaleString()}</td>
                  <td>{bid.bidder ? bid.bidder.email : 'N/A'}</td>
                  <td>{bid.status}</td>
                  <td>{bidType}</td>
                  <td>{bid.ownerEmail ? bid.ownerEmail : 'N/A'}</td>
                  <td>{bid.ownerName ? bid.ownerName : 'N/A'}</td>
                  <td>{bid.ownerCompany ? bid.ownerCompany : 'N/A'}</td>
                  <td>{new Date(bid.created_at).toLocaleString()}</td>
                  <td>
                    {/* Buttons for bids received (user is owner) */}
                    {isOwner && bid.status === 'offered' && (
                      <>
                        <button onClick={() => handleUpdateBidStatus(bid._id, 'accepted')}>Accept</button>
                        <button onClick={() => handleUpdateBidStatus(bid._id, 'rejected')}>Reject</button>
                      </>
                    )}
                    {/* Button for bids placed (user is bidder) */}
                    {isBidder && bid.status === 'offered' && (
                      <button onClick={() => handleUpdateBidStatus(bid._id, 'cancelled')}>Cancel</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserWatchBids;
