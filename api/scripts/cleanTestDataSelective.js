#!/usr/bin/env node

/**
 * Selective Data Cleaning Script
 * 
 * Provides granular control over what data to clean
 * 
 * Usage:
 *   npm run clean:selective -- --watches    - Only reset watches
 *   npm run clean:selective -- --bids       - Only delete bids
 *   npm run clean:selective -- --orders     - Only delete orders
 *   npm run clean:selective -- --carts      - Only delete carts
 *   npm run clean:selective -- --all        - Clean everything (default)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';

// Import models
import Watch from '../db/watchModel.js';
import Bid from '../db/bidModel.js';
import Transaction from '../db/transactionModel.js';
import Cart from '../db/cartModel.js';
import User from '../db/userModel.js';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  watches: args.includes('--watches'),
  bids: args.includes('--bids'),
  orders: args.includes('--orders'),
  carts: args.includes('--carts'),
  users: args.includes('--users'),
  all: args.includes('--all') || args.length === 0,
  interactive: args.includes('--interactive') || args.includes('-i'),
  force: args.includes('--force') || args.includes('-f'),
  dryRun: args.includes('--dry-run'),
  backup: args.includes('--backup')
};

// If no specific options selected, enable all
if (!options.watches && !options.bids && !options.orders && !options.carts && !options.users && !options.all) {
  options.all = true;
}

/**
 * Connect to MongoDB
 */
async function connectDB() {
  const spinner = ora('Connecting to MongoDB...').start();
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/junoauth';
    await mongoose.connect(mongoUri);
    spinner.succeed(`Connected to MongoDB`);
    return true;
  } catch (error) {
    spinner.fail(`Failed to connect: ${error.message}`);
    return false;
  }
}

/**
 * Get comprehensive data statistics
 */
async function getDataStatistics() {
  const spinner = ora('Analyzing database...').start();
  
  try {
    const stats = {
      watches: {
        total: await Watch.countDocuments(),
        available: await Watch.countDocuments({ status: 'available' }),
        sold: await Watch.countDocuments({ status: 'sold' }),
        pending: await Watch.countDocuments({ status: 'pending' }),
        reserved: await Watch.countDocuments({ status: 'reserved' })
      },
      bids: {
        total: await Bid.countDocuments(),
        offered: await Bid.countDocuments({ status: 'offered' }),
        accepted: await Bid.countDocuments({ status: 'accepted' }),
        rejected: await Bid.countDocuments({ status: 'rejected' }),
        cancelled: await Bid.countDocuments({ status: 'cancelled' })
      },
      transactions: {
        total: await Transaction.countDocuments(),
        completed: await Transaction.countDocuments({ status: 'completed' }),
        pending: await Transaction.countDocuments({ status: 'pending' }),
        cancelled: await Transaction.countDocuments({ status: 'cancelled' })
      },
      carts: {
        total: await Cart.countDocuments(),
        withItems: await Cart.countDocuments({ 'items.0': { $exists: true } })
      },
      users: {
        total: await User.countDocuments(),
        withPurchases: await User.countDocuments({ 
          purchase_history: { $exists: true, $ne: [] } 
        })
      }
    };
    
    spinner.succeed('Database analysis complete');
    return stats;
  } catch (error) {
    spinner.fail(`Analysis failed: ${error.message}`);
    throw error;
  }
}

/**
 * Display statistics in a table
 */
function displayStatistics(stats) {
  console.log(chalk.bold.cyan('\n📊 Current Database State\n'));
  
  // Create table
  const table = new Table({
    head: ['Entity', 'Total', 'Details'],
    colWidths: [15, 10, 50],
    style: { head: ['cyan'] }
  });
  
  // Add rows
  table.push(
    ['Watches', stats.watches.total, 
      `Available: ${stats.watches.available}, Sold: ${stats.watches.sold}, Pending: ${stats.watches.pending}`],
    ['Bids', stats.bids.total,
      `Offered: ${stats.bids.offered}, Accepted: ${stats.bids.accepted}, Rejected: ${stats.bids.rejected}`],
    ['Transactions', stats.transactions.total,
      `Completed: ${stats.transactions.completed}, Pending: ${stats.transactions.pending}`],
    ['Carts', stats.carts.total,
      `With items: ${stats.carts.withItems}`],
    ['Users', stats.users.total,
      `With purchases: ${stats.users.withPurchases}`]
  );
  
  console.log(table.toString());
}

