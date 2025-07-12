below are 5 similar examples of how to accuractely calculate teh desired analysis of any oploaded data.  The default action in the UI and the default analysis on-load show all follow this guidance.

approach 1

1. **Calculation - Period-Based Variance**

Period-based variance is calculated by subtracting the period's actual value from its budgeted value. It measures how much a budget deviates from actual performance over time. This can provide insights into financial health and profitability, helping to understand trends and anomalies in sales or revenue growth.

2. **Sample Data** 

| Period | Budget | Actual | Variance (Actual - Budget) |
|--------|--------|---------|----------------------------|
| 1      | 50     | 47      | -3                         |
| 2      | 60     | 58      | -2                         |
| 3      | 70     | 69      | 1                          |
| 4      | 65     | 75      | 10                         |

3. **Math Proof** 

For each period, we calculate the variance as follows:
- Variance (Actual - Budget) = Actual - Budget
In this case, for example, for Period 1, the calculation would be:
- Actual = 47 and Budget = 50
- Hence, Actual - Budget = -3

This process is applied to every period in our dataset.

4. **Pseudocode**

```python
def calculate_variance(budgeted_data, actual_data):
    return actual_data - budgeted_data
```
Arguments: `budgeted_data` (the value of the variable in question at the start of the period) and `actual_data` (the final value of the variable).

5. **Arguments** 

- `budgeted_data` : The starting budget for a certain period. This could be daily budgets, monthly budgets, or annual budgets depending on your data and needs.
- `actual_data` : The actual outcome after applying all changes within the time frame of the budgeted data. Again, this can represent daily sales, monthly revenues, or annual profits based on your data set.
  
This information should help you implement a function to calculate period-based variance in any programming language that supports mathematical operations. 

Please note: This is a simple implementation and might not cover all the complexities of real business scenarios like handling seasonal fluctuations, dealing with large datasets, etc. For such cases, more advanced statistical analysis or machine learning methods would be required to get accurate results.


approach 2 
1. **Calculation - Period-Based Variance**

Period-based variance is calculated by subtracting the period's actual value from its budgeted value. It measures how much a budget deviates from actual performance over time. This can provide insights into financial health and profitability, helping to understand trends and anomalies in sales or revenue growth.

2. **Sample Data** 

| Period | Budget | Actual | Variance (Actual - Budget) |
|--------|--------|---------|----------------------------|
| 1      | 50     | 47      | -3                         |
| 2      | 60     | 58      | -2                         |
| 3      | 70     | 69      | 1                          |
| 4      | 65     | 75      | 10                         |

3. **Math Proof** 

For each period, we calculate the variance as follows:
- Variance (Actual - Budget) = Actual - Budget
In this case, for example, for Period 1, the calculation would be:
- Actual = 47 and Budget = 50
- Hence, Actual - Budget = -3

This process is applied to every period in our dataset.

4. **Pseudocode**

```python
def calculate_variance(budgeted_data, actual_data):
    return actual_data - budgeted_data
```
Arguments: `budgeted_data` (the value of the variable in question at the start of the period) and `actual_data` (the final value of the variable).

5. **Arguments** 

- `budgeted_data` : The starting budget for a certain period. This could be daily budgets, monthly budgets, or annual budgets depending on your data and needs.
- `actual_data` : The actual outcome after applying all changes within the time frame of the budgeted data. Again, this can represent daily sales, monthly revenues, or annual profits based on your data set.
  
This information should help you implement a function to calculate period-based variance in any programming language that supports mathematical operations. 

Please note: This is a simple implementation and might not cover all the complexities of real business scenarios like handling seasonal fluctuations, dealing with large datasets, etc. For such cases, more advanced statistical analysis or machine learning methods would be required to get accurate results.

approach 3

### **1. Calculation - WoW Variance**  
**Approach:**  
- **Definition:** Compares current period value to the previous period value (e.g., Week over Week, Month over Month).  
- **Formula:**  
  - **Variance:** `Current Value - Previous Value`  
  - **Percentage Variance:** `(Current Value - Previous Value) / Previous Value * 100`  
