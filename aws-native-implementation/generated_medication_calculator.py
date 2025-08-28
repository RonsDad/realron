def calculate_savings(brand_price, generic_price, quantity):
    """Calculate monthly and yearly savings between brand and generic medications."""
    monthly_savings = (brand_price - generic_price) * quantity
    yearly_savings = monthly_savings * 12
    return monthly_savings, yearly_savings

def get_valid_number(prompt):
    """Get valid numeric input from user with error handling."""
    while True:
        try:
            value = float(input(prompt))
            if value < 0:
                print("Please enter a positive number.")
                continue
            return value
        except ValueError:
            print("Please enter a valid number.")

def main():
    print("\n=== Medication Cost Calculator ===")
    print("Compare brand name and generic medication costs")
    print("---------------------------------------")

    try:
        # Get medication information
        med_name = input("\nEnter medication name: ").strip()
        
        # Get prices
        brand_price = get_valid_number(f"Enter {med_name} brand price per pill: $")
        generic_price = get_valid_number(f"Enter {med_name} generic price per pill: $")
        
        # Get quantity
        monthly_quantity = get_valid_number("Enter number of pills per month: ")

        # Calculate costs
        monthly_brand_cost = brand_price * monthly_quantity
        monthly_generic_cost = generic_price * monthly_quantity
        
        # Calculate savings
        monthly_savings, yearly_savings = calculate_savings(
            brand_price, generic_price, monthly_quantity
        )

        # Display results
        print("\n=== Cost Comparison Results ===")
        print(f"\nMedication: {med_name}")
        print("\nMonthly Costs:")
        print(f"Brand Name: ${monthly_brand_cost:.2f}")
        print(f"Generic: ${monthly_generic_cost:.2f}")
        print(f"Monthly Savings: ${monthly_savings:.2f}")
        
        print("\nYearly Costs:")
        print(f"Brand Name: ${monthly_brand_cost * 12:.2f}")
        print(f"Generic: ${monthly_generic_cost * 12:.2f}")
        print(f"Yearly Savings: ${yearly_savings:.2f}")

        # Calculate and display savings percentage
        if monthly_brand_cost > 0:
            savings_percentage = (monthly_savings / monthly_brand_cost) * 100
            print(f"\nSwitching to generic would save you {savings_percentage:.1f}%")

    except KeyboardInterrupt:
        print("\nCalculator terminated by user.")
    except Exception as e:
        print(f"\nAn error occurred: {e}")

if __name__ == "__main__":
    main()