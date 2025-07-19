
# E2E Test Automation Project - AutomationExercise

This repository contains a complete automated testing environment for the website [automationexercise.com](https://automationexercise.com), using:

- ✅ **Playwright** for E2E UI testing.
- ✅ **Newman/Postman** for REST API testing.

---

## 🎯 Project Structure

```
ecommerce/
│
├── tests/          # Playwright test files (.spec.ts)
├── pages/          # Page Object Models
├── utils/          # Shared utilities
├── postman/        # Postman collections and Newman scripts
├── README.md       # Documentation
└── ...
```

---

## 🧪 Playwright - E2E Tests

Tests follow best practices, are organized using the Page Object Model, and validate step-by-step user behavior.

### ✅ Automated Scenarios

- Valid and invalid login
- Login verification via UI and API
- Add product to cart without login
- Complete purchase flow with logged-in user
- Logout validation
- Visual and DOM element checks

### 🚀 Run the tests

Install dependencies and run the tests:

```bash
npm install
npx playwright test
```

To open the interactive report:

```bash
npx playwright show-report
```

---

## 📡 API Tests - Postman + Newman

This project includes a Postman collection that covers the main public API endpoints from [AutomationExercise.com/api_list](https://automationexercise.com/api_list).

### 🔍 Implemented Tests

- ✅ GET products and brands
- ✅ POST login (valid, invalid, missing params)
- ✅ POST product search
- ✅ Dynamic user account creation
- ✅ User deletion and verification
- ✅ Realistic assertions adapted to actual API behavior

### 📦 Run API tests with Newman

Make sure `newman` is installed:

```bash
npm install -g newman
```

Execute the tests:

```bash
newman run postman/automationexercise-api-collection-repaired.json
```

---

## 📌 Notes

- Best practices based on official Playwright guidelines are followed (timeouts, robust selectors, error handling, etc.).
- API tests are adapted to real response behavior vs. documentation inconsistencies.
- All tests are idempotent and safe for public test environments.

---

## ✍️ Author

Lucas Romero - QA Engineer  
Test email: `Testlucas140725@gmail.com`  
Test password: `contraseña123`