- **Adaptability:** Handles varying period types (WoW, MoM, YoY, QoQ) by dynamically referencing the appropriate prior period.  

---

### **2. Sample Data**  
| Period       | Category | Value |  
|--------------|----------|-------|  
| Week 1       | Sales    | 100   |  
| Week 2       | Sales    | 105   |  
| Month 1      | Revenue  | 200   |  
| Month 2      | Revenue  | 210   |  
| Q1           | Expenses | 500   |  
| Q2           | Expenses | 550   |  
| Year 1       | Profit   | 300   |  
| Year 2       | Profit   | 320   |  

---

### **3. Math Proof**  
**Example:** Calculate WoW Variance for Week 2 Sales.  
- **Current Value:** 105 (Week 2)  
- **Previous Value:** 100 (Week 1)  
- **Variance:** `105 - 100 = 5`  
- **Percentage Variance:** `(5 / 100) * 100 = 5%`  

**Result:**  
- **Variance:** +5  
- **Percentage Variance:** +5% (Favorable)  

---

### **4. Pseudocode**  
```python
FUNCTION calculate_period_variance(current_value, previous_value, period_type, return_percentage=False):
    if period_type == "week":
        prev_period = get_previous_week_value(previous_value)
    elif period_type == "month":
        prev_period = get_previous_month_value(previous_value)
    elif period_type == "quarter":
        prev_period = get_previous_quarter_value(previous_value)
    elif period_type == "year":
        prev_period = get_previous_year_value(previous_value)
    else:
        raise ValueError("Invalid period type")
    
    variance = current_value - prev_period
    if return_percentage:
        percentage = (variance / prev_period) * 100
        return percentage
    return variance
```

---

### **5. Arguments**  
- `current_value`: Numeric value for the current period.  
- `previous_value`: Numeric value for the prior period.  
- `period_type`: String specifying the period type (e.g., "week", "month", "quarter", "year").  
- `return_percentage`: Boolean to determine if percentage variance is returned.  

---

### **1. Calculation - Budget vs Actual Variance per Period**  
**Approach:**  
- **Definition:** Compares actual value to budgeted value for the same period.  
- **Formula:**  
  - **Variance:** `Actual Value - Budget Value`  
  - **Percentage Variance:** `(Actual Value - Budget Value) / Budget Value * 100`  
- **Adaptability:** Applies to any period type (WoW, MoM, etc.) by using the same period for actual and budgeted data.  

---

### **2. Sample Data**  
| Period       | Category | Actual | Budget |  
|--------------|----------|--------|--------|  
| Week 1       | Sales    | 105    | 100    |  
| Month 1      | Revenue  | 210    | 200    |  
| Q1           | Expenses | 550    | 500    |  
| Year 1       | Profit   | 320    | 300    |  

---

### **3. Math Proof**  
**Example:** Calculate Budget vs Actual Variance for Month 1 Revenue.  
- **Actual Value:** 210  
- **Budget Value:** 200  
- **Variance:** `210 - 200 = 10`  
- **Percentage Variance:** `(10 / 200) * 100 = 5%`  

**Result:**  
- **Variance:** +10  
- **Percentage Variance:** +5% (Favorable)  

---

### **4. Pseudocode**  
```python
FUNCTION calculate_budget_variance(actual_value, budget_value, period_type, return_percentage=False):
    variance = actual_value - budget_value
    if return_percentage:
        percentage = (variance / budget_value) * 100
        return percentage
    return variance
```

---

### **5. Arguments**  
- `actual_value`: Numeric value for the actual period.  
- `budget_value`: Numeric value for the budgeted period.  
- `period_type`: String specifying the period type (e.g., "week", "month", etc.).  
- `return_percentage`: Boolean to determine if percentage variance is returned.  

---

### **1. Calculation - Trend Analysis**  
**Approach:**  
- **Definition:** Identifies upward/downward trends using moving averages or linear regression.  
- **Formula:**  
  - **Moving Average:** `(Sum of N periods) / N`  
  - **Trend Direction:** Compare current period to previous moving average.  
