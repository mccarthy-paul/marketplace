#!/usr/bin/env node

/**
 * Specific Test Data Cleaning Script
 *
 * This script removes only specifically identified test data items
 * while preserving all production data
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models
import Watch from '../db/watchModel.js';
import User from '../db/userModel.js';
import Bid from '../db/bidModel.js';
import Transaction from '../db/transactionModel.js';
import Cart from '../db/cartModel.js';
import Notification from '../db/notificationModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Create comprehensive backup
 */
async function createBackup() {
  console.log(chalk.blue('📦 Creating comprehensive backup...'));

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', `test-data-cleanup-${timestamp}`);

  try {
    // Create backup directory
    fs.mkdirSync(backupDir, { recursive: true });

    // Backup all collections
    const collections = [
      { model: Watch, name: 'watches' },
      { model: User, name: 'users' },
      { model: Bid, name: 'bids' },
      { model: Transaction, name: 'transactions' },
      { model: Cart, name: 'carts' },
      { model: Notification, name: 'notifications' }
    ];

    for (const { model, name } of collections) {
      const data = await model.find({}).lean();
      const filePath = path.join(backupDir, `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(chalk.gray(`   ✓ Backed up ${data.length} ${name}`));
    }

    // Create summary file
    const summary = {
      timestamp: new Date().toISOString(),
      purpose: 'Test data cleanup backup',
      collections: collections.map(c => ({
        name: c.name,
        count: fs.readFileSync(path.join(backupDir, `${c.name}.json`), 'utf8').split('\n').length
      }))
    };

    fs.writeFileSync(
      path.join(backupDir, 'backup-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log(chalk.green(`✓ Backup created at: ${backupDir}`));
    return backupDir;
  } catch (error) {
    console.error(chalk.red('✗ Backup failed:'), error.message);
    throw error;
  }
}

/**
 * Identify test data items
 */
async function identifyTestData() {
  console.log(chalk.blue('🔍 Identifying test data items...'));

  const testItems = {
    users: [],
    watches: [],
    bids: [],
    transactions: [],
    carts: [],
    notifications: []
  };

  // Identify test users
  const users = await User.find({}).lean();
  users.forEach(user => {
    const reasons = [];

    if (TEST_PATTERNS.names.test(user.name)) reasons.push('Name contains test pattern');
    if (TEST_PATTERNS.emails.test(user.email)) reasons.push('Email contains test pattern');
    if (user.company_name && TEST_PATTERNS.companies.test(user.company_name)) reasons.push('Company name contains test pattern');
    if (user.email.includes('localhost') || user.email.includes('example.com')) reasons.push('Test email domain');
    if (!user.email || !user.name) reasons.push('Missing required fields');

    if (reasons.length > 0) {
      testItems.users.push({ ...user, reasons });
    }
  });

  // Identify test watches
  const watches = await Watch.find({}).lean();
  watches.forEach(watch => {
    const reasons = [];

    if (TEST_PATTERNS.brands.test(watch.brand)) reasons.push('Brand contains test pattern');
    if (TEST_PATTERNS.models.test(watch.model)) reasons.push('Model contains test pattern');
    if (watch.description && TEST_PATTERNS.names.test(watch.description)) reasons.push('Description contains test pattern');

    if (reasons.length > 0) {
      testItems.watches.push({ ...watch, reasons });
    }
  });

  // Identify test bids
  const bids = await Bid.find({}).lean();
  bids.forEach(bid => {
    const reasons = [];

    if (bid.bidderEmail && TEST_PATTERNS.emails.test(bid.bidderEmail)) reasons.push('Bidder email contains test pattern');
    if (bid.bidderName && TEST_PATTERNS.names.test(bid.bidderName)) reasons.push('Bidder name contains test pattern');

    if (reasons.length > 0) {
      testItems.bids.push({ ...bid, reasons });
    }
  });

  // Identify test transactions
  const transactions = await Transaction.find({}).lean();
  transactions.forEach(transaction => {
    const reasons = [];

    if (transaction.shippingAddress) {
      const address = JSON.stringify(transaction.shippingAddress);
      if (TEST_PATTERNS.names.test(address)) reasons.push('Shipping address contains test pattern');
    }

    if (reasons.length > 0) {
      testItems.transactions.push({ ...transaction, reasons });
    }
  });

  // Identify test carts (empty carts from test users)
  const carts = await Cart.find({}).populate('user').lean();
  carts.forEach(cart => {
    const reasons = [];

    // Only consider completely empty carts as potential test data
    if (!cart.items || cart.items.length === 0) {
      reasons.push('Empty cart (potential test)');
    }

    // Check if associated with test users
    if (cart.user && (
      TEST_PATTERNS.emails.test(cart.user.email) ||
      cart.user.email.includes('example.com')
    )) {
      reasons.push('Associated with test user');
    }

    if (reasons.length > 0) {
      testItems.carts.push({ ...cart, reasons });
    }
  });

  // Identify test notifications (associated with test users)
  const notifications = await Notification.find({}).populate('user').lean();
  notifications.forEach(notification => {
    const reasons = [];

    if (notification.user && (
      TEST_PATTERNS.emails.test(notification.user.email) ||
      notification.user.email.includes('example.com')
    )) {
      reasons.push('Associated with test user');
    }

    if (TEST_PATTERNS.names.test(notification.message) || TEST_PATTERNS.names.test(notification.title)) {
      reasons.push('Message contains test pattern');
    }

    if (reasons.length > 0) {
      testItems.notifications.push({ ...notification, reasons });
    }
  });

  return testItems;
}

/**
 * Display identified test items for confirmation
 */
function displayTestItems(testItems) {
  console.log(chalk.bold.yellow('\n📋 IDENTIFIED TEST DATA ITEMS:\n'));

  let totalItems = 0;
  Object.entries(testItems).forEach(([entity, items]) => {
    if (items.length > 0) {
      totalItems += items.length;
      console.log(chalk.bold.cyan(`${entity.toUpperCase()} (${items.length} items):`));

      items.forEach((item, index) => {
        let display = '';
        switch (entity) {
          case 'users':
            display = `  ${index + 1}. ${item.name} (${item.email})`;
            break;
          case 'watches':
            display = `  ${index + 1}. ${item.brand} ${item.model} - $${item.price}`;
            break;
          case 'bids':
            display = `  ${index + 1}. $${item.amount} by ${item.bidderName || item.bidderEmail}`;
            break;
          case 'transactions':
            display = `  ${index + 1}. $${item.totalPrice} - ${item.status}`;
            break;
          case 'carts':
            display = `  ${index + 1}. Cart with ${item.items ? item.items.length : 0} items`;
            break;
          case 'notifications':
            display = `  ${index + 1}. ${item.type}: ${item.title}`;
            break;
        }
        console.log(chalk.yellow(display));
        console.log(chalk.gray(`     Reasons: ${item.reasons.join(', ')}`));
      });
      console.log();
    }
  });

  return totalItems;
}

/**
 * Remove test data items
 */
async function removeTestData(testItems, dryRun = false) {
  console.log(chalk.blue(`🧹 ${dryRun ? '[DRY RUN] ' : ''}Removing test data...`));

  const results = {};

  // Remove test users
  if (testItems.users.length > 0) {
    const userIds = testItems.users.map(u => u._id);
    if (dryRun) {
      console.log(chalk.gray(`   [DRY RUN] Would remove ${userIds.length} test users`));
      results.users = { count: userIds.length, dryRun: true };
    } else {
      const result = await User.deleteMany({ _id: { $in: userIds } });
      console.log(chalk.green(`   ✓ Removed ${result.deletedCount} test users`));
      results.users = { count: result.deletedCount };
    }
  }

  // Remove test watches
  if (testItems.watches.length > 0) {
    const watchIds = testItems.watches.map(w => w._id);
    if (dryRun) {
      console.log(chalk.gray(`   [DRY RUN] Would remove ${watchIds.length} test watches`));
      results.watches = { count: watchIds.length, dryRun: true };
    } else {
      const result = await Watch.deleteMany({ _id: { $in: watchIds } });
      console.log(chalk.green(`   ✓ Removed ${result.deletedCount} test watches`));
      results.watches = { count: result.deletedCount };
    }
  }

  // Remove test bids
  if (testItems.bids.length > 0) {
    const bidIds = testItems.bids.map(b => b._id);
    if (dryRun) {
      console.log(chalk.gray(`   [DRY RUN] Would remove ${bidIds.length} test bids`));
      results.bids = { count: bidIds.length, dryRun: true };
    } else {
      const result = await Bid.deleteMany({ _id: { $in: bidIds } });
      console.log(chalk.green(`   ✓ Removed ${result.deletedCount} test bids`));
      results.bids = { count: result.deletedCount };
    }
  }

  // Remove test transactions
  if (testItems.transactions.length > 0) {
    const transactionIds = testItems.transactions.map(t => t._id);
    if (dryRun) {
      console.log(chalk.gray(`   [DRY RUN] Would remove ${transactionIds.length} test transactions`));
      results.transactions = { count: transactionIds.length, dryRun: true };
    } else {
      const result = await Transaction.deleteMany({ _id: { $in: transactionIds } });
      console.log(chalk.green(`   ✓ Removed ${result.deletedCount} test transactions`));
      results.transactions = { count: result.deletedCount };
    }
  }

  // Remove test carts
  if (testItems.carts.length > 0) {
    const cartIds = testItems.carts.map(c => c._id);
    if (dryRun) {
      console.log(chalk.gray(`   [DRY RUN] Would remove ${cartIds.length} test carts`));
      results.carts = { count: cartIds.length, dryRun: true };
    } else {
      const result = await Cart.deleteMany({ _id: { $in: cartIds } });
      console.log(chalk.green(`   ✓ Removed ${result.deletedCount} test carts`));
      results.carts = { count: result.deletedCount };
    }
  }

  // Remove test notifications
  if (testItems.notifications.length > 0) {
    const notificationIds = testItems.notifications.map(n => n._id);
    if (dryRun) {
      console.log(chalk.gray(`   [DRY RUN] Would remove ${notificationIds.length} test notifications`));
      results.notifications = { count: notificationIds.length, dryRun: true };
    } else {
      const result = await Notification.deleteMany({ _id: { $in: notificationIds } });
      console.log(chalk.green(`   ✓ Removed ${result.deletedCount} test notifications`));
      results.notifications = { count: result.deletedCount };
    }
  }

  return results;
}

/**
 * Main execution function
 */
async function main() {
  console.clear();
  console.log(chalk.bold.blue(`
╔══════════════════════════════════════════════╗
║    JUNO MARKETPLACE SPECIFIC TEST CLEANER    ║
║    Remove only identified test data          ║
╚══════════════════════════════════════════════╝
  `));

  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  // Connect to database
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  try {
    // Identify test data
    const testItems = await identifyTestData();
    const totalTestItems = displayTestItems(testItems);

    if (totalTestItems === 0) {
      console.log(chalk.bold.green('✅ No test data items identified!'));
      console.log(chalk.gray('Your database appears to be clean of test data.'));
      return;
    }

    // Confirm with user unless force flag is set
    if (!force && !dryRun) {
      console.log(chalk.yellow(`⚠️  Found ${totalTestItems} potential test data items.`));
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Do you want to proceed with removing these items?',
        default: false
      }]);

      if (!confirm) {
        console.log(chalk.yellow('\n❌ Operation cancelled by user'));
        return;
      }
    }

    // Create backup unless dry run
    let backupPath = null;
    if (!dryRun) {
      backupPath = await createBackup();
    }

    // Remove test data
    const results = await removeTestData(testItems, dryRun);

    // Display summary
    console.log(chalk.bold.green(`\n✨ ${dryRun ? 'DRY RUN ' : ''}CLEANUP COMPLETE\n`));

    const totalRemoved = Object.values(results).reduce((sum, r) => sum + r.count, 0);

    if (dryRun) {
      console.log(chalk.yellow(`📝 DRY RUN: Would have removed ${totalRemoved} test data items`));
    } else {
      console.log(chalk.green(`🧹 Successfully removed ${totalRemoved} test data items`));
      if (backupPath) {
        console.log(chalk.blue(`📦 Backup available at: ${backupPath}`));
      }
    }

    // Display detailed results
    Object.entries(results).forEach(([entity, result]) => {
      const status = result.dryRun ? chalk.yellow('DRY RUN') : chalk.green('REMOVED');
      console.log(`   ${entity}: ${result.count} items ${status}`);
    });

  } catch (error) {
    console.error(chalk.red('\n❌ Cleanup failed:'), error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log(chalk.dim('\n👋 Database connection closed'));
  }
}

// Run the script
main().catch(console.error);