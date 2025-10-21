// Test script for low stock notification system
const mongoose = require('mongoose');
const Cake = require('../models/cake');
require('dotenv').config();

async function testLowStockNotification() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bakelk');
    console.log('Connected to MongoDB');

    // Test 1: Create a new cake with low quantity (should trigger email)
    console.log('\n=== Test 1: Creating new cake with low quantity ===');
    const newCake = new Cake({
      productName: 'Test Chocolate Cake',
      description: 'A delicious chocolate cake for testing',
      qty: 3, // Below 5, should trigger email
      category: 'Chocolate',
      price: 25.99,
      toppings: [
        { name: 'Chocolate Chips', price: 2.50 },
        { name: 'Whipped Cream', price: 1.50 }
      ]
    });

    await newCake.save();
    console.log('✅ New cake created with low quantity - email should have been sent');

    // Test 2: Update existing cake to low quantity (should trigger email)
    console.log('\n=== Test 2: Updating existing cake to low quantity ===');
    const existingCake = await Cake.findOne({ productName: 'Test Chocolate Cake' });
    if (existingCake) {
      existingCake.qty = 2; // Update to below 5
      await existingCake.save();
      console.log('✅ Existing cake updated to low quantity - email should have been sent');
    }

    // Test 3: Update cake with quantity above 5 (should NOT trigger email)
    console.log('\n=== Test 3: Updating cake to normal quantity ===');
    if (existingCake) {
      existingCake.qty = 10; // Above 5, should NOT trigger email
      await existingCake.save();
      console.log('✅ Cake updated to normal quantity - no email should be sent');
    }

    // Test 4: Update cake from normal to low quantity (should trigger email)
    console.log('\n=== Test 4: Updating cake from normal to low quantity ===');
    if (existingCake) {
      existingCake.qty = 1; // From 10 to 1, should trigger email
      await existingCake.save();
      console.log('✅ Cake updated from normal to low quantity - email should have been sent');
    }

    // Clean up test data
    console.log('\n=== Cleaning up test data ===');
    await Cake.deleteOne({ productName: 'Test Chocolate Cake' });
    console.log('✅ Test cake deleted');

    console.log('\n🎉 All tests completed! Check your email (vihanga.laksahan@gmail.com) for notifications.');
    console.log('Note: Make sure MAIL_USER and MAIL_PASS are set in your .env file for emails to work.');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testLowStockNotification();