- **Adaptability:** Handles varying period types (WoW, MoM, etc.) by grouping data by period.  

---

### **2. Sample Data**  
| Period       | Category | Value |  
|--------------|----------|-------|  
| Week 1       | Sales    | 100   |  
| Week 2       | Sales    | 105   |  
| Week 3       | Sales    | 110   |  
| Week 4       | Sales    | 115   |  
| Month 1      | Revenue  | 200   |  
| Month 2      | Revenue  | 210   |  
| Month 3      | Revenue  | 220   |  

---

### **3. Math Proof**  
**Example:** Calculate 3-Period Moving Average for Month 3 Revenue.  
- **Periods:** 200 (Month 1), 210 (Month 2), 220 (Month 3)  
- **Moving Average:** `(200 + 210 + 220) / 3 = 630 / 3 = 210`  
- **Trend Direction:** Compare Month 3 (220) to Moving Average (210) → Upward trend.  

**Result:**  
- **Moving Average:** 210  
- **Trend:** Upward (220 > 210)  

---

### **4. Pseudocode**  
```python
FUNCTION analyze_trend(data, period_type, window_size=3):
    grouped_data = GROUP BY period_type (e.g., month, week)
    moving_averages = []
    for i in range(len(grouped_data)):
        if i >= window_size - 1:
            window = grouped_data[i - window_size + 1 : i + 1]
            ma = sum(window) / window_size
            moving_averages.append(ma)
    trend = "upward" if grouped_data[-1] > moving_averages[-1] else "downward"
    return trend
```

---

### **5. Arguments**  
- `data`: Dataset with period and value columns.  
- `period_type`: String specifying the period type (e.g., "week", "month").  
- `window_size`: Integer for the moving average window (default: 3).  

---

### **1. Calculation - Top N and Bottom N by Category**  
**Approach:**  
- **Definition:** Sorts values by category and selects top/bottom N entries.  
- **Formula:**  
  - **Sorting:** `Sort by Category`  
  - **Selection:** `Slice top N or bottom N entries`  
- **Adaptability:** Works for any category (e.g., regions, products) and period types.  

---

### **2. Sample Data**  
| Category | Period | Value |  
|----------|--------|-------|  
| Product A | Week 1 | 100   |  
| Product B | Week 1 | 120   |  
| Product C | Week 1 | 90    |  
| Product D | Week 1 | 150   |  
| Product E | Week 1 | 80    |  

---

### **3. Math Proof**  
**Example:** Top 2 and Bottom 2 by Value for Week 1.  
- **Sorted Values:** 150 (D), 120 (B), 100 (A), 90 (C), 80 (E)  
- **Top 2:** 150 (D), 120 (B)  
- **Bottom 2:** 80 (E), 90 (C)  

**Result:**  
- **Top 2:** Product D (150), Product B (120)  
- **Bottom 2:** Product E (80), Product C (90)  

---

### **4. Pseudocode**  
```python
FUNCTION get_top_bottom_by_category(data, category, n, top=True):
    sorted_data = SORT data BY category descending
    if top:
        result = sorted_data[:n]
    else:
        result = sorted_data[-n:]
    return result
```

---

### **5. Arguments**  
- `data`: Dataset with category and value columns.  
- `category`: String specifying the category to group by (e.g., "product", "region").  
- `n`: Integer for the number of top/bottom entries.  
- `top`: Boolean to select top N (True) or bottom N (False).

approach 4
Okay, let’s implement the requested functional document, strictly adhering to the specified format.  We’ll focus on delivering concise, operational logic.  We’ll base the examples on the provided data.

---

### 1. Period-Based Variance (Week-over-Week – WoW)

**Description of Approach:** Calculates variance based on the difference between current and prior week's performance.  Uses a simple subtraction and percentage calculation.

**Sample Data:**

| Date       | Sales (Units) | Revenue ($) |
|------------|---------------|-------------|
| 2024-01-01 | 120           | 1,200       |
| 2024-01-08 | 135           | 1,350       |
| 2024-01-15 | 140           | 1,400       |
| 2024-01-22 | 150           | 1,500       |

