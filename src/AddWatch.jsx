import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddWatch = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    reference_number: '',
    description: '',
    year: new Date().getFullYear(),
    condition: 'Excellent',
    startingPrice: '',
    price: '',
    status: 'active'
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Condition options
  const conditionOptions = ['Mint', 'Excellent', 'Very Good', 'Good', 'Fair'];

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'number' ? (value ? Number(value) : '') : value 
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Create form data for file upload
      const data = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          data.append(key, formData[key]);
        }
      });

      // Add image if selected
      if (imageFile) {
        data.append('watchImage', imageFile);
      }

      // Submit to user watches endpoint
      const response = await fetch('/api/watches/user', {
        method: 'POST',
        body: data,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add watch');
      }

      // Navigate back to profile with My Listings tab active
      navigate('/profile?tab=listings', { replace: true });
    } catch (err) {
      console.error('Error adding watch:', err);
      setError(err.message || 'Failed to add watch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile?tab=listings');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Watch</h1>
          <p className="mt-2 text-gray-600">List your watch on the marketplace</p>
        </div>

        {/* Form */}
        <div className="bg-white shadow-sm rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                    placeholder="e.g., Rolex, Patek Philippe"
                  />
                </div>

                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                    placeholder="e.g., Submariner, Nautilus"
                  />
                </div>

                <div>
                  <label htmlFor="reference_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Number *
                  </label>
                  <input
                    type="text"
                    id="reference_number"
                    name="reference_number"
                    value={formData.reference_number}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                    placeholder="e.g., 126610LV"
                  />
                </div>

                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                  >
                    {conditionOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                placeholder="Detailed description of the watch..."
              />
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startingPrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Starting Bid Price ($)
                  </label>
                  <input
                    type="number"
                    id="startingPrice"
                    name="startingPrice"
                    value={formData.startingPrice}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Buy Now Price ($)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Watch Image</h3>
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <label htmlFor="watchImage" className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Image
                  </label>
                  <input
                    type="file"
                    id="watchImage"
                    name="watchImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">Accepted formats: JPG, PNG, GIF</p>
                </div>

                {imagePreview && (
                  <div className="flex-shrink-0">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-24 w-24 object-cover rounded-md border"
                    />
                  </div>
                )}
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
                {submitting ? 'Adding Watch...' : 'Add Watch'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddWatch;