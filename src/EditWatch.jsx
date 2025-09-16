import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EditWatch = ({ watch, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    reference_number: '',
    description: '',
    year: new Date().getFullYear(),
    condition: 'Excellent',
    price: '',
    currentBid: '',
    currency: 'USD',
    status: 'active'
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Condition options
  const conditionOptions = ['Mint', 'Excellent', 'Very Good', 'Good', 'Fair'];
  const currencyOptions = ['USD', 'EUR', 'GBP', 'JPY', 'CHF'];
  const statusOptions = ['active', 'inactive', 'sold', 'pending'];

  useEffect(() => {
    if (watch) {
      setFormData({
        brand: watch.brand || '',
        model: watch.model || '',
        reference_number: watch.reference_number || '',
        description: watch.description || '',
        year: watch.year || new Date().getFullYear(),
        condition: watch.condition || 'Excellent',
        price: watch.price || '',
        currentBid: watch.currentBid || '',
        currency: watch.currency || 'USD',
        status: watch.status || 'active'
      });

      // Set existing images
      if (watch.images && watch.images.length > 0) {
        setExistingImages(watch.images);
      } else if (watch.imageUrl) {
        setExistingImages([watch.imageUrl]);
      }
    }
  }, [watch]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? (value ? Number(value) : '') : value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Limit total images (existing + new) to 5
    const totalImages = existingImages.length + imageFiles.length + files.length;
    if (totalImages > 5) {
      alert(`You can have a maximum of 5 images. You currently have ${existingImages.length + imageFiles.length} images.`);
      return;
    }

    // Add new files to existing ones
    const newImageFiles = [...imageFiles, ...files];
    setImageFiles(newImageFiles);

    // Generate previews for new files
    const newPreviews = [...imagePreviews];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        if (newPreviews.length === newImageFiles.length) {
          setImagePreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index) => {
    const newExistingImages = existingImages.filter((_, i) => i !== index);
    setExistingImages(newExistingImages);
  };

  const removeNewImage = (index) => {
    const newImageFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newImageFiles);
    setImagePreviews(newPreviews);
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

      // Add existing images to keep
      data.append('existingImages', JSON.stringify(existingImages));

      // Add new images if selected
      imageFiles.forEach(file => {
        data.append('watchImages', file);
      });

      // Submit update to user endpoint
      const response = await fetch(`/api/watches/user/${watch._id}`, {
        method: 'PUT',
        body: data,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update watch');
      }

      const updatedWatch = await response.json();

      // Call the onSave callback with updated watch
      if (onSave) {
        onSave(updatedWatch);
      }

      // Close modal
      onClose();
    } catch (err) {
      console.error('Error updating watch:', err);
      setError(err.message || 'Failed to update watch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Watch Listing</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a]"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a]"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a]"
                />
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                  Year *
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a]"
                />
              </div>

              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                  Condition *
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a]"
                >
                  {conditionOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a]"
                >
                  {statusOptions.map(option => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a]"
              placeholder="Describe the watch condition, features, and any other relevant details..."
            />
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a]"
                >
                  {currencyOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Fixed Price (optional)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a]"
                  placeholder="Leave empty for offers only"
                />
              </div>

              <div>
                <label htmlFor="currentBid" className="block text-sm font-medium text-gray-700 mb-1">
                  Starting Bid
                </label>
                <input
                  type="number"
                  id="currentBid"
                  name="currentBid"
                  value={formData.currentBid}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a]"
                  placeholder="Minimum bid amount"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Images</h3>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Current Images</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Watch ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            {imagePreviews.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">New Images to Upload</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`New ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            {existingImages.length + imageFiles.length < 5 && (
              <div>
                <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">
                  Add More Images (Max {5 - existingImages.length - imageFiles.length} more)
                </label>
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab54a]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Accepted formats: JPEG, PNG, GIF, WebP. Maximum 5 images total.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-[#3ab54a] text-white rounded-md hover:bg-[#32a042] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Updating...' : 'Update Watch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWatch;