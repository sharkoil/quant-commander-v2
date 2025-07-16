import pandas as pd

def analyze_product_performance(file_path):
    """
    Analyzes product performance from a CSV file, identifying top and bottom products
    by year, quarter, and month.

    Args:
        file_path (str): The path to the CSV file.
    """
    df = pd.read_csv(file_path)
    df['Date'] = pd.to_datetime(df['Date'])
    df['Year'] = df['Date'].dt.year
    df['Quarter'] = df['Date'].dt.quarter
    df['Month'] = df['Date'].dt.month

    def get_top_bottom_products(grouped_df):
        """
        Calculates top and bottom products from a grouped DataFrame.

        Args:
            grouped_df (pd.DataFrame): DataFrame grouped by a time period.

        Returns:
            tuple: A tuple containing the top and bottom product series.
        """
        total_actuals = grouped_df['Actuals'].sum()
        grouped_df['Percentage'] = (grouped_df['Actuals'] / total_actuals) * 100
        top_product = grouped_df.loc[grouped_df['Actuals'].idxmax()]
        bottom_product = grouped_df.loc[grouped_df['Actuals'].idxmin()]
        return top_product, bottom_product

    # --- Year ---
    print("--- Analysis by Year ---")
    yearly_groups = df.groupby(['Year', 'Product']).agg({'Actuals': 'sum'}).reset_index()
    for year, group in yearly_groups.groupby('Year'):
        print(f"\nYear: {year}")
        top, bottom = get_top_bottom_products(group)
        print(f"  Top Product: {top['Product']} - Amount: ${top['Actuals']:,.2f}, Percentage: {top['Percentage']:.2f}%")
        print(f"  Bottom Product: {bottom['Product']} - Amount: ${bottom['Actuals']:,.2f}, Percentage: {bottom['Percentage']:.2f}%")


    # --- Quarter ---
    print("\n--- Analysis by Quarter ---")
    quarterly_groups = df.groupby(['Year', 'Quarter', 'Product']).agg({'Actuals': 'sum'}).reset_index()
    for (year, quarter), group in quarterly_groups.groupby(['Year', 'Quarter']):
        print(f"\nQuarter: Q{quarter} {year}")
        top, bottom = get_top_bottom_products(group)
        print(f"  Top Product: {top['Product']} - Amount: ${top['Actuals']:,.2f}, Percentage: {top['Percentage']:.2f}%")
        print(f"  Bottom Product: {bottom['Product']} - Amount: ${bottom['Actuals']:,.2f}, Percentage: {bottom['Percentage']:.2f}%")


    # --- Month ---
    print("\n--- Analysis by Month ---")
    monthly_groups = df.groupby(['Year', 'Month', 'Product']).agg({'Actuals': 'sum'}).reset_index()
    for (year, month), group in monthly_groups.groupby(['Year', 'Month']):
        print(f"\nMonth: {month}/{year}")
        top, bottom = get_top_bottom_products(group)
        print(f"  Top Product: {top['Product']} - Amount: ${top['Actuals']:,.2f}, Percentage: {top['Percentage']:.2f}%")
        print(f"  Bottom Product: {bottom['Product']} - Amount: ${bottom['Actuals']:,.2f}, Percentage: {bottom['Percentage']:.2f}%")


if __name__ == "__main__":
    analyze_product_performance("F:/GEMINI/Projects/beautiful/Sample Data/REG.csv")
