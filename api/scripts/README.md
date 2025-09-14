# Data Cleaning Scripts

This directory contains scripts for cleaning and resetting the Juno Marketplace database for testing purposes.

## 🧹 Available Scripts

### 1. Complete Data Cleaning (`cleanTestData.js`)

Comprehensive cleaning script that resets the entire database to a clean testing state.

**Operations performed:**
- ✅ Sets all watches to "active" status
- 🗑️ Deletes all bids
- 🗑️ Deletes all transactions/orders
- 🗑️ Deletes all carts
- 🧽 Clears user purchase history

**Usage:**
```bash
# Run with confirmation prompts
cd api
npm run clean:data

# Skip confirmations (careful!)
npm run clean:data:force

# Create backup before cleaning
npm run clean:data:backup

# Preview changes without modifying data
npm run clean:data:dry

# Force clean with automatic backup
npm run clean:all
```

### 2. Selective Data Cleaning (`cleanTestDataSelective.js`)

Interactive cleaning script with granular control over what to clean.

**Features:**
- 🎯 Select specific entities to clean
- 📊 View detailed statistics before cleaning
- 🎨 Beautiful CLI interface with tables
- ✨ Interactive mode with checkboxes

**Usage:**
```bash
# Interactive mode - select what to clean
npm run clean:selective

# Clean specific entities only
npm run clean:watches    # Only reset watches
npm run clean:bids       # Only delete bids
npm run clean:orders     # Only delete orders

# Combine with flags
npm run clean:selective -- --watches --bids --force
```

## 🛡️ Safety Features

Both scripts include multiple safety features:

1. **Confirmation Prompts**: Always asks for confirmation unless `--force` flag is used
2. **Dry Run Mode**: Preview changes without modifying data using `--dry-run`
3. **Backup Option**: Create JSON backups before cleaning with `--backup`
4. **Detailed Logging**: Color-coded output showing exactly what's being changed
5. **Statistics Display**: Shows current database state before cleaning

## 📁 Backups

When using the `--backup` flag, data is saved to:
```
api/backups/backup-[timestamp]/
├── watches.json
├── bids.json
├── transactions.json
├── carts.json
└── users.json
```

## ⚙️ Command Line Options

### Common Flags

| Flag | Description |
|------|-------------|
| `--force` | Skip confirmation prompts |
| `--backup` | Create backup before cleaning |
| `--dry-run` | Preview changes without modifying data |
| `--verbose` | Show detailed debug information |

### Selective Cleaning Flags

| Flag | Description |
|------|-------------|
| `--interactive` or `-i` | Launch interactive selection mode |
| `--watches` | Clean only watches |
| `--bids` | Clean only bids |
| `--orders` | Clean only orders/transactions |
| `--carts` | Clean only carts |
| `--users` | Clean only user purchase history |
| `--all` | Clean everything (default) |

## 🎯 Quick Commands

```bash
# Most common use cases
npm run clean:all         # Full reset with backup
npm run clean:data:dry    # Preview what will be cleaned
npm run clean:selective   # Choose what to clean interactively
```

## ⚠️ Warning

These scripts permanently modify your database. Always:
1. Use `--dry-run` first to preview changes
2. Create backups with `--backup` flag
3. Be extra careful with `--force` flag

## 🔧 Requirements

- Node.js 16+
- MongoDB connection configured in `.env`
- Required npm packages (automatically installed)

## 📝 Examples

### Example 1: Preview cleaning operation
```bash
npm run clean:data:dry
```
Shows what would be cleaned without making changes.

### Example 2: Clean with backup
```bash
npm run clean:data:backup
```
Creates backup, then cleans with confirmation prompts.

### Example 3: Interactive selective cleaning
```bash
npm run clean:selective
```
Opens interactive menu to select specific operations.

### Example 4: Quick reset for testing
```bash
npm run clean:all
```
Force cleans everything with automatic backup (no prompts).

## 🐛 Troubleshooting

**Issue: "Cannot connect to MongoDB"**
- Check your `.env` file has correct `MONGODB_URI`
- Ensure MongoDB is running

**Issue: "Missing dependencies"**
- Run `pnpm install` in the api directory

**Issue: "Permission denied"**
- Ensure you have write permissions for the backup directory

## 📊 What Gets Cleaned

| Entity | Action |
|--------|--------|
| **Watches** | Status → "active", Remove sold_to, reserved_by fields |
| **Bids** | Complete deletion |
| **Transactions** | Complete deletion |
| **Carts** | Complete deletion |
| **Users** | Clear purchase_history, Reset total_spent to 0 |

## 🔍 Database State Visualization

The scripts provide detailed visualization of your database state:

```
📊 Current Database State

┌───────────────┬──────────┬──────────────────────────────────────────────────┐
│ Entity        │ Total    │ Details                                          │
├───────────────┼──────────┼──────────────────────────────────────────────────┤
│ Watches       │ 156      │ Available: 89, Sold: 45, Pending: 22            │
│ Bids          │ 234      │ Offered: 120, Accepted: 80, Rejected: 34        │
│ Transactions  │ 67       │ Completed: 45, Pending: 22                      │
│ Carts         │ 34       │ With items: 28                                  │
│ Users         │ 189      │ With purchases: 67                              │
└───────────────┴──────────┴──────────────────────────────────────────────────┘
```

This helps you understand exactly what will be affected before proceeding.