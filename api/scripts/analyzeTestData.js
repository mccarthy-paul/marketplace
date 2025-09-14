#!/usr/bin/env node

/**
 * Test Data Analysis Script for Juno Marketplace
 *
 * Identifies potential test data based on:
 * - Names containing 'test', 'demo', 'sample'
 * - Email addresses with test patterns
 * - Watch brands/models that appear to be test data
 * - Unrealistic values or patterns
 * - Recent creation dates (assuming test data is recent)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import chalk from 'chalk';
import Table from 'cli-table3';

// Import models
import Watch from '../db/watchModel.js';
import User from '../db/userModel.js';
import Bid from '../db/bidModel.js';
import Transaction from '../db/transactionModel.js';
import Cart from '../db/cartModel.js';
import Notification from '../db/notificationModel.js';

// Test data patterns to look for
const TEST_PATTERNS = {
  names: /\b(test|demo|sample|example|fake|dummy|john\s*doe|jane\s*doe)\b/i,
  emails: /\b(test|demo|sample|example|fake|dummy|\+test|noreply|no-reply).*@/i,
  brands: /\b(test|demo|sample|example|fake|dummy)\b/i,
  models: /\b(test|demo|sample|example|fake|dummy)\b/i,
  companies: /\b(test|demo|sample|example|fake|dummy|acme|corp|inc)\b/i
};

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/junoauth';
    await mongoose.connect(mongoUri);
    console.log(chalk.green('✓ Connected to MongoDB'));
    return true;
  } catch (error) {
    console.error(chalk.red('✗ Failed to connect to MongoDB:'), error.message);
    return false;
  }
}

/**
 * Analyze users for test data patterns
 */
async function analyzeUsers() {
  console.log(chalk.blue('\n📧 Analyzing Users...'));

  const users = await User.find({}).lean();
  const testUsers = [];

  users.forEach(user => {
    const reasons = [];

    // Check name patterns
    if (TEST_PATTERNS.names.test(user.name)) {
      reasons.push('Name contains test pattern');
    }

    // Check email patterns
    if (TEST_PATTERNS.emails.test(user.email)) {
      reasons.push('Email contains test pattern');
    }

    // Check company name patterns
    if (user.company_name && TEST_PATTERNS.companies.test(user.company_name)) {
      reasons.push('Company name contains test pattern');
    }

    // Check for obvious test emails
    if (user.email.includes('localhost') || user.email.includes('example.com')) {
      reasons.push('Test email domain');
    }

    // Check for missing required fields that might indicate test data
    if (!user.email || !user.name) {
      reasons.push('Missing required fields');
    }

    if (reasons.length > 0) {
      testUsers.push({
        _id: user._id,
        name: user.name,
        email: user.email,
        company_name: user.company_name,
        created_at: user.created_at,
        reasons: reasons
      });
    }
  });

  return { total: users.length, testUsers };
}

/**
 * Analyze watches for test data patterns
 */
async function analyzeWatches() {
  console.log(chalk.blue('\n⌚ Analyzing Watches...'));

  const watches = await Watch.find({}).lean();
  const testWatches = [];

  watches.forEach(watch => {
    const reasons = [];

    // Check brand patterns
    if (TEST_PATTERNS.brands.test(watch.brand)) {
      reasons.push('Brand contains test pattern');
    }

    // Check model patterns
    if (TEST_PATTERNS.models.test(watch.model)) {
      reasons.push('Model contains test pattern');
    }

    // Check description patterns
    if (watch.description && TEST_PATTERNS.names.test(watch.description)) {
      reasons.push('Description contains test pattern');
    }

    // Check for unrealistic values
    if (watch.price && watch.price < 100) {
      reasons.push('Unrealistically low price');
    }

    if (watch.year && (watch.year < 1900 || watch.year > 2025)) {
      reasons.push('Invalid year');
    }

    // Check for missing images
    if (!watch.images || watch.images.length === 0) {
      reasons.push('No images (might be test data)');
    }

    if (reasons.length > 0) {
      testWatches.push({
        _id: watch._id,
        brand: watch.brand,
        model: watch.model,
        reference_number: watch.reference_number,
        price: watch.price,
        status: watch.status,
        created_at: watch.created_at,
        reasons: reasons
      });
    }
  });

  return { total: watches.length, testWatches };
}