**Math Proof:**

1.  **Calculate WoW Variance (Revenue):**
    *   Variance = Current Period Revenue - Previous Period Revenue
    *   Variance = $1,500 - $1,350 = $150
2.  **Calculate WoW Percentage Variance (Revenue):**
    *   Percentage Variance = (Variance / Previous Period Revenue) * 100
    *   Percentage Variance = ($150 / $1,350) * 100 = 11.11%

**Pseudocode:**

```
FUNCTION calculate_wow_variance(current_data, previous_data, metric):
    // Input: current_data (dictionary of current period metrics), previous_data (dictionary of previous period metrics)
    //        metric (string, e.g., "sales", "revenue")
    // Output: A dictionary containing variance and percentage variance

    variance = current_data[metric] - previous_data[metric]
    percentage_variance = (variance / previous_data[metric]) * 100
    return {
        "variance": variance,
        "percentage_variance": percentage_variance
    }
```

**Arguments:**

*   `current_data`: Dictionary –  { “sales”: <current_value>, “revenue”: <current_value> }
*   `previous_data`: Dictionary – { “sales”: <previous_value>, “revenue”: <previous_value> }
*   `metric`: String –  "sales" or "revenue".


---

### 2. Budget vs. Actual Variance – Per Period

**Description of Approach:** Calculates the difference between the actual performance for each period and the budget.  Handles variations in period types.

**Sample Data:** (Based on the data above)

| Date       | Actual Sales | Budget Sales | Actual Revenue | Budget Revenue |
|------------|--------------|--------------|----------------|----------------|
| 2024-01-01 | 120          | 100          | 1,200          | 1,000          |
| 2024-01-08 | 135          | 110          | 1,350          | 1,100          |
| 2024-01-15 | 140          | 130          | 1,400          | 1,300          |
| 2024-01-22 | 150          | 160          | 1,500          | 1,600          |

**Math Proof:**

| Metric             | Calculation            | Result      |
|--------------------|------------------------|-------------|
| Sales Variance      | 150 – 130              | 20          |
| Revenue Variance    | 1,500 – 1,300           | 200         |

**Pseudocode:**

```
FUNCTION calculate_budget_variance(current_data, budget_data, metric):
    // Input: current_data (dictionary), budget_data (dictionary), metric (string)
    // Output: Dictionary containing variance and percentage

    variance = current_data[metric] - budget_data[metric]
    percentage_variance = (variance / budget_data[metric]) * 100
    return {
        "variance": variance,
        "percentage_variance": percentage_variance
    }
```

**Arguments:**

*   `current_data`: Dictionary – {“actual_sales”: <actual_value>, “actual_revenue”: <actual_value>}
*   `budget_data`: Dictionary – {“budget_sales”: <budget_value>, “budget_revenue”: <budget_value>}
*   `metric`: String - "sales" or "revenue"


---

### 3. Trend Analysis (Moving Average - Simple)

**Description of Approach:** Calculates a simple moving average (3-period) for revenue over time.  Simple trend identification.

**Sample Data:** (From the previous examples)

| Date       | Revenue ($) |
|------------|-------------|
| 2024-01-01 | 1,200       |
| 2024-01-08 | 1,350       |
| 2024-01-15 | 1,400       |
| 2024-01-22 | 1,500       |

**Math Proof:**

1.  **3-Period Moving Average (Revenue):**
    *   MA1 (2024-01-01): (1200 + 1350 + 1400) / 3 = 1350
    *   MA2 (2024-01-08): (1350 + 1400 + 1500) / 3 = 1400
    *   MA3 (2024-01-15): (1400+1500+1400) / 3 = 1400

**Pseudocode:**

```python
def calculate_moving_average(data, window_size):
    # Check if there's enough data
    if len(data) < window_size:
        return None  # Not enough data

    # Calculate the moving average
    moving_average = sum(data[-window_size:]) / window_size
    return moving_average
```

**Arguments:**

*   `data`: List of numeric values
*   `window_size`: Integer – The number of periods to include in the moving average (e.g., 3 for a 3-period moving average).

