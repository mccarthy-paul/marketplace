import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronRight, X, AlertCircle, HelpCircle } from 'lucide-react';

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingDelivery, setConfirmingDelivery] = useState({});
  const [deliveryNotes, setDeliveryNotes] = useState({});
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedAction, setSelectedAction] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
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
  };

  const confirmDelivery = async (transactionId) => {
    const note = deliveryNotes[transactionId] || '';
    
    setConfirmingDelivery(prev => ({ ...prev, [transactionId]: true }));
    
    try {
      const response = await fetch(`/api/junopay/transaction/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'confirm',
          note: note
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.reauth) {
          alert('Your JunoPay session has expired. Please log in again.');
          window.location.href = '/auth/junopay/login';
          return;
        }
        throw new Error(data.error || 'Failed to confirm delivery');
      }

      alert('Delivery confirmed successfully!');
      
      // Clear the note and refresh orders
      setDeliveryNotes(prev => ({ ...prev, [transactionId]: '' }));
      fetchOrders();
      
    } catch (error) {
      console.error('Error confirming delivery:', error);
      alert(`Error confirming delivery: ${error.message}`);
    } finally {
      setConfirmingDelivery(prev => ({ ...prev, [transactionId]: false }));
    }
  };

  const openActionModal = (order, action) => {
    console.log('Opening action modal:', { order, action });
    setSelectedOrder(order);
    setSelectedAction(action);
    setActionNote('');
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedOrder(null);
    setSelectedAction('');
    setActionNote('');
  };

  const handleOrderAction = async () => {
    console.log('handleOrderAction called:', { selectedOrder, selectedAction });
    if (!selectedOrder || !selectedAction) {
      console.log('Missing order or action, returning');
      return;
    }

    setProcessingAction(true);

    try {
      // For reject action, we need to use a different endpoint or status
      const status = selectedAction === 'reject' ? 'cancel' : selectedAction;
      console.log('Sending request with status:', status);
      
      const response = await fetch(`/api/junopay/transaction/${selectedOrder.applicationTransactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: status,
          note: actionNote
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.reauth) {
          alert('Your JunoPay session has expired. Please log in again.');
          window.location.href = '/auth/junopay/login';
          return;
        }
        throw new Error(data.error || `Failed to ${selectedAction} order`);
      }

      const actionMessages = {
        confirm: 'Order confirmed successfully!',
        query: 'Query sent successfully!',
        reject: 'Order rejected successfully!',
        cancel: 'Order cancelled successfully!'
      };

      alert(actionMessages[selectedAction] || 'Action completed successfully!');
      
      // Close modal and refresh orders
      closeActionModal();
      fetchOrders();
      
    } catch (error) {
      console.error(`Error ${selectedAction} order:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

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
              <div 
                key={order._id} 
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/orders/${order.applicationTransactionId}`)}
              >
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
                  <div className="flex items-center gap-3">
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
                    <ChevronRight className="w-5 h-5 text-gray-400" />
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
                  <div className="bg-gray-50 rounded-md p-3 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> {order.buyerNote}
                    </p>
                  </div>
                )}

                {/* Action Buttons for Pending/Initiated Orders */}
                {(order.currentStatus === 'pending' || order.currentStatus === 'initiated') && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold mb-3">Order Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openActionModal(order, 'confirm');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm Delivery
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openActionModal(order, 'query');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                      >
                        <HelpCircle className="w-4 h-4" />
                        Query Order
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openActionModal(order, 'reject');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Reject Order
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Select an action to update the order status in JunoPay.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">
                {selectedAction === 'confirm' && 'Confirm Delivery'}
                {selectedAction === 'query' && 'Query Order'}
                {selectedAction === 'reject' && 'Reject Order'}
              </h3>
              <button
                onClick={closeActionModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Order: {selectedOrder.productName}
              </p>
              <p className="text-xs text-gray-500">
                Transaction ID: {selectedOrder.applicationTransactionId}
              </p>
            </div>

            <div className="mb-4">
              {selectedAction === 'confirm' && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-green-800 font-medium">
                        Confirm that you have received the watch
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        This action confirms that the watch has been delivered and you are satisfied with the purchase.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedAction === 'query' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">
                        Query this order
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Use this if you have questions or concerns about the order that need to be addressed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedAction === 'reject' && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-800 font-medium">
                        Reject this order
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        This action will reject the order. Use this if there's an issue with the delivery or product.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a note (optional)
              </label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={
                  selectedAction === 'confirm' 
                    ? "e.g., Watch received in excellent condition" 
                    : selectedAction === 'query'
                    ? "e.g., Tracking shows delivered but not received"
                    : "e.g., Watch not as described in listing"
                }
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleOrderAction}
                disabled={processingAction}
                className={`flex-1 px-4 py-2 rounded-md text-white font-medium transition-colors ${
                  processingAction
                    ? 'bg-gray-400 cursor-not-allowed'
                    : selectedAction === 'confirm'
                    ? 'bg-green-600 hover:bg-green-700'
                    : selectedAction === 'query'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processingAction ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Processing...
                  </span>
                ) : (
                  <>
                    {selectedAction === 'confirm' && 'Confirm Delivery'}
                    {selectedAction === 'query' && 'Submit Query'}
                    {selectedAction === 'reject' && 'Reject Order'}
                  </>
                )}
              </button>
              <button
                onClick={closeActionModal}
                disabled={processingAction}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
