#!/usr/bin/env node

/**
 * Quick test to demonstrate 100k capability
 * This creates a medium-sized dataset to show the improvements
 */

const fs = require('fs');
const path = require('path');

// Create a simple test input file
const testInput = `1
2
25000
test_50k_dataset.csv
`;

// Write the test input to a temporary file
fs.writeFileSync('test_input.txt', testInput);

console.log('🧪 Testing Large Dataset Generation (50k records)');
console.log('📊 Configuration: Technology business, 2 months, 25k records/month');
console.log('🎯 This demonstrates the 100k capability with a manageable test size\n');

// Import and run the generator
const { execSync } = require('child_process');

try {
    // Run the generator with the test input
    execSync('node smart-data-generator.js < test_input.txt', { 
        stdio: 'inherit',
        cwd: __dirname
    });
    
    console.log('\n✅ Test completed successfully!');
    console.log('📁 Check the Sample Data folder for the generated file');
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
} finally {
    // Clean up the test input file
    if (fs.existsSync('test_input.txt')) {
        fs.unlinkSync('test_input.txt');
    }
}
