import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Assuming react-router-dom is used for navigation

const UserAdminAdd = () => {
  const [formData, setFormData] = useState({
    juno_id: '',
    email: '',
    name: '',
    company_name: '',
    is_admin: false,
    password: '', // Include password for admin creation
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setError(null);

    try {
      // Post new user data to the backend (admin endpoint)
      await axios.post('/api/users', formData);
      setSuccess(true);
      setSubmitting(false);
      navigate('/admin/users'); // Redirect to user list on success
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding user');
      console.error('Error adding user:', err);
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Add New User</h2>
      {success && <div style={{ color: 'green' }}>User added successfully!</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="juno_id">Juno ID:</label>
          <input type="text" id="juno_id" name="juno_id" value={formData.juno_id} onChange={handleInputChange} required />
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
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} required />
        </div>
        <div>
          <label htmlFor="is_admin">Is Admin:</label>
          <input type="checkbox" id="is_admin" name="is_admin" checked={formData.is_admin} onChange={handleInputChange} />
        </div>
        <button type="submit" disabled={submitting}>{submitting ? 'Adding...' : 'Add User'}</button>
      </form>
    </div>
  );
};

export default UserAdminAdd;
