import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { getApiUrl } from './utils/api.js';

const OrderDetailsPage = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [transactionId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/junopay/orders/${transactionId}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch order details');
      }

      if (data.success) {
        setOrder(data.order);
      } else {
        setError(data.error || 'Failed to load order details');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelivery = async () => {
    setConfirmingDelivery(true);
    
    try {
      const response = await fetch(`/api/junopay/transaction/${order.applicationTransactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'confirm',
          note: deliveryNote
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.reauth) {
          alert('Your JunoPay session has expired. Please log in again.');
          window.location.href = getApiUrl('auth/junopay/login');
          return;
        }
        throw new Error(data.error || 'Failed to confirm delivery');
      }

      alert('Delivery confirmed successfully!');
      setDeliveryNote('');
      fetchOrderDetails(); // Refresh order details
      
    } catch (error) {
      console.error('Error confirming delivery:', error);
      alert(`Error confirming delivery: ${error.message}`);
    } finally {
      setConfirmingDelivery(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'initiated':
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'cancelled':
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'initiated':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Orders
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Order not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Orders
          </button>
          <h1 className="text-3xl font-bold">Order Details</h1>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-semibold mb-2">
                {order.watch?.brand} {order.watch?.model}
              </h2>
              <p className="text-gray-600">
                Order ID: {order.applicationTransactionId}
              </p>
              <p className="text-gray-600">
                Date: {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(order.currentStatus)}`}>
              {getStatusIcon(order.currentStatus)}
              {order.currentStatus?.charAt(0).toUpperCase() + order.currentStatus?.slice(1)}
            </span>
          </div>

          {/* Watch Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {order.watch?.imageUrl && (
              <img 
                src={order.watch.imageUrl} 
                alt={`${order.watch.brand} ${order.watch.model}`}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Reference Number</p>
                <p className="font-medium">{order.watch?.reference_number || order.productCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Condition</p>
                <p className="font-medium">{order.watch?.condition || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Year</p>
                <p className="font-medium">{order.watch?.year || 'N/A'}</p>
              </div>
              {order.seller && (
                <div>
                  <p className="text-sm text-gray-600">Seller</p>
                  <p className="font-medium">
                    {order.seller.name || order.seller.company_name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Price Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Item Price</span>
                <span className="font-medium">${parseFloat(order.purchasePrice).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">${parseFloat(order.shippingPrice || 0).toLocaleString()}</span>
              </div>
              {order.buyerFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Buyer Fee</span>
                  <span className="font-medium">${parseFloat(order.buyerFee).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total Paid</span>
                <span className="font-bold text-lg">${parseFloat(order.totalPrice).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        {order.deliveryAddress && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Delivery Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Delivery Method</p>
                <p className="font-medium">
                  {order.deliveryMethod === 'shipping' ? 'Shipping' : 'Collection'}
                </p>
              </div>
              {order.deliveryMethod === 'shipping' && order.deliveryAddress && (
                <div>
                  <p className="text-sm text-gray-600">Shipping Address</p>
                  <p className="font-medium">
                    {order.deliveryAddress.street}<br />
                    {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}<br />
                    {order.deliveryAddress.country}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        {order.timeline && order.timeline.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="font-semibold mb-4">Order Timeline</h3>
            <div className="space-y-4">
              {order.timeline.map((event, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    {getStatusIcon(event.status)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{event.description}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirm Delivery Section */}
        {order.currentStatus === 'initiated' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Confirm Delivery
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Note (optional)
                </label>
                <textarea
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Add any notes about the delivery (e.g., condition of watch, delivery experience)"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                />
              </div>
              <button
                onClick={confirmDelivery}
                disabled={confirmingDelivery}
                className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                  confirmingDelivery
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {confirmingDelivery ? 'Confirming...' : 'Confirm Delivery Received'}
              </button>
              <p className="text-xs text-gray-500">
                By confirming delivery, you acknowledge that you have received the watch in the expected condition.
              </p>
            </div>
          </div>
        )}

        {/* Notes */}
        {order.buyerNote && (
          <div className="bg-gray-50 rounded-lg p-6 mt-6">
            <h3 className="font-semibold mb-2">Order Notes</h3>
            <p className="text-gray-700">{order.buyerNote}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsPage;