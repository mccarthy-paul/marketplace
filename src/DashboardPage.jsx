import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Gavel, Watch, Users, BarChart3, Settings } from 'lucide-react';

const DashboardPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalBids: 0,
    totalWatches: 0,
    totalUsers: 0
  });

  useEffect(() => {
    // Fetch current user
    fetch('/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setCurrentUser(data.user);
        // Only fetch admin data if user is admin
        if (data.user?.is_admin) {
          fetchAdminStats();
        }
      })
      .catch(err => console.error(err));
  }, []);

  const fetchAdminStats = async () => {
    try {
      // These endpoints would need to be created
      const [ordersRes, bidsRes, watchesRes, usersRes] = await Promise.all([
        fetch('/api/admin/orders/count', { credentials: 'include' }),
        fetch('/api/admin/bids/count', { credentials: 'include' }),
        fetch('/api/admin/watches/count', { credentials: 'include' }),
        fetch('/api/admin/users/count', { credentials: 'include' })
      ]);

      const [orders, bids, watches, users] = await Promise.all([
        ordersRes.ok ? ordersRes.json() : { count: 0 },
        bidsRes.ok ? bidsRes.json() : { count: 0 },
        watchesRes.ok ? watchesRes.json() : { count: 0 },
        usersRes.ok ? usersRes.json() : { count: 0 }
      ]);

      setStats({
        totalOrders: orders.count || 0,
        totalBids: bids.count || 0,
        totalWatches: watches.count || 0,
        totalUsers: users.count || 0
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!currentUser.is_admin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <p className="text-gray-600">You need administrator privileges to access this page.</p>
          <Link to="/" className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      title: 'Orders Management',
      description: 'View and manage all orders in the system',
      icon: ShoppingBag,
      link: '/admin/orders',
      color: 'bg-blue-500',
      count: stats.totalOrders
    },
    {
      title: 'Bids Management',
      description: 'View and manage all bids in the system',
      icon: Gavel,
      link: '/admin/bids',
      color: 'bg-green-500',
      count: stats.totalBids
    },
    {
      title: 'Watches Management',
      description: 'View and manage all watch listings',
      icon: Watch,
      link: '/admin/watches',
      color: 'bg-purple-500',
      count: stats.totalWatches
    },
    {
      title: 'Users Management',
      description: 'View and manage user accounts',
      icon: Users,
      link: '/admin/users',
      color: 'bg-orange-500',
      count: stats.totalUsers
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard - v2.0
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {currentUser.name}. Here's what's happening with your marketplace. (Updated: Sept 6, 2025)
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {menuItems.map((item) => (
            <div key={item.title} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{item.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{item.count}</p>
                </div>
                <div className={`${item.color} rounded-full p-3`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              to={item.link}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <div className="flex items-start space-x-4">
                <div className={`${item.color} rounded-lg p-3`}>
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {item.description}
                  </p>
                  <div className="flex items-center text-blue-600 hover:text-blue-700">
                    <span className="text-sm font-medium">Manage</span>
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/add-watch"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add New Watch
            </Link>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
              Export Data
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              System Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
