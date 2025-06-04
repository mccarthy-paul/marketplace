import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom'; // Assuming react-router-dom is used for routing

const UserAdminEdit = () => {
  const { id } = useParams(); // Get user ID from URL
  const [formData, setFormData] = useState({
    juno_id: '',
    email: '',
    name: '',
    company_name: '',
    is_admin: false,
    password: '', // Password field for updating (not pre-filled)
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Fetch user data from the backend (admin endpoint)
        const response = await axios.get(`/api/users/${id}`);
        // Pre-fill form with existing data, but not the password
        setFormData({ ...response.data, password: '' });
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setError(null);

    const dataToUpdate = { ...formData };
    // Remove password from update data if it's empty (not being changed)
    if (dataToUpdate.password === '') {
      delete dataToUpdate.password;
    }

    try {
      // Put updated user data to the backend (admin endpoint)
      await axios.put(`/api/users/${id}`, dataToUpdate);
      setSuccess(true);
      setSubmitting(false);
      // TODO: Optionally redirect to user list or show success message and stay
      // navigate('/admin/users'); // Example redirect
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating user');
      console.error('Error updating user:', err);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading user data...</div>;
  }

  if (error && !formData.email) { // Show error only if initial fetch failed
    return <div>Error loading user: {error.message}</div>;
  }

  return (
    <div>
      <h2>Edit User</h2>
      {success && <div style={{ color: 'green' }}>User updated successfully!</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="juno_id">Juno ID:</label>
          {/* Juno ID is likely not editable */}
          <input type="text" id="juno_id" name="juno_id" value={formData.juno_id} disabled />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required />
        </div>
        <div>
          <label htmlFor="name">Name:</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
        </div>
        <div>
          <label htmlFor="company_name">Company Name:</label>
          <input type="text" id="company_name" name="company_name" value={formData.company_name} onChange={handleInputChange} required />
        </div>
        <div>
          <label htmlFor="password">Password (leave blank to keep current):</label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} />
        </div>
        <div>
          <label htmlFor="is_admin">Is Admin:</label>
          <input type="checkbox" id="is_admin" name="is_admin" checked={formData.is_admin} onChange={handleInputChange} />
        </div>
        <button type="submit" disabled={submitting}>{submitting ? 'Updating...' : 'Update User'}</button>
      </form>
    </div>
  );
};

export default UserAdminEdit;
