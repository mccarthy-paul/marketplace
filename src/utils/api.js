// Utility function for API requests that includes ngrok-skip-browser-warning header
export const apiRequest = async (url, options = {}) => {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  return fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  });
};

// Specific helper for GET requests
export const apiGet = (url, options = {}) => {
  return apiRequest(url, { method: 'GET', ...options });
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