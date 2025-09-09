import Watch from '../db/watchModel.js';
import Bid from '../db/bidModel.js';
import User from '../db/userModel.js';
import AssistantContext from '../db/assistantContextModel.js';
import openaiService from './openaiService.js';

class AssistantFunctions {
  
  // Search watches in the database
  async searchWatches(params) {
    try {
      const { brand, model, minPrice, maxPrice, condition, limit = 10 } = params;
      
      let query = { status: 'active' }; // Only show active watches
      
      if (brand) {
        query.brand = new RegExp(brand, 'i'); // Case-insensitive search
      }
      
      if (model) {
        query.model = new RegExp(model, 'i');
      }
      
      if (condition) {
        query.condition = condition;
      }
      
      // Price filtering
      if (minPrice || maxPrice) {
        query.$or = [];
        
        if (minPrice && maxPrice) {
          query.$or.push(
            { price: { $gte: minPrice, $lte: maxPrice } },
            { currentBid: { $gte: minPrice, $lte: maxPrice } }
          );
        } else if (minPrice) {
          query.$or.push(
            { price: { $gte: minPrice } },
            { currentBid: { $gte: minPrice } }
          );
        } else if (maxPrice) {
          query.$or.push(
            { price: { $lte: maxPrice } },
            { currentBid: { $lte: maxPrice } }
          );
        }
      }
      
      const watches = await Watch.find(query)
        .populate('seller', 'name company_name')
        .populate('owner', 'name company_name')
        .limit(limit)
        .sort({ created_at: -1 });
      
      return {
        success: true,
        data: watches.map(watch => ({
          id: watch._id,
          brand: watch.brand,
          model: watch.model,
          reference_number: watch.reference_number,
          description: watch.description,
          year: watch.year,
          condition: watch.condition,
          price: watch.price,
          currentBid: watch.currentBid,
          imageUrl: watch.imageUrl,
          seller: watch.seller?.name || 'Unknown',
          status: watch.status,
          created_at: watch.created_at
        })),
        count: watches.length
      };
    } catch (error) {
      console.error('Search watches error:', error);
      return {
        success: false,
        error: 'Failed to search watches'
      };
    }
  }

