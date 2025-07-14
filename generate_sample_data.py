#!/usr/bin/env python3
"""
AI-Powered Sample CSV Data Generator for Quant Commander
Generates realistic financial data with AI-suggested products and categories
"""

import pandas as pd
import numpy as np
import argparse
import sys
import json
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
import random
import os
from pathlib import Path

# Sample data definitions
STATES_CITIES = {
    'Alabama': ['Birmingham', 'Mobile', 'Montgomery'],
    'Alaska': ['Anchorage', 'Fairbanks', 'Juneau'],
    'Arizona': ['Phoenix', 'Tucson', 'Mesa'],
    'Arkansas': ['Little Rock', 'Fort Smith', 'Fayetteville'],
    'California': ['Los Angeles', 'San Diego', 'San Jose'],
    'Colorado': ['Denver', 'Colorado Springs', 'Aurora'],
    'Connecticut': ['Bridgeport', 'New Haven', 'Hartford'],
    'Delaware': ['Wilmington', 'Dover', 'Newark'],
    'Florida': ['Jacksonville', 'Miami', 'Tampa'],
    'Georgia': ['Atlanta', 'Columbus', 'Augusta'],
    'Hawaii': ['Honolulu', 'Pearl City', 'Hilo'],
    'Idaho': ['Boise', 'Meridian', 'Nampa'],
    'Illinois': ['Chicago', 'Aurora', 'Rockford'],
    'Indiana': ['Indianapolis', 'Fort Wayne', 'Evansville'],
    'Iowa': ['Des Moines', 'Cedar Rapids', 'Davenport'],
    'Kansas': ['Wichita', 'Overland Park', 'Kansas City'],
    'Kentucky': ['Louisville', 'Lexington', 'Bowling Green'],
    'Louisiana': ['New Orleans', 'Baton Rouge', 'Shreveport'],
    'Maine': ['Portland', 'Lewiston', 'Bangor'],
    'Maryland': ['Baltimore', 'Frederick', 'Rockville'],
    'Massachusetts': ['Boston', 'Worcester', 'Springfield'],
    'Michigan': ['Detroit', 'Grand Rapids', 'Warren'],
    'Minnesota': ['Minneapolis', 'Saint Paul', 'Rochester'],
    'Mississippi': ['Jackson', 'Gulfport', 'Southaven'],
    'Missouri': ['Kansas City', 'Saint Louis', 'Springfield'],
    'Montana': ['Billings', 'Missoula', 'Great Falls'],
    'Nebraska': ['Omaha', 'Lincoln', 'Bellevue'],
    'Nevada': ['Las Vegas', 'Henderson', 'Reno'],
    'New Hampshire': ['Manchester', 'Nashua', 'Concord'],
    'New Jersey': ['Newark', 'Jersey City', 'Paterson'],
    'New Mexico': ['Albuquerque', 'Las Cruces', 'Rio Rancho'],
    'New York': ['New York City', 'Buffalo', 'Rochester'],
    'North Carolina': ['Charlotte', 'Raleigh', 'Greensboro'],
    'North Dakota': ['Fargo', 'Bismarck', 'Grand Forks'],
    'Ohio': ['Columbus', 'Cleveland', 'Cincinnati'],
    'Oklahoma': ['Oklahoma City', 'Tulsa', 'Norman'],
    'Oregon': ['Portland', 'Eugene', 'Salem'],
    'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown'],
    'Rhode Island': ['Providence', 'Warwick', 'Cranston'],
    'South Carolina': ['Charleston', 'Columbia', 'North Charleston'],
    'South Dakota': ['Sioux Falls', 'Rapid City', 'Aberdeen'],
    'Tennessee': ['Nashville', 'Memphis', 'Knoxville'],
    'Texas': ['Houston', 'San Antonio', 'Dallas'],
    'Utah': ['Salt Lake City', 'West Valley City', 'Provo'],
    'Vermont': ['Burlington', 'Essex', 'South Burlington'],
    'Virginia': ['Virginia Beach', 'Norfolk', 'Chesapeake'],
    'Washington': ['Seattle', 'Spokane', 'Tacoma'],
    'West Virginia': ['Charleston', 'Huntington', 'Parkersburg'],
    'Wisconsin': ['Milwaukee', 'Madison', 'Green Bay'],
    'Wyoming': ['Cheyenne', 'Casper', 'Laramie']
}