---

### 4. Top N and Bottom N by Category

**Description of Approach:** Sorts data based on a given metric and selects the top N and bottom N results.

**Sample Data:** (Using the Revenue data across all periods)

| Date       | Revenue ($) |
|------------|-------------|
| 2024-01-01 | 1,200       |
| 2024-01-08 | 1,350       |
| 2024-01-15 | 1,400       |
| 2024-01-22 | 1,500       |

**Top 2 Revenue:**

| Date       | Revenue ($) |
|------------|-------------|
| 2024-01-22 | 1,500       |
| 2024-01-08 | 1,350       |

**Bottom 2 Revenue:**

| Date       | Revenue ($) |
|------------|-------------|
| 2024-01-01 | 1,200       |
| 2024-01-15 | 1,400       |

**Pseudocode (Top N - Revenue):**

```python
def get_top_n(data, n):
    # Sort data by revenue in descending order
    sorted_data = sorted(data, key=lambda x: x[1], reverse=True) #lambda function to sort based on revenue

    # Return the top N elements
    return sorted_data[:n]
```

**Arguments:**

*   `data`: List of tuples (date, revenue)
*   `n`: Integer - The number of top elements to return.

This structure provides a functional, directly usable documentation. Each section addresses the requested aspect with the minimum needed details for implementation.

approach 5
## 1. Period-Based Variance (WoW, MoM, YoY, QoQ)

**1. Calculation** - Calculate the percentage change between two consecutive periods. This variance represents the change from the previous period to the current period. Periodicity (WoW, MoM, YoY, QoQ) is determined by the selected comparison periods.

**2. Sample Data** - (From Source 2 – Sales Data)

| Period   | Sales (USD) |
|----------|-------------|
| 2023-10-27 | 35,887    |
| 2023-11-03 | 36,210    |
| 2023-11-10 | 36,550    |
| 2023-11-17 | 36,800    |
| 2023-11-24 | 37,050    |

**3. Math Proof** - WoW Variance (Using 2023-11-03 vs. 2023-10-27)

Variance = (36,210 - 35,887) / 35,887 * 100 ≈ 0.97%

**4. Pseudocode**

```pseudocode
FUNCTION calculate_period_variance(current_period_value, previous_period_value, period_type):
    variance = (current_period_value - previous_period_value) / previous_period_value * 100
    RETURN variance
```

**5. Arguments**

*   `current_period_value`: Numeric. Value for the current period.
*   `previous_period_value`: Numeric. Value for the preceding period.
*   `period_type`: String.  One of: "WoW", "MoM", "QoQ", "YoY" –  affects how the previous period is determined.

---

## 2. Budget vs Actual Variance per Period

**1. Calculation** - Calculate the difference between actual values and budgeted values for a given period. This shows how actual performance deviated from the plan.

**2. Sample Data** - (From Source 3 – Regional Sales Data)

| Period   | Region | Budgeted Sales | Actual Sales |
|----------|--------|----------------|--------------|
| Q3 2023 | North | 50,000          | 55,000         |
| Q3 2023 | South | 45,000          | 42,000         |
| Q3 2023 | East  | 60,000          | 62,000         |

**3. Math Proof** - Variance (North Region, Q3 2023)

Variance = 55,000 - 50,000 = 5,000

**4. Pseudocode**

```pseudocode
FUNCTION calculate_budget_variance(actual_value, budgeted_value):
    variance = actual_value - budgeted_value
    RETURN variance
```

**5. Arguments**

*   `actual_value`: Numeric. Actual value for a given period.
*   `budgeted_value`: Numeric. Budgeted value for the same period.

---

## 3. Trend Analysis

**1. Calculation** - Analyze data over time to identify patterns and direction (increasing, decreasing, stable).  Typically involves calculating moving averages or using regression analysis.

**2. Sample Data** - (From Source 1 - Monthly Sales)

| Month       | Sales (USD) |
|-------------|-------------|
| 2023-01    | 100,000   |
| 2023-02    | 105,000   |
| 2023-03    | 110,000   |
| 2023-04    | 115,000   |
| 2023-05    | 120,000   |

