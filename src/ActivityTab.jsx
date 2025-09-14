import React, { useState, useEffect } from 'react';
import { apiGet } from './utils/api.js';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const ActivityTab = () => {
  const [dailyBids, setDailyBids] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch all analytics data in parallel
      const [bidsRes, salesRes, summaryRes] = await Promise.all([
        apiGet('/api/analytics/daily-bids'),
        apiGet('/api/analytics/daily-sales'),
        apiGet('/api/analytics/summary')
      ]);

      if (bidsRes.ok) {
        const data = await bidsRes.json();
        setDailyBids(data.dailyBids || []);
      }

      if (salesRes.ok) {
        const data = await salesRes.json();
        setDailySales(data.dailySales || []);
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-sm text-gray-600">Total Bids Received</div>
          <div className="text-2xl font-bold text-gray-900">{summary?.totalBidsReceived || 0}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-sm text-gray-600">Pending Bids</div>
          <div className="text-2xl font-bold text-yellow-600">{summary?.pendingBids || 0}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-sm text-gray-600">Total Sales</div>
          <div className="text-2xl font-bold text-green-600">{summary?.totalSales || 0}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-sm text-gray-600">Total Revenue</div>
          <div className="text-2xl font-bold text-gray-900">${(summary?.totalRevenue || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Daily Bids Chart */}
      <div className="bg-white rounded-xl p-6 shadow-md border">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Daily Bids Received (Last 30 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyBids}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value, name) => {
                  if (name === 'count') return [value, 'Bids'];
                  if (name === 'totalValue') return [`$${value.toLocaleString()}`, 'Total Value'];
                  return [value, name];
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Number of Bids"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Sales Chart */}
      <div className="bg-white rounded-xl p-6 shadow-md border">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Daily Sales (Last 30 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailySales}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                label={{ value: 'Sales Count', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                label={{ value: 'Revenue ($)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value, name) => {
                  if (name === 'count') return [value, 'Sales'];
                  if (name === 'totalValue') return [`$${value.toLocaleString()}`, 'Revenue'];
                  return [value, name];
                }}
              />
              <Legend />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="totalValue"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorSales)"
                name="Revenue"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="count"
                stroke="#ef4444"
                strokeWidth={2}
                name="Number of Sales"
                dot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ActivityTab;