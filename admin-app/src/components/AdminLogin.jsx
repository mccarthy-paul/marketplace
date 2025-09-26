import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../utils/api.js';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiPost('/api/admin/login', credentials);
      console.log('Admin login successful:', data);
      navigate('/dashboard'); // Redirect to admin dashboard on success
    } catch (err) {
      setError(err.message || 'Login failed');
      console.error('Admin login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen"> {/* Center the form vertically and horizontally */}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm"> {/* Add white background, padding, rounded corners, shadow, and max width */}
        <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2> {/* Center heading and add margin */}
        {error && <div className="text-red-500 text-center mb-4">{error}</div>} {/* Style error message */}
        <form onSubmit={handleSubmit} className="space-y-4"> {/* Add spacing between form groups */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email:</label> {/* Style label */}
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center justify-between"> {/* Use flexbox to align password and login button */}
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password:</label> {/* Style label */}
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              required
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="ml-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