**3. Math Proof** - Moving Average (3-period)

*   Period 1-3: (100,000 + 105,000 + 110,000) / 3 = 105,000
*   Period 2-4: (105,000 + 110,000 + 115,000) / 3 = 110,000
*   Trend: Increasing (110,000 > 105,000)

**4. Pseudocode**

```pseudocode
FUNCTION analyze_trend(data, window_size):
    moving_average = calculate_moving_average(data, window_size)
    trend_direction = determine_trend(moving_average)
    RETURN trend_direction
```

**5. Arguments**

*   `data`: Array of Numeric values representing time-series data.
*   `window_size`: Integer – determines the period for calculating the moving average.

---

## 4. Top N and Bottom N by Category

**1. Calculation** - Identify the top 'N' highest and bottom 'N' lowest values within a defined category.

**2. Sample Data** - (From Source 2 - Product Sales by Category)

| Product | Category | Sales (USD) |
|---------|----------|-------------|
| A       | Electronics | 20,000         |
| B       | Clothing    | 15,000         |
| C       | Electronics | 25,000         |
| D       | Clothing    | 10,000         |
| E       | Home Goods | 18,000         |

**3. Math Proof** - Top 2, Bottom 2 (by Sales)

*   Sorted Data (by Sales Descending):
    *   C: 25,000
    *   A: 20,000
    *   E: 18,000
    *   B: 15,000
    *   D: 10,000
*   Top 2: C, A
*   Bottom 2: D, B

**4. Pseudocode**

```pseudocode
FUNCTION get_top_bottom_n(data, n, category):
    grouped_data = GROUP BY category (data)
    sorted_data = SORT BY sales DESCENDING (grouped_data)
    top_n = GET first N rows (sorted_data)
    bottom_n = GET last N rows (sorted_data)
    RETURN top_n, bottom_n
```

**5. Arguments**

*   `data`: Array of records, each with a category and a numeric sales value.
*   `n`: Integer – the number of top/bottom items to retrieve.
*   `category`: String - the category to filter the data by (optional).

approach 6

## 6. Contribution Analysis

**1. Calculation** - Determine what percentage each category contributes to the total, identifying the most and least significant contributors. This helps understand which elements drive overall performance.

**2. Sample Data** - (Product Revenue Contribution)

| Product | Category | Revenue (USD) |
|---------|----------|---------------|
| iPhone  | Electronics | 45,000      |
| MacBook | Electronics | 35,000      |
| T-Shirt | Clothing    | 12,000      |
| Jeans   | Clothing    | 8,000       |
| Sofa    | Furniture   | 25,000      |
| Chair   | Furniture   | 15,000      |

**3. Math Proof** - Contribution Analysis

Total Revenue = 45,000 + 35,000 + 12,000 + 8,000 + 25,000 + 15,000 = 140,000

Individual Contributions:
- iPhone: (45,000 / 140,000) × 100 = 32.14%
- MacBook: (35,000 / 140,000) × 100 = 25.00%
- Sofa: (25,000 / 140,000) × 100 = 17.86%
- Chair: (15,000 / 140,000) × 100 = 10.71%
- T-Shirt: (12,000 / 140,000) × 100 = 8.57%
- Jeans: (8,000 / 140,000) × 100 = 5.71%

Category Contributions:
- Electronics: (80,000 / 140,000) × 100 = 57.14%
- Furniture: (40,000 / 140,000) × 100 = 28.57%
- Clothing: (20,000 / 140,000) × 100 = 14.29%

**4. Pseudocode**

```pseudocode
FUNCTION calculate_contribution_analysis(data, groupby_column, value_column):
    total_value = SUM(data[value_column])
    grouped_data = GROUP BY groupby_column (data)
    contributions = []
    
    FOR each group IN grouped_data:
        group_total = SUM(group[value_column])
        contribution_percentage = (group_total / total_value) * 100
        contributions.append({
            "category": group.name,
            "value": group_total,
            "contribution_percentage": contribution_percentage
        })
    
    sorted_contributions = SORT contributions BY contribution_percentage DESC
    RETURN sorted_contributions
```

