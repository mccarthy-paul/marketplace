import React, { useEffect, useState } from 'react';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/junopay/orders', {
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setOrders(data.orders);
        } else {
          setError(data.error || 'Failed to load orders');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Order fetch error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading order history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">Error loading orders: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-center text-gray-800 mb-8">Order History</h1>
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 text-lg">You haven't made any purchases yet.</p>
            <a 
              href="/watches" 
              className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Watches
            </a>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map(order => (
              <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {order.watch ? `${order.watch.brand} ${order.watch.model}` : order.productName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Transaction ID: {order.applicationTransactionId}
                    </p>
                    <p className="text-sm text-gray-600">
                      Reference: {order.watch?.reference_number || order.productCode}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.currentStatus === 'completed' || order.currentStatus === 'confirmed' 
                        ? 'bg-green-100 text-green-800' :
                      order.currentStatus === 'cancelled' || order.currentStatus === 'failed'
                        ? 'bg-red-100 text-red-800' :
                      order.currentStatus === 'pending' || order.currentStatus === 'initiated'
                        ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.currentStatus?.charAt(0).toUpperCase() + order.currentStatus?.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {order.watch?.imageUrl && (
                    <img 
                      src={order.watch.imageUrl} 
                      alt={`${order.watch.brand} ${order.watch.model}`}
                      className="w-full h-48 object-cover rounded-md"
                    />
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Purchase Price:</span>
                      <span className="font-semibold">${parseFloat(order.purchasePrice).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-semibold">${parseFloat(order.shippingPrice).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Buyer Fee:</span>
                      <span className="font-semibold">${parseFloat(order.buyerFee || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-800 font-medium">Total:</span>
                      <span className="font-bold text-lg">${parseFloat(order.totalPrice).toLocaleString()}</span>
                    </div>
                    
                    <div className="pt-2">
                      <p className="text-sm text-gray-600">
                        <strong>Purchase Date:</strong> {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      {order.seller && (
                        <p className="text-sm text-gray-600">
                          <strong>Seller:</strong> {order.seller.name} ({order.seller.company_name})
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {order.buyerNote && (
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> {order.buyerNote}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;
