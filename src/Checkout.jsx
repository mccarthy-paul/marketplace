import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle, Package } from 'lucide-react';
import { formatPrice } from './utils/currency';
import { getApiUrl } from './utils/api.js';

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchCart();
    fetchCurrentUser();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/');
          return;
        }
        throw new Error('Failed to fetch cart');
      }

      const data = await response.json();
      
      // Validate cart has items and delivery details
      if (!data || data.items.length === 0) {
        alert('Your cart is empty');
        navigate('/cart');
        return;
      }

      if (!data.deliveryMethod) {
        alert('Please select delivery options');
        navigate('/cart');
        return;
      }

      if (data.deliveryMethod === 'shipping' && (!data.deliveryAddress?.street || !data.deliveryAddress?.city)) {
        alert('Please provide delivery address');
        navigate('/cart');
        return;
      }

      setCart(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      alert('Failed to load checkout');
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const processPayment = async () => {
    if (!cart || cart.items.length === 0) {
      alert('Cart is empty');
      return;
    }

    setProcessing(true);

    try {
      // Process each item in the cart
      let failedItems = [];
      for (const item of cart.items) {
        const watch = item.watch;
        
        if (!watch.owner?.junopay_client_id) {
          console.error(`Seller missing JunoPay ID:`, watch.owner);
          failedItems.push(`${watch.brand} ${watch.model}`);
          continue;
        }

        // Calculate total for this item (including shipping if applicable)
        const itemTotal = item.price + (cart.deliveryMethod === 'shipping' ? 50 / cart.items.length : 0);

        // Prepare transaction payload
        const transactionPayload = {
          sellerClientId: watch.owner.junopay_client_id,
          productName: `${watch.brand} ${watch.model}`,
          productCode: watch.reference_number || watch._id,
          currency: 'USD',
          purchasePrice: item.price.toString(),
          shippingPrice: cart.deliveryMethod === 'shipping' ? (50 / cart.items.length).toFixed(2) : '0',
          totalPrice: itemTotal.toFixed(2),
          buyerNote: `Purchase of ${watch.brand} ${watch.model} - Ref: ${watch.reference_number}`,
          deliveryMethod: cart.deliveryMethod,
          deliveryAddress: cart.deliveryAddress,
          fromBid: item.fromBid || null
        };

        // Initiate JunoPay transaction
        const response = await fetch('/api/junopay/transaction/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionPayload),
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.reauth) {
            alert('Your JunoPay session has expired. Please log in again to continue.');
            window.location.href = 'https://api-53189232060.us-central1.run.app/auth/junopay/login';
            return;
          }
          throw new Error(data.error || 'Failed to initiate transaction');
        }

        // Transaction initiated successfully
        const transaction = data.transaction;
        const applicationTransactionId = transaction.applicationTransactionId || transaction.transactionId || transaction.id;
        
        console.log(`Transaction initiated for ${watch.brand} ${watch.model}:`, applicationTransactionId);
      }

      // Check if there were any failed items
      if (failedItems.length > 0) {
        alert(`Warning: The following items could not be processed because their sellers are not configured for JunoPay:\n\n${failedItems.join('\n')}\n\nPlease contact support for assistance.`);
        
        if (failedItems.length === cart.items.length) {
          // All items failed
          return;
        }
      }

      // Clear the cart after successful payment
      await fetch('/api/cart/clear', {
        method: 'DELETE',
        credentials: 'include'
      });

      // Show success message
      const successfulCount = cart.items.length - failedItems.length;
      if (successfulCount > 0) {
        alert(`Payment successful! 

${successfulCount} item(s) have been purchased successfully.
${failedItems.length > 0 ? `\n${failedItems.length} item(s) could not be processed.` : ''}

Your order has been placed and payment has been initiated through JunoPay.
You will receive confirmation once the payment is processed.

Delivery Method: ${cart.deliveryMethod === 'shipping' ? 'Shipping' : 'Collection'}
${cart.deliveryMethod === 'shipping' ? `Shipping Address: ${cart.deliveryAddress.street}, ${cart.deliveryAddress.city}, ${cart.deliveryAddress.state} ${cart.deliveryAddress.postalCode}` : 'You will be contacted for collection arrangements'}

Total Paid: ${formatPrice(cart.subtotal + (cart.deliveryMethod === 'shipping' ? 50 : 0), cart.items?.[0]?.watch?.currency)}`);

        // Navigate to success page or orders page
        navigate('/orders');
      }

    } catch (error) {
      console.error('Error processing payment:', error);
      alert(`Error processing payment: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-center text-xl mt-8">Loading checkout...</div>;
  }

  if (!cart) {
    return null;
  }

  const total = cart.subtotal + (cart.deliveryMethod === 'shipping' ? 50 : 0);

  // Check for items with sellers not configured for JunoPay
  const itemsWithoutJunoPay = cart.items.filter(item => !item.watch?.owner?.junopay_client_id);
  
  if (itemsWithoutJunoPay.length > 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Checkout Issue</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-3">
            Some items cannot be purchased through JunoPay
          </h2>
          <p className="text-yellow-700 mb-4">
            The following items are from sellers who are not yet configured for JunoPay transactions:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6">
            {itemsWithoutJunoPay.map(item => (
              <li key={item._id} className="text-yellow-700">
                <strong>{item.watch?.brand} {item.watch?.model}</strong>
                {item.watch?.owner && (
                  <span className="text-sm ml-2">
                    (Seller: {item.watch.owner.name || item.watch.owner.company_name || 'Unknown'})
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="text-sm text-yellow-600 mb-4">
            These sellers need to log in with JunoPay to enable transactions. 
            Please remove these items from your cart or contact support for assistance.
          </p>
          <button
            onClick={() => navigate('/cart')}
            className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700"
          >
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Details */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Summary
            </h2>
            
            <div className="space-y-3 mb-4">
              {cart.items.map((item) => (
                <div key={item._id} className="flex justify-between text-sm">
                  <span className="flex-1">
                    {item.watch?.brand} {item.watch?.model}
                    {item.fromBid && <span className="text-green-600 ml-2">(Negotiated)</span>}
                  </span>
                  <span className="font-medium">{formatPrice(item.price, item.watch?.currency)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotal, cart.items?.[0]?.watch?.currency)}</span>
              </div>
              {cart.deliveryMethod === 'shipping' && (
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>$50</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(total, cart.items?.[0]?.watch?.currency)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Delivery Details</h2>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Method:</span>{' '}
                {cart.deliveryMethod === 'shipping' ? 'Shipping' : 'Collection'}
              </div>
              
              {cart.deliveryMethod === 'shipping' && cart.deliveryAddress && (
                <>
                  <div>
                    <span className="font-medium">Address:</span>
                  </div>
                  <div className="pl-4 text-gray-600">
                    <div>{cart.deliveryAddress.street}</div>
                    <div>
                      {cart.deliveryAddress.city}, {cart.deliveryAddress.state} {cart.deliveryAddress.postalCode}
                    </div>
                    <div>{cart.deliveryAddress.country}</div>
                  </div>
                </>
              )}
              
              {cart.deliveryMethod === 'collection' && (
                <div className="text-gray-600">
                  You will be contacted with collection details after payment
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment with JunoPay Wallet
            </h2>

            {currentUser ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Logged in as:</p>
                  <p className="font-medium">{currentUser.name}</p>
                  <p className="text-sm text-gray-600">{currentUser.email}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Payment will be processed through your JunoPay wallet. 
                    The total amount of <strong>{formatPrice(total, cart.items?.[0]?.watch?.currency)}</strong> will be deducted from your wallet balance.
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Each watch will be paid to its respective seller. 
                    You may see multiple transactions in your JunoPay wallet history.
                  </p>
                </div>

                <button
                  onClick={processPayment}
                  disabled={processing}
                  className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 ${
                    processing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#3ab54a] hover:bg-[#32a042] text-white'
                  }`}
                >
                  {processing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Pay {formatPrice(total, cart.items?.[0]?.watch?.currency)} with JunoPay
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Please log in to complete payment</p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-[#3ab54a] text-white px-6 py-2 rounded-lg hover:bg-[#32a042]"
                >
                  Log In
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>By completing this purchase, you agree to our terms and conditions.</p>
            <p className="mt-2">
              Questions? Contact support at support@luxe24.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;