/**
 * Analyze bids for test data patterns
 */
async function analyzeBids() {
  console.log(chalk.blue('\n💰 Analyzing Bids...'));

  const bids = await Bid.find({}).populate('bidder').populate('watch').lean();
  const testBids = [];

  bids.forEach(bid => {
    const reasons = [];

    // Check bidder email patterns
    if (bid.bidderEmail && TEST_PATTERNS.emails.test(bid.bidderEmail)) {
      reasons.push('Bidder email contains test pattern');
    }

    // Check bidder name patterns
    if (bid.bidderName && TEST_PATTERNS.names.test(bid.bidderName)) {
      reasons.push('Bidder name contains test pattern');
    }

    // Check for unrealistic bid amounts
    if (bid.amount < 1 || bid.amount > 10000000) {
      reasons.push('Unrealistic bid amount');
    }

    if (reasons.length > 0) {
      testBids.push({
        _id: bid._id,
        amount: bid.amount,
        bidderEmail: bid.bidderEmail,
        bidderName: bid.bidderName,
        status: bid.status,
        created_at: bid.created_at,
        reasons: reasons
      });
    }
  });

  return { total: bids.length, testBids };
}

/**
 * Analyze transactions for test data patterns
 */
async function analyzeTransactions() {
  console.log(chalk.blue('\n📦 Analyzing Transactions...'));

  const transactions = await Transaction.find({}).lean();
  const testTransactions = [];

  transactions.forEach(transaction => {
    const reasons = [];

    // Check for test amounts
    if (transaction.totalPrice && (transaction.totalPrice < 1 || transaction.totalPrice > 10000000)) {
      reasons.push('Unrealistic price');
    }

    // Check for test patterns in addresses
    if (transaction.shippingAddress) {
      const address = JSON.stringify(transaction.shippingAddress);
      if (TEST_PATTERNS.names.test(address)) {
        reasons.push('Shipping address contains test pattern');
      }
    }

    if (reasons.length > 0) {
      testTransactions.push({
        _id: transaction._id,
        totalPrice: transaction.totalPrice,
        status: transaction.status,
        created_at: transaction.created_at,
        reasons: reasons
      });
    }
  });

  return { total: transactions.length, testTransactions };
}

/**
 * Analyze carts for test data patterns
 */
async function analyzeCarts() {
  console.log(chalk.blue('\n🛒 Analyzing Carts...'));

  const carts = await Cart.find({}).populate('user').lean();
  const testCarts = [];

  carts.forEach(cart => {
    const reasons = [];

    // Empty carts might be test data
    if (!cart.items || cart.items.length === 0) {
      reasons.push('Empty cart (might be test)');
    }

    // Check associated user for test patterns
    if (cart.user && TEST_PATTERNS.emails.test(cart.user.email)) {
      reasons.push('Associated with test user');
    }

    if (reasons.length > 0) {
      testCarts.push({
        _id: cart._id,
        user: cart.user ? cart.user.email : 'Unknown',
        itemCount: cart.items ? cart.items.length : 0,
        created_at: cart.created_at,
        reasons: reasons
      });
    }
  });

  return { total: carts.length, testCarts };
}

/**
 * Analyze notifications for test data patterns
 */
async function analyzeNotifications() {
  console.log(chalk.blue('\n🔔 Analyzing Notifications...'));

  const notifications = await Notification.find({}).populate('user').lean();
  const testNotifications = [];

  notifications.forEach(notification => {
    const reasons = [];

    // Check if associated with test users
    if (notification.user && TEST_PATTERNS.emails.test(notification.user.email)) {
      reasons.push('Associated with test user');
    }

    // Check message content for test patterns
    if (TEST_PATTERNS.names.test(notification.message) || TEST_PATTERNS.names.test(notification.title)) {
      reasons.push('Message contains test pattern');
    }

    if (reasons.length > 0) {
      testNotifications.push({
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        user: notification.user ? notification.user.email : 'Unknown',
        createdAt: notification.createdAt,
        reasons: reasons
      });
    }
  });

  return { total: notifications.length, testNotifications };
}

