import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { formatPrice } from './utils/currency';

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState('shipping');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'USA'
  });
  const [buyerFeeRate, setBuyerFeeRate] = useState(0);

  useEffect(() => {
    fetchCart();
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/users/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Set buyer fee rate
        if (data.user?.buyer_fee !== undefined) {
          setBuyerFeeRate(data.user.buyer_fee);
        }
        
        if (data.user?.defaultDeliveryAddress) {
          // Load saved delivery address
          const addr = data.user.defaultDeliveryAddress;
          if (addr.street || addr.city || addr.state || addr.postalCode) {
            setDeliveryAddress({
              street: addr.street || '',
              city: addr.city || '',
              state: addr.state || '',
              postalCode: addr.postalCode || '',
              country: addr.country || 'USA'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

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
      setCart(data);
      
      // Set existing delivery details if available
      if (data.deliveryAddress) {
        setDeliveryAddress(data.deliveryAddress);
      }
      if (data.deliveryMethod) {
        setDeliveryMethod(data.deliveryMethod);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await fetch(`/api/cart/remove/${itemId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      const data = await response.json();
      setCart(data.cart);
      alert('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item from cart');
    }
  };

  const updateDeliveryDetails = async () => {
    try {
      const response = await fetch('/api/cart/delivery', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deliveryAddress,
          deliveryMethod
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update delivery details');
      }

      const data = await response.json();
      setCart(data.cart);
      alert('Delivery details updated');
    } catch (error) {
      console.error('Error updating delivery:', error);
      alert('Failed to update delivery details');
    }
  };

  const proceedToCheckout = async () => {
    // Validate delivery details
    if (deliveryMethod === 'shipping') {
      if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.postalCode) {
        alert('Please fill in all delivery address fields');
        return;
      }
    }

    try {
      // Save delivery details to cart
      await updateDeliveryDetails();
      
      // Save delivery address as user's default for future use
      if (deliveryMethod === 'shipping' && deliveryAddress.street) {
        await fetch('/api/users/me/delivery-address', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(deliveryAddress),
          credentials: 'include'
        });
      }
      
      navigate('/checkout');
    } catch (error) {
      console.error('Error proceeding to checkout:', error);
      alert('Failed to proceed to checkout');
    }
  };

  if (loading) {
    return <div className="text-center text-xl mt-8">Loading cart...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some watches to get started</p>
          <button
            onClick={() => navigate('/watches')}
            className="bg-[#3ab54a] text-white px-6 py-2 rounded-lg hover:bg-[#32a042]"
          >
            Browse Watches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Cart Items ({cart.items.length})</h2>
            
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item._id} className="border-b pb-4 last:border-0">
                  <div className="flex items-start gap-4">
                    {item.watch?.imageUrl && (
                      <img
                        src={item.watch.imageUrl}
                        alt={`${item.watch.brand} ${item.watch.model}`}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {item.watch?.brand} {item.watch?.model}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Ref: {item.watch?.reference_number}
                      </p>
                      <p className="text-sm text-gray-600">
                        Seller: {item.watch?.owner?.company_name || item.watch?.owner?.name}
                      </p>
                      {item.fromBid && (
                        <p className="text-sm text-green-600">
                          Negotiated price from accepted bid
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {formatPrice(item.price, item.watch?.currency)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-red-500 hover:text-red-700 mt-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Options */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Delivery Options</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Delivery Method</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="shipping"
                      checked={deliveryMethod === 'shipping'}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                      className="mr-2"
                    />
                    <span>Ship to Address ($50 shipping fee)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="collection"
                      checked={deliveryMethod === 'collection'}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                      className="mr-2"
                    />
                    <span>Collect in Person (Free)</span>
                  </label>
                </div>
              </div>

              {deliveryMethod === 'shipping' && (
                <div className="space-y-4 mt-4">
                  <h3 className="font-medium">Shipping Address</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1">Street Address</label>
                    <input
                      type="text"
                      value={deliveryAddress.street}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">City</label>
                      <input
                        type="text"
                        value={deliveryAddress.city}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">State</label>
                      <input
                        type="text"
                        value={deliveryAddress.state}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="NY"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={deliveryAddress.postalCode}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, postalCode: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="10001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Country</label>
                      <input
                        type="text"
                        value={deliveryAddress.country}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, country: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="USA"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotal || 0, cart.items?.[0]?.watch?.currency)}</span>
              </div>
              {buyerFeeRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Buyer Fee ({buyerFeeRate}%)</span>
                  <span>{formatPrice((cart.subtotal || 0) * buyerFeeRate / 100, cart.items?.[0]?.watch?.currency)}</span>
                </div>
              )}
              {deliveryMethod === 'shipping' && (
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatPrice(50, cart.items?.[0]?.watch?.currency)}</span>
                </div>
              )}
              <div className="border-t pt-2 font-bold">
                <div className="flex justify-between text-lg">
                  <span>Total</span>
                  <span>
                    {formatPrice(
                      (cart.subtotal || 0) + 
                      ((cart.subtotal || 0) * buyerFeeRate / 100) + 
                      (deliveryMethod === 'shipping' ? 50 : 0),
                      cart.items?.[0]?.watch?.currency
                    )}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={proceedToCheckout}
              className="w-full bg-[#3ab54a] text-white py-3 rounded-lg hover:bg-[#32a042] flex items-center justify-center gap-2"
            >
              Proceed to Checkout
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;