#!/usr/bin/env node

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { performInitialSync, setupRealtimeSync, verifySyncStatus } from '../services/searchSync.js';
import connectDB from '../db/index.js';

dotenv.config();

async function main() {
  try {
    console.log('🚀 OpenSearch Sync Script Starting...\n');

    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected\n');

    // Check current sync status
    console.log('🔍 Checking current sync status...');
    try {
      const status = await verifySyncStatus();
      console.log(`MongoDB watches: ${status.mongoCount}`);
      console.log(`OpenSearch watches: ${status.opensearchCount}`);
      console.log(`Difference: ${status.difference}`);
      console.log(`In sync: ${status.inSync ? 'Yes ✅' : 'No ❌'}\n`);
    } catch (error) {
      console.log('⚠️ Could not verify sync status (index might not exist yet)\n');
    }

    // Perform initial sync
    console.log('🔄 Starting initial data sync...');
    const result = await performInitialSync();
    console.log(`✅ Initial sync complete! Synced ${result.synced} watches\n`);

    // Set up real-time sync
    console.log('⚡ Setting up real-time synchronization...');
    const changeStream = setupRealtimeSync();
    console.log('✅ Real-time sync activated\n');

    // Verify final status
    console.log('🔍 Final sync status:');
    const finalStatus = await verifySyncStatus();
    console.log(`MongoDB watches: ${finalStatus.mongoCount}`);
    console.log(`OpenSearch watches: ${finalStatus.opensearchCount}`);
    console.log(`In sync: ${finalStatus.inSync ? 'Yes ✅' : 'No ❌'}\n`);

    console.log('🎉 OpenSearch synchronization complete!');
    console.log('   The change stream will continue running to sync future changes.');
    console.log('   Press Ctrl+C to stop.\n');

    // Keep the script running for real-time sync
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down sync service...');
      changeStream.close();
      mongoose.connection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error during sync:', error);
    process.exit(1);
  }
}

// Run the sync
main();