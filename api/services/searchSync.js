import Watch from '../db/watchModel.js';
import { indexWatch, bulkIndexWatches, updateWatch, deleteWatch, initializeIndex } from './opensearch.js';

// Set up MongoDB change streams for real-time sync
export function setupRealtimeSync() {
  console.log('Setting up OpenSearch real-time synchronization...');

  const changeStream = Watch.watch([], {
    fullDocument: 'updateLookup'
  });

  changeStream.on('change', async (change) => {
    try {
      switch (change.operationType) {
        case 'insert':
          console.log('Indexing new watch:', change.fullDocument._id);
          // Populate owner data before indexing
          const newWatch = await Watch.findById(change.fullDocument._id).populate('owner');
          await indexWatch(newWatch);
          break;

        case 'update':
        case 'replace':
          console.log('Updating watch in index:', change.documentKey._id);
          const updatedWatch = await Watch.findById(change.documentKey._id).populate('owner');
          if (updatedWatch) {
            await indexWatch(updatedWatch);
          }
          break;

        case 'delete':
          console.log('Removing watch from index:', change.documentKey._id);
          await deleteWatch(change.documentKey._id.toString());
          break;
      }
    } catch (error) {
      console.error('Error syncing change to OpenSearch:', error);
    }
  });

  changeStream.on('error', (error) => {
    console.error('Change stream error:', error);
    // Attempt to restart the change stream after a delay
    setTimeout(() => setupRealtimeSync(), 5000);
  });

  return changeStream;
}

// Perform initial bulk sync of all watches
export async function performInitialSync() {
  try {
    console.log('Starting initial OpenSearch sync...');

    // Initialize index
    await initializeIndex();

    // Get total count
    const totalCount = await Watch.countDocuments({ status: 'active' });
    console.log(`Found ${totalCount} active watches to sync`);

    // Process in batches to avoid memory issues
    const batchSize = 100;
    let processed = 0;

    for (let skip = 0; skip < totalCount; skip += batchSize) {
      const watches = await Watch.find({ status: 'active' })
        .skip(skip)
        .limit(batchSize)
        .populate('owner')
        .lean();

      if (watches.length > 0) {
        await bulkIndexWatches(watches);
        processed += watches.length;
        console.log(`Synced ${processed}/${totalCount} watches`);
      }
    }

    console.log('Initial sync completed successfully');
    return { success: true, synced: processed };
  } catch (error) {
    console.error('Error during initial sync:', error);
    throw error;
  }
}

// Sync specific watches (useful for batch updates)
export async function syncSpecificWatches(watchIds) {
  try {
    const watches = await Watch.find({
      _id: { $in: watchIds }
    }).populate('owner').lean();

    if (watches.length > 0) {
      await bulkIndexWatches(watches);
    }

    return { success: true, synced: watches.length };
  } catch (error) {
    console.error('Error syncing specific watches:', error);
    throw error;
  }
}

// Verify sync status between MongoDB and OpenSearch
export async function verifySyncStatus() {
  try {
    const mongoCount = await Watch.countDocuments({ status: 'active' });

    // Get OpenSearch count
    const { Client } = await import('@opensearch-project/opensearch');
    const client = new Client({
      node: process.env.OPENSEARCH_URL || 'https://localhost:9200',
      auth: {
        username: process.env.OPENSEARCH_USERNAME || 'admin',
        password: process.env.OPENSEARCH_PASSWORD || 'Admin123!'
      },
      ssl: {
        rejectUnauthorized: false
      }
    });

    const osResponse = await client.count({
      index: 'watches',
      body: {
        query: {
          term: { status: 'active' }
        }
      }
    });

    const osCount = osResponse.body.count;

    return {
      inSync: mongoCount === osCount,
      mongoCount,
      opensearchCount: osCount,
      difference: Math.abs(mongoCount - osCount)
    };
  } catch (error) {
    console.error('Error verifying sync status:', error);
    throw error;
  }
}

// Re-index all watches (useful for schema changes)
export async function reindexAllWatches() {
  try {
    console.log('Starting complete reindex...');

    // Delete and recreate index
    const { Client } = await import('@opensearch-project/opensearch');
    const client = new Client({
      node: process.env.OPENSEARCH_URL || 'https://localhost:9200',
      auth: {
        username: process.env.OPENSEARCH_USERNAME || 'admin',
        password: process.env.OPENSEARCH_PASSWORD || 'Admin123!'
      },
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Check if index exists and delete it
    const exists = await client.indices.exists({ index: 'watches' });
    if (exists.body) {
      await client.indices.delete({ index: 'watches' });
      console.log('Deleted existing index');
    }

    // Recreate index and sync all data
    await performInitialSync();

    return { success: true, message: 'Reindex completed' };
  } catch (error) {
    console.error('Error during reindex:', error);
    throw error;
  }
}

// Update search metrics (view count, etc.)
export async function updateSearchMetrics(watchId, metrics) {
  try {
    await updateWatch(watchId, {
      metrics: {
        view_count: metrics.viewCount,
        bid_count: metrics.bidCount,
        favorite_count: metrics.favoriteCount,
        inquiry_count: metrics.inquiryCount
      }
    });
  } catch (error) {
    console.error('Error updating search metrics:', error);
  }
}

export default {
  setupRealtimeSync,
  performInitialSync,
  syncSpecificWatches,
  verifySyncStatus,
  reindexAllWatches,
  updateSearchMetrics
};