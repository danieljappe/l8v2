const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    console.log(`\n🧪 Testing: ${method} ${endpoint}`);
    console.log('─'.repeat(50));
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response:`, JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.log(`❌ Error: ${data.error || 'Unknown error'}`);
    } else {
      console.log(`✅ Success: ${Array.isArray(data) ? data.length : 1} items returned`);
    }
    
  } catch (error) {
    console.log(`💥 Network Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  // Test basic endpoints
  await testEndpoint('/events');
  await testEndpoint('/artists');
  await testEndpoint('/venues');
  await testEndpoint('/gallery');
  
  // Test specific event
  await testEndpoint('/events/1');
  
  // Test contact form submission
  await testEndpoint('/contact', 'POST', {
    name: 'Test User',
    email: 'test@example.com',
    subject: 'Test Message',
    message: 'This is a test message from the debug script.'
  });
  
  console.log('\n🏁 API Tests Complete!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint }; 