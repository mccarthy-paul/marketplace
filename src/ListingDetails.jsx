import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const ListingDetails = () => {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(res => res.json())
      .then(data => {
        setListing(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div>Loading listing details...</div>;
  }

  if (!listing) {
    return <div>Listing not found.</div>;
  }

  return (
    <div>
      <h1>Listing Details</h1>
      <p>Listing ID: {listing.id}</p>
      <p>Watch ID: {listing.watch_id}</p>
      <p>Seller ID: {listing.seller_id}</p>
      <p>Price: {listing.price}</p>
      <p>Available: {listing.is_available ? 'Yes' : 'No'}</p>
    </div>
  );
};

export default ListingDetails;