/**
 * Interactive mode - let user select what to clean
 */
async function getInteractiveOptions() {
  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'operations',
      message: 'Select operations to perform:',
      choices: [
        { name: 'Reset all watches to active', value: 'watches', checked: true },
        { name: 'Delete all bids', value: 'bids', checked: true },
        { name: 'Delete all transactions/orders', value: 'orders', checked: true },
        { name: 'Delete all carts', value: 'carts', checked: true },
        { name: 'Clear user purchase history', value: 'users', checked: true }
      ]
    },
    {
      type: 'confirm',
      name: 'backup',
      message: 'Create backup before cleaning?',
      default: true
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to proceed?',
      default: false
    }
  ]);
  
  return answers;
}

/**
 * Clean operations
 */
const cleanOperations = {
  async watches() {
    const spinner = ora('Resetting watches...').start();
    try {
      if (options.dryRun) {
        const count = await Watch.countDocuments({ status: { $ne: 'active' } });
        spinner.info(`[DRY RUN] Would reset ${count} watches`);
        return { operation: 'watches', affected: count, dryRun: true };
      }
      
      const result = await Watch.updateMany(
        {},
        { 
          $set: { 
            status: 'active',
            updated_at: new Date()
          },
          $unset: { 
            sold_to: '',
            reserved_by: '',
            reserved_until: ''
          }
        }
      );
      
      spinner.succeed(`Reset ${result.modifiedCount} watches to active`);
      return { operation: 'watches', affected: result.modifiedCount };
    } catch (error) {
      spinner.fail(`Failed to reset watches: ${error.message}`);
      throw error;
    }
  },
  
  async bids() {
    const spinner = ora('Deleting bids...').start();
    try {
      if (options.dryRun) {
        const count = await Bid.countDocuments();
        spinner.info(`[DRY RUN] Would delete ${count} bids`);
        return { operation: 'bids', affected: count, dryRun: true };
      }
      
      const result = await Bid.deleteMany({});
      spinner.succeed(`Deleted ${result.deletedCount} bids`);
      return { operation: 'bids', affected: result.deletedCount };
    } catch (error) {
      spinner.fail(`Failed to delete bids: ${error.message}`);
      throw error;
    }
  },
  
  async orders() {
    const spinner = ora('Deleting transactions/orders...').start();
    try {
      if (options.dryRun) {
        const count = await Transaction.countDocuments();
        spinner.info(`[DRY RUN] Would delete ${count} transactions`);
        return { operation: 'orders', affected: count, dryRun: true };
      }
      
      const result = await Transaction.deleteMany({});
      spinner.succeed(`Deleted ${result.deletedCount} transactions`);
      return { operation: 'orders', affected: result.deletedCount };
    } catch (error) {
      spinner.fail(`Failed to delete transactions: ${error.message}`);
      throw error;
    }
  },
  
  async carts() {
    const spinner = ora('Deleting carts...').start();
    try {
      if (options.dryRun) {
        const count = await Cart.countDocuments();
        spinner.info(`[DRY RUN] Would delete ${count} carts`);
        return { operation: 'carts', affected: count, dryRun: true };
      }
      
      const result = await Cart.deleteMany({});
      spinner.succeed(`Deleted ${result.deletedCount} carts`);
      return { operation: 'carts', affected: result.deletedCount };
    } catch (error) {
      spinner.fail(`Failed to delete carts: ${error.message}`);
      throw error;
    }
  },
  
  async users() {
    const spinner = ora('Clearing user purchase history...').start();
    try {
      if (options.dryRun) {
        const count = await User.countDocuments({ 
          purchase_history: { $exists: true, $ne: [] } 
        });
        spinner.info(`[DRY RUN] Would clear history for ${count} users`);
        return { operation: 'users', affected: count, dryRun: true };
      }
      
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
      
      spinner.succeed(`Cleared purchase history for ${result.modifiedCount} users`);
      return { operation: 'users', affected: result.modifiedCount };
    } catch (error) {
      spinner.fail(`Failed to clear user history: ${error.message}`);
      throw error;
    }
  }
};