/**
 * Display analysis results
 */
function displayResults(results) {
  console.log(chalk.bold.cyan('\n🔍 TEST DATA ANALYSIS RESULTS\n'));

  const summaryTable = new Table({
    head: ['Entity', 'Total', 'Test Items', 'Percentage'],
    colWidths: [15, 10, 12, 12],
    style: { head: ['cyan'] }
  });

  Object.entries(results).forEach(([entity, data]) => {
    const testCount = data.testItems ? data.testItems.length : 0;
    const percentage = data.total > 0 ? ((testCount / data.total) * 100).toFixed(1) + '%' : '0%';

    summaryTable.push([
      entity.charAt(0).toUpperCase() + entity.slice(1),
      data.total,
      testCount,
      percentage
    ]);
  });

  console.log(summaryTable.toString());

  // Display detailed results for each entity
  Object.entries(results).forEach(([entity, data]) => {
    if (data.testItems && data.testItems.length > 0) {
      console.log(chalk.bold.yellow(`\n📋 Detailed ${entity.toUpperCase()} Test Data:`));

      const detailTable = new Table({
        head: ['ID', 'Key Info', 'Reasons'],
        colWidths: [25, 40, 40],
        style: { head: ['yellow'] }
      });

      data.testItems.forEach(item => {
        let keyInfo = '';

        switch (entity) {
          case 'users':
            keyInfo = `${item.name} (${item.email})`;
            break;
          case 'watches':
            keyInfo = `${item.brand} ${item.model} - $${item.price}`;
            break;
          case 'bids':
            keyInfo = `$${item.amount} by ${item.bidderName}`;
            break;
          case 'transactions':
            keyInfo = `$${item.totalPrice} - ${item.status}`;
            break;
          case 'carts':
            keyInfo = `${item.itemCount} items - ${item.user}`;
            break;
          case 'notifications':
            keyInfo = `${item.type}: ${item.title}`;
            break;
        }

        detailTable.push([
          item._id.toString().slice(-8),
          keyInfo,
          item.reasons.join(', ')
        ]);
      });

      console.log(detailTable.toString());
    }
  });
}

/**
 * Main execution function
 */
async function main() {
  console.clear();
  console.log(chalk.bold.blue(`
╔══════════════════════════════════════════════╗
║       JUNO MARKETPLACE TEST DATA ANALYZER    ║
║       Identify potential test data           ║
╚══════════════════════════════════════════════╝
  `));

  // Connect to database
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  try {
    // Run analysis on all entities
    const results = {
      users: await analyzeUsers(),
      watches: await analyzeWatches(),
      bids: await analyzeBids(),
      transactions: await analyzeTransactions(),
      carts: await analyzeCarts(),
      notifications: await analyzeNotifications()
    };

    // Map to consistent format
    const formattedResults = {};
    Object.entries(results).forEach(([entity, data]) => {
      formattedResults[entity] = {
        total: data.total,
        testItems: data.testUsers || data.testWatches || data.testBids ||
                  data.testTransactions || data.testCarts || data.testNotifications || []
      };
    });

    // Display results
    displayResults(formattedResults);

    // Summary recommendation
    const totalTestItems = Object.values(formattedResults)
      .reduce((sum, data) => sum + data.testItems.length, 0);

    if (totalTestItems > 0) {
      console.log(chalk.bold.red(`\n⚠️  RECOMMENDATION: ${totalTestItems} potential test items found!`));
      console.log(chalk.yellow('Consider running the selective cleaning script to remove test data.'));
      console.log(chalk.gray('Command: npm run clean:selective -- --interactive'));
    } else {
      console.log(chalk.bold.green('\n✅ No obvious test data patterns detected.'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Analysis failed:'), error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log(chalk.dim('\n👋 Database connection closed'));
  }
}

// Run the analysis
main().catch(console.error);