# Default fallback data
DEFAULT_PRODUCTS = [
    'Premium Laptop Pro',
    'Smart Home Security System',
    'Wireless Gaming Headset',
    'Professional Coffee Machine',
    'Fitness Tracker Elite',
    '4K Ultra HD TV',
    'Electric Standing Desk',
    'Bluetooth Speaker Max',
    'Digital Camera Pro',
    'Smart Watch Series X',
    'Wireless Earbuds Pro',
    'Smart Thermostat',
    'Gaming Desktop Ultimate',
    'Yoga Mat Premium',
    'Protein Powder'
]

DEFAULT_CATEGORIES = [
    'Electronics',
    'Home & Garden', 
    'Health & Fitness',
    'Office & Business',
    'Entertainment'
]

CHANNELS = ['Online', 'Retail', 'Direct Sales', 'Partner', 'Wholesale']

class AIProductGenerator:
    """Generate products and categories using AI/LLM"""
    
    def __init__(self):
        self.fallback_data = self._create_fallback_mapping()
    
    def _create_fallback_mapping(self) -> Dict[str, str]:
        """Create fallback product-category mapping"""
        return {
            'Premium Laptop Pro': 'Electronics',
            'Smart Home Security System': 'Home & Garden',
            'Wireless Gaming Headset': 'Electronics',
            'Professional Coffee Machine': 'Home & Garden',
            'Fitness Tracker Elite': 'Health & Fitness',
            '4K Ultra HD TV': 'Electronics',
            'Electric Standing Desk': 'Office & Business',
            'Bluetooth Speaker Max': 'Electronics',
            'Digital Camera Pro': 'Electronics',
            'Smart Watch Series X': 'Health & Fitness',
            'Wireless Earbuds Pro': 'Electronics',
            'Smart Thermostat': 'Home & Garden',
            'Gaming Desktop Ultimate': 'Electronics',
            'Yoga Mat Premium': 'Health & Fitness',
            'Protein Powder': 'Health & Fitness'
        }
    
    def generate_products_and_categories(self, business_type: str, use_ai: bool = True) -> Tuple[List[str], List[str], Dict[str, str]]:
        """
        Generate products and categories for a business type
        
        Args:
            business_type: Description of the business (e.g., "fitness equipment retailer")
            use_ai: Whether to use AI generation (falls back to local generation if False)
            
        Returns:
            Tuple of (products, categories, product_category_mapping)
        """
        if use_ai:
            try:
                return self._generate_with_ai(business_type)
            except Exception as e:
                print(f"⚠️  AI generation failed ({e}), using smart fallback...")
                return self._generate_smart_fallback(business_type)
        else:
            return self._generate_smart_fallback(business_type)
    
    def _generate_with_ai(self, business_type: str) -> Tuple[List[str], List[str], Dict[str, str]]:
        """Generate using AI/LLM (placeholder for actual implementation)"""
        # This is where you would integrate with an actual LLM API
        # For now, we'll use a smart local generation that simulates AI
        return self._generate_smart_fallback(business_type)
    
    def _generate_smart_fallback(self, business_type: str) -> Tuple[List[str], List[str], Dict[str, str]]:
        """Generate products and categories based on business type keywords"""
        business_lower = business_type.lower()
        
        # Business type mappings
        if any(keyword in business_lower for keyword in ['restaurant', 'food', 'cafe', 'dining', 'kitchen']):
            return self._generate_restaurant_data()
        elif any(keyword in business_lower for keyword in ['fitness', 'gym', 'health', 'wellness', 'sport']):
            return self._generate_fitness_data()
        elif any(keyword in business_lower for keyword in ['tech', 'software', 'electronics', 'computer', 'digital']):
            return self._generate_tech_data()
        elif any(keyword in business_lower for keyword in ['clothing', 'fashion', 'apparel', 'retail', 'boutique']):
            return self._generate_fashion_data()
        elif any(keyword in business_lower for keyword in ['automotive', 'car', 'vehicle', 'auto']):
            return self._generate_automotive_data()
        elif any(keyword in business_lower for keyword in ['beauty', 'cosmetic', 'skincare', 'salon']):
            return self._generate_beauty_data()
        elif any(keyword in business_lower for keyword in ['home', 'furniture', 'decor', 'garden']):
            return self._generate_home_data()
        else:
            # Generic business - mix of categories
            return self._generate_generic_data()
    
    def _generate_restaurant_data(self) -> Tuple[List[str], List[str], Dict[str, str]]:
        """Generate restaurant/food business data"""
        categories = ['Appetizers', 'Main Courses', 'Beverages', 'Desserts', 'Specials']
        products = [
            'Caesar Salad', 'Buffalo Wings', 'Mozzarella Sticks',  # Appetizers
            'Grilled Salmon', 'Prime Ribeye Steak', 'Chicken Parmesan',  # Main Courses
            'Craft Beer Selection', 'Premium Wine List', 'Specialty Cocktails',  # Beverages
            'Chocolate Lava Cake', 'Tiramisu', 'Seasonal Fruit Tart',  # Desserts
            'Chef\'s Daily Special', 'Weekend Brunch Menu', 'Holiday Feast'  # Specials
        ]
        
        mapping = {
            'Caesar Salad': 'Appetizers', 'Buffalo Wings': 'Appetizers', 'Mozzarella Sticks': 'Appetizers',
            'Grilled Salmon': 'Main Courses', 'Prime Ribeye Steak': 'Main Courses', 'Chicken Parmesan': 'Main Courses',
            'Craft Beer Selection': 'Beverages', 'Premium Wine List': 'Beverages', 'Specialty Cocktails': 'Beverages',
            'Chocolate Lava Cake': 'Desserts', 'Tiramisu': 'Desserts', 'Seasonal Fruit Tart': 'Desserts',
            'Chef\'s Daily Special': 'Specials', 'Weekend Brunch Menu': 'Specials', 'Holiday Feast': 'Specials'
        }
        
        return products, categories, mapping
    
    def _generate_fitness_data(self) -> Tuple[List[str], List[str], Dict[str, str]]:
        """Generate fitness business data"""
        categories = ['Cardio Equipment', 'Strength Training', 'Accessories', 'Supplements', 'Apparel']
        products = [
            'Professional Treadmill', 'Elliptical Trainer', 'Stationary Bike',  # Cardio
            'Olympic Weight Set', 'Power Rack System', 'Adjustable Dumbbells',  # Strength
            'Yoga Mat Premium', 'Resistance Bands', 'Foam Roller',  # Accessories
            'Whey Protein Powder', 'Pre-Workout Formula', 'Recovery Drink',  # Supplements
            'Athletic Shorts', 'Performance T-Shirt', 'Training Shoes'  # Apparel
        ]
        
        mapping = {
            'Professional Treadmill': 'Cardio Equipment', 'Elliptical Trainer': 'Cardio Equipment', 'Stationary Bike': 'Cardio Equipment',
            'Olympic Weight Set': 'Strength Training', 'Power Rack System': 'Strength Training', 'Adjustable Dumbbells': 'Strength Training',
            'Yoga Mat Premium': 'Accessories', 'Resistance Bands': 'Accessories', 'Foam Roller': 'Accessories',
            'Whey Protein Powder': 'Supplements', 'Pre-Workout Formula': 'Supplements', 'Recovery Drink': 'Supplements',
            'Athletic Shorts': 'Apparel', 'Performance T-Shirt': 'Apparel', 'Training Shoes': 'Apparel'
        }
        
        return products, categories, mapping
    
    def _generate_tech_data(self) -> Tuple[List[str], List[str], Dict[str, str]]:
        """Generate technology business data"""
        categories = ['Computing', 'Mobile Devices', 'Audio/Visual', 'Gaming', 'Smart Home']
        products = [
            'Gaming Laptop Pro', 'Desktop Workstation', 'Ultrabook Elite',  # Computing
            'Flagship Smartphone', 'Tablet Pro', 'Smartwatch Series',  # Mobile
            '4K Monitor', 'Wireless Headphones', 'Streaming Camera',  # Audio/Visual
            'Gaming Console', 'Mechanical Keyboard', 'Gaming Mouse Pro',  # Gaming
            'Smart Thermostat', 'Security Camera System', 'Voice Assistant'  # Smart Home
        ]
        
        mapping = {
            'Gaming Laptop Pro': 'Computing', 'Desktop Workstation': 'Computing', 'Ultrabook Elite': 'Computing',
            'Flagship Smartphone': 'Mobile Devices', 'Tablet Pro': 'Mobile Devices', 'Smartwatch Series': 'Mobile Devices',
            '4K Monitor': 'Audio/Visual', 'Wireless Headphones': 'Audio/Visual', 'Streaming Camera': 'Audio/Visual',
            'Gaming Console': 'Gaming', 'Mechanical Keyboard': 'Gaming', 'Gaming Mouse Pro': 'Gaming',
            'Smart Thermostat': 'Smart Home', 'Security Camera System': 'Smart Home', 'Voice Assistant': 'Smart Home'
        }
        
        return products, categories, mapping
    
    def _generate_fashion_data(self) -> Tuple[List[str], List[str], Dict[str, str]]:
        """Generate fashion retail data"""
        categories = ['Casual Wear', 'Formal Wear', 'Footwear', 'Accessories', 'Seasonal']
        products = [
            'Designer Jeans', 'Cotton T-Shirt', 'Casual Hoodie',  # Casual
            'Business Suit', 'Evening Dress', 'Dress Shirt',  # Formal
            'Running Sneakers', 'Leather Boots', 'Dress Shoes',  # Footwear
            'Designer Handbag', 'Luxury Watch', 'Statement Jewelry',  # Accessories
            'Winter Coat', 'Summer Dress', 'Beach Swimwear'  # Seasonal
        ]
        
        mapping = {
            'Designer Jeans': 'Casual Wear', 'Cotton T-Shirt': 'Casual Wear', 'Casual Hoodie': 'Casual Wear',
            'Business Suit': 'Formal Wear', 'Evening Dress': 'Formal Wear', 'Dress Shirt': 'Formal Wear',
            'Running Sneakers': 'Footwear', 'Leather Boots': 'Footwear', 'Dress Shoes': 'Footwear',
            'Designer Handbag': 'Accessories', 'Luxury Watch': 'Accessories', 'Statement Jewelry': 'Accessories',
            'Winter Coat': 'Seasonal', 'Summer Dress': 'Seasonal', 'Beach Swimwear': 'Seasonal'
        }
        
        return products, categories, mapping
    
    def _generate_automotive_data(self) -> Tuple[List[str], List[str], Dict[str, str]]:
        """Generate automotive business data"""
        categories = ['Engine Parts', 'Body & Exterior', 'Interior', 'Electronics', 'Maintenance']
        products = [
            'Performance Air Filter', 'Turbocharger Kit', 'Exhaust System',  # Engine
            'Carbon Fiber Hood', 'LED Headlights', 'Custom Wheels',  # Body
            'Leather Seat Covers', 'Dashboard Kit', 'Floor Mats',  # Interior
            'GPS Navigation', 'Backup Camera', 'Sound System',  # Electronics
            'Motor Oil Premium', 'Brake Pads', 'Tire Set'  # Maintenance
        ]
        
        mapping = {
            'Performance Air Filter': 'Engine Parts', 'Turbocharger Kit': 'Engine Parts', 'Exhaust System': 'Engine Parts',
            'Carbon Fiber Hood': 'Body & Exterior', 'LED Headlights': 'Body & Exterior', 'Custom Wheels': 'Body & Exterior',
            'Leather Seat Covers': 'Interior', 'Dashboard Kit': 'Interior', 'Floor Mats': 'Interior',
            'GPS Navigation': 'Electronics', 'Backup Camera': 'Electronics', 'Sound System': 'Electronics',
            'Motor Oil Premium': 'Maintenance', 'Brake Pads': 'Maintenance', 'Tire Set': 'Maintenance'
        }
        
        return products, categories, mapping
    
    def _generate_beauty_data(self) -> Tuple[List[str], List[str], Dict[str, str]]:
        """Generate beauty/cosmetics data"""
        categories = ['Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Tools']
        products = [
            'Anti-Aging Serum', 'Moisturizing Cream', 'Cleansing Oil',  # Skincare
            'Foundation Premium', 'Lipstick Collection', 'Eyeshadow Palette',  # Makeup
            'Shampoo & Conditioner', 'Hair Styling Cream', 'Hair Dryer Pro',  # Haircare
            'Luxury Perfume', 'Body Spray', 'Scented Candle',  # Fragrance
            'Makeup Brush Set', 'Beauty Blender', 'LED Mirror'  # Tools
        ]
        
        mapping = {
            'Anti-Aging Serum': 'Skincare', 'Moisturizing Cream': 'Skincare', 'Cleansing Oil': 'Skincare',
            'Foundation Premium': 'Makeup', 'Lipstick Collection': 'Makeup', 'Eyeshadow Palette': 'Makeup',
            'Shampoo & Conditioner': 'Haircare', 'Hair Styling Cream': 'Haircare', 'Hair Dryer Pro': 'Haircare',
            'Luxury Perfume': 'Fragrance', 'Body Spray': 'Fragrance', 'Scented Candle': 'Fragrance',
            'Makeup Brush Set': 'Tools', 'Beauty Blender': 'Tools', 'LED Mirror': 'Tools'
        }
        
        return products, categories, mapping
    
    def _generate_home_data(self) -> Tuple[List[str], List[str], Dict[str, str]]:
        """Generate home & garden data"""
        categories = ['Furniture', 'Decor', 'Kitchen', 'Garden', 'Storage']
        products = [
            'Leather Sofa Set', 'Dining Table Oak', 'Office Chair Ergonomic',  # Furniture
            'Wall Art Canvas', 'Table Lamp Modern', 'Decorative Vase',  # Decor
            'Stainless Steel Cookware', 'Coffee Machine Pro', 'Blender High-Speed',  # Kitchen
            'Garden Tool Set', 'Outdoor Furniture', 'Plant Collection',  # Garden
            'Storage Bins', 'Closet Organizer', 'Garage Shelving'  # Storage
        ]
        
        mapping = {
            'Leather Sofa Set': 'Furniture', 'Dining Table Oak': 'Furniture', 'Office Chair Ergonomic': 'Furniture',
            'Wall Art Canvas': 'Decor', 'Table Lamp Modern': 'Decor', 'Decorative Vase': 'Decor',
            'Stainless Steel Cookware': 'Kitchen', 'Coffee Machine Pro': 'Kitchen', 'Blender High-Speed': 'Kitchen',
            'Garden Tool Set': 'Garden', 'Outdoor Furniture': 'Garden', 'Plant Collection': 'Garden',
            'Storage Bins': 'Storage', 'Closet Organizer': 'Storage', 'Garage Shelving': 'Storage'
        }
        
        return products, categories, mapping
    
    def _generate_generic_data(self) -> Tuple[List[str], List[str], Dict[str, str]]:
        """Generate generic business data"""
        return DEFAULT_PRODUCTS, DEFAULT_CATEGORIES, self.fallback_data

