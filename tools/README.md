# Smart Data Generator for Quant Commander

🚀 **AI-powered sample data generator** that creates realistic business data based on your industry type.

✅ **All generated files are automatically saved to the `Sample Data` folder** for immediate use in Quant Commander!

## Features

✨ **8 Business Types** with industry-specific products and categories:
- Technology (Software, Cloud, AI, Cybersecurity)
- Healthcare (Medical devices, Pharmaceuticals, Health software)
- Retail & E-commerce (Fashion, Electronics, Beauty)
- Financial Services (Banking, Insurance, Investment)
- Manufacturing (Industrial equipment, Automotive)
- Education (Learning platforms, Training)
- Food & Beverage (Premium foods, Restaurant services)
- Real Estate (Property management, Construction)

🎯 **Smart Data Generation**:
- **5 categories** per business type with **15 products** each
- Realistic financial data with region/channel-based variance
- Global locations (North America, Europe, Asia Pacific)
- Multiple sales channels (Online, Retail, Direct Sales, etc.)
- Time-based data generation (1-24 months)

📊 **Rich Data Output**:
- Date, Product, Category, Region, Country, City
- Budget vs Actuals with realistic variance patterns
- Quarter and Month grouping for time-series analysis
- CSV format ready for Quant Commander import

## Quick Start

### 1. Install Dependencies

```bash
cd tools
npm install
```

### 2. Run Interactive Generator

```bash
npm run generate
```

### 3. Follow the Prompts

```
🚀 Smart Sample Data Generator for Quant Commander

📊 Available Business Types:
  1. Technology - Software, hardware, and digital services
  2. Healthcare - Medical devices, pharmaceuticals, and health services
  3. Retail & E-commerce - Consumer goods, fashion, and online marketplace
  ...

🏢 Enter your business type (name or number): 1

✅ Selected: Technology
📝 Description: Software, hardware, and digital services

🏷️ Available Categories for Technology:
  1. Software Solutions
  2. Hardware & Devices
  3. Cloud Services
  4. AI & Analytics
  5. Cybersecurity

📦 Sample Products for Technology:
  1. Enterprise Software License
  2. Cloud Computing Platform
  3. AI Analytics Suite
  4. Cybersecurity Package
  5. Mobile App Development
  ... and 10 more products

📅 How many months of data do you want? (1-24): 12
📊 How many records per month? (10-1000): 100
📁 Output filename (press Enter for auto-generated): tech_sample_data.csv
```

### 4. Generated Output

```
✅ Data generation complete!
📁 Output file: tech_sample_data.csv
📊 Total records: 1,200
📅 Date range: 2024-07-01 to 2025-07-13
📦 Products: 15
🏷️ Categories: 5
🌍 Regions: 3
📺 Channels: 6
💰 Budget range: $68,000 - $389,000
💸 Actuals range: $47,600 - $543,460
```

## Command Line Options

### List Available Business Types

```bash
npm run list-types
```

Shows all business categories with their descriptions and sample products.

### Direct Command Line Usage

```bash
# Run the generator
node smart-data-generator.js

# List business types
node smart-data-generator.js list
```

## Sample Output Data

| Date | Product | Category | Region | Country | City | Budget | Actuals | Channel | Quarter | Month |
|------|---------|----------|--------|---------|------|--------|---------|---------|---------|-------|
| 2024-07-15 | Enterprise Software License | Software Solutions | North America | United States | New York | 285000 | 312450 | Direct Sales | 2024-Q3 | 2024-07 |
| 2024-07-22 | Cloud Computing Platform | Cloud Services | Europe | United Kingdom | London | 198000 | 178200 | Online | 2024-Q3 | 2024-07 |
| 2024-08-03 | AI Analytics Suite | AI & Analytics | Asia Pacific | Japan | Tokyo | 156000 | 171600 | Partner | 2024-Q3 | 2024-08 |

## Business Type Details

