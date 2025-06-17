import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time
import random
import string

# Replace with your EC2 public IP
BASE_URL = "http://13.48.46.254:4000"  # 🔁 <-- CHANGE THIS

# Utility function to generate a random email
def random_email():
    return f"testuser_{''.join(random.choices(string.ascii_lowercase, k=5))}@mail.com"

@pytest.fixture
def driver():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=options)
    yield driver
    driver.quit()

# ──────────────── SIGNUP TEST CASES ────────────────

def test_signup_success(driver):
    driver.get(f"{BASE_URL}/signup")
    driver.find_element(By.NAME, "name").send_keys("Test User")
    driver.find_element(By.NAME, "email").send_keys(random_email())
    driver.find_element(By.NAME, "password").send_keys("testpass123")
    driver.find_element(By.ID, "signup-button").click()
    time.sleep(2)
    assert "dashboard" in driver.current_url or "success" in driver.page_source.lower()

def test_signup_existing_email(driver):
    driver.get(f"{BASE_URL}/signup")
    driver.find_element(By.NAME, "name").send_keys("Duplicate User")
    driver.find_element(By.NAME, "email").send_keys("existinguser@mail.com")  # Must exist in DB
    driver.find_element(By.NAME, "password").send_keys("testpass123")
    driver.find_element(By.ID, "signup-button").click()
    time.sleep(2)
    assert "email already exists" in driver.page_source.lower()

def test_signup_empty_fields(driver):
    driver.get(f"{BASE_URL}/signup")
    driver.find_element(By.ID, "signup-button").click()
    time.sleep(1)
    assert "required" in driver.page_source.lower() or "missing" in driver.page_source.lower()

def test_signup_invalid_email(driver):
    driver.get(f"{BASE_URL}/signup")
    driver.find_element(By.NAME, "name").send_keys("Wrong Email")
    driver.find_element(By.NAME, "email").send_keys("not-an-email")
    driver.find_element(By.NAME, "password").send_keys("password123")
    driver.find_element(By.ID, "signup-button").click()
    time.sleep(2)
    assert "invalid email" in driver.page_source.lower()

def test_signup_short_password(driver):
    driver.get(f"{BASE_URL}/signup")
    driver.find_element(By.NAME, "name").send_keys("Short Password")
    driver.find_element(By.NAME, "email").send_keys(random_email())
    driver.find_element(By.NAME, "password").send_keys("123")
    driver.find_element(By.ID, "signup-button").click()
    time.sleep(2)
    assert "password" in driver.page_source.lower()

# ──────────────── LOGIN TEST CASES ────────────────

def test_login_success(driver):
    driver.get(f"{BASE_URL}/login")
    driver.find_element(By.NAME, "email").send_keys("daudnasar16@gmail.com")  # Must exist in DB
    driver.find_element(By.NAME, "password").send_keys("Daud@786")
    driver.find_element(By.ID, "login-button").click()
    time.sleep(2)
    assert "dashboard" in driver.current_url or "welcome" in driver.page_source.lower()

def test_login_wrong_password(driver):
    driver.get(f"{BASE_URL}/login")
    driver.find_element(By.NAME, "email").send_keys("existinguser@mail.com")
    driver.find_element(By.NAME, "password").send_keys("wrongpassword")
    driver.find_element(By.ID, "login-button").click()
    time.sleep(2)
    assert "invalid email or password" in driver.page_source.lower()

def test_login_nonexistent_user(driver):
    driver.get(f"{BASE_URL}/login")
    driver.find_element(By.NAME, "email").send_keys("nonexistent@mail.com")
    driver.find_element(By.NAME, "password").send_keys("somepassword")
    driver.find_element(By.ID, "login-button").click()
    time.sleep(2)
    assert "invalid email or password" in driver.page_source.lower()

def test_login_empty_fields(driver):
    driver.get(f"{BASE_URL}/login")
    driver.find_element(By.ID, "login-button").click()
    time.sleep(1)
    assert "required" in driver.page_source.lower() or "missing" in driver.page_source.lower()

def test_login_invalid_email_format(driver):
    driver.get(f"{BASE_URL}/login")
    driver.find_element(By.NAME, "email").send_keys("wrongformat")
    driver.find_element(By.NAME, "password").send_keys("testpass123")
    driver.find_element(By.ID, "login-button").click()
    time.sleep(2)
    assert "invalid email" in driver.page_source.lower()
