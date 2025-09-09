// API configuration for admin app
const getApiBaseUrl = () => {
  // If we're on the ngrok admin domain, use the admin API routes on the same domain
  if (window.location.hostname.includes('4c153d847f98.ngrok-free.app')) {
    return ''; // Use relative URLs when on ngrok admin domain
  }
  
  // For local development, use relative URLs to localhost:8002
  return '';
};

export const API_BASE_URL = getApiBaseUrl();