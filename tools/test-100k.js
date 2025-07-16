#!/usr/bin/env node

/**
 * Test script to generate 100k records for testing
 */

const { SmartDataGenerator } = require('./smart-data-generator.js');

async function generateLargeDataset() {
    console.log('🧪 Testing 100k Record Generation');
    console.log('This will generate a large dataset for testing purposes\n');
    
    const generator = new SmartDataGenerator();
    
    // Override the interactive setup for automated testing
    generator.config = {
        businessType: 'Technology',
        categories: ['Software Solutions', 'Hardware & Devices', 'Cloud Services', 'AI & Analytics', 'Cybersecurity'],
        products: [
            'Enterprise Software License', 'Cloud Computing Platform', 'AI Analytics Suite', 
            'Cybersecurity Package', 'Mobile App Development', 'Business Intelligence Tool',
            'Database Management System', 'Network Security Solution', 'IoT Platform',
            'DevOps Automation Tool', 'Customer CRM System', 'Project Management Software'
        ],
        months: 2, // 2 months
        recordsPerMonth: 50000, // 50k per month = 100k total
        outputFile: '../Sample Data/large_test_100k.csv'
    };
    
    console.log('📊 Configuration:');
    console.log(`   Business Type: ${generator.config.businessType}`);
    console.log(`   Months: ${generator.config.months}`);
    console.log(`   Records per month: ${generator.config.recordsPerMonth.toLocaleString()}`);
    console.log(`   Total records: ${(generator.config.months * generator.config.recordsPerMonth).toLocaleString()}`);
    console.log(`   Output file: ${generator.config.outputFile}\n`);
    
    const startTime = Date.now();
    
    try {
        // Call the generation process directly
        await generator.generateDataDirect();
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        console.log(`\n🎉 SUCCESS! Generated 100k records in ${duration.toFixed(2)} seconds`);
        console.log(`⚡ Rate: ${((100000 / duration)).toFixed(0)} records/second`);
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

// Run the test
generateLargeDataset();
