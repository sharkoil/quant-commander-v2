# 🚀 Quant Commander V2

**Advanced Financial Data Analysis Platform with AI-Powered Insights**

> *Transforming raw financial data into actionable intelligence through cutting-edge time series analysis, trend detection, and intelligent automation.*

[![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Ollama](https://img.shields.io/badge/Ollama-AI%20Powered-green)](https://ollama.ai/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC)](https://tailwindcss.com/)

## 🌟 Implemented Features

### 📊 **Period Variance Analyzer** ✅
- **Time Series Analysis**: Intelligent period-over-period variance calculations
- **Trend Detection**: Emoji-coded visual indicators (🔥📈📉💔) for instant trend recognition
- **Smart Scaling**: Card-based display that adapts to any number of periods
- **Statistical Insights**: Automatic calculation of averages, maximums, and trend summaries
- **HTML Rendering**: Beautiful, interactive cards with color-coded performance indicators

### 🎯 **Budget vs Actual Variance Analyzer** ✅
- **Performance Analysis**: Compares actual results against budgeted/planned values
- **Visual Indicators**: Emoji-coded performance status (🚀🎯⚠️💥) for quick assessment
- **Classification System**: Favorable, unfavorable, and on-target performance detection
- **Comprehensive Metrics**: Variance amounts, percentages, and performance scoring
- **Multi-Period Support**: Quarterly, monthly, or custom period analysis
- **Summary Statistics**: Overall performance score, favorable/unfavorable period counts

### 📈 **Trend Analysis Analyzer** ✅
- **Moving Averages**: Simple and exponential moving average calculations with configurable window sizes
- **Trend Direction**: Automatic classification of upward, downward, or stable trends
- **Trend Strength**: Assessment of weak, moderate, or strong trend intensity
- **Momentum Analysis**: Detection of accelerating, decelerating, or steady momentum patterns
- **Statistical Analysis**: Volatility measurement, growth rates, and trend consistency scoring
- **Visual Indicators**: Emoji-based trend representation (📈📉⚖️💪👍👌⚡🐌)
- **Comprehensive Reporting**: Detailed trend summaries with confidence metrics

### 🧠 **Column Intelligence System** ✅
- **Automatic Column Detection**: Smart pattern matching for budget, actual, forecast, and date columns
- **Semantic Analysis**: AI-powered column name interpretation and mapping
- **Confidence Scoring**: Reliability assessment for automatic column mappings
- **Fallback Mechanisms**: Manual mapping options when automatic detection fails
- **LLM Integration**: Uses local language models for complex column interpretation
- **Multi-Format Support**: Handles various CSV naming conventions and structures

### 🤖 **AI-Powered Analysis** ✅
- **Ollama Integration**: Local LLM for intelligent data interpretation
- **Function Calling**: Automatic argument extraction from CSV data
- **Natural Language**: Chat-based interface for intuitive data exploration
- **Smart Recommendations**: AI-driven insights and actionable recommendations
- **HTML Rendering**: Rich, interactive analysis results in chat interface

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | Next.js 15 + React 19 | Modern web application framework |
| **Language** | TypeScript | Type-safe development with enhanced IDE support |
| **Styling** | TailwindCSS | Utility-first CSS framework for rapid UI development |
| **AI/ML** | Ollama | Local large language model integration |
| **Testing** | Jest | Comprehensive unit and integration testing |
| **Code Quality** | ESLint + Prettier | Automated code formatting and linting |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Ollama (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/quant-commander-v2.git
cd quant-commander-v2

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see your application running!

### Setting up Ollama (Optional)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model (e.g., llama2)
ollama pull llama2

# Start Ollama service
ollama serve
```

## 💡 Usage Examples

### Period Variance Analysis

The Period Variance Analyzer automatically detects time series patterns in your data:

```typescript
// Period Variance Example
const timeSeriesData = [
  { date: '2024-01', value: 1000 },
  { date: '2024-02', value: 1200 },
  { date: '2024-03', value: 950 }
];

// Budget Variance Example  
const budgetData = [
  { period: '2024-Q1', actual: 275000, budget: 250000 },
  { period: '2024-Q2', actual: 320000, budget: 300000 },
  { period: '2024-Q3', actual: 280000, budget: 320000 }
];

// Automatic analysis with trend detection
const periodAnalysis = calculatePeriodVariance(timeSeriesData);
const budgetAnalysis = calculateBudgetVariance(budgetData);
```

**Sample Output:**
- 🔥 **Feb 2024**: +20.0% (Significant Growth)
- 💔 **Mar 2024**: -20.8% (Concerning Decline)
- � **Q2 2024**: +6.7% (Strong Performance vs Budget)
- ⚠️ **Q3 2024**: -12.5% (Significant Underperformance)

### AI Chat Interface

Simply upload your CSV data and ask natural language questions:

```
"Analyze the period variance for our sales data"
"Show me trends in revenue over the last 12 months"
"What periods had the highest growth?"
"Compare our actual performance against budget"
"Which quarters exceeded budget expectations?"
"Show me budget variance analysis for this year"
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main application page with test buttons
├── components/            # Reusable React components
│   ├── ChatUI.tsx        # AI chat interface with HTML rendering
│   ├── DataGrid.tsx      # Data visualization components
│   └── DocumentUploadUI.tsx # File upload interface
├── lib/                   # Core business logic
│   ├── analyzers/        # Financial analysis engines
│   │   ├── periodVariance.ts     # Period variance calculator
│   │   ├── budgetVariance.ts     # Budget vs actual analyzer
│   │   ├── trendAnalysis.ts      # Trend analysis with moving averages
│   │   ├── columnIntelligence.ts # Smart column detection
│   │   └── csvProcessor.ts       # Intelligent CSV processing
│   ├── test/             # Test utilities and harnesses
│   │   ├── periodVarianceTest.ts     # Period variance testing
│   │   ├── budgetVarianceTest.ts     # Budget variance testing
│   │   ├── trendAnalysisTest.ts      # Trend analysis testing
│   │   └── columnIntelligenceTest.ts # Column detection testing
│   └── ollama.ts         # AI integration utilities
└── test/                 # Unit and integration tests
```

## 🧪 Testing

We maintain high code quality with comprehensive testing:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- periodVariance
npm test -- budgetVariance
npm test -- trendAnalysis
```

**Current Test Coverage**: 85%+ (exceeding quality standards)

### Testing Features
- ✅ **Period Variance Analyzer**: Complete test suite with multiple time series scenarios
- ✅ **Budget Variance Analyzer**: Comprehensive testing with favorable/unfavorable/on-target cases
- ✅ **Trend Analysis Analyzer**: Full testing with upward/downward/volatile trend scenarios
- ✅ **Column Intelligence**: Testing automatic detection and manual mapping fallbacks
- ✅ **Interactive Testing**: In-browser test buttons for immediate validation

## 🎨 Design Principles

### Code Quality Standards
- ✅ **Modular Design**: Small, focused functions and components
- ✅ **Type Safety**: Comprehensive TypeScript interfaces and type hints
- ✅ **Test Coverage**: Unit tests for all business logic
- ✅ **Documentation**: Inline comments for novice developer understanding
- ✅ **Consistent Naming**: Descriptive function and variable names

### UI/UX Philosophy
- **Responsive Design**: Works seamlessly across all device sizes
- **Visual Hierarchy**: Color-coded indicators for instant data comprehension
- **Progressive Enhancement**: Core functionality works without AI features
- **Accessibility**: WCAG compliant interface design

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run test suite
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Contributing Guidelines
1. **Small, Testable Changes**: Follow the "one feature per commit" principle
2. **Test Coverage**: All new code must include corresponding tests
3. **Documentation**: Update README.md for any new features
4. **Type Safety**: Use TypeScript interfaces for all data structures

## 📈 Performance

- **Build Size**: ~63.4 kB (optimized Next.js bundle)
- **First Load JS**: 165 kB (includes React 19 and dependencies)
- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices)

## 🛣️ Roadmap

### ✅ **Phase 1: Core Analytics** *(COMPLETED)*
- [x] Period Variance Analyzer with time series analysis
- [x] Budget vs Actual Variance Analyzer with performance classification
- [x] Trend Analysis Analyzer with moving averages and momentum detection
- [x] Column Intelligence System with automatic CSV mapping
- [x] AI Chat Interface with function calling
- [x] HTML Card Rendering with visual indicators
- [x] Comprehensive Test Suites for all analyzers

### 🔄 **Phase 2: Advanced Analytics** *(IN PROGRESS)*
- [ ] **Top N Analysis**: Identify highest/lowest performing categories with ranking algorithms
- [ ] **Outlier Detection**: Statistical anomaly detection with confidence intervals
- [ ] **Contribution Analysis**: Calculate percentage contributions to totals with hierarchical breakdowns
- [ ] **Seasonal Analysis**: Detect recurring patterns and seasonal trends
- [ ] **Correlation Analysis**: Multi-dimensional data relationship detection
- [ ] **Forecast Variance**: Compare forecasted vs actual vs budget performance

### 🎯 **Phase 3: Data Management** *(PLANNED)*
- [ ] **CSV Import/Export**: Enhanced file handling with format validation
- [ ] **Data Persistence**: Save analysis results and historical data
- [ ] **Multi-dataset Support**: Compare data across multiple CSV files
- [ ] **Data Validation**: Automatic data quality checks and cleansing
- [ ] **Template Library**: Pre-built analysis templates for common use cases

### 🚀 **Phase 4: Enterprise Features** *(FUTURE)*
- [ ] **User Authentication**: Multi-user support with role-based access
- [ ] **Dashboard Builder**: Custom dashboard creation and sharing
- [ ] **Automated Reporting**: Scheduled analysis and email reports
- [ ] **API Integration**: Connect to external data sources (databases, APIs)
- [ ] **Advanced Visualizations**: Interactive charts and graphs
- [ ] **Collaboration Tools**: Comments, annotations, and sharing features

### 🔬 **Phase 5: Advanced AI** *(RESEARCH)*
- [ ] **Predictive Analytics**: Machine learning forecasting models
- [ ] **Natural Language Queries**: Advanced LLM-powered data exploration
- [ ] **Automated Insights**: AI-generated analysis recommendations
- [ ] **Custom Model Training**: User-specific AI model fine-tuning
- [ ] **Real-time Analysis**: Streaming data processing capabilities

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Documentation**: Check our [Wiki](https://github.com/yourusername/quant-commander-v2/wiki)
- **Issues**: Report bugs via [GitHub Issues](https://github.com/yourusername/quant-commander-v2/issues)
- **Discussions**: Join our [Community Discussions](https://github.com/yourusername/quant-commander-v2/discussions)

---

**Built with ❤️ by the Quant Commander team**

*Empowering financial professionals with AI-driven analytics and intuitive data visualization.*