class SampleDataGenerator:
    """Generate realistic sample CSV data for financial analysis"""
    
    def __init__(self):
        """Initialize the generator with random seed for reproducibility"""
        random.seed(42)
        np.random.seed(42)
        self.ai_generator = AIProductGenerator()
    
    def interactive_setup(self) -> Dict:
        """Interactive setup for data generation parameters"""
        print("\n🚀 Welcome to the AI-Powered Sample Data Generator!")
        print("=" * 60)
        
        # Get business type
        print("\n📋 Step 1: Business Information")
        business_type = input("What type of business are you generating data for? (e.g., 'fitness equipment retailer', 'restaurant chain', 'tech startup'): ").strip()
        
        if not business_type:
            business_type = "general retail business"
            print(f"Using default: {business_type}")
        
        # Get months of data
        print("\n📅 Step 2: Time Period")
        while True:
            try:
                months = int(input("How many months of data do you want? (1-24): "))
                if 1 <= months <= 24:
                    break
                else:
                    print("Please enter a number between 1 and 24")
            except ValueError:
                print("Please enter a valid number")
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)
        
        # Get number of records
        print("\n📊 Step 3: Data Volume")
        while True:
            try:
                records = int(input("How many records do you want to generate? (50-10000): "))
                if 50 <= records <= 10000:
                    break
                else:
                    print("Please enter a number between 50 and 10000")
            except ValueError:
                print("Please enter a valid number")
        
        # Generate products and categories
        print(f"\n🤖 Step 4: Generating Products & Categories for '{business_type}'...")
        products, categories, product_mapping = self.ai_generator.generate_products_and_categories(business_type)
        
        print(f"\n✅ Generated {len(categories)} categories with {len(products)} products:")
        for category in categories:
            category_products = [p for p, c in product_mapping.items() if c == category]
            print(f"  📦 {category}: {', '.join(category_products)}")
        
        # Output file
        print("\n📁 Step 5: Output File")
        default_filename = f"sample_data_{business_type.replace(' ', '_')}_{months}months.csv"
        output_file = input(f"Output filename (default: {default_filename}): ").strip()
        if not output_file:
            output_file = default_filename
        
        return {
            'business_type': business_type,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'months': months,
            'records': records,
            'products': products,
            'categories': categories,
            'product_mapping': product_mapping,
            'output_file': output_file
        }
    
    def generate_data(self, 
                     start_date: str,
                     end_date: str,
                     row_count: int,
                     products: List[str],
                     product_mapping: Dict[str, str],
                     output_file: str,
                     business_type: str = "general") -> None:
        """
        Generate sample data with specified parameters
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            row_count: Number of rows to generate
            products: List of products to include
            product_mapping: Product to category mapping
            output_file: Output CSV file path
            business_type: Type of business for pricing logic
        """
        
        # Parse dates
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d')
        
        if start_dt >= end_dt:
            raise ValueError("Start date must be before end date")
        
        print(f"\n🔧 Generating {row_count:,} rows of data...")
        print(f"📅 Date range: {start_date} to {end_date}")
        print(f"📦 Products: {len(products)} products")
        print(f"🏷️ Business type: {business_type}")
        
        # Generate data
        data = []
        
        for i in range(row_count):
            # Generate random date in range
            days_diff = (end_dt - start_dt).days
            random_days = random.randint(0, days_diff)
            record_date = start_dt + timedelta(days=random_days)
            
            # Select random location
            state = random.choice(list(STATES_CITIES.keys()))
            city = random.choice(STATES_CITIES[state])
            
            # Select random product
            product = random.choice(products)
            category = product_mapping.get(product, 'General')
            
            # Select random channel
            channel = random.choice(CHANNELS)
            
            # Generate realistic budget and actuals based on business type
            budget = self._generate_budget(product, category, state, channel, business_type)
            actuals = self._generate_actuals(budget)
            
            # Create record
            record = {
                'Date': record_date.strftime('%Y-%m-%d'),
                'Product': product,
                'Category': category,
                'State': state,
                'City': city,
                'Budget': budget,
                'Actuals': actuals,
                'Channel': channel
            }
            
            data.append(record)
            
            # Progress indicator
            if (i + 1) % 100 == 0 or i == row_count - 1:
                progress = ((i + 1) / row_count) * 100
                print(f"📊 Progress: {i + 1:,}/{row_count:,} ({progress:.1f}%)")
        
        # Create DataFrame and save
        df = pd.DataFrame(data)
        
        # Sort by date for better readability
        df = df.sort_values('Date').reset_index(drop=True)
        
        # Save to CSV
        df.to_csv(output_file, index=False)
        
        # Generate summary
        self._print_summary(df, output_file, business_type)
    
    def _generate_budget(self, product: str, category: str, state: str, channel: str, business_type: str) -> int:
        """Generate realistic budget based on product, location, and business type"""
        
        # Base budget ranges by business type
        base_ranges = {
            'restaurant': (5000, 50000),
            'fitness': (10000, 80000),
            'tech': (20000, 200000),
            'fashion': (8000, 60000),
            'automotive': (15000, 150000),
            'beauty': (5000, 40000),
            'home': (10000, 100000),
            'general': (8000, 80000)
        }
        
        # Determine business category
        business_key = 'general'
        for key in base_ranges.keys():
            if key in business_type.lower():
                business_key = key
                break
        
        # Get base range
        min_budget, max_budget = base_ranges[business_key]
        base_budget = random.randint(min_budget, max_budget)
        
        # Add location variance (coastal/major cities are more expensive)
        major_states = ['California', 'New York', 'Texas', 'Florida', 'Illinois']
        if state in major_states:
            base_budget = int(base_budget * random.uniform(1.1, 1.4))
        
        # Add channel multiplier
        channel_multipliers = {
            'Online': random.uniform(0.8, 1.2),
            'Retail': random.uniform(0.9, 1.1),
            'Direct Sales': random.uniform(1.1, 1.4),
            'Partner': random.uniform(0.7, 1.0),
            'Wholesale': random.uniform(0.6, 0.9)
        }
        
        return int(base_budget * channel_multipliers[channel])
    
    def _generate_actuals(self, budget: int) -> int:
        """Generate actuals with realistic variance"""
        # Generate actuals with variance (-25% to +40% for more realistic business data)
        variance_factor = random.uniform(0.75, 1.4)
        return int(budget * variance_factor)
    
    def _print_summary(self, df: pd.DataFrame, output_file: str, business_type: str) -> None:
        """Print generation summary"""
        print(f"\n✅ Data generation complete!")
        print(f"📁 Output file: {output_file}")
        print(f"🏢 Business type: {business_type}")
        print(f"📊 Total rows: {len(df):,}")
        print(f"📅 Date range: {df['Date'].min()} to {df['Date'].max()}")
        print(f"🏛️ States: {df['State'].nunique()}")
        print(f"🏙️ Cities: {df['City'].nunique()}")
        print(f"📦 Products: {df['Product'].nunique()}")
        print(f"🏷️ Categories: {df['Category'].nunique()}")
        print(f"📺 Channels: {df['Channel'].nunique()}")
        print(f"💰 Budget range: ${df['Budget'].min():,} - ${df['Budget'].max():,}")
        print(f"💸 Actuals range: ${df['Actuals'].min():,} - ${df['Actuals'].max():,}")
        
        # Calculate variance statistics
        df['Variance'] = df['Actuals'] - df['Budget']
        df['Variance_Pct'] = (df['Variance'] / df['Budget']) * 100
        
        print(f"📈 Variance range: {df['Variance_Pct'].min():.1f}% to {df['Variance_Pct'].max():.1f}%")
        print(f"📊 Average variance: {df['Variance_Pct'].mean():.1f}%")
        
        # Show sample data
        print(f"\n📄 Sample data preview:")
        sample_df = df[['Date', 'Product', 'Category', 'State', 'Budget', 'Actuals', 'Channel']].head(3)
        print(sample_df.to_string(index=False))
        
        # Category breakdown
        print(f"\n📦 Category breakdown:")
        category_summary = df.groupby('Category').agg({
            'Budget': ['count', 'sum'],
            'Actuals': 'sum'
        }).round(0)
        category_summary.columns = ['Records', 'Budget_Total', 'Actuals_Total']
        print(category_summary.to_string())

