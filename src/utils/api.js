// API base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Export the base URL for direct use
export const API_URL = API_BASE_URL;

// Helper to build full API URL
export const getApiUrl = (path) => {
  // Add debug logging
  console.log('🔍 getApiUrl DEBUG:');
  console.log('  - Input path:', path);
  console.log('  - API_BASE_URL:', API_BASE_URL);
  console.log('  - VITE_API_URL env:', import.meta.env.VITE_API_URL);

  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  console.log('  - Clean path:', cleanPath);

  // In production, use the full URL from environment variable
  // In development, relative URLs work due to Vite proxy
  if (API_BASE_URL && API_BASE_URL.trim() !== '') {
    const fullUrl = `${API_BASE_URL}/${cleanPath}`;
    console.log('  - Using full URL:', fullUrl);
    return fullUrl;
  }

  // For local development or when VITE_API_URL is not set, return relative path
  const relativeUrl = `/${cleanPath}`;
  console.log('  - Using relative URL:', relativeUrl);
  return relativeUrl;
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
export const apiPost = (url, data = null, options = {}) => {
  const postOptions = {
    method: 'POST',
    ...options
  };

  if (data) {
    postOptions.body = typeof data === 'string' ? data : JSON.stringify(data);
  }

  return apiRequest(url, postOptions);
};

// Specific helper for PUT requests
export const apiPut = (url, data = null, options = {}) => {
  const putOptions = {
    method: 'PUT',
    ...options
  };

  if (data) {
    putOptions.body = typeof data === 'string' ? data : JSON.stringify(data);
  }

  return apiRequest(url, putOptions);
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