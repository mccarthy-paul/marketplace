import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatPrice } from './utils/currency';

const WatchBidsPage = () => {
  const { watchId } = useParams();
  const [bids, setBids] = useState([]);
  const [watch, setWatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both watch and bids data
        const [watchResponse, bidsResponse] = await Promise.all([
          axios.get(`http://localhost:8001/api/watches/${watchId}`, { withCredentials: true }),
          axios.get(`http://localhost:8001/api/bids/watch/${watchId}`, { withCredentials: true })
        ]);
        setWatch(watchResponse.data);
        setBids(bidsResponse.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchData();
  }, [watchId]);

  if (loading) {
    return <div>Loading bids for watch {watchId}...</div>;
  }

  if (error) {
    return <div>Error loading bids: {error.message}</div>;
  }

  return (
    <div>
      <h2>Bids for Watch {watchId}</h2>
      {bids.length === 0 ? (
        <p>No bids found for this watch.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Bid ID</th>
              <th>Bid Amount</th>
              <th>Status</th>
              <th>Bidder Email</th>
              <th>Bid Time</th>
            </tr>
          </thead>
          <tbody>
            {bids.map(bid => (
              <tr key={bid._id}>
                <td onClick={() => navigate(`/bids/${bid._id}`)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                  {bid._id}
                </td>
                <td>{formatPrice(bid.amount, watch?.currency)}</td>
                <td>{bid.status}</td>
                <td>{bid.bidder ? bid.bidder.email : 'N/A'}</td>
                <td>{new Date(bid.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default WatchBidsPage;