  // Get user's bids
  async getUserBids(userId, params) {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User must be logged in to view bids'
        };
      }

      const { status, limit = 10 } = params;
      
      let query = { bidder: userId };
      
      if (status) {
        query.status = status;
      }
      
      const bids = await Bid.find(query)
        .populate('watch', 'brand model reference_number imageUrl currentBid price')
        .populate('bidder', 'name email')
        .limit(limit)
        .sort({ created_at: -1 });
      
      return {
        success: true,
        data: bids.map(bid => ({
          id: bid._id,
          amount: bid.amount,
          status: bid.status,
          created_at: bid.created_at,
          watch: {
            id: bid.watch._id,
            brand: bid.watch.brand,
            model: bid.watch.model,
            reference_number: bid.watch.reference_number,
            imageUrl: bid.watch.imageUrl,
            currentBid: bid.watch.currentBid,
            price: bid.watch.price
          }
        })),
        count: bids.length
      };
    } catch (error) {
      console.error('Get user bids error:', error);
      return {
        success: false,
        error: 'Failed to retrieve user bids'
      };
    }
  }

  // Get detailed watch information
  async getWatchDetails(params) {
    try {
      const { watchId } = params;
      
      const watch = await Watch.findById(watchId)
        .populate('seller', 'name company_name email')
        .populate('owner', 'name company_name')
        .populate('buyer', 'name company_name');
      
      if (!watch) {
        return {
          success: false,
          error: 'Watch not found'
        };
      }

      // Get recent bids for this watch
      const recentBids = await Bid.find({ watch: watchId })
        .populate('bidder', 'name')
        .sort({ created_at: -1 })
        .limit(5);
      
      return {
        success: true,
        data: {
          id: watch._id,
          brand: watch.brand,
          model: watch.model,
          reference_number: watch.reference_number,
          description: watch.description,
          year: watch.year,
          condition: watch.condition,
          price: watch.price,
          currentBid: watch.currentBid,
          imageUrl: watch.imageUrl,
          status: watch.status,
          seller: {
            name: watch.seller?.name,
            company: watch.seller?.company_name
          },
          owner: {
            name: watch.owner?.name,
            company: watch.owner?.company_name
          },
          buyer: watch.buyer ? {
            name: watch.buyer.name,
            company: watch.buyer.company_name
          } : null,
          recentBids: recentBids.map(bid => ({
            id: bid._id,
            amount: bid.amount,
            status: bid.status,
            bidder: bid.bidder?.name || 'Anonymous',
            created_at: bid.created_at
          })),
          created_at: watch.created_at,
          updated_at: watch.updated_at
        }
      };
    } catch (error) {
      console.error('Get watch details error:', error);
      return {
        success: false,
        error: 'Failed to retrieve watch details'
      };
    }
  }

  // Identify watch from image
  async identifyWatchFromImage(params) {
    try {
      const { imageUrl, additionalContext } = params;
      
      // For now, we'll assume the image is already uploaded and we have the path
      // In a full implementation, you'd handle the image upload here
      
      // This would typically involve reading the image file
      // For this example, we'll simulate the process
      const analysisResult = await openaiService.analyzeImage(
        Buffer.from(''), // This would be the actual image buffer
        additionalContext
      );
      
      // Try to find similar watches in the database based on the analysis
      // This is a simplified version - in reality, you'd use more sophisticated matching
      const potentialMatches = await this.searchWatches({
        brand: '', // Extract from analysis
        limit: 5
      });
      
      return {
        success: true,
        data: {
          analysis: analysisResult,
          potentialMatches: potentialMatches.data || []
        }
      };
    } catch (error) {
      console.error('Identify watch from image error:', error);
      return {
        success: false,
        error: 'Failed to identify watch from image'
      };
    }
  }

  // Get bidding help and strategy
  async getBiddingHelp(userId, params) {
    try {
      const { watchId, userBudget } = params;
      
      // Get watch details
      const watchResult = await this.getWatchDetails({ watchId });
      if (!watchResult.success) {
        return watchResult;
      }
      
      const watch = watchResult.data;
      
      // Get bidding history for this watch
      const biddingHistory = await Bid.find({ watch: watchId })
        .sort({ created_at: -1 })
        .limit(10);
      
      // Get user's bidding context if available
      let userContext = null;
      if (userId) {
        userContext = await AssistantContext.findOne({ user: userId });
      }
      
      // Calculate bidding insights
      const insights = {
        currentHighestBid: watch.currentBid,
        suggestedBidRange: {
          conservative: Math.ceil(watch.currentBid * 1.05),
          competitive: Math.ceil(watch.currentBid * 1.10),
          aggressive: Math.ceil(watch.currentBid * 1.15)
        },
        marketAnalysis: {
          totalBids: biddingHistory.length,
          averageBidIncrease: this.calculateAverageBidIncrease(biddingHistory),
          biddingActivity: this.analyzeBiddingActivity(biddingHistory)
        },
        recommendations: this.generateBiddingRecommendations(watch, userBudget, biddingHistory)
      };
      
      return {
        success: true,
        data: {
          watch: {
            brand: watch.brand,
            model: watch.model,
            currentBid: watch.currentBid,
            price: watch.price
          },
          insights,
          userBudget,
          withinBudget: userBudget ? userBudget >= insights.suggestedBidRange.conservative : null
        }
      };
    } catch (error) {
      console.error('Get bidding help error:', error);
      return {
        success: false,
        error: 'Failed to provide bidding help'
      };
    }
  }

  // Helper methods
  calculateAverageBidIncrease(bids) {
    if (bids.length < 2) return 0;
    
    let totalIncrease = 0;
    let increaseCount = 0;
    
    for (let i = 0; i < bids.length - 1; i++) {
      const increase = bids[i].amount - bids[i + 1].amount;
      if (increase > 0) {
        totalIncrease += increase;
        increaseCount++;
      }
    }
    
    return increaseCount > 0 ? Math.round(totalIncrease / increaseCount) : 0;
  }

  analyzeBiddingActivity(bids) {
    const now = new Date();
    const last24Hours = bids.filter(bid => 
      (now - new Date(bid.created_at)) < 24 * 60 * 60 * 1000
    ).length;
    
    const lastWeek = bids.filter(bid => 
      (now - new Date(bid.created_at)) < 7 * 24 * 60 * 60 * 1000
    ).length;
    
    return {
      last24Hours,
      lastWeek,
      activity: last24Hours > 3 ? 'high' : last24Hours > 1 ? 'moderate' : 'low'
    };
  }

  generateBiddingRecommendations(watch, userBudget, biddingHistory) {
    const recommendations = [];
    
    if (biddingHistory.length > 5) {
      recommendations.push("This watch has high bidding activity. Consider placing a competitive bid soon.");
    }
    
    if (userBudget && userBudget < watch.currentBid * 1.1) {
      recommendations.push("Your budget is close to the current bid. Consider if you want to increase your limit.");
    }
    
    if (watch.condition === 'excellent' && watch.year && watch.year > 2020) {
      recommendations.push("This is a recent watch in excellent condition - good investment potential.");
    }
    
    recommendations.push("Monitor the auction closely in the final hours for last-minute bidding activity.");
    
    return recommendations;
  }

  // Execute function based on name
  async executeFunction(functionName, parameters, userId = null) {
    switch (functionName) {
      case 'search_watches':
        return await this.searchWatches(parameters);
      
      case 'get_user_bids':
        return await this.getUserBids(userId, parameters);
      
      case 'get_watch_details':
        return await this.getWatchDetails(parameters);
      
      case 'identify_watch_from_image':
        return await this.identifyWatchFromImage(parameters);
      
      case 'get_bidding_help':
        return await this.getBiddingHelp(userId, parameters);
      
      default:
        return {
          success: false,
          error: `Unknown function: ${functionName}`
        };
    }
  }
}

export default new AssistantFunctions();
