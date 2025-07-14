#!/usr/bin/env node
/**
 * Demo Script - Generate sample data for testing
 * Creates a small Technology dataset for demonstration
 */

const { SmartDataGenerator, BUSINESS_CATEGORIES } = require('./smart-data-generator.js');
const fs = require('fs');

class DemoGenerator {
  constructor() {
    this.config = {
      businessType: 'Technology',
      categories: BUSINESS_CATEGORIES['Technology'].categories,
      products: BUSINESS_CATEGORIES['Technology'].products,
      months: 3,
      recordsPerMonth: 25,
      outputFile: 'demo_technology_data.csv'
    };
  }

  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  getRandomLocation() {
    const REGIONS = {
      'North America': {
        'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
        'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa']
      },
      'Europe': {
        'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool'],
        'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt']
      },
      'Asia Pacific': {
        'Japan': ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo'],
        'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide']
      }
    };

    const region = this.getRandomElement(Object.keys(REGIONS));
    const country = this.getRandomElement(Object.keys(REGIONS[region]));
    const city = this.getRandomElement(REGIONS[region][country]);
    
    return { region, country, city };
  }

  generateRealisticFinancials(product, category, location, channel) {
    // Technology base budget
    let baseBudget = Math.random() * 200000 + 100000; // $100K-$300K

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

    const budget = Math.round(baseBudget * (0.8 + Math.random() * 0.4));
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
    return date.toISOString().slice(0, 7);
  }

  arrayToCsv(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
  }

  generateDemo() {
    console.log('🎯 Generating demo Technology dataset...\n');
    console.log(`📊 Business Type: ${this.config.businessType}`);
    console.log(`📅 Time Period: ${this.config.months} months`);
    console.log(`📈 Records: ${this.config.recordsPerMonth * this.config.months} total`);
    console.log(`📁 Output: ${this.config.outputFile}\n`);

    const data = [];
    const CHANNELS = ['Online', 'Retail', 'Direct Sales', 'Partner', 'Wholesale', 'Mobile App'];

    // Generate dates for the last 3 months
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - this.config.months);

    for (let monthIndex = 0; monthIndex < this.config.months; monthIndex++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(startDate.getMonth() + monthIndex);
      
      for (let recordIndex = 0; recordIndex < this.config.recordsPerMonth; recordIndex++) {
        const dayOfMonth = Math.floor(Math.random() * 28) + 1;
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
      }
    }

    // Sort by date
    data.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

    // Write CSV
    const csvContent = this.arrayToCsv(data);
    fs.writeFileSync(this.config.outputFile, csvContent);

    // Summary
    console.log('✅ Demo data generation complete!');
    console.log(`📁 Output file: ${this.config.outputFile}`);
    console.log(`📊 Total records: ${data.length}`);
    console.log(`📅 Date range: ${data[0].Date} to ${data[data.length - 1].Date}`);
    
    const uniqueProducts = new Set(data.map(r => r.Product)).size;
    const uniqueCategories = new Set(data.map(r => r.Category)).size;
    const uniqueRegions = new Set(data.map(r => r.Region)).size;
    
    console.log(`📦 Products: ${uniqueProducts}`);
    console.log(`🏷️ Categories: ${uniqueCategories}`);
    console.log(`🌍 Regions: ${uniqueRegions}`);
    
    const budgetRange = {
      min: Math.min(...data.map(r => r.Budget)),
      max: Math.max(...data.map(r => r.Budget))
    };
    
    console.log(`💰 Budget range: $${budgetRange.min.toLocaleString()} - $${budgetRange.max.toLocaleString()}`);

    console.log('\n📄 Sample records:');
    console.table(data.slice(0, 3));

    console.log('\n🎯 Ready for Quant Commander analysis!');
    console.log('📥 Upload demo_technology_data.csv to test outlier detection and other analyzers.');
  }
}

// Run demo
const demo = new DemoGenerator();
demo.generateDemo();