/**
 * Create data backup
 */
async function createBackup() {
  const spinner = ora('Creating backup...').start();
  
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'backups', `backup-${timestamp}`);
    
    // Create backup directory
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Backup collections
    const collections = [
      { model: Watch, name: 'watches' },
      { model: Bid, name: 'bids' },
      { model: Transaction, name: 'transactions' },
      { model: Cart, name: 'carts' },
      { model: User, name: 'users' }
    ];
    
    for (const { model, name } of collections) {
      const data = await model.find({}).lean();
      const filePath = path.join(backupDir, `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
    
    spinner.succeed(`Backup created at: ${backupDir}`);
    return backupDir;
  } catch (error) {
    spinner.fail(`Backup failed: ${error.message}`);
    throw error;
  }
}

/**
 * Display summary of operations
 */
function displaySummary(results) {
  console.log(chalk.bold.green('\n✨ Cleaning Complete\n'));
  
  const table = new Table({
    head: ['Operation', 'Records Affected', 'Status'],
    colWidths: [25, 20, 15],
    style: { head: ['green'] }
  });
  
  results.forEach(result => {
    table.push([
      result.operation,
      result.affected.toString(),
      result.dryRun ? chalk.yellow('DRY RUN') : chalk.green('✓')
    ]);
  });
  
  console.log(table.toString());
}

/**
 * Main execution
 */
async function main() {
  console.clear();
  console.log(chalk.bold.blue(`
╔═══════════════════════════════════════╗
║   JUNO MARKETPLACE DATA CLEANER       ║
║   Selective Cleaning Tool             ║
╚═══════════════════════════════════════╝
  `));
  
  // Connect to database
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }
  
  try {
    // Get and display current statistics
    const stats = await getDataStatistics();
    displayStatistics(stats);
    
    // Handle interactive mode
    let selectedOps = [];
    if (options.interactive) {
      const answers = await getInteractiveOptions();
      if (!answers.confirm) {
        console.log(chalk.yellow('\n❌ Operation cancelled'));
        process.exit(0);
      }
      selectedOps = answers.operations;
      options.backup = answers.backup;
    } else {
      // Determine which operations to run
      if (options.all) {
        selectedOps = ['watches', 'bids', 'orders', 'carts', 'users'];
      } else {
        if (options.watches) selectedOps.push('watches');
        if (options.bids) selectedOps.push('bids');
        if (options.orders) selectedOps.push('orders');
        if (options.carts) selectedOps.push('carts');
        if (options.users) selectedOps.push('users');
      }
      
      // Confirm unless force flag
      if (!options.force && !options.dryRun && selectedOps.length > 0) {
        console.log(chalk.yellow('\n⚠️  Warning: This will modify your database!'));
        console.log('Operations to perform:', selectedOps.join(', '));
        
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: 'Continue?',
          default: false
        }]);
        
        if (!confirm) {
          console.log(chalk.yellow('\n❌ Operation cancelled'));
          process.exit(0);
        }
      }
    }
    
    // Create backup if requested
    if (options.backup && !options.dryRun) {
      await createBackup();
    }
    
    // Execute selected operations
    console.log(chalk.bold.cyan('\n🔧 Executing operations...\n'));
    
    const results = [];
    for (const op of selectedOps) {
      if (cleanOperations[op]) {
        const result = await cleanOperations[op]();
        results.push(result);
      }
    }
    
    // Display summary
    displaySummary(results);
    
    if (options.dryRun) {
      console.log(chalk.yellow('\n📝 DRY RUN - No actual changes were made'));
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log(chalk.dim('\n👋 Database connection closed'));
  }
}

// Check if required packages are installed
async function checkDependencies() {
  try {
    await import('inquirer');
    await import('ora');
    await import('chalk');
    await import('cli-table3');
  } catch (error) {
    console.error('Missing dependencies. Please run:');
    console.error('npm install inquirer ora chalk cli-table3');
    process.exit(1);
  }
}

// Run the script
checkDependencies().then(() => main()).catch(console.error);