**5. Arguments**

- `data`: Array of records with category and numeric value columns
- `groupby_column`: String - the column to group by (e.g., "category", "product", "region")
- `value_column`: String - the numeric column to calculate contributions for (e.g., "revenue", "sales", "profit")

---

approach 7

## 7. Outlier Detection

**1. Calculation** - Identify data points that deviate significantly from the normal pattern using statistical methods like IQR (Interquartile Range) or Z-score. Outliers can indicate data errors, exceptional performance, or unusual market conditions.

**2. Sample Data** - (Weekly Sales Performance)

| Week | Sales (USD) |
|------|-------------|
| 1    | 12,500      |
| 2    | 13,200      |
| 3    | 12,800      |
| 4    | 13,500      |
| 5    | 12,900      |
| 6    | 25,000      | ← Potential outlier
| 7    | 13,100      |
| 8    | 12,700      |
| 9    | 13,300      |
| 10   | 2,500       | ← Potential outlier

**3. Math Proof** - IQR Method for Outlier Detection

Step 1: Sort data: [2,500, 12,500, 12,700, 12,800, 12,900, 13,100, 13,200, 13,300, 13,500, 25,000]

Step 2: Calculate quartiles:
- Q1 (25th percentile) = 12,700
- Q3 (75th percentile) = 13,300
- IQR = Q3 - Q1 = 13,300 - 12,700 = 600

Step 3: Calculate outlier boundaries:
- Lower bound = Q1 - (1.5 × IQR) = 12,700 - (1.5 × 600) = 11,800
- Upper bound = Q3 + (1.5 × IQR) = 13,300 + (1.5 × 600) = 14,200

Step 4: Identify outliers:
- Week 6: 25,000 > 14,200 (Upper outlier)
- Week 10: 2,500 < 11,800 (Lower outlier)

**Alternative: Z-Score Method**

Mean = 13,350, Standard Deviation = 6,247
- Week 6 Z-score: (25,000 - 13,350) / 6,247 = 1.87
- Week 10 Z-score: (2,500 - 13,350) / 6,247 = -1.74

(Typically, |Z-score| > 2 or 3 indicates outliers)

**4. Pseudocode**

```pseudocode
FUNCTION detect_outliers_iqr(data, column):
    sorted_data = SORT data BY column
    n = LENGTH(sorted_data)
    
    q1_index = n * 0.25
    q3_index = n * 0.75
    q1 = sorted_data[q1_index][column]
    q3 = sorted_data[q3_index][column]
    iqr = q3 - q1
    
    lower_bound = q1 - (1.5 * iqr)
    upper_bound = q3 + (1.5 * iqr)
    
    outliers = []
    FOR each record IN data:
        IF record[column] < lower_bound OR record[column] > upper_bound:
            outliers.append({
                "record": record,
                "type": "lower" IF record[column] < lower_bound ELSE "upper",
                "deviation": ABS(record[column] - (q1 + q3)/2)
            })
    
    RETURN outliers

FUNCTION detect_outliers_zscore(data, column, threshold=2):
    mean_value = MEAN(data[column])
    std_dev = STANDARD_DEVIATION(data[column])
    
    outliers = []
    FOR each record IN data:
        z_score = (record[column] - mean_value) / std_dev
        IF ABS(z_score) > threshold:
            outliers.append({
                "record": record,
                "z_score": z_score,
                "deviation": ABS(record[column] - mean_value)
            })
    
    RETURN outliers
```

**5. Arguments**

- `data`: Array of records with numeric values
- `column`: String - the numeric column to analyze for outliers (e.g., "sales", "revenue")
- `threshold`: Float - Z-score threshold for outlier detection (typically 2 or 3)

**Use Cases:**
- **Quality Control**: Identify unusual sales performance periods
- **Data Validation**: Find potential data entry errors
- **Exception Analysis**: Understand extraordinary business events
- **Forecasting**: Remove outliers for more accurate trend analysis
