import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronRight, DollarSign, Calendar, User } from 'lucide-react';
import { apiGet } from './utils/api.js';

const SalesHistory = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const data = await apiGet('/api/junopay/sales');
      if (data.success) {
        setSales(data.sales);
      } else {
        setError(data.error || 'Failed to load sales history');
      }
      setLoading(false);
    } catch (err) {
      console.error('Sales fetch error:', err);
      setError('Error loading sales: ' + err.message);
      setLoading(false);
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

  const calculateEarnings = (sale) => {
    const purchasePrice = parseFloat(sale.purchasePrice);
    const shippingPrice = parseFloat(sale.shippingPrice || 0);
    const buyerFee = parseFloat(sale.buyerFee || 0);
    // Seller receives purchase price + shipping (buyer fee goes to platform)
    return purchasePrice + shippingPrice;
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading sales history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-xl text-red-600">Error loading sales: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {sales.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">You haven't sold any watches yet.</p>
          <p className="text-sm text-gray-500">When you sell a watch, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sales Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Sales Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Completed Sales</p>
                <p className="text-2xl font-bold text-green-600">
                  {sales.filter(s => s.currentStatus === 'completed' || s.currentStatus === 'confirmed').length}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${sales
                    .filter(s => s.currentStatus === 'completed' || s.currentStatus === 'confirmed')
                    .reduce((total, sale) => total + calculateEarnings(sale), 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Sales List */}
          <div className="space-y-4">
            {sales.map(sale => (
              <div 
                key={sale._id} 
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/sales/${sale.applicationTransactionId}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {sale.watch ? `${sale.watch.brand} ${sale.watch.model}` : sale.productName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Transaction ID: {sale.applicationTransactionId}
                    </p>
                    {sale.watch?.reference_number && (
                      <p className="text-sm text-gray-600">
                        Reference: {sale.watch.reference_number}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sale.currentStatus)}`}>
                      {sale.currentStatus?.charAt(0).toUpperCase() + sale.currentStatus?.slice(1)}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sale.watch?.imageUrl && (
                    <img 
                      src={sale.watch.imageUrl} 
                      alt={`${sale.watch.brand} ${sale.watch.model}`}
                      className="w-full h-48 object-cover rounded-md"
                    />
                  )}
                  
                  <div className="space-y-3">
                    {/* Buyer Information */}
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Buyer:</span>
                      <span className="text-sm font-medium">
                        {sale.buyer?.name || sale.buyer?.company_name || 'Unknown Buyer'}
                      </span>
                    </div>

                    {/* Sale Date */}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Sale Date:</span>
                      <span className="text-sm font-medium">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Earnings Breakdown */}
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">Earnings Breakdown</span>
                      </div>
                      <div className="space-y-1 ml-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Sale Price:</span>
                          <span className="font-medium">${parseFloat(sale.purchasePrice).toLocaleString()}</span>
                        </div>
                        {parseFloat(sale.shippingPrice) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Shipping:</span>
                            <span className="font-medium">${parseFloat(sale.shippingPrice).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm border-t pt-1">
                          <span className="font-semibold text-gray-700">Your Earnings:</span>
                          <span className="font-bold text-green-600">
                            ${calculateEarnings(sale).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Watch Details */}
                    {sale.watch && (
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        {sale.watch.condition && (
                          <span className="mr-3">Condition: {sale.watch.condition}</span>
                        )}
                        {sale.watch.year && (
                          <span>Year: {sale.watch.year}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Buyer's Note */}
                {sale.buyerNote && (
                  <div className="mt-4 bg-gray-50 rounded-md p-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Buyer's Note:</span> {sale.buyerNote}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;