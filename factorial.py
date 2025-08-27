def factorial(n):
    """Calculate the factorial of a non-negative integer."""
    if n < 0:
        raise ValueError("Factorial is not defined for negative numbers")
    elif n == 0 or n == 1:
        return 1
    else:
        result = 1
        for i in range(2, n + 1):
            result *= i
        return result


# Example usage
if __name__ == "__main__":
    # Test the function
    test_numbers = [0, 1, 5, 10]
    for num in test_numbers:
        print(f"factorial({num}) = {factorial(num)}")