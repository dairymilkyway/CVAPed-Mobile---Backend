const dns = require('dns');
const mongoose = require('mongoose');

const PUBLIC_DNS_SERVERS = ['8.8.8.8', '1.1.1.1'];

try {
  dns.setServers(PUBLIC_DNS_SERVERS);
  console.log('🔧 DNS servers set for MongoDB:', PUBLIC_DNS_SERVERS.join(', '));
} catch (error) {
  console.warn('⚠️ Could not override DNS servers for MongoDB:', error.message);
}

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('Missing MONGODB_URI');
    }

    console.log('🔌 Attempting to connect to MongoDB...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Hide password
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: process.env.NODE_ENV !== 'production'
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    
    return conn.connection.db; // Return database instance
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('Error Stack:', error.stack);
    process.exit(1);
  }
};

module.exports = connectDB;
