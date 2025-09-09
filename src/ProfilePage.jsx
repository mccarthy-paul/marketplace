import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Wallet, Settings, Activity, CreditCard, Gavel, Receipt, ShoppingBag, Watch, Plus, Edit3 } from 'lucide-react';
import { apiGet } from './utils/api.js';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletBalances, setWalletBalances] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [bidsPlaced, setBidsPlaced] = useState([]);
  const [bidsReceived, setBidsReceived] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await apiGet('/api/me');
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        } else {
          // Redirect to home if not authenticated
          window.location.replace('/');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        window.location.replace('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const fetchWalletBalances = async () => {
    try {
      console.log('Fetching real Juno wallet balances for user:', currentUser?.junopay_client_id);
      
      const response = await apiGet('/api/junopay/balance');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Juno balance response:', data);
        
        if (data.success && data.balance) {
          // Transform Juno balance data to our format
          const balances = transformJunoBalanceData(data.balance);
          setWalletBalances(balances);
        } else {
          console.error('Invalid balance response:', data);
          setWalletBalances([]);
        }
      } else if (response.status === 401) {
        // Handle re-authentication required
        const errorData = await response.json();
        if (errorData.reauth) {
          console.log('Re-authentication required for Juno API');
          // Could redirect to login or show message
          setWalletBalances([]);
        }
      } else {
        console.error('Failed to fetch balances:', response.status);
        setWalletBalances([]);
      }
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
      setWalletBalances([]);
    }
  };

  // Transform Juno API balance response to our UI format
  const transformJunoBalanceData = (junoBalance) => {
    const balances = [];
    
    // Handle array of balance objects (actual Juno format)
    if (Array.isArray(junoBalance)) {
      junoBalance.forEach(balanceObj => {
        const symbol = getCurrencySymbol(balanceObj.currency);
        balances.push({
          currency: balanceObj.currency,
          balance: parseFloat(balanceObj.balance?.balanceAmount || 0),
          pendingAmount: parseFloat(balanceObj.balance?.pendingAmount || 0),
          symbol: symbol,
          currencyType: balanceObj.currencyType,
          isFreeze: balanceObj.isFreeze,
          lastUpdated: balanceObj.balance?.updated,
          creationDate: balanceObj.creationDate
        });
      });
    } else if (junoBalance.balances && Array.isArray(junoBalance.balances)) {
      junoBalance.balances.forEach(balance => {
        const symbol = getCurrencySymbol(balance.currency);
        balances.push({
          currency: balance.currency,
          balance: parseFloat(balance.amount || balance.balance || 0),
          symbol: symbol
        });
      });
    } else if (typeof junoBalance === 'object') {
      // If balance is an object with currency keys
      Object.keys(junoBalance).forEach(currency => {
        const amount = junoBalance[currency];
        if (typeof amount === 'number' || (typeof amount === 'string' && !isNaN(parseFloat(amount)))) {
          const symbol = getCurrencySymbol(currency);
          balances.push({
            currency: currency.toUpperCase(),
            balance: parseFloat(amount),
            symbol: symbol
          });
        }
      });
    }
    
    return balances;
  };

  const fetchBidsPlaced = async () => {
    try {
      console.log('Fetching bids placed by user:', currentUser?._id);
      
      const response = await apiGet('/api/bids/user/placed');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Bids placed response:', data);
        setBidsPlaced(data);
      } else {
        console.error('Failed to fetch bids placed:', response.status);
        setBidsPlaced([]);
      }
    } catch (error) {
      console.error('Error fetching bids placed:', error);
      setBidsPlaced([]);
    }
  };

  const fetchBidsReceived = async () => {
    try {
      console.log('Fetching bids received by user:', currentUser?._id);
      
      const response = await apiGet('/api/bids/user/received');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Bids received response:', data);
        setBidsReceived(data);
      } else {
        console.error('Failed to fetch bids received:', response.status);
        setBidsReceived([]);
      }
    } catch (error) {
      console.error('Error fetching bids received:', error);
      setBidsReceived([]);
    }
  };

  const fetchMyListings = async () => {
    try {
      console.log('Fetching my listings for user:', currentUser?._id);
      
      const response = await apiGet('/api/watches');
      
      if (response.ok) {
        const data = await response.json();
        console.log('All watches response:', data);
        
        // Filter watches by current user ID (check seller and owner fields)
        const userWatches = data.filter(watch => 
          watch.seller === currentUser._id || 
          watch.owner === currentUser._id
        );
        
        console.log('User watches filtered:', userWatches);
        setMyListings(userWatches);
      } else {
        console.error('Failed to fetch watches:', response.status);
        setMyListings([]);
      }
    } catch (error) {
      console.error('Error fetching my listings:', error);
      setMyListings([]);
    }
  };

  const fetchOrderHistory = async () => {
    try {
      console.log('Fetching order history for user:', currentUser?._id);
      
      const response = await apiGet('/api/junopay/orders');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Order history response:', data);
        
        if (data.success) {
          setOrderHistory(data.orders);
        } else {
          console.error('Order history fetch failed:', data.error);
          setOrderHistory([]);
        }
      } else if (response.status === 401) {
        const errorData = await response.json();
        if (errorData.reauth) {
          console.log('Re-authentication required for order history');
          setOrderHistory([]);
        }
      } else {
        console.error('Failed to fetch order history:', response.status);
        setOrderHistory([]);
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
      setOrderHistory([]);
    }
  };

  // Get currency symbol
  const getCurrencySymbol = (currency) => {
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'BTC': '₿',
      'ETH': 'Ξ',
      'LTC': 'Ł'
    };
    return symbols[currency?.toUpperCase()] || currency?.toUpperCase() || '';
  };

  useEffect(() => {
    if (currentUser && activeTab === 'wallet') {
      fetchWalletBalances();
    }
    if (currentUser && activeTab === 'my-listings') {
      fetchMyListings();
    }
    if (currentUser && activeTab === 'bids-placed') {
      fetchBidsPlaced();
    }
    if (currentUser && activeTab === 'bids-received') {
      fetchBidsReceived();
    }
    if (currentUser && activeTab === 'order-history') {
      fetchOrderHistory();
    }
  }, [currentUser, activeTab]);

  const menuItems = [
    { id: 'profile', label: '👤 Profile', icon: User },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'my-listings', label: 'My Listings', icon: Watch },
    { id: 'bids-placed', label: 'Bids Placed', icon: Gavel },
    { id: 'bids-received', label: 'Bids Received', icon: Receipt },
    { id: 'order-history', label: 'Order History', icon: ShoppingBag },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];
  
  console.log('ProfilePage menuItems:', menuItems);
  console.log('ProfilePage activeTab:', activeTab);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#3ab54a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const renderWalletContent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#3ab54a] to-[#32a042] rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Juno Wallet</h2>
        </div>
        <p className="text-white/80">Connected Account: {currentUser.email}</p>
        <p className="text-white/80">Client ID: {currentUser.junopay_client_id}</p>
      </div>

      <div className="grid gap-4">
        <h3 className="text-xl font-semibold text-gray-800">Balances</h3>
        {walletBalances.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {walletBalances.map((balance) => (
              <div key={balance.currency} className="bg-white rounded-lg p-6 shadow-md border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">{balance.currency}</p>
                      {balance.currencyType && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {balance.currencyType}
                        </span>
                      )}
                      {balance.isFreeze && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Frozen
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-800">
                      {balance.symbol}{balance.balance.toLocaleString()}
                    </p>
                    {balance.pendingAmount > 0 && (
                      <p className="text-sm text-orange-600">
                        Pending: {balance.symbol}{balance.pendingAmount.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                {balance.lastUpdated && (
                  <div className="text-xs text-gray-500">
                    Updated: {new Date(balance.lastUpdated).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center shadow-md border">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading wallet balances...</p>
            <button 
              onClick={fetchWalletBalances}
              className="mt-4 px-4 py-2 bg-[#3ab54a] text-white rounded-lg hover:bg-[#32a042]"
            >
              Refresh Balances
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfileContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-md border">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Information</h2>
        <div className="grid gap-4">
          <div>
            <label className="text-sm text-gray-600">Name</label>
            <p className="text-lg font-medium text-gray-800">{currentUser.name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <p className="text-lg font-medium text-gray-800">{currentUser.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Company</label>
            <p className="text-lg font-medium text-gray-800">{currentUser.company_name || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Account Type</label>
            <p className="text-lg font-medium text-gray-800">
              {currentUser.is_admin ? 'Administrator' : 'Standard User'}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Buyer Fee</label>
            <p className="text-lg font-medium text-gray-800">
              {currentUser.buyer_fee ? `${currentUser.buyer_fee}%` : 'Not specified'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMyListingsContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-md border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">My Listings</h2>
            <span className="bg-[#3ab54a] text-white px-3 py-1 rounded-full text-sm font-medium">
              {myListings.length} {myListings.length === 1 ? 'Watch' : 'Watches'}
            </span>
          </div>
          <button
            onClick={() => navigate('/add-watch')}
            className="flex items-center gap-2 bg-[#3ab54a] text-white px-4 py-2 rounded-lg hover:bg-[#32a042] transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Watch
          </button>
        </div>
        
        {myListings.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myListings.map((watch) => (
              <div key={watch._id} className="bg-gray-50 rounded-lg p-4 border hover:shadow-md transition-shadow">
                <div className="aspect-square mb-4 bg-gray-200 rounded-lg overflow-hidden">
                  {watch.imageUrl ? (
                    <img 
                      src={watch.imageUrl} 
                      alt={`${watch.brand} ${watch.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Watch className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">
                    {watch.brand} {watch.model}
                  </h3>
                  
                  {watch.reference_number && (
                    <p className="text-sm text-gray-600">
                      Ref: {watch.reference_number}
                    </p>
                  )}
                  
                  {watch.condition && (
                    <p className="text-sm text-gray-600">
                      Condition: {watch.condition}
                    </p>
                  )}
                  
                  {watch.price && (
                    <p className="text-lg font-bold text-[#3ab54a]">
                      ${watch.price.toLocaleString()}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        watch.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {watch.status || 'Active'}
                      </span>
                      
                      {watch.created_at && (
                        <span className="text-xs text-gray-500">
                          Listed {new Date(watch.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => window.location.href = `/admin/edit-watch/${watch._id}`}
                      className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                      title="Edit listing"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Watch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No listings yet</p>
              <p className="text-sm text-gray-500 mb-6">Your uploaded watches will appear here</p>
              <button
                onClick={() => window.location.href = '/admin/add-watch'}
                className="flex items-center gap-2 bg-[#3ab54a] text-white px-6 py-3 rounded-lg hover:bg-[#32a042] transition-colors font-medium mx-auto"
              >
                <Plus className="w-5 h-5" />
                Add Your First Watch
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderBidsPlacedContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-md border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Bids Placed</h2>
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            {bidsPlaced.length} {bidsPlaced.length === 1 ? 'Bid' : 'Bids'}
          </span>
        </div>

        {bidsPlaced.length > 0 ? (
          <div className="space-y-4">
            {bidsPlaced.map((bid) => (
              <div key={bid._id} className="bg-gray-50 rounded-lg p-4 border hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Watch Image */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      {bid.watch?.imageUrl ? (
                        <img 
                          src={bid.watch.imageUrl} 
                          alt={`${bid.watch.brand} ${bid.watch.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Watch className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bid Details */}
                  <div className="flex-grow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {bid.watch?.brand} {bid.watch?.model}
                        </h3>
                        {bid.watch?.reference_number && (
                          <p className="text-sm text-gray-600">Ref: {bid.watch.reference_number}</p>
                        )}
                        <p className="text-lg font-bold text-blue-600 mt-1">
                          Bid: ${bid.amount.toLocaleString()}
                        </p>
                        {bid.watch?.price && (
                          <p className="text-sm text-gray-600">
                            List Price: ${bid.watch.price.toLocaleString()}
                          </p>
                        )}
                      </div>
                      
                      {/* Status and Date */}
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          bid.status === 'offered' ? 'bg-yellow-100 text-yellow-800' :
                          bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          bid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          bid.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {bid.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(bid.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Comments */}
                    {bid.comments && bid.comments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Your comment:</span> {bid.comments[0].text}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Gavel className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No bids placed yet</p>
              <p className="text-sm text-gray-500">Your bid history will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderBidsReceivedContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-md border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Bids Received</h2>
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            {bidsReceived.length} {bidsReceived.length === 1 ? 'Bid' : 'Bids'}
          </span>
        </div>

        {bidsReceived.length > 0 ? (
          <div className="space-y-4">
            {bidsReceived.map((bid) => (
              <div key={bid._id} className="bg-gray-50 rounded-lg p-4 border hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Watch Image */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      {bid.watch?.imageUrl ? (
                        <img 
                          src={bid.watch.imageUrl} 
                          alt={`${bid.watch.brand} ${bid.watch.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Watch className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bid Details */}
                  <div className="flex-grow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {bid.watch?.brand} {bid.watch?.model}
                        </h3>
                        {bid.watch?.reference_number && (
                          <p className="text-sm text-gray-600">Ref: {bid.watch.reference_number}</p>
                        )}
                        <p className="text-lg font-bold text-green-600 mt-1">
                          Bid: ${bid.amount.toLocaleString()}
                        </p>
                        {bid.watch?.price && (
                          <p className="text-sm text-gray-600">
                            Your List Price: ${bid.watch.price.toLocaleString()}
                          </p>
                        )}
                        {bid.bidder && (
                          <p className="text-sm text-gray-700 mt-1">
                            Bidder: {bid.bidder.name} ({bid.bidder.email})
                          </p>
                        )}
                      </div>
                      
                      {/* Status and Date */}
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          bid.status === 'offered' ? 'bg-yellow-100 text-yellow-800' :
                          bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          bid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          bid.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {bid.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(bid.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Comments */}
                    {bid.comments && bid.comments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Bidder's comment:</span> {bid.comments[0].text}
                        </p>
                      </div>
                    )}

                    {/* Action buttons for received bids */}
                    {bid.status === 'offered' && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                        <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                          Accept
                        </button>
                        <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors">
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No bids received yet</p>
              <p className="text-sm text-gray-500">Bids on your watches will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderOrderHistoryContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-md border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Order History</h2>
          <span className="bg-[#3ab54a] text-white px-3 py-1 rounded-full text-sm font-medium">
            {orderHistory.length} {orderHistory.length === 1 ? 'Order' : 'Orders'}
          </span>
        </div>

        {orderHistory.length > 0 ? (
          <div className="space-y-6">
            {orderHistory.map((order) => (
              <div key={order._id} className="bg-gray-50 rounded-lg p-6 border hover:shadow-sm transition-shadow">
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
                    <div className="md:order-1">
                      <img 
                        src={order.watch.imageUrl} 
                        alt={`${order.watch.brand} ${order.watch.model}`}
                        className="w-full h-48 object-cover rounded-md"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3 md:order-2">
                    <div className="grid grid-cols-2 gap-4">
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
                        <span className="font-bold text-lg text-[#3ab54a]">${parseFloat(order.totalPrice).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-600 mb-2">
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
                  <div className="bg-gray-100 rounded-md p-3 mt-4">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> {order.buyerNote}
                    </p>
                  </div>
                )}

                {/* Transaction Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <button 
                    onClick={() => window.open(`/orders/${order._id}`, '_blank')}
                    className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    View Details
                  </button>
                  {order.currentStatus === 'initiated' || order.currentStatus === 'pending' && (
                    <>
                      <button 
                        className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                      >
                        Confirm Receipt
                      </button>
                      <button 
                        className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full hover:bg-orange-200 transition-colors"
                      >
                        Report Issue
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No orders yet</p>
              <p className="text-sm text-gray-500 mb-6">Your purchase history will appear here</p>
              <a 
                href="/watches" 
                className="inline-block bg-[#3ab54a] text-white px-6 py-3 rounded-lg hover:bg-[#32a042] transition-colors font-medium"
              >
                Browse Watches
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderActivityContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-md border">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h2>
        <p className="text-gray-600">Activity tracking coming soon...</p>
      </div>
    </div>
  );

  const renderSettingsContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-md border">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h2>
        <p className="text-gray-600">Settings panel coming soon...</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'wallet':
        return renderWalletContent();
      case 'profile':
        return renderProfileContent();
      case 'my-listings':
        return renderMyListingsContent();
      case 'bids-placed':
        return renderBidsPlacedContent();
      case 'bids-received':
        return renderBidsReceivedContent();
      case 'order-history':
        return renderOrderHistoryContent();
      case 'activity':
        return renderActivityContent();
      case 'settings':
        return renderSettingsContent();
      default:
        return renderProfileContent();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-gray-600 mt-2">Manage your account and wallet</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Menu */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md border overflow-hidden">
              <nav className="space-y-1 p-4">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === item.id
                          ? 'bg-[#3ab54a] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}