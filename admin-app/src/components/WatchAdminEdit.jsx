import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';

const WatchAdminEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    reference_number: '',
    description: '',
    year: '',
    condition: '',
    price: '',
    currency: 'USD',
    status: 'active',
    currentBid: '',
    owner: '',
    images: [],
    imageUrl: '' // For backwards compatibility
  });

  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Condition options
  const conditionOptions = ['Mint', 'Excellent', 'Very Good', 'Good', 'Fair'];
  const statusOptions = ['active', 'sold', 'pending', 'cancelled'];
  const currencyOptions = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'AUD', name: 'Australian Dollar' },
    { code: 'SGD', symbol: 'SGD', name: 'Singapore Dollar' },
    { code: 'HKD', symbol: 'HKD', name: 'Hong Kong Dollar' }
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/admin/users');
        setUsers(response.data);
        setUsersLoading(false);
      } catch (err) {
        setUsersError(err);
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchWatch = async () => {
      try {
        const response = await axios.get(`/api/admin/watches/${id}`);
        const watchData = response.data;
        setFormData({
          brand: watchData.brand || '',
          model: watchData.model || '',
          reference_number: watchData.reference_number || '',
          description: watchData.description || '',
          year: watchData.year || '',
          condition: watchData.condition || '',
          price: watchData.price || '',
          currency: watchData.currency || 'USD',
          status: watchData.status || 'active',
          currentBid: watchData.currentBid || '',
          owner: watchData.owner ? watchData.owner._id : '',
          images: watchData.images || [],
          imageUrl: watchData.imageUrl || ''
        });
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Limit to 5 images total
    const currentImageCount = formData.images.length + newImages.length;
    if (files.length + currentImageCount > 5) {
      alert('You can have a maximum of 5 images total');
      return;
    }
    
    setNewImages([...newImages, ...files]);
    
    // Generate previews for new images
    const newPreviews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        if (newPreviews.length === files.length) {
          setImagePreviews([...imagePreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index) => {
    const updatedImages = [...formData.images];
    updatedImages.splice(index, 1);
    setFormData({ ...formData, images: updatedImages });
  };

  const removeNewImage = (index) => {
    const updatedNewImages = [...newImages];
    updatedNewImages.splice(index, 1);
    setNewImages(updatedNewImages);
    
    const updatedPreviews = [...imagePreviews];
    updatedPreviews.splice(index, 1);
    setImagePreviews(updatedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setError(null);

    const data = new FormData();
    
    // Add all form fields
    for (const key in formData) {
      if (key === 'images') {
        // Send existing images as JSON string
        data.append('existingImages', JSON.stringify(formData.images));
      } else if (key === 'owner' && formData[key] === '') {
        continue;
      } else if (formData[key] !== null && formData[key] !== undefined) {
        data.append(key, formData[key]);
      }
    }

    // Add new image files
    newImages.forEach(file => {
      data.append('watchImages', file);
    });

    try {
      await axios.put(`/api/admin/watches/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(true);
      setSubmitting(false);
      setTimeout(() => {
        navigate('/admin/watches');
      }, 1500);
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading watch data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/watches')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Watches
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Watch</h1>
        <p className="text-gray-600 mt-2">Update watch details and manage images</p>
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-800">Watch updated successfully! Redirecting...</span>
        </div>
      )}
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">Error updating watch: {error.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand *
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Rolex"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Submariner"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number *
              </label>
              <input
                type="text"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 116610LN"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 2020"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select condition</option>
                {conditionOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter watch description..."
              />
            </div>
          </div>
        </div>

        {/* Pricing Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Pricing Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {currencyOptions.map(option => (
                  <option key={option.code} value={option.code}>
                    {option.code} - {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buy Now Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">
                  {currencyOptions.find(c => c.code === formData.currency)?.symbol}
                </span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Bid
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">
                  {currencyOptions.find(c => c.code === formData.currency)?.symbol}
                </span>
                <input
                  type="number"
                  name="currentBid"
                  value={formData.currentBid}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Owner Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Owner Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Owner
            </label>
            {usersLoading ? (
              <div className="text-gray-500">Loading users...</div>
            ) : usersError ? (
              <div className="text-red-600">Error loading users: {usersError.message}</div>
            ) : (
              <select
                name="owner"
                value={formData.owner}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select an owner</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} - {user.email}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Images Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Watch Images</h2>
          
          {/* Existing Images */}
          {formData.images.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Current Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Watch ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images Preview */}
          {imagePreviews.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">New Images to Upload</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`New ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Images (Max 5 total)
            </label>
            <div className="flex items-center">
              <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                <Upload className="w-5 h-5 mr-2 text-gray-600" />
                <span className="text-gray-700">Choose Files</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={formData.images.length + newImages.length >= 5}
                />
              </label>
              <span className="ml-4 text-sm text-gray-500">
                {formData.images.length + newImages.length}/5 images
              </span>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/watches')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {submitting ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Watch
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WatchAdminEdit;