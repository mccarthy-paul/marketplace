import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './db/index.js';
import Watch from './db/watchModel.js';
import User from './db/userModel.js';

const sampleWatches = [
  {
    brand: "Rolex",
    model: "Submariner Date",
    reference_number: "126610LV",
    description: "The iconic green Submariner, also known as the 'Hulk'. Features a green ceramic bezel and matching green dial. Excellent condition with box and papers.",
    year: 2020,
    condition: "Excellent",
    imageUrl: "/images/watches/watch1.jpg",
    currentBid: 15000,
    startingPrice: 12000
  },
  {
    brand: "Patek Philippe",
    model: "Nautilus",
    reference_number: "5711/1A-010",
    description: "The legendary stainless steel Nautilus with blue dial. One of the most sought-after luxury sports watches. Mint condition.",
    year: 2019,
    condition: "Mint",
    imageUrl: "/images/watches/watch2.jpg",
    currentBid: 85000,
    startingPrice: 75000
  },
  {
    brand: "Audemars Piguet",
    model: "Royal Oak",
    reference_number: "15202ST.OO.1240ST.01",
    description: "The classic Royal Oak Jumbo in stainless steel. Ultra-thin automatic movement with the iconic octagonal bezel.",
    year: 2021,
    condition: "Like New",
    imageUrl: "/images/watches/watch3.jpg",
    currentBid: 45000,
    startingPrice: 40000
  },
  {
    brand: "Omega",
    model: "Speedmaster Professional",
    reference_number: "310.30.42.50.01.001",
    description: "The legendary Moonwatch. Manual-wound chronograph with hesalite crystal. The watch worn on the moon.",
    year: 2022,
    condition: "Excellent",
    imageUrl: "/images/watches/watch4.jpg",
    currentBid: 3500,
    startingPrice: 3200
  },
  {
    brand: "Cartier",
    model: "Santos de Cartier",
    reference_number: "WSSA0009",
    description: "Large model in stainless steel with blue hands and Roman numerals. Classic dress watch excellence.",
    year: 2021,
    condition: "Very Good",
    imageUrl: "/images/watches/watch5.jpg",
    currentBid: 6800,
    startingPrice: 6000
  }
];

async function seedWatches() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Find a user to assign as seller (use your user)
    const seller = await User.findOne({ email: 'paul.mccarthy@badbeat.com' });
    
    if (!seller) {
      console.error('User not found. Please make sure you have logged in first.');
      process.exit(1);
    }

    console.log('Found seller:', seller.name);

    // Clear existing watches (optional)
    await Watch.deleteMany({});
    console.log('Cleared existing watches');

    // Add seller to each watch
    const watchesWithSeller = sampleWatches.map(watch => ({
      ...watch,
      seller: seller._id,
      owner: seller._id,
      created_at: new Date(),
      updated_at: new Date()
    }));

    // Insert sample watches
    const createdWatches = await Watch.insertMany(watchesWithSeller);
    console.log(`Added ${createdWatches.length} sample watches:`);
    
    createdWatches.forEach(watch => {
      console.log(`- ${watch.brand} ${watch.model} (${watch.reference_number}) - $${watch.currentBid}`);
    });

    console.log('\n✅ Sample watches added successfully!');
    console.log('You can now visit the marketplace to see these watches.');
    
  } catch (error) {
    console.error('Error seeding watches:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedWatches();