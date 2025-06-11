#!/usr/bin/env node

// Test script showing the BROKEN behavior (without our fix)

class MockSSHManager {
  constructor() {
    this.connections = {};
    this.openCount = 0;
    this.closeCount = 0;
  }

  openConnection(id) {
    this.openCount++;
    console.log(`🔗 Opening SSH connection for ${id} (total opens: ${this.openCount})`);
    this.connections[id] = { active: true, openTime: Date.now() };
  }

  closeConnection(id) {
    this.closeCount++;
    console.log(`🔓 Closing SSH connection for ${id} (total closes: ${this.closeCount})`);
    delete this.connections[id];
  }

  isActive(id) {
    return !!this.connections[id]?.active;
  }
}

class BrokenAppSimulator {
  constructor() {
    this.sshManager = new MockSSHManager();
    this.settings = {
      activeEnvironmentId: null,
      environments: [
        { id: 'env1', name: 'Test Env 1', hostname: 'host1', username: 'user1' }
      ]
    };
    this.callCount = 0;
  }

  getActiveEnvironment() {
    if (!this.settings.activeEnvironmentId) return null;
    return this.settings.environments.find(env => env.id === this.settings.activeEnvironmentId);
  }

  async setActiveEnvironmentBROKEN(environmentId) {
    this.callCount++;
    const prevEnv = this.getActiveEnvironment();
    
    console.log(`\n📍 setActiveEnvironment called (#${this.callCount}):`);
    console.log(`   Previous: ${prevEnv?.id || 'none'}`);
    console.log(`   New: ${environmentId || 'none'}`);
    
    // BROKEN: No check for same environment - always proceeds!
    
    // Close previous tunnel
    if (prevEnv) {
      console.log(`   🔄 Closing tunnel for previous environment: ${prevEnv.id}`);
      this.sshManager.closeConnection(prevEnv.id);
    }

    // Update settings
    this.settings.activeEnvironmentId = environmentId;
    
    // Open new tunnel
    if (environmentId) {
      const newEnv = this.settings.environments.find(env => env.id === environmentId);
      if (newEnv) {
        console.log(`   🔄 Opening tunnel for new environment: ${newEnv.id}`);
        this.sshManager.openConnection(newEnv.id);
      }
    }
  }

  async simulateBrokenNavigation() {
    console.log('🚀 BROKEN SSH Connection Test (WITHOUT FIX)\n');
    console.log('🧪 TEST: Simulating navigation with broken logic');
    console.log('=====================================\n');

    // Initial connection
    console.log('1️⃣ User selects environment from dropdown');
    await this.setActiveEnvironmentBROKEN('env1');

    // Simulate navigating between pages
    console.log('\n2️⃣ User navigates to Dashboard');
    await this.setActiveEnvironmentBROKEN('env1'); // This will reconnect!

    console.log('\n3️⃣ User navigates to Containers');
    await this.setActiveEnvironmentBROKEN('env1'); // This will reconnect again!

    console.log('\n4️⃣ User navigates to MCP Servers');
    await this.setActiveEnvironmentBROKEN('env1'); // And again!

    // Show the problem
    console.log('\n❌ PROBLEM DEMONSTRATED:');
    console.log(`   Total setActiveEnvironment calls: ${this.callCount}`);
    console.log(`   Total SSH connections opened: ${this.sshManager.openCount}`);
    console.log(`   Total SSH connections closed: ${this.sshManager.closeCount}`);
    console.log(`\n   🚨 Each navigation caused a disconnect/reconnect cycle!`);
    console.log(`   🚨 This is why users experience "ssh connection gets broken"`);
  }
}

// Run broken test
const app = new BrokenAppSimulator();
app.simulateBrokenNavigation().catch(console.error);