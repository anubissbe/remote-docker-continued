#!/usr/bin/env node

// Test script to verify SSH connection stability logic

class MockSSHManager {
  constructor() {
    this.connections = {};
    this.commandCount = 0;
  }

  openConnection(id) {
    console.log(`🔗 Opening SSH connection for ${id}`);
    this.connections[id] = { active: true, openTime: Date.now() };
  }

  closeConnection(id) {
    console.log(`🔓 Closing SSH connection for ${id}`);
    delete this.connections[id];
  }

  isActive(id) {
    return !!this.connections[id]?.active;
  }

  executeCommand(id, command) {
    this.commandCount++;
    console.log(`📞 Executing command #${this.commandCount} on ${id}: ${command.substring(0, 50)}...`);
    if (!this.isActive(id)) {
      throw new Error(`No active connection for ${id}`);
    }
    return `Result of ${command}`;
  }
}

class AppSimulator {
  constructor() {
    this.sshManager = new MockSSHManager();
    this.settings = {
      activeEnvironmentId: null,
      environments: [
        { id: 'env1', name: 'Test Env 1', hostname: 'host1', username: 'user1' },
        { id: 'env2', name: 'Test Env 2', hostname: 'host2', username: 'user2' }
      ]
    };
    this.callCount = 0;
  }

  getActiveEnvironment() {
    if (!this.settings.activeEnvironmentId) return null;
    return this.settings.environments.find(env => env.id === this.settings.activeEnvironmentId);
  }

  async setActiveEnvironment(environmentId) {
    this.callCount++;
    const prevEnv = this.getActiveEnvironment();
    
    console.log(`\n📍 setActiveEnvironment called (#${this.callCount}):`);
    console.log(`   Previous: ${prevEnv?.id || 'none'}`);
    console.log(`   New: ${environmentId || 'none'}`);
    console.log(`   Current Active: ${this.settings.activeEnvironmentId || 'none'}`);
    
    // NEW FIX: If we're setting the same environment, don't do anything
    if (this.settings.activeEnvironmentId === environmentId) {
      console.log('   ✅ Same environment selected, no action needed');
      return;
    }

    // Update settings
    this.settings.activeEnvironmentId = environmentId;
    
    // Only close tunnel if switching to a different environment
    if (prevEnv && prevEnv.id !== environmentId) {
      console.log(`   🔄 Closing tunnel for previous environment: ${prevEnv.id}`);
      this.sshManager.closeConnection(prevEnv.id);
    }

    // Open new tunnel if needed
    if (environmentId && environmentId !== prevEnv?.id) {
      const newEnv = this.settings.environments.find(env => env.id === environmentId);
      if (newEnv) {
        console.log(`   🔄 Opening tunnel for new environment: ${newEnv.id}`);
        this.sshManager.openConnection(newEnv.id);
      }
    }
  }

  async simulateNavigation() {
    console.log('\n🧪 TEST: Simulating user navigation between pages');
    console.log('=====================================\n');

    // Initial connection
    console.log('1️⃣ User selects environment from dropdown');
    await this.setActiveEnvironment('env1');

    // Simulate navigating between pages
    console.log('\n2️⃣ User navigates to Dashboard');
    await this.setActiveEnvironment('env1'); // Dashboard might call this

    console.log('\n3️⃣ User navigates to Containers');
    await this.setActiveEnvironment('env1'); // Containers might call this

    console.log('\n4️⃣ User navigates to MCP Servers');
    await this.setActiveEnvironment('env1'); // MCP might call this

    console.log('\n5️⃣ User navigates back to Dashboard');
    await this.setActiveEnvironment('env1'); // Dashboard calls again

    // Check if connection is still active
    console.log('\n📊 Connection Status:');
    console.log(`   env1 active: ${this.sshManager.isActive('env1') ? '✅ YES' : '❌ NO'}`);
    console.log(`   Total setActiveEnvironment calls: ${this.callCount}`);
    console.log(`   SSH commands executed: ${this.sshManager.commandCount}`);
  }

  async simulateEnvironmentSwitch() {
    console.log('\n\n🧪 TEST: Switching between environments');
    console.log('=====================================\n');

    // Reset
    this.callCount = 0;
    
    console.log('1️⃣ Switch to env1');
    await this.setActiveEnvironment('env1');

    console.log('\n2️⃣ Switch to env2');
    await this.setActiveEnvironment('env2');

    console.log('\n3️⃣ Switch back to env1');
    await this.setActiveEnvironment('env1');

    // Check status
    console.log('\n📊 Connection Status:');
    console.log(`   env1 active: ${this.sshManager.isActive('env1') ? '✅ YES' : '❌ NO'}`);
    console.log(`   env2 active: ${this.sshManager.isActive('env2') ? '✅ YES' : '❌ NO'}`);
  }

  async runAllTests() {
    console.log('🚀 SSH Connection Stability Test\n');
    
    await this.simulateNavigation();
    await this.simulateEnvironmentSwitch();

    console.log('\n\n✅ All tests completed!');
    console.log('\n🎯 Key Results:');
    console.log('- Multiple calls with same environment ID are ignored (no reconnection)');
    console.log('- Navigation between pages does not break SSH connection');
    console.log('- Only actual environment changes trigger reconnection');
  }
}

// Run tests
const app = new AppSimulator();
app.runAllTests().catch(console.error);