### 🔧 Technology
- **Categories**: Software Solutions, Hardware & Devices, Cloud Services, AI & Analytics, Cybersecurity
- **Sample Products**: Enterprise Software License, Cloud Computing Platform, AI Analytics Suite, Cybersecurity Package, Mobile App Development
- **Budget Range**: $100K - $300K

### 🏥 Healthcare  
- **Categories**: Medical Devices, Pharmaceuticals, Diagnostic Equipment, Health Software, Wellness Products
- **Sample Products**: Digital Blood Pressure Monitor, Prescription Management System, MRI Scanner Software, Telemedicine Platform
- **Budget Range**: $200K - $700K

### 🛒 Retail & E-commerce
- **Categories**: Fashion & Apparel, Home & Living, Electronics & Gadgets, Sports & Outdoor, Beauty & Personal Care
- **Sample Products**: Premium Designer Jacket, Smart Home Lighting System, Wireless Bluetooth Headphones, Professional Hiking Backpack
- **Budget Range**: $50K - $200K

### 💰 Financial Services
- **Categories**: Banking Solutions, Insurance Products, Investment Services, Payment Processing, Risk Management
- **Sample Products**: Digital Banking Platform, Life Insurance Policy, Investment Portfolio Management, Payment Gateway Service
- **Budget Range**: $150K - $450K

### 🏭 Manufacturing
- **Categories**: Industrial Equipment, Automotive Parts, Production Machinery, Quality Control, Supply Chain
- **Sample Products**: Automated Production Line, High-Performance Engine Component, CNC Machining Center, Quality Inspection System
- **Budget Range**: $100K - $500K

## Smart Financial Modeling

The generator uses **AI-inspired logic** to create realistic financial data:

### Regional Variance
- **North America**: 1.2x multiplier (higher costs)
- **Europe**: 1.1x multiplier
- **Asia Pacific**: 0.9x multiplier (lower costs)

### Channel Multipliers  
- **Direct Sales**: 1.3x (highest margin)
- **Retail**: 1.0x (baseline)
- **Partner**: 0.9x
- **Online**: 0.85x
- **Wholesale**: 0.7x (lowest margin)
- **Mobile App**: 0.8x

### Variance Patterns
- **Budget**: Industry-specific base ranges with regional/channel adjustments
- **Actuals**: -30% to +40% variance from budget (realistic business performance)
- **Outliers**: Natural outliers included for realistic analysis testing

## Integration with Quant Commander

1. **Generate Data**: Use this tool to create industry-specific CSV data
2. **Upload to App**: Import the CSV file into your Quant Commander application  
3. **Run Analysis**: Use all 6 analyzers (Outlier Detection, Budget Variance, Contribution Analysis, etc.)
4. **View Results**: See realistic analysis results with your scatter plots and statistical insights

## File Structure

```
tools/
├── smart-data-generator.js    # Main generator script
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Example Workflows

### Technology Startup (3 months, 50 records/month)
```bash
npm run generate
# Select: Technology
# Months: 3  
# Records: 50
# Output: technology_startup_data.csv
```

### Healthcare Analytics (12 months, 200 records/month)  
```bash
npm run generate
# Select: Healthcare
# Months: 12
# Records: 200  
# Output: healthcare_annual_data.csv
```

### Retail Performance (6 months, 150 records/month)
```bash
npm run generate  
# Select: Retail & E-commerce
# Months: 6
# Records: 150
# Output: retail_performance_data.csv
```

## Tips for Best Results

🎯 **For Outlier Detection**: Use 100+ records with 6+ months of data
📊 **For Trend Analysis**: Generate 12+ months with consistent monthly records  
💹 **For Budget Variance**: Use realistic record counts (50-200/month)
🏆 **For Top N Analysis**: Include diverse products and regions
📈 **For Contribution Analysis**: Ensure good category distribution

---

**Ready to generate intelligent sample data for your Quant Commander analysis!** 🚀
