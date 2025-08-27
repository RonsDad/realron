import re
from typing import bool


def validate_email(email: str) -> bool:
    """
    Validates an email address using regex pattern matching.
    
    Args:
        email: The email address string to validate
        
    Returns:
        True if the email is valid, False otherwise
        
    Examples:
        >>> validate_email("user@example.com")
        True
        >>> validate_email("john.doe+tag@company.co.uk")
        True
        >>> validate_email("invalid.email")
        False
    """
    # Remove leading/trailing whitespace
    email = email.strip()
    
    # Email regex pattern
    # Explanation:
    # ^[a-zA-Z0-9._%+-]+ : Local part - alphanumeric, dots, underscores, percent, plus, hyphen
    # @                   : Required @ symbol
    # [a-zA-Z0-9.-]+      : Domain name - alphanumeric, dots, hyphens
    # \.                  : Required dot before TLD
    # [a-zA-Z]{2,}$       : Top-level domain - at least 2 letters
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    # Additional validation rules
    if not email or len(email) > 320:  # Max email length per RFC
        return False
    
    # Check basic pattern match
    if not re.match(pattern, email):
        return False
    
    # Additional checks for edge cases
    local, domain = email.rsplit('@', 1)
    
    # Local part validation
    if len(local) > 64:  # Max local part length
        return False
    if local.startswith('.') or local.endswith('.'):
        return False
    if '..' in local:  # No consecutive dots
        return False
    
    # Domain validation
    if domain.startswith('-') or domain.endswith('-'):
        return False
    if '..' in domain:  # No consecutive dots
        return False
    
    return True


def validate_email_simple(email: str) -> bool:
    """
    A simpler email validation using a basic regex pattern.
    Less strict but faster for basic validation needs.
    
    Args:
        email: The email address string to validate
        
    Returns:
        True if the email matches basic format, False otherwise
    """
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return bool(re.match(pattern, email.strip()))


# Test the functions
if __name__ == "__main__":
    # Test cases
    test_emails = [
        ("user@example.com", True),
        ("john.doe@company.co.uk", True),
        ("alice+tag@domain.org", True),
        ("bob_smith123@test-site.com", True),
        ("name.surname@sub.domain.com", True),
        ("invalid.email", False),
        ("@example.com", False),
        ("user@", False),
        ("user @example.com", False),
        ("user..name@example.com", False),
        (".user@example.com", False),
        ("user@-example.com", False),
        ("user@example", False),
        ("", False),
        ("user@.com", False),
    ]
    
    print("Testing validate_email() function:")
    print("-" * 50)
    for email, expected in test_emails:
        result = validate_email(email)
        status = "✓" if result == expected else "✗"
        print(f"{status} '{email}' -> {result} (expected: {expected})")
    
    print("\n" + "=" * 50)
    print("\nTesting validate_email_simple() function:")
    print("-" * 50)
    for email, expected in test_emails:
        result = validate_email_simple(email)
        # Note: Simple version may have different results for edge cases
        print(f"'{email}' -> {result}")