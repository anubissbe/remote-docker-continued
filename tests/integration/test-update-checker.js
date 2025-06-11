#!/usr/bin/env node

// Test the update checker logic

async function testUpdateChecker() {
  console.log('🚀 Testing Update Checker Logic\n');

  const CURRENT_VERSION = '1.0.21';
  
  // Simulate different version scenarios
  const testCases = [
    { current: '1.0.21', latest: '1.0.22', shouldUpdate: true, description: 'Patch update available' },
    { current: '1.0.21', latest: '1.1.0', shouldUpdate: true, description: 'Minor update available' },
    { current: '1.0.21', latest: '2.0.0', shouldUpdate: true, description: 'Major update available' },
    { current: '1.0.21', latest: '1.0.21', shouldUpdate: false, description: 'Same version (up to date)' },
    { current: '1.0.21', latest: '1.0.20', shouldUpdate: false, description: 'Older version available' },
    { current: '1.0.21', latest: '1.0.19', shouldUpdate: false, description: 'Much older version' },
  ];

  console.log('Version Comparison Tests:');
  console.log('========================\n');

  testCases.forEach(test => {
    const currentParts = test.current.split('.').map(n => parseInt(n, 10));
    const latestParts = test.latest.split('.').map(n => parseInt(n, 10));
    
    let isNewer = false;
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const current = currentParts[i] || 0;
      const latest = latestParts[i] || 0;
      if (latest > current) {
        isNewer = true;
        break;
      } else if (latest < current) {
        break;
      }
    }
    
    const result = isNewer === test.shouldUpdate ? '✅ PASS' : '❌ FAIL';
    console.log(`${result} ${test.description}`);
    console.log(`   Current: ${test.current} → Latest: ${test.latest}`);
    console.log(`   Should update: ${test.shouldUpdate}, Got: ${isNewer}\n`);
  });

  // Simulate Docker Hub API response
  console.log('\nDocker Hub API Simulation:');
  console.log('=========================\n');

  const mockDockerHubResponse = {
    results: [
      { name: 'latest', last_updated: '2024-01-10T10:00:00Z' },
      { name: '1.0.22', last_updated: '2024-01-10T09:00:00Z' },
      { name: '1.0.21', last_updated: '2024-01-09T10:00:00Z' },
      { name: '1.0.20', last_updated: '2024-01-08T10:00:00Z' },
      { name: 'main', last_updated: '2024-01-10T11:00:00Z' },
      { name: 'abc123def', last_updated: '2024-01-07T10:00:00Z' }, // commit hash
    ]
  };

  // Filter and sort versions
  const versionTags = mockDockerHubResponse.results
    .filter(tag => tag.name.match(/^\d+\.\d+(\.\d+)?$/))
    .sort((a, b) => {
      const versionA = a.name.split('.').map(n => parseInt(n, 10));
      const versionB = b.name.split('.').map(n => parseInt(n, 10));
      
      for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
        const numA = versionA[i] || 0;
        const numB = versionB[i] || 0;
        if (numA !== numB) return numB - numA;
      }
      return 0;
    });

  console.log('Filtered version tags:', versionTags.map(t => t.name));
  console.log('Latest version detected:', versionTags[0]?.name || 'none');
  
  // Test update command generation
  console.log('\n\nUpdate Command Generation:');
  console.log('=========================\n');
  
  const latestVersion = '1.0.22';
  const updateCommand = `docker extension update anubissbe/remote-docker:${latestVersion}`;
  console.log('Generated command:', updateCommand);
  
  console.log('\n✅ All tests completed!');
}

testUpdateChecker().catch(console.error);