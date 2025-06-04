import React, { useEffect, useState } from 'react'; // Import useEffect
import axios from 'axios';

const WatchAdminAdd = () => {
  const [users, setUsers] = useState([]); // State to store users for the dropdown
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    reference_number: '',
    description: '',
    year: '',
    condition: '',
    watchImage: null, // For the image file
    seller: '', // Add seller field to form data
  });

  const [usersLoading, setUsersLoading] = useState(true); // Loading state for users
  const [usersError, setUsersError] = useState(null); // Error state for users

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

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

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
      data.append(key, formData[key]);
    }

    try {
      // TODO: Use the admin specific endpoint once implemented and secured
      await axios.post('/api/watches', data, {
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

  return (
    <div>
      <h2>Add New Watch</h2>
      {success && <div style={{ color: 'green' }}>Watch added successfully!</div>}
      {error && <div style={{ color: 'red' }}>Error adding watch: {error.message}</div>}
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
          <label htmlFor="seller">Seller:</label>
          {usersLoading ? (
            <div>Loading sellers...</div>
          ) : usersError ? (
            <div>Error loading sellers: {usersError.message}</div>
          ) : (
            <select id="seller" name="seller" value={formData.seller} onChange={handleInputChange} required>
              <option value="">Select a Seller</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.email} ({user.name})
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label htmlFor="watchImage">Watch Image:</label>
          <input type="file" id="watchImage" name="watchImage" accept="image/*" onChange={handleFileChange} />
        </div>
        <button type="submit" disabled={submitting}>{submitting ? 'Adding...' : 'Add Watch'}</button>
      </form>
    </div>
  );
};

export default WatchAdminAdd;
