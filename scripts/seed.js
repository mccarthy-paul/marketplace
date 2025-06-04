import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Watch from '../api/db/watchModel.js'; // Adjust path if necessary

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../api/.env') });

const imageFiles = [
  '/images/watch1.jpg',
  '/images/watch2.jpg',
  '/images/watch3.jpg',
  '/images/watch4.jpg',
  '/images/watch5.jpg',
];

const sampleWatches = [
  {
    brand: 'Rolex',
    model: 'Submariner',
    reference_number: '116610LN',
    description: 'A classic dive watch.',
    year: 2020,
    condition: 'Used - Excellent',
    imageUrl: imageFiles[Math.floor(Math.random() * imageFiles.length)]
  },
  {
    brand: 'Omega',
    model: 'Speedmaster Professional',
    reference_number: '311.30.42.30.01.005',
    description: 'The Moonwatch.',
    year: 2019,
    condition: 'Used - Good',
    imageUrl: imageFiles[Math.floor(Math.random() * imageFiles.length)]
  },
  {
    brand: 'Patek Philippe',
    model: 'Nautilus',
    reference_number: '5711/1A-010',
    description: 'A highly sought-after sport watch.',
    year: 2021,
    condition: 'New',
    imageUrl: imageFiles[Math.floor(Math.random() * imageFiles.length)]
  },
  {
    brand: 'Audemars Piguet',
    model: 'Royal Oak',
    reference_number: '15500ST.OO.1220ST.01',
    description: 'An iconic luxury sport watch.',
    year: 2022,
    condition: 'New',
    imageUrl: imageFiles[Math.floor(Math.random() * imageFiles.length)]
  },
  {
    brand: 'Cartier',
    model: 'Tank Must',
    reference_number: 'WSTA0042',
    description: 'A timeless and elegant dress watch.',
    year: 2023,
    condition: 'New',
    imageUrl: imageFiles[Math.floor(Math.random() * imageFiles.length)]
  },
  {
    brand: 'TAG Heuer',
    model: 'Carrera',
    reference_number: 'CBN2A1A.BA0643',
    description: 'A sporty chronograph.',
    year: 2020,
    condition: 'Used - Excellent',
    imageUrl: imageFiles[Math.floor(Math.random() * imageFiles.length)]
  },
  {
    brand: 'Breitling',
    model: 'Navitimer',
    reference_number: 'AB0120121B1A1',
    description: 'A pilot\'s chronograph with a slide rule.',
    year: 2018,
    condition: 'Used - Good',
    imageUrl: imageFiles[Math.floor(Math.random() * imageFiles.length)]
  },
  {
    brand: 'IWC',
    model: 'Portugieser',
    reference_number: 'IW500710',
    description: 'A classic dress watch with a large case.',
    year: 2021,
    condition: 'New',
    imageUrl: imageFiles[Math.floor(Math.random() * imageFiles.length)]
  },
  {
    brand: 'Jaeger-LeCoultre',
    model: 'Reverso Classic',
    reference_number: 'Q2518412',
    description: 'A watch with a reversible case.',
    year: 2022,
    condition: 'New',
    imageUrl: imageFiles[Math.floor(Math.random() * imageFiles.length)]
  },
  {
    brand: 'Panerai',
    model: 'Luminor Marina',
    reference_number: 'PAM01312',
    description: 'A large and distinctive dive watch.',
    year: 2019,
    condition: 'Used - Excellent',
    imageUrl: imageFiles[Math.floor(Math.random() * imageFiles.length)]
  },
  {
    brand: 'Grand Seiko',
    model: 'Spring Drive Snowflake',
    reference_number: 'SBGA211',
    description: 'A watch with a unique dial texture and smooth seconds hand.',
    year: 2020,
    condition: 'Used - Good',
    imageUrl: imageFiles[Math.floor(Math.random() * imageFiles.length)]
  },
  {
    brand: 'Zenith',
    model: 'Chronomaster Open',
    reference_number: '03.2040.4061/69.C496',
    description: 'A chronograph with a view of the movement.',
    year: 2023,
    condition: 'New',
    imageUrl: imageFiles[Math.floor(Math.random() * imageFiles.length)]
  },
  {
    brand: 'Tudor',
    model: 'Black Bay Fifty-Eight',
    reference_number: '79030B',
    description: 'A vintage-inspired dive watch.',
    year: 2021,
    condition: 'Used - Excellent',
    imageUrl: imageFiles[Math.floor(Math.random() * imageFiles.length)]
  },
  {
    brand: 'Hublot',
    model: 'Big Bang',
    reference_number: '301.SX.130.RX',
    description: 'A bold and modern chronograph.',
    year: 2022,
    condition: 'New',
    imageUrl: imageFiles[Math.floor(Math.random() * imageFiles.length)]
  },
  {
    brand: 'Vacheron Constantin',
    model: 'Overseas',
    reference_number: '4500V/110A-B128',
    description: 'A versatile luxury sport watch.',
    year: 2023,
    condition: 'New',
    imageUrl: imageFiles[Math.floor(Math.random() * imageFiles.length)]
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for seeding');

    await Watch.deleteMany({}); // Clear existing data
    console.log('Existing watches cleared');

    sampleWatches.forEach(watch => {
      watch.price = Math.floor(Math.random() * (120000 - 80000 + 1)) + 80000;
    });

    await Watch.insertMany(sampleWatches);
    console.log('Sample watches added');

  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedDB();