def main():
    """Main command line interface"""
    parser = argparse.ArgumentParser(
        description='AI-Powered Sample CSV Data Generator for Quant Commander',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Interactive mode (recommended)
  python generate_sample_data.py --interactive
  
  # Quick generation with defaults
  python generate_sample_data.py --business "tech startup" --months 6 --records 500
  
  # Custom parameters
  python generate_sample_data.py --business "restaurant chain" --months 12 --records 1000 --output restaurant_data.csv
        """
    )
    
    parser.add_argument('--interactive', '-i',
                       action='store_true',
                       help='Run in interactive mode (recommended)')
    
    parser.add_argument('--business', '-b',
                       help='Type of business (e.g., "fitness equipment retailer")')
    
    parser.add_argument('--months', '-m',
                       type=int,
                       help='Number of months of data (1-24)')
    
    parser.add_argument('--records', '-r',
                       type=int,
                       help='Number of records to generate (50-10000)')
    
    parser.add_argument('--output', '-o',
                       help='Output CSV file name')
    
    parser.add_argument('--list-examples',
                       action='store_true',
                       help='List example business types and exit')
    
    args = parser.parse_args()
    
    # Handle list examples
    if args.list_examples:
        print("🏢 Example Business Types:")
        examples = [
            "fitness equipment retailer",
            "restaurant chain", 
            "tech startup",
            "fashion boutique",
            "automotive parts supplier",
            "beauty products distributor",
            "home furniture store",
            "electronics retailer",
            "coffee shop chain",
            "sporting goods store"
        ]
        for i, example in enumerate(examples, 1):
            print(f"  {i:2d}. {example}")
        return
    
    try:
        generator = SampleDataGenerator()
        
        if args.interactive or not all([args.business, args.months, args.records]):
            # Interactive mode
            config = generator.interactive_setup()
            
            generator.generate_data(
                start_date=config['start_date'],
                end_date=config['end_date'],
                row_count=config['records'],
                products=config['products'],
                product_mapping=config['product_mapping'],
                output_file=config['output_file'],
                business_type=config['business_type']
            )
        else:
            # Command line mode
            if not args.output:
                args.output = f"sample_data_{args.business.replace(' ', '_')}_{args.months}months.csv"
            
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=args.months * 30)
            
            # Generate products for the business type
            products, categories, product_mapping = generator.ai_generator.generate_products_and_categories(args.business)
            
            generator.generate_data(
                start_date=start_date.strftime('%Y-%m-%d'),
                end_date=end_date.strftime('%Y-%m-%d'),
                row_count=args.records,
                products=products,
                product_mapping=product_mapping,
                output_file=args.output,
                business_type=args.business
            )
        
    except ValueError as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print(f"\n❌ Generation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
