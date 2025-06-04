import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom'; // Assuming react-router-dom is used for routing

const WatchAdminEdit = () => {
  const { id } = useParams(); // Get watch ID from URL
  const [users, setUsers] = useState([]); // State to store users for the dropdown
  const [usersLoading, setUsersLoading] = useState(true); // Loading state for users
  const [usersError, setUsersError] = useState(null); // Error state for users
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    reference_number: '',
    description: '',
    year: '',
    condition: '',
    watchImage: null, // For the new image file
    imageUrl: '', // To display the current image
    seller: '', // Add seller field to form data
  });


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/users'); // Fetch users from backend
        setUsers(response.data);
        setUsersLoading(false);
      } catch (err) {
        setUsersError(err);
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, []); // Empty dependency array means this runs once on mount

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWatch = async () => {
      try {
        // TODO: Use the admin specific endpoint once implemented and secured
        const response = await axios.get(`http://localhost:8001/api/watches/${id}`);
        setFormData({ ...response.data, watchImage: null }); // Pre-fill form with existing data
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchWatch();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, watchImage: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setError(null);

    const data = new FormData();
    for (const key in formData) {
      if (formData[key] !== null) { // Don't append null values
        data.append(key, formData[key]);
      }
    }

    try {
      // TODO: Use the admin specific endpoint once implemented and secured
      await axios.put(`http://localhost:8001/api/watches/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(true);
      setSubmitting(false);
      // TODO: Redirect to the watch list page
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading watch data...</div>;
  }

  if (error && !formData.brand) { // Show error only if initial fetch failed
    return <div>Error loading watch: {error.message}</div>;
  }

  return (
    <div>
      <h2>Edit Watch</h2>
      {success && <div style={{ color: 'green' }}>Watch updated successfully!</div>}
      {error && <div style={{ color: 'red' }}>Error updating watch: {error.message}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="brand">Brand:</label>
          <input type="text" id="brand" name="brand" value={formData.brand} onChange={handleInputChange} required />
        </div>
        <div>
          <label htmlFor="model">Model:</label>
          <input type="text" id="model" name="model" value={formData.model} onChange={handleInputChange} required />
        </div>
        <div>
          <label htmlFor="reference_number">Reference Number:</label>
          <input type="text" id="reference_number" name="reference_number" value={formData.reference_number} onChange={handleInputChange} required />
        </div>
        <div>
          <label htmlFor="description">Description:</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleInputChange}></textarea>
        </div>
        <div>
          <label htmlFor="year">Year:</label>
          <input type="number" id="year" name="year" value={formData.year} onChange={handleInputChange} />
        </div>
        <div>
          <label htmlFor="condition">Condition:</label>
          <input type="text" id="condition" name="condition" value={formData.condition} onChange={handleInputChange} />
        </div>
        <div>
          <label htmlFor="watchImage">Watch Image:</label>
          <input type="file" id="watchImage" name="watchImage" accept="image/*" onChange={handleFileChange} />
          {formData.imageUrl && (
            <div>
              <p>Current Image:</p>
              <img src={formData.imageUrl} alt="Current Watch Image" style={{ maxWidth: '200px' }} />
            </div>
          )}
        </div>
        <button type="submit" disabled={submitting}>{submitting ? 'Updating...' : 'Update Watch'}</button>
      </form>
    </div>
  );
};

export default WatchAdminEdit;
