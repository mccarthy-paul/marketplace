// API base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Export the base URL for direct use
export const API_URL = API_BASE_URL;

// Helper to build full API URL
export const getApiUrl = (path) => {
  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // In production, use the full URL from environment variable
  // In development, relative URLs work due to Vite proxy
  if (API_BASE_URL) {
    return `${API_BASE_URL}/${cleanPath}`;
  }

  // For local development, return relative path
  return `/${cleanPath}`;
};

// Utility function for API requests that includes ngrok-skip-browser-warning header
export const apiRequest = async (url, options = {}) => {
  // Convert relative API paths to full URLs
  const fullUrl = url.startsWith('/api/') ? getApiUrl(url) : url;

  const defaultOptions = {
    credentials: 'include',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  return fetch(fullUrl, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  });
};

// Specific helper for GET requests
export const apiGet = async (url, options = {}) => {
  const response = await apiRequest(url, { method: 'GET', ...options });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Specific helper for POST requests
export const apiPost = async (url, data = null, options = {}) => {
  const postOptions = {
    method: 'POST',
    ...options
  };

  if (data) {
    postOptions.body = typeof data === 'string' ? data : JSON.stringify(data);
  }

  const response = await apiRequest(url, postOptions);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Specific helper for PUT requests
export const apiPut = async (url, data = null, options = {}) => {
  const putOptions = {
    method: 'PUT',
    ...options
  };

  if (data) {
    putOptions.body = typeof data === 'string' ? data : JSON.stringify(data);
  }

  const response = await apiRequest(url, putOptions);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Specific helper for DELETE requests
export const apiDelete = async (url, options = {}) => {
  const response = await apiRequest(url, { method: 'DELETE', ...options });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Helper to convert image URLs to use backend API
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's a relative path starting with /public, convert to backend URL
  if (imagePath.startsWith('/public/')) {
    return getApiUrl(imagePath);
  }

  // If it's just a filename or different format, assume it's in uploads directory
  if (!imagePath.startsWith('/')) {
    return getApiUrl(`public/uploads/watches/${imagePath}`);
  }

  return getApiUrl(imagePath);
};