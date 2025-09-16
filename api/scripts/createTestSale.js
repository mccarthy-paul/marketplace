import mongoose from 'mongoose';
import Transaction from '../db/transactionModel.js';
import User from '../db/userModel.js';
import Watch from '../db/watchModel.js';

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/luxe24');

try {
  // Find broker1 user
  const broker1 = await User.findOne({ email: 'broker1@juno.com' });
  if (!broker1) {
    console.log('broker1 user not found');
    process.exit(1);
  }

  // Find another user to be the buyer
  const buyer = await User.findOne({ email: { $ne: 'broker1@juno.com' } });
  if (!buyer) {
    console.log('No other user found to be buyer');
    process.exit(1);
  }

  // Find or create a watch owned by broker1
  let watch = await Watch.findOne({ owner: broker1._id });
  if (!watch) {
    watch = await Watch.create({
      brand: 'Rolex',
      model: 'Submariner',
      reference_number: '126610LN',
      year: 2023,
      condition: 'Excellent',
      price: '15000',
      currency: 'USD',
      owner: broker1._id,
      listed_by: broker1._id,
      status: 'available',
      description: 'Test watch for sales chart'
    });
    console.log('Created test watch');
  }

  // Create a test transaction for today
  const transaction = await Transaction.create({
    applicationTransactionId: `TEST-${Date.now()}`,
    watch: watch._id,
    buyer: buyer._id,
    seller: broker1._id,
    buyerClientId: buyer.junoClientId || 'test-buyer-client',
    sellerClientId: broker1.junoClientId || 'test-seller-client',
    productName: `${watch.brand} ${watch.model}`,
    productCode: watch.reference_number,
    currency: 'USD',
    purchasePrice: '15000',
    shippingPrice: '50',
    totalPrice: '15050',
    buyerFee: '450',
    status: 'completed',
    buyerNote: 'Test transaction for sales chart',
    created_at: new Date(),
    updated_at: new Date()
  });

  console.log('Created test transaction:', transaction.applicationTransactionId);
  console.log('Seller:', broker1.email, '(ID:', broker1._id.toString(), ')');
  console.log('Buyer:', buyer.email, '(ID:', buyer._id.toString(), ')');
  console.log('Transaction status:', transaction.status);

  // Also create a few transactions from past days
  for (let i = 1; i <= 5; i++) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - i);

    await Transaction.create({
      applicationTransactionId: `TEST-PAST-${Date.now()}-${i}`,
      watch: watch._id,
      buyer: buyer._id,
      seller: broker1._id,
      buyerClientId: buyer.junoClientId || 'test-buyer-client',
      sellerClientId: broker1.junoClientId || 'test-seller-client',
      productName: `${watch.brand} ${watch.model}`,
      productCode: watch.reference_number,
      currency: 'USD',
      purchasePrice: (10000 + i * 1000).toString(),
      shippingPrice: '50',
      totalPrice: (10050 + i * 1000).toString(),
      buyerFee: '300',
      status: 'completed',
      created_at: pastDate,
      updated_at: pastDate
    });
    console.log(`Created transaction for ${pastDate.toDateString()}`);
  }

  console.log('\nTest sales data created successfully!');
  console.log('You should now see data in the Activity tab sales chart.');

} catch (error) {
  console.error('Error creating test sale:', error);
} finally {
  await mongoose.disconnect();
}