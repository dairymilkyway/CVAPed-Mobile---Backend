/**
 * Test script to verify prescriptive analysis endpoints
 * Run with: node test-prescriptive.js
 */

const axios = require('axios');

const THERAPY_SERVICE_URL = process.env.THERAPY_URL || 'http://127.0.0.1:5002';

async function testPrescriptiveEndpoint() {
  console.log('\n🧪 Testing Prescriptive Analysis Endpoint');
  console.log('='.repeat(60));
  
  try {
    // Test with a dummy user ID
    const userId = '60d5ec49f1b2c8a5e4f8b456'; // Replace with actual user ID
    
    console.log(`\n📡 Testing URL: ${THERAPY_SERVICE_URL}/api/therapy/prescriptive/${userId}`);
    console.log('⏳ Sending request...\n');
    
    const response = await axios.get(`${THERAPY_SERVICE_URL}/api/therapy/prescriptive/${userId}`, {
      timeout: 30000 // 30 second timeout
    });
    
    console.log('✅ Response received!');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    
    if (response.data.success) {
      console.log('\n📊 Prescriptive Analysis Data:');
      console.log('- Priorities:', response.data.data.priorities?.length || 0);
      console.log('- Weekly Schedule:', response.data.data.weekly_schedule?.length || 0, 'days');
      console.log('- Recommendations:', response.data.data.recommendations?.length || 0);
      console.log('- Insights:', response.data.data.insights?.length || 0);
      console.log('- Bottleneck Analysis:', response.data.data.bottleneck_analysis ? 'Yes' : 'No');
      console.log('- Optimal Sequence:', response.data.data.optimal_sequence?.length || 0, 'steps');
    }
    
    console.log('\n✅ Test PASSED - Endpoint is working!\n');
    
  } catch (error) {
    console.error('\n❌ Test FAILED');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Flask server is not running on port 5002');
      console.error('   Please start the server with: cd backend/therapy-exercises && python app.py');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.error('\n⚠️  Request timed out - server might be processing or stuck');
    } else if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    console.log('');
  }
}

// Run test
testPrescriptiveEndpoint();
