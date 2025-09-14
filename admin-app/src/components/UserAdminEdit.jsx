import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const UserAdminEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    juno_id: '',
    junopay_client_id: '',
    email: '',
    name: '',
    company_name: '',
    is_admin: false,
    buyer_fee: 0,
    seller_fee: 0,
    password: '',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`/api/admin/users/${id}`);
        setFormData({ 
          ...response.data, 
          password: '',
          buyer_fee: response.data.buyer_fee || 0,
          seller_fee: response.data.seller_fee || 0
        });
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load user');
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : 
               type === 'number' ? parseFloat(value) || 0 : 
               value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setError(null);

    const dataToUpdate = { ...formData };
    // Remove password if empty
    if (dataToUpdate.password === '') {
      delete dataToUpdate.password;
    }

    try {
      await axios.put(`/api/admin/users/${id}`, dataToUpdate);
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating user');
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/users');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ab54a] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error && !formData.email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-700">Error loading user</p>
          <p className="text-red-500 mt-2">{error}</p>
          <button 
            onClick={() => navigate('/admin/users')}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
          <p className="mt-2 text-gray-600">Update user account information and permissions</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            User updated successfully! Redirecting...
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow-sm rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Account Information Section */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Leave blank to keep current"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Only fill if you want to change the password</p>
                </div>
              </div>
            </div>

            {/* System Information Section */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="juno_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Juno ID
                  </label>
                  <input
                    type="text"
                    id="juno_id"
                    name="juno_id"
                    value={formData.juno_id || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">System identifier (read-only)</p>
                </div>

                <div>
                  <label htmlFor="junopay_client_id" className="block text-sm font-medium text-gray-700 mb-1">
                    JunoPay Client ID
                  </label>
                  <input
                    type="text"
                    id="junopay_client_id"
                    name="junopay_client_id"
                    value={formData.junopay_client_id || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Required for listing watches</p>
                </div>
              </div>
            </div>

            {/* Fees Section */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Fees</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="buyer_fee" className="block text-sm font-medium text-gray-700 mb-1">
                    Buyer Fee (%)
                  </label>
                  <input
                    type="number"
                    id="buyer_fee"
                    name="buyer_fee"
                    value={formData.buyer_fee}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Percentage fee charged to buyers</p>
                </div>

                <div>
                  <label htmlFor="seller_fee" className="block text-sm font-medium text-gray-700 mb-1">
                    Seller Fee (%)
                  </label>
                  <input
                    type="number"
                    id="seller_fee"
                    name="seller_fee"
                    value={formData.seller_fee}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Percentage fee charged to sellers</p>
                </div>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Permissions</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_admin"
                    name="is_admin"
                    checked={formData.is_admin}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-[#3ab54a] focus:ring-[#3ab54a] border-gray-300 rounded"
                  />
                  <label htmlFor="is_admin" className="ml-2 block text-sm text-gray-700">
                    Administrator Access
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  Grant full access to admin dashboard and all system features
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-[#3ab54a] hover:bg-[#32a042] disabled:bg-gray-400 text-white rounded-md transition-colors"
              >
                {submitting ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserAdminEdit;
