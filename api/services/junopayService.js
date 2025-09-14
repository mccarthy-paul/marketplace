import fetch from 'node-fetch';
import User from '../db/userModel.js';

class JunoPayService {
  constructor() {
    this.baseURL = process.env.JUNOPAY_API_BASE_URL;
    this.tokenURL = process.env.JUNOPAY_TOKEN_URL;
    this.applicationId = process.env.JUNO_APPLICATION_ID;
    this.secretKey = process.env.JUNO_SECRET_KEY;
  }

  // Refresh access token using refresh token
  async refreshAccessToken(user) {
    try {
      const response = await fetch(this.tokenURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: user.refresh_token,
          application_id: this.applicationId,
          secret_key: this.secretKey
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'invalid_grant') {
          // Refresh token is invalid, user needs to re-authenticate
          throw new Error('REAUTH_REQUIRED');
        }
        throw new Error(`Token refresh failed: ${data.error}`);
      }

      // Update user's tokens
      await User.findByIdAndUpdate(user._id, {
        access_token: data.access_token,
        refresh_token: data.refresh_token || user.refresh_token,
        updated_at: new Date()
      });

      return data.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  // Make authenticated API call with automatic token refresh
  async makeAuthenticatedRequest(user, endpoint, body = {}) {
    let accessToken = user.access_token;

    const makeRequest = async (token) => {
      return await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
    };

    let response = await makeRequest(accessToken);

    // If token expired, refresh and retry
    if (response.status === 401) {
      try {
        accessToken = await this.refreshAccessToken(user);
        response = await makeRequest(accessToken);
      } catch (error) {
        if (error.message === 'REAUTH_REQUIRED') {
          throw new Error('USER_REAUTH_REQUIRED');
        }
        throw error;
      }
    }

    const data = await response.json();
    if (!response.ok) {
      console.error('JunoPay API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data
      });
      throw new Error(`API request failed: ${JSON.stringify(data) || response.statusText}`);
    }

    return data;
  }

  // Get user's JunoPay balance
  async getUserBalance(user) {
    try {
      console.log('Getting balance for user:', user.junopay_client_id);
      console.log('Using access token:', user.access_token ? 'Token exists' : 'No token');
      
      // POST request with no parameters, only Authorization header
      const response = await fetch('https://stg.junomoney.org/restapi/get-client-balances-for-app', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      });

      const data = await response.json();
      console.log('Balance API response status:', response.status);
      console.log('Balance API response:', JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        console.error('Balance API error - Status:', response.status);
        console.error('Balance API error - Response:', JSON.stringify(data, null, 2));
        
        // If token expired, try refreshing
        if (response.status === 401) {
          console.log('Access token expired, refreshing...');
          const newAccessToken = await this.refreshAccessToken(user);
          
          // Retry with new token
          const retryResponse = await fetch('https://stg.junomoney.org/restapi/get-client-balances-for-app', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newAccessToken}`
            }
          });

          const retryData = await retryResponse.json();
          console.log('Balance API retry response status:', retryResponse.status);
          console.log('Balance API retry response:', JSON.stringify(retryData, null, 2));
          
          if (!retryResponse.ok) {
            console.error('Balance API retry error - Status:', retryResponse.status);
            console.error('Balance API retry error - Response:', JSON.stringify(retryData, null, 2));
            throw new Error(`API request failed after refresh: ${retryData.error || retryResponse.statusText}`);
          }
          
          return retryData;
        }
        
        throw new Error(`API request failed: ${data.error || response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Get balance error:', error);
      throw error;
    }
  }

  // Get user information from JunoPay
  async getUserInfo(user) {
    try {
      return await this.makeAuthenticatedRequest(user, '/get-client-user-info');
    } catch (error) {
      console.error('Get user info error:', error);
      throw error;
    }
  }

  // Initiate a transaction (watch purchase)
  async initiateTransaction(user, transactionDetails) {
    try {
      const purchasePrice = parseFloat(transactionDetails.purchasePrice);
      const shippingPrice = parseFloat(transactionDetails.shippingPrice || '0');
      const buyerFeeAmount = (purchasePrice * (user.buyer_fee || 0)) / 100;
      const totalPrice = purchasePrice + shippingPrice + buyerFeeAmount;

      const requestBody = {
        buyerClientId: user.junopay_client_id,
        sellerClientId: transactionDetails.sellerClientId,
        application_id: this.applicationId,
        productDetails: {
          name: transactionDetails.productName,
          code: transactionDetails.productCode || '',
          currency: transactionDetails.currency || 'USD',
          purchasePrice: purchasePrice.toString(),
          shippingPrice: shippingPrice.toString(),
          totalPrice: totalPrice.toString(),
          purchaseDate: new Date().toISOString(),
          buyerNote: transactionDetails.buyerNote || '',
          buyerFee: buyerFeeAmount.toString()
        }
      };

      console.log('Initiating JunoPay transaction with request body:', JSON.stringify(requestBody, null, 2));
      console.log('Making request to:', `${this.baseURL}/initiate-app-buy-transaction`);
      console.log('Using access token:', user.access_token ? 'Token exists' : 'No token');
      
      const result = await this.makeAuthenticatedRequest(user, '/initiate-app-buy-transaction', requestBody);
      console.log('JunoPay initiate-app-buy-transaction response:', JSON.stringify(result, null, 2));
      
      return result;
    } catch (error) {
      console.error('Initiate transaction error:', error);
      throw error;
    }
  }

  // Get transaction details
  async getTransactionDetails(user, transactionId) {
    try {
      const requestBody = {
        application_id: this.applicationId,
        associatedClientId: user.junopay_client_id,
        transactionId: transactionId
      };

      const result = await this.makeAuthenticatedRequest(user, '/get-app-transaction-details', requestBody);
      
      // The result should contain the transaction details with current status
      console.log(`Transaction ${transactionId} details:`, result);
      
      return result;
    } catch (error) {
      console.error('Get transaction details error:', error);
      throw error;
    }
  }

  // Update transaction status (confirm/query)
  async updateTransaction(user, transactionId, status, note = '') {
    try {
      const requestBody = {
        application_id: this.applicationId,
        clientId: user.junopay_client_id,
        transactionId: transactionId,
        status: status, // 'confirm' or 'query'
        note: note
      };

      return await this.makeAuthenticatedRequest(user, '/update-app-buy-transaction', requestBody);
    } catch (error) {
      console.error('Update transaction error:', error);
      throw error;
    }
  }
}

export default new JunoPayService();