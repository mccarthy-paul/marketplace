#!/usr/bin/env node

/**
 * Data Cleaning Script for Testing
 * 
 * This script cleans the database for testing purposes:
 * - Sets all watches to 'active' status
 * - Deletes all bids
 * - Deletes all transactions/orders
 * - Optionally backs up data before cleaning
 * 
 * Usage:
 *   npm run clean:data           - Run with confirmations
 *   npm run clean:data -- --force - Skip confirmations
 *   npm run clean:data -- --backup - Create backup before cleaning
 *   npm run clean:data -- --dry-run - Preview what will be cleaned
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models
import Watch from '../db/watchModel.js';
import Bid from '../db/bidModel.js';
import Transaction from '../db/transactionModel.js';
import Cart from '../db/cartModel.js';
import User from '../db/userModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  force: args.includes('--force'),
  backup: args.includes('--backup'),
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose')
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Logging functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  debug: (msg) => flags.verbose && console.log(`${colors.magenta}◆${colors.reset} ${msg}`)
};

// Statistics tracking
const stats = {
  watches: { total: 0, updated: 0 },
  bids: { total: 0, deleted: 0 },
  transactions: { total: 0, deleted: 0 },
  carts: { total: 0, deleted: 0 }
};

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/junoauth';
    await mongoose.connect(mongoUri);
    log.success(`Connected to MongoDB: ${mongoUri}`);
    return true;
  } catch (error) {
    log.error(`Failed to connect to MongoDB: ${error.message}`);
    return false;
  }
}

/**
 * Create backup of current data
 */
