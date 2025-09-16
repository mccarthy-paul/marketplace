#!/usr/bin/env node

/**
 * Comprehensive Test Data Cleanup Script with Watch Status Reset
 *
 * This script performs a comprehensive cleanup of test data while preserving users and watches,
 * AND additionally resets all watches to active status:
 * - Creates backups of all data before any changes
 * - Deletes ALL orders/transactions
 * - Deletes ALL bids
 * - Deletes ALL notifications
 * - Deletes ALL cart data
 * - Sets ALL watches to active status
 * - Keeps all users and watches intact (except status reset)
 *
 * Usage:
 *   node comprehensiveCleanupWithWatchReset.js           - Run with confirmations
 *   node comprehensiveCleanupWithWatchReset.js --force   - Skip confirmations
 *   node comprehensiveCleanupWithWatchReset.js --dry-run - Preview what will be cleaned
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
import Order from '../db/orderModel.js';
import Notification from '../db/notificationModel.js';
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
  dryRun: args.includes('--dry-run')
};

// Create backup directory
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `comprehensive-with-watch-reset-backup-${timestamp}.json`);

/**
 * Print colored console messages
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Create readline interface for user input
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Ask user for confirmation
 */
function askConfirmation(question) {
  return new Promise((resolve) => {
    const rl = createReadlineInterface();
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim() === 'yes' || answer.toLowerCase().trim() === 'y');
    });
  });
}

/**
 * Get count of documents in each collection and watch status breakdown
 */
async function getDataCounts() {
  const counts = {
    users: await User.countDocuments(),
    watches: await Watch.countDocuments(),
    bids: await Bid.countDocuments(),
    orders: await Order.countDocuments(),
    transactions: await Transaction.countDocuments(),
    notifications: await Notification.countDocuments(),
    carts: await Cart.countDocuments()
  };

  // Get watch status breakdown
  const watchStatusBreakdown = await Watch.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  counts.watchStatuses = {};
  watchStatusBreakdown.forEach(item => {
    counts.watchStatuses[item._id || 'undefined'] = item.count;
  });

  return counts;
}

/**
 * Create backup of all data
 */
