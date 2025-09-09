import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Edit, RefreshCw } from 'lucide-react';

const AdminOrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, { 
        credentials: 'include' 
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else {
        setError('Failed to load order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Error loading order details');
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/refresh-status`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800',
      'confirmed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'initiated': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800',
      'failed': 'bg-red-100 text-red-800'
    };
    
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading order details...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error || 'Order not found'}</div>
          <Link to="/admin/orders" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/orders"
              className="bg-gray-600 text-white p-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600 mt-1">
                Transaction ID: {order.applicationTransactionId}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={refreshStatus}
              disabled={refreshing}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Status'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Information</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(order.currentStatus)}`}>
                  {order.currentStatus?.charAt(0).toUpperCase() + order.currentStatus?.slice(1)}
                </span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-medium text-gray-900">{order.applicationTransactionId}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Order Date</span>
                <span className="font-medium text-gray-900">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium text-gray-900">
                  {new Date(order.updated_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Currency</span>
                <span className="font-medium text-gray-900">{order.currency}</span>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Information</h2>
            
            {order.watch ? (
              <div className="space-y-4">
                {order.watch.imageUrl && (
                  <div className="flex justify-center">
                    <img 
                      src={order.watch.imageUrl} 
                      alt={`${order.watch.brand} ${order.watch.model}`}
                      className="w-48 h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Brand</span>
                  <span className="font-medium text-gray-900">{order.watch.brand}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Model</span>
                  <span className="font-medium text-gray-900">{order.watch.model}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Reference</span>
                  <span className="font-medium text-gray-900">{order.watch.reference_number}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Condition</span>
                  <span className="font-medium text-gray-900">{order.watch.condition}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Product Name</span>
                  <span className="font-medium text-gray-900">{order.productName}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Product Code</span>
                  <span className="font-medium text-gray-900">{order.productCode}</span>
                </div>
              </div>
            )}
          </div>

          {/* Buyer Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Buyer Information</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Name</span>
                <span className="font-medium text-gray-900">{order.buyer?.name || 'Unknown'}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Email</span>
                <span className="font-medium text-gray-900">{order.buyer?.email || 'No email'}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Company</span>
                <span className="font-medium text-gray-900">{order.buyer?.company_name || 'No company'}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">JunoPay Client ID</span>
                <span className="font-medium text-gray-900">{order.buyerClientId}</span>
              </div>
            </div>
          </div>

          {/* Seller Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Seller Information</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Name</span>
                <span className="font-medium text-gray-900">{order.seller?.name || 'Unknown'}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Email</span>
                <span className="font-medium text-gray-900">{order.seller?.email || 'No email'}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Company</span>
                <span className="font-medium text-gray-900">{order.seller?.company_name || 'No company'}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">JunoPay Client ID</span>
                <span className="font-medium text-gray-900">{order.sellerClientId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Details */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Pricing Details</h2>
          
          <div className="max-w-md">
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Purchase Price</span>
                <span className="font-medium text-gray-900">${parseFloat(order.purchasePrice).toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Shipping Price</span>
                <span className="font-medium text-gray-900">${parseFloat(order.shippingPrice || 0).toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Buyer Fee</span>
                <span className="font-medium text-gray-900">${parseFloat(order.buyerFee || 0).toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between py-2 border-t-2 border-gray-200 pt-2">
                <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                <span className="text-lg font-bold text-green-600">${parseFloat(order.totalPrice).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.buyerNote && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Buyer Notes</h2>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-gray-700">{order.buyerNote}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;