async function createBackup() {
  if (!flags.backup) return;

  log.info('Creating backup of current data...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', `backup-${timestamp}`);
  
  try {
    // Create backup directory
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Backup each collection
    const collections = [
      { model: Watch, name: 'watches' },
      { model: Bid, name: 'bids' },
      { model: Transaction, name: 'transactions' },
      { model: Cart, name: 'carts' }
    ];
    
    for (const { model, name } of collections) {
      const data = await model.find({}).lean();
      const filePath = path.join(backupDir, `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      log.debug(`Backed up ${data.length} ${name} to ${filePath}`);
    }
    
    log.success(`Backup created at: ${backupDir}`);
    return backupDir;
  } catch (error) {
    log.error(`Backup failed: ${error.message}`);
    throw error;
  }
}

/**
 * Get current data statistics
 */
async function getDataStats() {
  log.info('Analyzing current data...');
  
  // Get watch statistics
  stats.watches.total = await Watch.countDocuments();
  const watchStatuses = await Watch.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  // Get bid statistics
  stats.bids.total = await Bid.countDocuments();
  const bidStatuses = await Bid.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  // Get transaction statistics
  stats.transactions.total = await Transaction.countDocuments();
  
  // Get cart statistics
  stats.carts.total = await Cart.countDocuments();
  
  // Display current state
  console.log('\n' + colors.cyan + '═══════════════════════════════════════════' + colors.reset);
  console.log(colors.bright + '         CURRENT DATABASE STATE' + colors.reset);
  console.log(colors.cyan + '═══════════════════════════════════════════' + colors.reset);
  
  console.log('\n📊 ' + colors.bright + 'Watches:' + colors.reset + ` ${stats.watches.total} total`);
  watchStatuses.forEach(s => {
    console.log(`   • ${s._id}: ${s.count}`);
  });
  
  console.log('\n💰 ' + colors.bright + 'Bids:' + colors.reset + ` ${stats.bids.total} total`);
  bidStatuses.forEach(s => {
    console.log(`   • ${s._id}: ${s.count}`);
  });
  
  console.log('\n📦 ' + colors.bright + 'Transactions:' + colors.reset + ` ${stats.transactions.total} total`);
  console.log('\n🛒 ' + colors.bright + 'Carts:' + colors.reset + ` ${stats.carts.total} total`);
  
  console.log('\n' + colors.cyan + '═══════════════════════════════════════════' + colors.reset + '\n');
}

/**
 * Clean watches - set all to active
 */
async function cleanWatches() {
  log.info('Processing watches...');
  
  if (flags.dryRun) {
    const nonActive = await Watch.countDocuments({ status: { $ne: 'active' } });
    log.warning(`[DRY RUN] Would update ${nonActive} watches to 'active' status`);
    return;
  }
  
  try {
    // Update all watches to active status
    const result = await Watch.updateMany(
      { status: { $ne: 'active' } },
      { 
        $set: { 
          status: 'active',
          updated_at: new Date()
        }
      }
    );
    
    stats.watches.updated = result.modifiedCount;
    log.success(`Updated ${result.modifiedCount} watches to 'active' status`);
    
    // Clear sold_to references
    const soldResult = await Watch.updateMany(
      { sold_to: { $exists: true } },
      { 
        $unset: { sold_to: '' },
        $set: { updated_at: new Date() }
      }
    );
    
    if (soldResult.modifiedCount > 0) {
      log.success(`Cleared sold_to references from ${soldResult.modifiedCount} watches`);
    }
    
  } catch (error) {
    log.error(`Failed to update watches: ${error.message}`);
    throw error;
  }
}

/**
 * Clean bids - delete all
 */
async function cleanBids() {
  log.info('Processing bids...');
  
  if (flags.dryRun) {
    log.warning(`[DRY RUN] Would delete ${stats.bids.total} bids`);
    return;
  }
  
  try {
    const result = await Bid.deleteMany({});
    stats.bids.deleted = result.deletedCount;
    log.success(`Deleted ${result.deletedCount} bids`);
  } catch (error) {
    log.error(`Failed to delete bids: ${error.message}`);
    throw error;
  }
}

/**
 * Clean transactions/orders - delete all
 */
async function cleanTransactions() {
  log.info('Processing transactions/orders...');
  
  if (flags.dryRun) {
    log.warning(`[DRY RUN] Would delete ${stats.transactions.total} transactions`);
    return;
  }
  
  try {
    const result = await Transaction.deleteMany({});
    stats.transactions.deleted = result.deletedCount;
    log.success(`Deleted ${result.deletedCount} transactions/orders`);
  } catch (error) {
    log.error(`Failed to delete transactions: ${error.message}`);
    throw error;
  }
}

/**
 * Clean carts - delete all
 */
async function cleanCarts() {
  log.info('Processing carts...');
  
  if (flags.dryRun) {
    log.warning(`[DRY RUN] Would delete ${stats.carts.total} carts`);
    return;
  }
  
  try {
    const result = await Cart.deleteMany({});
    stats.carts.deleted = result.deletedCount;
    log.success(`Deleted ${result.deletedCount} carts`);
  } catch (error) {
    log.error(`Failed to delete carts: ${error.message}`);
    throw error;
  }
}

/**
 * Reset user purchase history
 */
async function cleanUserPurchaseHistory() {
  log.info('Cleaning user purchase history...');
  
  if (flags.dryRun) {
    const usersWithHistory = await User.countDocuments({ 
      $or: [
        { purchase_history: { $exists: true, $ne: [] } },
        { total_spent: { $gt: 0 } }
      ]
    });
    log.warning(`[DRY RUN] Would clear purchase history for ${usersWithHistory} users`);
    return;
  }
  
  try {
    const result = await User.updateMany(
      {},
      {
        $set: {
          purchase_history: [],
          total_spent: 0,
          updated_at: new Date()
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      log.success(`Cleared purchase history for ${result.modifiedCount} users`);
    }
  } catch (error) {
    log.error(`Failed to clean user purchase history: ${error.message}`);
    throw error;
  }
}

/**
 * Display cleaning summary
 */
function displaySummary() {
  console.log('\n' + colors.green + '═══════════════════════════════════════════' + colors.reset);
  console.log(colors.bright + '         CLEANING COMPLETE' + colors.reset);
  console.log(colors.green + '═══════════════════════════════════════════' + colors.reset);
  
  console.log('\n📊 ' + colors.bright + 'Summary:' + colors.reset);
  console.log(`   • Watches updated: ${stats.watches.updated}/${stats.watches.total}`);
  console.log(`   • Bids deleted: ${stats.bids.deleted}/${stats.bids.total}`);
  console.log(`   • Transactions deleted: ${stats.transactions.deleted}/${stats.transactions.total}`);
  console.log(`   • Carts deleted: ${stats.carts.deleted}/${stats.carts.total}`);
  
  console.log('\n' + colors.green + '═══════════════════════════════════════════' + colors.reset + '\n');
}

/**
 * Main execution function
 */
async function main() {
  console.clear();
  console.log(colors.bright + colors.blue + '\n🧹 JUNO MARKETPLACE DATA CLEANER\n' + colors.reset);
  
  // Connect to database
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }
  
  try {
    // Get current statistics
    await getDataStats();
    
    // Check if dry run
    if (flags.dryRun) {
      log.warning('Running in DRY RUN mode - no data will be modified');
    }
    
    // Confirm with user unless force flag is set
    if (!flags.force && !flags.dryRun) {
      console.log(colors.yellow + '\n⚠️  WARNING: This will modify your database!' + colors.reset);
      console.log('The following operations will be performed:');
      console.log('  1. Set all watches to "active" status');
      console.log('  2. Delete all bids');
      console.log('  3. Delete all transactions/orders');
      console.log('  4. Delete all carts');
      console.log('  5. Clear user purchase history\n');
      
      const answer = await askQuestion(colors.bright + 'Are you sure you want to continue? (yes/no): ' + colors.reset);
      
      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        log.warning('Operation cancelled by user');
        process.exit(0);
      }
    }
    
    // Create backup if requested
    if (flags.backup && !flags.dryRun) {
      await createBackup();
    }
    
    // Perform cleaning operations
    console.log('\n' + colors.bright + 'Starting cleaning process...' + colors.reset + '\n');
    
    await cleanWatches();
    await cleanBids();
    await cleanTransactions();
    await cleanCarts();
    await cleanUserPurchaseHistory();
    
    // Display summary
    if (!flags.dryRun) {
      displaySummary();
    } else {
      console.log('\n' + colors.yellow + 'DRY RUN COMPLETE - No data was modified' + colors.reset + '\n');
    }
    
  } catch (error) {
    log.error(`Cleaning failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Close connections
    rl.close();
    await mongoose.connection.close();
    log.info('Database connection closed');
  }
}

// Run the script
main().catch(console.error);