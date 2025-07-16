#!/usr/bin/env node
"use strict";
/**
 * Smart Sample Data Generator for Quant Commander
 * Uses AI to generate realistic business data based on user's industry
 * Enhanced version with intelligent product/category generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUSINESS_CATEGORIES = exports.SmartDataGenerator = void 0;
const path = require("path");
const csv_writer_1 = require("csv-writer");
const commander_1 = require("commander");
const readline = require("readline");
// Enhanced location data
const REGIONS = {
    'North America': {
        'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
        'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa', 'Edmonton', 'Mississauga', 'Winnipeg', 'Quebec City', 'Hamilton'],
        'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Zapopan', 'Nezahualcóyotl', 'Chihuahua']
    },
    'Europe': {
        'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Cardiff'],
        'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig'],
        'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille']
    },
    'Asia Pacific': {
        'Japan': ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kawasaki', 'Kyoto', 'Saitama'],
        'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong'],
        'Singapore': ['Central', 'East', 'North', 'Northeast', 'West']
    }
};
const CHANNELS = ['Online', 'Retail', 'Direct Sales', 'Partner', 'Wholesale', 'Mobile App'];
const BUSINESS_CATEGORIES = {
    'Technology': {
        description: 'Software, hardware, and digital services',
        categories: ['Software Solutions', 'Hardware & Devices', 'Cloud Services', 'AI & Analytics', 'Cybersecurity'],
        products: [
            'Enterprise Software License', 'Cloud Computing Platform', 'AI Analytics Suite', 'Cybersecurity Package', 'Mobile App Development',
            'Business Intelligence Tool', 'Database Management System', 'Network Security Solution', 'IoT Platform', 'DevOps Automation Tool',
            'Customer CRM System', 'Project Management Software', 'Video Conferencing Solution', 'API Management Platform', 'Machine Learning Framework'
        ]
    },
    'Healthcare': {
        description: 'Medical devices, pharmaceuticals, and health services',
        categories: ['Medical Devices', 'Pharmaceuticals', 'Diagnostic Equipment', 'Health Software', 'Wellness Products'],
        products: [
            'Digital Blood Pressure Monitor', 'Prescription Management System', 'MRI Scanner Software', 'Telemedicine Platform', 'Wellness Tracker Device',
            'Electronic Health Records', 'Medical Imaging Software', 'Patient Monitoring System', 'Pharmaceutical Inventory', 'Diagnostic Test Kit',
            'Surgical Equipment', 'Health Analytics Platform', 'Mental Health App', 'Fitness Tracking Device', 'Medical Consultation Service'
        ]
    },
    'Retail & E-commerce': {
        description: 'Consumer goods, fashion, and online marketplace',
        categories: ['Fashion & Apparel', 'Home & Living', 'Electronics & Gadgets', 'Sports & Outdoor', 'Beauty & Personal Care'],
        products: [
            'Premium Designer Jacket', 'Smart Home Lighting System', 'Wireless Bluetooth Headphones', 'Professional Hiking Backpack', 'Organic Skincare Set',
            'Luxury Watch Collection', 'Modern Furniture Set', 'Gaming Laptop Pro', 'Outdoor Camping Gear', 'Professional Makeup Kit',
            'Athletic Running Shoes', 'Smart Kitchen Appliances', 'High-End Camera Equipment', 'Fitness Equipment Set', 'Artisan Jewelry Collection'
        ]
    },
    'Financial Services': {
        description: 'Banking, insurance, and investment services',
        categories: ['Banking Solutions', 'Insurance Products', 'Investment Services', 'Payment Processing', 'Risk Management'],
        products: [
            'Digital Banking Platform', 'Life Insurance Policy', 'Investment Portfolio Management', 'Payment Gateway Service', 'Credit Risk Assessment Tool',
            'Mobile Banking App', 'Auto Insurance Coverage', 'Retirement Planning Service', 'Fraud Detection System', 'Compliance Management Software',
            'Wealth Management Platform', 'Property Insurance Package', 'Trading Analytics Tool', 'Digital Wallet Solution', 'Financial Planning Software'
        ]
    },
    'Manufacturing': {
        description: 'Industrial equipment, automotive, and production',
        categories: ['Industrial Equipment', 'Automotive Parts', 'Production Machinery', 'Quality Control', 'Supply Chain'],
        products: [
            'Automated Production Line', 'High-Performance Engine Component', 'CNC Machining Center', 'Quality Inspection System', 'Inventory Management Platform',
            'Industrial Robot System', 'Automotive Safety Module', 'Precision Manufacturing Tool', 'Process Control Software', 'Logistics Tracking System',
            'Heavy Machinery Equipment', 'Vehicle Diagnostic Tool', 'Assembly Line Component', 'Quality Assurance Software', 'Warehouse Management System'
        ]
    },
    'Education': {
        description: 'Learning platforms, educational content, and training',
        categories: ['Learning Management', 'Educational Content', 'Training Programs', 'Assessment Tools', 'Research Platforms'],
        products: [
            'Online Learning Platform', 'Interactive Course Content', 'Professional Certification Program', 'Student Assessment Tool', 'Academic Research Database',
            'Virtual Classroom Software', 'Educational Video Series', 'Skills Training Workshop', 'Exam Proctoring System', 'Library Management System',
            'Language Learning App', 'STEM Education Kit', 'Corporate Training Program', 'Student Information System', 'Educational Analytics Platform'
        ]
    },
    'Food & Beverage': {
        description: 'Food products, beverages, and restaurant services',
        categories: ['Premium Foods', 'Beverages', 'Restaurant Services', 'Food Technology', 'Catering Solutions'],
        products: [
            'Gourmet Food Collection', 'Craft Beer Selection', 'Fine Dining Experience', 'Food Delivery Platform', 'Corporate Catering Service',
            'Organic Produce Box', 'Specialty Coffee Blend', 'Restaurant POS System', 'Kitchen Equipment Solution', 'Event Catering Package',
            'Artisan Bakery Products', 'Premium Wine Collection', 'Food Safety Software', 'Recipe Management System', 'Nutrition Tracking App'
        ]
    },
    'Real Estate': {
        description: 'Property management, construction, and real estate services',
        categories: ['Property Management', 'Construction Services', 'Real Estate Technology', 'Facility Management', 'Investment Properties'],
        products: [
            'Property Management Software', 'Construction Project Management', 'Real Estate CRM Platform', 'Facility Maintenance Service', 'Commercial Property Investment',
            'Tenant Screening Service', 'Building Design Software', 'Property Listing Platform', 'Smart Building System', 'Real Estate Analytics Tool',
            'Lease Management System', 'Construction Equipment Rental', 'Virtual Property Tours', 'Energy Management Solution', 'Property Valuation Service'
        ]
    }
};
exports.BUSINESS_CATEGORIES = BUSINESS_CATEGORIES;
class SmartDataGenerator {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.startTime = null; // For ETA calculation
    }
    async askQuestion(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    }
    async interactiveSetup() {
        console.log('🚀 Smart Sample Data Generator for Quant Commander\n');
        console.log('Let\'s create realistic data for your business analysis!\n');
        // Show available business types
        console.log('📊 Available Business Types:');
        Object.keys(BUSINESS_CATEGORIES).forEach((type, index) => {
            const businessType = type;
            const desc = BUSINESS_CATEGORIES[businessType].description;
            console.log(`  ${index + 1}. ${type} - ${desc}`);
        });
        // Get business type
        const businessTypeAnswer = await this.askQuestion('\n🏢 Enter your business type (name or number): ');
        let businessType;
        if (!isNaN(parseInt(businessTypeAnswer))) {
            const index = parseInt(businessTypeAnswer) - 1;
            const types = Object.keys(BUSINESS_CATEGORIES);
            if (index >= 0 && index < types.length) {
                businessType = types[index];
            }
            else {
                throw new Error('Invalid business type number');
            }
        }
        else {
            const foundType = Object.keys(BUSINESS_CATEGORIES).find(type => type.toLowerCase().includes(businessTypeAnswer.toLowerCase()));
            if (!foundType) {
                throw new Error(`Business type "${businessTypeAnswer}" not found`);
            }
            businessType = foundType;
        }
        const businessConfig = BUSINESS_CATEGORIES[businessType];
        console.log(`\n✅ Selected: ${businessType}`);
        console.log(`📝 Description: ${businessConfig.description}`);
        // Show categories and products for this business type
        console.log(`\n🏷️ Available Categories for ${businessType}:`);
        businessConfig.categories.forEach((cat, index) => {
            console.log(`  ${index + 1}. ${cat}`);
        });
        console.log(`\n📦 Sample Products for ${businessType}:`);
        businessConfig.products.slice(0, 5).forEach((product, index) => {
            console.log(`  ${index + 1}. ${product}`);
        });
        console.log(`  ... and ${businessConfig.products.length - 5} more products\n`);
        // Get time period
        const monthsAnswer = await this.askQuestion('📅 How many months of data do you want? (1-24): ');
        const months = parseInt(monthsAnswer);
        if (isNaN(months) || months < 1 || months > 24) {
            throw new Error('Months must be a number between 1 and 24');
        }
        // Get record count
        const recordsAnswer = await this.askQuestion('📊 How many records per month? (10-50000): ');
        const recordsPerMonth = parseInt(recordsAnswer);
        if (isNaN(recordsPerMonth) || recordsPerMonth < 10 || recordsPerMonth > 50000) {
            throw new Error('Records per month must be a number between 10 and 50,000');
        }

        // Memory usage warning for very large datasets
        const estimatedTotalRecords = recordsPerMonth * months;
        if (estimatedTotalRecords > 100000) {
            console.log('\n⚠️  LARGE DATASET WARNING:');
            console.log(`📊 Estimated total records: ${estimatedTotalRecords.toLocaleString()}`);
            console.log('🧠 This will require significant memory and processing time.');
            console.log('💡 Recommendations for large datasets:');
            console.log('   - Ensure you have at least 4GB of available RAM');
            console.log('   - Close other applications to free up memory');
            console.log('   - Consider generating data in smaller batches');
            console.log('   - Process may take 10-30 minutes depending on system');
            
            const continueAnswer = await this.askQuestion('\n❓ Continue with large dataset generation? (y/N): ');
            if (continueAnswer.toLowerCase() !== 'y' && continueAnswer.toLowerCase() !== 'yes') {
                throw new Error('Large dataset generation cancelled by user');
            }
        }
        // Get output file
        const outputFileAnswer = await this.askQuestion('📁 Output filename (press Enter for auto-generated): ');
        const baseFileName = outputFileAnswer || `${businessType.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}_data_${months}m_${recordsPerMonth * months}r.csv`;
        // Ensure the filename has .csv extension if not provided
        const fileName = baseFileName.endsWith('.csv') ? baseFileName : `${baseFileName}.csv`;
        // Always save to Sample Data folder relative to tools directory
        const outputFile = path.join('..', 'Sample Data', fileName);
        return {
            businessType,
            categories: businessConfig.categories,
            products: businessConfig.products,
            months,
            recordsPerMonth,
            outputFile
        };
    }
    generateDateRange(months) {
        const dates = [];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);
        for (let i = 0; i < months; i++) {
            const currentDate = new Date(startDate);
            currentDate.setMonth(startDate.getMonth() + i);
            dates.push(currentDate);
        }
        return dates;
    }
    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    getRandomLocation() {
        const region = this.getRandomElement(Object.keys(REGIONS));
        const country = this.getRandomElement(Object.keys(REGIONS[region]));
        const city = this.getRandomElement(REGIONS[region][country]);
        return { region, country, city };
    }
    calculateETA(current, total) {
        if (!this.startTime || current === 0) return '';
        
        const elapsed = Date.now() - this.startTime;
        const rate = current / elapsed; // records per millisecond
        const remaining = total - current;
        const eta = remaining / rate;
        
        if (eta < 60000) { // Less than 1 minute
            return `(ETA: ${Math.round(eta / 1000)}s)`;
        } else if (eta < 3600000) { // Less than 1 hour
            return `(ETA: ${Math.round(eta / 60000)}m)`;
        } else {
            return `(ETA: ${Math.round(eta / 3600000)}h)`;
        }
    }
    generateRealisticFinancials(product, category, location, channel) {
        // Base budget calculation based on business type and category
        let baseBudget = 50000; // Default base
        // Adjust based on business type
        if (this.config.businessType === 'Technology') {
            baseBudget = Math.random() * 200000 + 100000; // $100K-$300K
        }
        else if (this.config.businessType === 'Healthcare') {
            baseBudget = Math.random() * 500000 + 200000; // $200K-$700K
        }
        else if (this.config.businessType === 'Financial Services') {
            baseBudget = Math.random() * 300000 + 150000; // $150K-$450K
        }
        else if (this.config.businessType === 'Manufacturing') {
            baseBudget = Math.random() * 400000 + 100000; // $100K-$500K
        }
        else if (this.config.businessType === 'Retail & E-commerce') {
            baseBudget = Math.random() * 150000 + 50000; // $50K-$200K
        }
        else {
            baseBudget = Math.random() * 200000 + 75000; // $75K-$275K
        }
        // Regional multipliers
        const regionalMultipliers = {
            'North America': 1.2,
            'Europe': 1.1,
            'Asia Pacific': 0.9
        };
        baseBudget *= regionalMultipliers[location.region] || 1.0;
        // Channel multipliers
        const channelMultipliers = {
            'Online': 0.85,
            'Retail': 1.0,
            'Direct Sales': 1.3,
            'Partner': 0.9,
            'Wholesale': 0.7,
            'Mobile App': 0.8
        };
        baseBudget *= channelMultipliers[channel] || 1.0;
        // Add some randomness
        const budget = Math.round(baseBudget * (0.8 + Math.random() * 0.4));
        // Generate actuals with realistic variance (-30% to +40%)
        const varianceMultiplier = 0.7 + Math.random() * 0.7; // 0.7 to 1.4
        const actuals = Math.round(budget * varianceMultiplier);
        return { budget, actuals };
    }
    generateQuarter(date) {
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const quarter = Math.ceil(month / 3);
        return `${year}-Q${quarter}`;
    }
    generateMonth(date) {
        return date.toISOString().slice(0, 7); // YYYY-MM format
    }
    async generateData() {
        try {
            this.config = await this.interactiveSetup();
            await this.generateDataDirect();
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }

    async generateDataDirect() {
        if (!this.config) {
            throw new Error('Configuration not set. Call interactiveSetup() first.');
        }

        console.log('\n🔧 Generating data...');
        console.log(`📊 Business Type: ${this.config.businessType}`);
        console.log(`📅 Time Period: ${this.config.months} months`);
        console.log(`📈 Records: ${(this.config.recordsPerMonth * this.config.months).toLocaleString()} total (${this.config.recordsPerMonth.toLocaleString()}/month)`);
        console.log(`📁 Output: ${this.config.outputFile}\n`);

        // Performance warning for large datasets
        const expectedTotalRecords = this.config.months * this.config.recordsPerMonth;
        if (expectedTotalRecords > 10000) {
            console.log('⚠️  Large dataset detected. This may take several minutes...');
            console.log('💡 Tip: Consider running this in the background or reducing the record count for testing.\n');
        }
        const data = [];
        const dateRange = this.generateDateRange(this.config.months);
        let totalRecords = 0;
        const expectedTotal = this.config.months * this.config.recordsPerMonth;
        this.startTime = Date.now(); // Start ETA timer
        for (let monthIndex = 0; monthIndex < this.config.months; monthIndex++) {
            const monthDate = dateRange[monthIndex];
            for (let recordIndex = 0; recordIndex < this.config.recordsPerMonth; recordIndex++) {
                // Generate random date within the month
                const dayOfMonth = Math.floor(Math.random() * 28) + 1; // Safe day range
                const recordDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), dayOfMonth);
                const location = this.getRandomLocation();
                const product = this.getRandomElement(this.config.products);
                const category = this.getRandomElement(this.config.categories);
                const channel = this.getRandomElement(CHANNELS);
                const { budget, actuals } = this.generateRealisticFinancials(product, category, location, channel);
                const record = {
                    Date: recordDate.toISOString().split('T')[0],
                    Product: product,
                    Category: category,
                    Region: location.region,
                    Country: location.country,
                    City: location.city,
                    Budget: budget,
                    Actuals: actuals,
                    Channel: channel,
                    Quarter: this.generateQuarter(recordDate),
                    Month: this.generateMonth(recordDate)
                };
                data.push(record);
                totalRecords++;
                // Enhanced progress indicator for large datasets
                if (totalRecords % 1000 === 0 || totalRecords === expectedTotal) {
                    const progress = (totalRecords / expectedTotal) * 100;
                    const eta = this.calculateETA(totalRecords, expectedTotal);
                    console.log(`📊 Progress: ${totalRecords.toLocaleString()}/${expectedTotal.toLocaleString()} (${progress.toFixed(1)}%) ${eta}`);
                }
            }
        }
        // Sort by date for better readability (skip for very large datasets to improve performance)
        if (data.length < 50000) {
            console.log('📝 Sorting data by date...');
            data.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
        } else {
            console.log('📝 Skipping sort for large dataset (performance optimization)');
        }
        // Write CSV file
        console.log('💾 Writing CSV file...');
        const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
            path: this.config.outputFile,
            header: [
                { id: 'Date', title: 'Date' },
                { id: 'Product', title: 'Product' },
                { id: 'Category', title: 'Category' },
                { id: 'Region', title: 'Region' },
                { id: 'Country', title: 'Country' },
                { id: 'City', title: 'City' },
                { id: 'Budget', title: 'Budget' },
                { id: 'Actuals', title: 'Actuals' },
                { id: 'Channel', title: 'Channel' },
                { id: 'Quarter', title: 'Quarter' },
                { id: 'Month', title: 'Month' }
            ]
        });

        // For very large datasets, write in batches to manage memory
        if (data.length > 50000) {
            console.log('📊 Large dataset detected - writing in batches...');
            const batchSize = 10000;
            for (let i = 0; i < data.length; i += batchSize) {
                const batch = data.slice(i, i + batchSize);
                if (i === 0) {
                    await csvWriter.writeRecords(batch);
                } else {
                    // Append mode for subsequent batches
                    const appendWriter = (0, csv_writer_1.createObjectCsvWriter)({
                        path: this.config.outputFile,
                        header: [
                            { id: 'Date', title: 'Date' },
                            { id: 'Product', title: 'Product' },
                            { id: 'Category', title: 'Category' },
                            { id: 'Region', title: 'Region' },
                            { id: 'Country', title: 'Country' },
                            { id: 'City', title: 'City' },
                            { id: 'Budget', title: 'Budget' },
                            { id: 'Actuals', title: 'Actuals' },
                            { id: 'Channel', title: 'Channel' },
                            { id: 'Quarter', title: 'Quarter' },
                            { id: 'Month', title: 'Month' }
                        ],
                        append: true
                    });
                    await appendWriter.writeRecords(batch);
                }
                console.log(`📝 Batch ${Math.ceil((i + batchSize) / batchSize)}/${Math.ceil(data.length / batchSize)} written`);
            }
        } else {
            await csvWriter.writeRecords(data);
        }
        // Generate summary
        console.log('\n✅ Data generation complete!');
        console.log(`📁 Output file: ${this.config.outputFile}`);
        console.log(`📊 Total records: ${data.length.toLocaleString()}`);
        console.log(`📅 Date range: ${data[0].Date} to ${data[data.length - 1].Date}`);
        const uniqueProducts = new Set(data.map(r => r.Product)).size;
        const uniqueCategories = new Set(data.map(r => r.Category)).size;
        const uniqueRegions = new Set(data.map(r => r.Region)).size;
        const uniqueChannels = new Set(data.map(r => r.Channel)).size;
        console.log(`📦 Products: ${uniqueProducts}`);
        console.log(`🏷️ Categories: ${uniqueCategories}`);
        console.log(`🌍 Regions: ${uniqueRegions}`);
        console.log(`📺 Channels: ${uniqueChannels}`);
        const budgetRange = {
            min: Math.min(...data.map(r => r.Budget)),
            max: Math.max(...data.map(r => r.Budget))
        };
        const actualsRange = {
            min: Math.min(...data.map(r => r.Actuals)),
            max: Math.max(...data.map(r => r.Actuals))
        };
        console.log(`💰 Budget range: $${budgetRange.min.toLocaleString()} - $${budgetRange.max.toLocaleString()}`);
        console.log(`💸 Actuals range: $${actualsRange.min.toLocaleString()} - $${actualsRange.max.toLocaleString()}`);
        // Show sample data
        console.log('\n📄 Sample records:');
        console.table(data.slice(0, 3));
        console.log('\n🎯 Ready for analysis in Quant Commander!');
        console.log('📥 Upload this CSV file to your application to begin analysis.');
    }
}
exports.SmartDataGenerator = SmartDataGenerator;
// Command line interface
const program = new commander_1.Command();
program
    .name('smart-data-generator')
    .description('AI-powered sample data generator for Quant Commander')
    .version('1.0.0')
    .action(async () => {
    const generator = new SmartDataGenerator();
    await generator.generateData();
});
// Add list command to show available business types
program
    .command('list')
    .description('List available business types and their categories')
    .action(() => {
    console.log('🏢 Available Business Types:\n');
    Object.entries(BUSINESS_CATEGORIES).forEach(([type, config]) => {
        console.log(`📊 ${type}`);
        console.log(`   Description: ${config.description}`);
        console.log(`   Categories: ${config.categories.join(', ')}`);
        console.log(`   Sample Products: ${config.products.slice(0, 3).join(', ')}...\n`);
    });
});
if (require.main === module) {
    program.parse();
}
