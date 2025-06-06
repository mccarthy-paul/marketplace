import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const WatchAdminList = () => {
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWatches = async () => {
      try {
        // TODO: Use the admin specific endpoint once implemented and secured
        const response = await axios.get('http://localhost:8001/api/watches');
        setWatches(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchWatches();
  }, []);

  if (loading) {
    return <div>Loading watches...</div>;
  }

  if (error) {
    return <div>Error loading watches: {error.message}</div>;
  }

  return (
    <div>
      <h2>Watch Admin List</h2>
      <table>
        <thead>
          <tr>
            <th>Brand</th>
            <th>Model</th>
            <th>Reference Number</th>
            <th>Year</th>
            <th>Condition</th>
            <th>Owner Email</th>
            <th>Owner Name</th>
            <th>Owner Company</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {watches.map((watch) => (
            <tr key={watch._id}>
              <td>{watch.brand}</td>
              <td>{watch.model}</td>
              <td>{watch.reference_number}</td>
              <td>{watch.year}</td>
              <td>{watch.condition}</td>
              <td>{watch.owner ? watch.owner.email : 'N/A'}</td>
              <td>{watch.owner ? watch.owner.name : 'N/A'}</td>
              <td>{watch.owner ? watch.owner.company_name : 'N/A'}</td>
              <td>
                <Link to={`/admin/watches/edit/${watch._id}`}>Edit</Link>
                <button onClick={() => handleDelete(watch._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link to="/admin/watches/new">Add New Watch</Link>
    </div>
  );

const handleDelete = async (watchId) => {
  try {
    // TODO: Use the admin specific endpoint once implemented and secured
    await axios.delete(`/api/${watchId}`);
    // Remove the deleted watch from the state
    setWatches(watches.filter(watch => watch._id !== watchId));
  } catch (err) {
    console.error('Error deleting watch:', err);
    // TODO: Display an error message to the user
  }
};
};

export default WatchAdminList;
