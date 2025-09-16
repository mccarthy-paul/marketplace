import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Calendar, Package, Truck, Award, Shield, Clock, ChevronRight } from 'lucide-react';

const SellerProfile = () => {
  const { sellerId } = useParams();
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reviews');

  useEffect(() => {
    fetchSellerProfile();
  }, [sellerId]);

  const fetchSellerProfile = async () => {
    try {
      const response = await fetch(`/api/sellers/${sellerId}`);
      if (response.ok) {
        const data = await response.json();
        setSeller(data);
      }
    } catch (error) {
      console.error('Error fetching seller profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-5 h-5">
            <Star className="absolute w-5 h-5 text-gray-300 fill-current" />
            <div className="absolute overflow-hidden w-2.5">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} className="w-5 h-5 text-gray-300 fill-current" />);
      }
    }
    return stars;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading seller profile...</div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Seller not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Seller Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              {/* Seller Avatar */}
              <div className="w-24 h-24 bg-gradient-to-br from-[#0b3d2e] to-[#164d3a] rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {seller.name.charAt(0).toUpperCase()}
              </div>

              {/* Seller Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{seller.name}</h1>
                {seller.company_name && (
                  <p className="text-lg text-gray-600 mt-1">{seller.company_name}</p>
                )}

                <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Member since {formatDate(seller.memberSince)}
                  </div>
                  {seller.profile?.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {seller.profile.location}
                    </div>
                  )}
                </div>

                {/* Rating Summary */}
                <div className="flex items-center space-x-3 mt-4">
                  <div className="flex items-center">
                    {renderStars(seller.statistics.averageRating)}
                  </div>
                  <span className="text-xl font-semibold text-gray-900">
                    {seller.statistics.averageRating.toFixed(1)}
                  </span>
                  <span className="text-gray-500">
                    ({seller.statistics.totalReviews} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-col space-y-2">
              {seller.badges.map((badge) => (
                <div key={badge.id} className="flex items-center bg-[#facc15] bg-opacity-20 text-[#0b3d2e] px-3 py-1.5 rounded-full text-sm font-medium">
                  {badge.icon === 'trophy' && <Award className="w-4 h-4 mr-1.5" />}
                  {badge.icon === 'star' && <Star className="w-4 h-4 mr-1.5" />}
                  {badge.icon === 'crown' && <Award className="w-4 h-4 mr-1.5 text-[#facc15]" />}
                  {badge.icon === 'rocket' && <Truck className="w-4 h-4 mr-1.5" />}
                  {badge.name}
                </div>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{seller.statistics.totalSales}</div>
              <div className="text-sm text-gray-600">Total Sales</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{seller.statistics.activeListings}</div>
              <div className="text-sm text-gray-600">Active Listings</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{seller.statistics.recentSales}</div>
              <div className="text-sm text-gray-600">Sales (30 days)</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {seller.statistics.averageRating.toFixed(1)}⭐
              </div>
              <div className="text-sm text-gray-600">Avg. Rating</div>
            </div>
          </div>

          {/* Bio */}
          {seller.profile?.bio && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">About</h3>
              <p className="text-gray-600">{seller.profile.bio}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b">
            <div className="flex space-x-8 px-6">
              <button
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-[#0b3d2e] text-[#0b3d2e]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews ({seller.statistics.totalReviews})
              </button>
              <button
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'ratings'
                    ? 'border-[#0b3d2e] text-[#0b3d2e]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('ratings')}
              >
                Rating Breakdown
              </button>
              <button
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'policies'
                    ? 'border-[#0b3d2e] text-[#0b3d2e]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('policies')}
              >
                Policies
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {seller.recentReviews.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No reviews yet</p>
                ) : (
                  seller.recentReviews.map((review) => (
                    <div key={review._id} className="border-b pb-6 last:border-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex">{renderStars(review.rating)}</div>
                            <span className="font-semibold text-gray-900">
                              {review.buyer.name || review.buyer.company_name}
                            </span>
                            <span className="text-gray-500 text-sm">
                              {formatDate(review.created_at)}
                            </span>
                          </div>

                          <p className="mt-3 text-gray-700">{review.comment}</p>

                          {review.watch && (
                            <div className="mt-2 text-sm text-gray-500">
                              Purchased: {review.watch.brand} {review.watch.model}
                              {review.watch.reference_number && ` - ${review.watch.reference_number}`}
                            </div>
                          )}

                          {review.verified && (
                            <div className="flex items-center mt-2 text-sm text-green-600">
                              <Shield className="w-4 h-4 mr-1" />
                              Verified Purchase
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Ratings Breakdown Tab */}
            {activeTab === 'ratings' && (
              <div className="space-y-6">
                {/* Overall Rating Distribution */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Overall Rating Distribution</h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600 w-12">{rating} star</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#facc15] h-2 rounded-full"
                            style={{
                              width: `${
                                seller.statistics.totalReviews > 0
                                  ? (seller.statistics.ratingDistribution[rating] / seller.statistics.totalReviews) * 100
                                  : 0
                              }%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {seller.statistics.ratingDistribution[rating] || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratings */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Rating by Aspect</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(seller.statistics.aspectRatings).map(([aspect, rating]) => (
                      <div key={aspect} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="capitalize text-gray-700">{aspect}</span>
                        <div className="flex items-center space-x-2">
                          <div className="flex">{renderStars(rating)}</div>
                          <span className="text-sm text-gray-600">({rating.toFixed(1)})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Policies Tab */}
            {activeTab === 'policies' && (
              <div className="space-y-6">
                {seller.profile?.returnPolicy && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Return Policy</h3>
                    <p className="text-gray-600">{seller.profile.returnPolicy}</p>
                  </div>
                )}

                {seller.profile?.shippingInfo && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Shipping Information</h3>
                    <p className="text-gray-600">{seller.profile.shippingInfo}</p>
                  </div>
                )}

                {!seller.profile?.returnPolicy && !seller.profile?.shippingInfo && (
                  <p className="text-gray-500 text-center py-8">No policies information available</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* View Active Listings Button */}
        <div className="mt-6 text-center">
          <Link
            to={`/watches?seller=${sellerId}`}
            className="inline-flex items-center px-6 py-3 bg-[#0b3d2e] text-white font-medium rounded-lg hover:bg-[#164d3a] transition-colors"
          >
            <Package className="w-5 h-5 mr-2" />
            View Active Listings ({seller.statistics.activeListings})
            <ChevronRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;