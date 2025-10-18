// Simple test script for admin users endpoint
const fetch = require('node-fetch');

async function testAdminUsers() {
  try {
    console.log('Testing admin users endpoint...');
    
    // You'll need to replace this with a valid token
    const token = 'your-jwt-token-here';
    const orgId = 'your-org-id-here';
    
    const response = await fetch('http://localhost:3001/api/v1/admin/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-org-id': orgId,
        'Content-Type': 'application/json',
      }
    });
    
    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      const users = JSON.parse(result);
      console.log('✅ Users fetched successfully!');
      console.log('Number of users:', users.length);
      
      // Check structure
      if (users.length > 0) {
        const firstUser = users[0];
        console.log('First user structure:', {
          hasId: !!firstUser.id,
          hasRole: !!firstUser.role,
          hasUser: !!firstUser.user,
          hasUserEmail: !!firstUser.user?.email,
          hasUserDisplayName: !!firstUser.user?.displayName
        });
      }
    } else {
      console.log('❌ Request failed');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Uncomment and add valid credentials to test
// testAdminUsers();