import React, { useEffect, useState } from 'react';

const ListingList = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/listings')
      .then(res => res.json())
      .then(data => {
        setListings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading listings...</div>;
  }

  return (
    <div>
      <h1>Listing List</h1>
      <ul>
        {listings.map(listing => (
          <li key={listing.id}>
            Listing ID: {listing.id}, Price: {listing.price}, Available: {listing.is_available ? 'Yes' : 'No'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ListingList;
