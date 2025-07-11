import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BidDetailsPage = () => {
  const { bidId } = useParams();
  const [bid, setBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchBidDetails = async () => {
      try {
        // TODO: Implement API endpoint to fetch bid details by bid ID
        const response = await axios.get(`http://localhost:8001/api/bids/${bidId}`, { withCredentials: true });
        setBid(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchBidDetails();
  }, [bidId]);

  const handleAddComment = async () => {
    try {
      // TODO: Implement API endpoint to add comments to a bid
      await axios.post(`http://localhost:8001/api/bids/${bidId}/comments`, { comment }, { withCredentials: true });
      setComment('');
      // Refresh bid details to show the new comment
      const response = await axios.get(`http://localhost:8001/api/bids/${bidId}`, { withCredentials: true });
      setBid(response.data);
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Error adding comment.');
    }
  };

  if (loading) {
    return <div>Loading bid details for bid {bidId}...</div>;
  }

  if (error) {
    return <div>Error loading bid details: {error.message}</div>;
  }

  if (!bid) {
    return <div>Bid not found.</div>;
  }

  return (
    <div>
      <h2>Bid Details for Bid {bidId}</h2>
      <p>Watch Model: {bid.watch ? bid.watch.model : 'N/A'}</p>
      <p>Bid Amount: ${bid.amount.toLocaleString()}</p>
      <p>Status: {bid.status}</p>
      <p>Bidder Email: {bid.bidder ? bid.bidder.email : 'N/A'}</p>
      <p>Bid Time: {new Date(bid.created_at).toLocaleString()}</p>

      <h3>Comments</h3>
      {bid.comments && bid.comments.length > 0 ? (
        <ul>
          {bid.comments.map((comment, index) => (
            <li key={index}>{comment.text} - {new Date(comment.created_at).toLocaleString()}</li>
          ))}
        </ul>
      ) : (
        <p>No comments yet.</p>
      )}

      <div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment"
        ></textarea>
        <button onClick={handleAddComment}>Add Comment</button>
      </div>
    </div>
  );
};

export default BidDetailsPage;