async function createBackup() {
  log('\n📦 Creating comprehensive backup...', 'yellow');

  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      collections: {}
    };

    // Backup all collections (including ones we keep)
    log('  → Backing up users...', 'cyan');
    backupData.collections.users = await User.find({}).lean();

    log('  → Backing up watches (including current status)...', 'cyan');
    backupData.collections.watches = await Watch.find({}).lean();

    log('  → Backing up bids...', 'cyan');
    backupData.collections.bids = await Bid.find({}).lean();

    log('  → Backing up orders...', 'cyan');
    backupData.collections.orders = await Order.find({}).lean();

    log('  → Backing up transactions...', 'cyan');
    backupData.collections.transactions = await Transaction.find({}).lean();

    log('  → Backing up notifications...', 'cyan');
    backupData.collections.notifications = await Notification.find({}).lean();

    log('  → Backing up carts...', 'cyan');
    backupData.collections.carts = await Cart.find({}).lean();

    // Write backup to file
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    log(`✅ Backup created successfully: ${backupPath}`, 'green');

    return backupData.collections;
  } catch (error) {
    log(`❌ Failed to create backup: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Display what will be cleaned and updated
 */
function displayCleanupPlan(counts) {
  log('\n🧹 CLEANUP & RESET PLAN:', 'bright');
  log('========================', 'bright');
  log(`📋 Collections to be COMPLETELY CLEARED:`, 'yellow');
  log(`   • Bids: ${counts.bids} documents`, 'red');
  log(`   • Orders: ${counts.orders} documents`, 'red');
  log(`   • Transactions: ${counts.transactions} documents`, 'red');
  log(`   • Notifications: ${counts.notifications} documents`, 'red');
  log(`   • Carts: ${counts.carts} documents`, 'red');

  log(`\n📋 Collections to be PRESERVED:`, 'green');
  log(`   • Users: ${counts.users} documents`, 'green');

  log(`\n📋 Collections to be UPDATED:`, 'magenta');
  log(`   • Watches: ${counts.watches} documents (status reset to 'active')`, 'magenta');

  log(`\n📊 Current Watch Status Breakdown:`, 'cyan');
  Object.entries(counts.watchStatuses).forEach(([status, count]) => {
    log(`   • ${status}: ${count} watches`, 'cyan');
  });

  const totalToDelete = counts.bids + counts.orders + counts.transactions + counts.notifications + counts.carts;
  log(`\n📊 SUMMARY:`, 'bright');
  log(`   • Total documents to delete: ${totalToDelete}`, 'red');
  log(`   • Total documents to preserve: ${counts.users}`, 'green');
  log(`   • Total watches to reset status: ${counts.watches}`, 'magenta');
}

/**
 * Reset all watches to active status
 */
async function resetWatchStatuses() {
  log('\n🔄 Resetting all watches to active status...', 'yellow');

  try {
    const result = await Watch.updateMany(
      {}, // Match all watches
      {
        $set: {
          status: 'active',
          updated_at: new Date()
        }
      }
    );

    log(`    ✅ Updated ${result.modifiedCount} watches to active status`, 'green');
    return result.modifiedCount;
  } catch (error) {
    log(`❌ Error resetting watch statuses: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Perform the actual cleanup
 */
async function performCleanup() {
  log('\n🗑️  Starting cleanup operations...', 'yellow');
  const results = {};

  try {
    // Delete bids
    log('  → Deleting all bids...', 'cyan');
    const bidResult = await Bid.deleteMany({});
    results.bids = bidResult.deletedCount;
    log(`    ✅ Deleted ${bidResult.deletedCount} bids`, 'green');

    // Delete orders
    log('  → Deleting all orders...', 'cyan');
    const orderResult = await Order.deleteMany({});
    results.orders = orderResult.deletedCount;
    log(`    ✅ Deleted ${orderResult.deletedCount} orders`, 'green');

    // Delete transactions
    log('  → Deleting all transactions...', 'cyan');
    const transactionResult = await Transaction.deleteMany({});
    results.transactions = transactionResult.deletedCount;
    log(`    ✅ Deleted ${transactionResult.deletedCount} transactions`, 'green');

    // Delete notifications
    log('  → Deleting all notifications...', 'cyan');
    const notificationResult = await Notification.deleteMany({});
    results.notifications = notificationResult.deletedCount;
    log(`    ✅ Deleted ${notificationResult.deletedCount} notifications`, 'green');

    // Delete carts
    log('  → Deleting all carts...', 'cyan');
    const cartResult = await Cart.deleteMany({});
    results.carts = cartResult.deletedCount;
    log(`    ✅ Deleted ${cartResult.deletedCount} carts`, 'green');

    // Reset watch statuses
    results.watchesUpdated = await resetWatchStatuses();

    return results;
  } catch (error) {
    log(`❌ Error during cleanup: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Verify cleanup results
 */
async function verifyCleanup() {
  log('\n🔍 Verifying cleanup results...', 'yellow');

  const finalCounts = await getDataCounts();

  log('  → Final collection counts:', 'cyan');
  log(`    • Users: ${finalCounts.users} (preserved)`, 'green');
  log(`    • Watches: ${finalCounts.watches} (preserved, status reset)`, 'green');
  log(`    • Bids: ${finalCounts.bids} (should be 0)`, finalCounts.bids === 0 ? 'green' : 'red');
  log(`    • Orders: ${finalCounts.orders} (should be 0)`, finalCounts.orders === 0 ? 'green' : 'red');
  log(`    • Transactions: ${finalCounts.transactions} (should be 0)`, finalCounts.transactions === 0 ? 'green' : 'red');
  log(`    • Notifications: ${finalCounts.notifications} (should be 0)`, finalCounts.notifications === 0 ? 'green' : 'red');
  log(`    • Carts: ${finalCounts.carts} (should be 0)`, finalCounts.carts === 0 ? 'green' : 'red');

  log(`\n  → Final Watch Status Breakdown:`, 'cyan');
  Object.entries(finalCounts.watchStatuses).forEach(([status, count]) => {
    const color = status === 'active' ? 'green' : 'yellow';
    log(`    • ${status}: ${count} watches`, color);
  });

  return finalCounts;
}

/**
 * Generate cleanup summary report
 */
function generateSummaryReport(initialCounts, deletionResults, finalCounts, backupPath) {
  const reportContent = `# Comprehensive Test Data Cleanup with Watch Status Reset Report

## Execution Details
- **Date**: ${new Date().toISOString()}
- **Script**: comprehensiveCleanupWithWatchReset.js
- **Backup Created**: ${backupPath}

## Initial State
- Users: ${initialCounts.users}
- Watches: ${initialCounts.watches}
- Bids: ${initialCounts.bids}
- Orders: ${initialCounts.orders}
- Transactions: ${initialCounts.transactions}
- Notifications: ${initialCounts.notifications}
- Carts: ${initialCounts.carts}

### Initial Watch Status Breakdown
${Object.entries(initialCounts.watchStatuses).map(([status, count]) => `- ${status}: ${count}`).join('\n')}

## Operations Performed
- Bids deleted: ${deletionResults.bids}
- Orders deleted: ${deletionResults.orders}
- Transactions deleted: ${deletionResults.transactions}
- Notifications deleted: ${deletionResults.notifications}
- Carts deleted: ${deletionResults.carts}
- Watches updated to active status: ${deletionResults.watchesUpdated}

## Final State (Verification)
- Users: ${finalCounts.users} (preserved)
- Watches: ${finalCounts.watches} (preserved, status reset)
- Bids: ${finalCounts.bids}
- Orders: ${finalCounts.orders}
- Transactions: ${finalCounts.transactions}
- Notifications: ${finalCounts.notifications}
- Carts: ${finalCounts.carts}

### Final Watch Status Breakdown
${Object.entries(finalCounts.watchStatuses).map(([status, count]) => `- ${status}: ${count}`).join('\n')}

## Summary
- **Total documents deleted**: ${Object.values(deletionResults).filter((_, key) => key !== 'watchesUpdated').reduce((sum, count) => sum + count, 0)}
- **Total documents preserved**: ${finalCounts.users + finalCounts.watches}
- **Total watches reset to active**: ${deletionResults.watchesUpdated}
- **Cleanup successful**: ${finalCounts.bids === 0 && finalCounts.orders === 0 && finalCounts.transactions === 0 && finalCounts.notifications === 0 && finalCounts.carts === 0 ? 'YES' : 'NO'}
- **Watch status reset successful**: ${(finalCounts.watchStatuses.active || 0) === finalCounts.watches ? 'YES' : 'NO'}

## Collections Status
- ✅ Users: Preserved as requested
- ✅ Watches: Preserved with status reset to active
- ${finalCounts.bids === 0 ? '✅' : '❌'} Bids: ${finalCounts.bids === 0 ? 'Completely cleared' : 'Some documents remain'}
- ${finalCounts.orders === 0 ? '✅' : '❌'} Orders: ${finalCounts.orders === 0 ? 'Completely cleared' : 'Some documents remain'}
- ${finalCounts.transactions === 0 ? '✅' : '❌'} Transactions: ${finalCounts.transactions === 0 ? 'Completely cleared' : 'Some documents remain'}
- ${finalCounts.notifications === 0 ? '✅' : '❌'} Notifications: ${finalCounts.notifications === 0 ? 'Completely cleared' : 'Some documents remain'}
- ${finalCounts.carts === 0 ? '✅' : '❌'} Carts: ${finalCounts.carts === 0 ? 'Completely cleared' : 'Some documents remain'}
- ${(finalCounts.watchStatuses.active || 0) === finalCounts.watches ? '✅' : '❌'} Watch Status Reset: ${(finalCounts.watchStatuses.active || 0) === finalCounts.watches ? 'All watches set to active' : 'Some watches may not be active'}
`;

  const reportPath = path.join(backupDir, `cleanup-with-watch-reset-report-${timestamp}.md`);
  fs.writeFileSync(reportPath, reportContent);

  log(`📊 Summary report created: ${reportPath}`, 'green');
  return reportPath;
}

/**
 * Main execution function
 */
async function main() {
  try {
    log('🚀 Comprehensive Test Data Cleanup with Watch Status Reset Script', 'bright');
    log('=================================================================', 'bright');

    // Connect to MongoDB
    log('\n📡 Connecting to MongoDB...', 'yellow');
    await mongoose.connect(process.env.MONGODB_URI);
    log('✅ Connected to MongoDB', 'green');

    // Get initial counts
    const initialCounts = await getDataCounts();

    // Display cleanup plan
    displayCleanupPlan(initialCounts);

    // Handle dry run
    if (flags.dryRun) {
      log('\n🔍 DRY RUN MODE - No changes will be made', 'yellow');
      log('This is what would be executed in a real run.', 'yellow');
      process.exit(0);
    }

    // Confirm with user (unless forced)
    if (!flags.force) {
      log('\n⚠️  WARNING: This will permanently delete test data and reset watch statuses!', 'red');
      log('A backup will be created before any changes.', 'yellow');

      const totalToDelete = initialCounts.bids + initialCounts.orders + initialCounts.transactions + initialCounts.notifications + initialCounts.carts;
      const totalWatchesToUpdate = initialCounts.watches;

      if (totalToDelete === 0 && totalWatchesToUpdate === 0) {
        log('\n✨ No test data found to clean and no watches to update. All target collections are already empty and no watches exist.', 'green');
        process.exit(0);
      }

      log(`\nOperations to be performed:`, 'yellow');
      log(`  • Delete ${totalToDelete} documents from test collections`, 'yellow');
      log(`  • Reset ${totalWatchesToUpdate} watches to active status`, 'yellow');

      const confirmed = await askConfirmation('\nDo you want to proceed? (yes/no): ');
      if (!confirmed) {
        log('❌ Operation cancelled by user.', 'yellow');
        process.exit(0);
      }
    }

    // Create backup
    await createBackup();

    // Perform cleanup
    const deletionResults = await performCleanup();

    // Verify results
    const finalCounts = await verifyCleanup();

    // Generate report
    const reportPath = generateSummaryReport(initialCounts, deletionResults, finalCounts, backupPath);

    log('\n🎉 Comprehensive cleanup with watch status reset completed successfully!', 'bright');
    log(`📦 Backup: ${backupPath}`, 'cyan');
    log(`📊 Report: ${reportPath}`, 'cyan');

    // Final summary
    log('\n📋 OPERATION SUMMARY:', 'bright');
    log(`✅ Deleted ${Object.values(deletionResults).reduce((sum, count, index) => index < 5 ? sum + count : sum, 0)} test documents`, 'green');
    log(`✅ Reset ${deletionResults.watchesUpdated} watches to active status`, 'green');
    log(`✅ Preserved ${finalCounts.users} users`, 'green');
    log(`✅ Preserved ${finalCounts.watches} watches (with status reset)`, 'green');

  } catch (error) {
    log(`\n❌ Script failed: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log('\n🔌 Disconnected from MongoDB', 'cyan');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  log('\n\n🛑 Script interrupted by user', 'yellow');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the script
main();