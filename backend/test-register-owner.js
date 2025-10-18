// Simple test script for register-owner endpoint
const fetch = require('node-fetch');

const testData = {
  user: {
    email: 'test@example.com',
    password: 'testpassword123',
    displayName: 'Test User'
  },
  organization: {
    name: 'Test Glass Company',
    companyType: 'Private Limited Company',
    industry: 'Glass Manufacturing',
    email: 'contact@testglass.com',
    phone: '+91 9876543210',
    address: {
      street: '123 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001'
    },
    description: 'A test glass manufacturing company'
  }
};

async function testRegisterOwner() {
  try {
    console.log('Testing register-owner endpoint...');
    console.log('Request data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3001/auth/register-owner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

testRegisterOwner();