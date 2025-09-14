# Juno Marketplace Test Plan - Implementation Guide

## ✅ Phase 1: Testing Infrastructure (COMPLETED)

### Installed Dependencies
- **Marketplace Frontend & Admin App**: Vitest, Testing Library, MSW for mocking
- **API Services**: Jest, Supertest, MongoDB Memory Server

### Configuration Files Created
- `vitest.config.js` - Marketplace frontend configuration
- `api/jest.config.js` - API testing configuration  
- `admin-app/vitest.config.js` - Admin app configuration
- Test setup files for each application

### Test Scripts Added
```bash
# Marketplace Frontend
pnpm test              # Run tests
pnpm test:ui           # Run tests with UI
pnpm test:coverage     # Generate coverage report
pnpm test:watch        # Watch mode

# API Services
cd api
pnpm test              # Run tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # Generate coverage report

# Admin App
cd admin-app
pnpm test              # Run tests
pnpm test:ui           # Run tests with UI
pnpm test:coverage     # Generate coverage report
```

## 📝 Sample Tests Created

1. **Frontend Component Test**: `src/components/NavBar.test.jsx`
   - Tests navigation bar rendering and user interactions
   - Demonstrates React Testing Library usage

2. **Utility Function Test**: `src/utils/pkce.test.js`
   - Tests PKCE authentication utilities
   - Shows how to mock crypto APIs

3. **API Route Test**: `api/routes/watches.test.js`
   - Tests watch CRUD operations
   - Uses MongoDB Memory Server for database testing

4. **Admin Component Test**: `admin-app/src/components/AdminLogin.test.jsx`
   - Tests admin login functionality
   - Demonstrates form testing and API mocking

## 🚀 Running Tests

### Quick Start
```bash
# Run all tests
pnpm test                    # Frontend tests
cd api && pnpm test         # API tests
cd admin-app && pnpm test   # Admin tests

# Generate coverage reports
pnpm test:coverage
cd api && pnpm test:coverage
cd admin-app && pnpm test:coverage
```

## 📋 Next Steps - Test Implementation Phases

### Phase 2: Unit Tests (Priority: HIGH)

#### API Unit Tests to Implement
```
api/
├── db/
│   ├── bidModel.test.js         # Bid model validation
│   ├── watchModel.test.js       # Watch model validation
│   ├── userModel.test.js        # User model validation
│   └── transactionModel.test.js # Transaction model validation
├── services/
│   ├── junopayService.test.js   # JunoPay integration
│   └── openaiService.test.js    # OpenAI service
└── routes/
    ├── bids.test.js              # Bidding endpoints
    ├── junopay.test.js           # Payment endpoints
    └── users.test.js             # User management
```

#### Frontend Unit Tests to Implement
```
src/
├── components/
│   ├── HomePage.test.jsx         # Landing page
│   ├── WatchList.test.jsx        # Watch listing
│   ├── WatchDetails.test.jsx     # Watch detail view
│   └── ProfilePage.test.jsx      # User profile
└── utils/
    └── api.test.js                # API utilities
```

#### Admin Unit Tests to Implement
```
admin-app/src/components/
├── AdminDashboard.test.jsx       # Dashboard statistics
├── WatchAdminList.test.jsx       # Watch management
├── UserAdminList.test.jsx        # User management
├── OrderAdminList.test.jsx       # Order management
└── BidAdminList.test.jsx         # Bid management
```

### Phase 3: Integration Tests (Priority: HIGH)

#### Key User Flows to Test
1. **Authentication Flow**
   - Juno OAuth login
   - Session management
   - Admin authentication

2. **Watch Marketplace Flow**
   - Browse watches
   - Search and filter
   - View watch details

3. **Bidding System**
   - Place bid
   - Accept/reject bids
   - Bid notifications

4. **Purchase Flow**
   - Buy now functionality
   - JunoPay integration
   - Order confirmation

### Phase 4: E2E Tests with Playwright

#### Installation
```bash
pnpm add -D @playwright/test
npx playwright install
```

#### Create E2E Test Structure
```
e2e/
├── auth.spec.js          # Authentication flows
├── marketplace.spec.js   # Browse and search
├── bidding.spec.js       # Bidding system
├── purchase.spec.js      # Purchase flow
└── admin.spec.js         # Admin operations
```

### Phase 5: Performance Testing

#### Load Testing with k6
```javascript
// k6/load-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function() {
  let response = http.get('http://localhost:8001/api/watches');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### Phase 6: CI/CD Integration

#### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test:coverage
      - run: cd api && pnpm test:coverage
      - run: cd admin-app && pnpm test:coverage
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## 🎯 Testing Best Practices

### 1. Test Structure
```javascript
describe('Component/Feature', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something specific', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### 2. Mocking Strategies
- Use MSW for API mocking in frontend tests
- Use MongoDB Memory Server for database tests
- Mock external services (JunoPay, OpenAI)

### 3. Test Data Management
```javascript
// test/fixtures/watches.js
export const mockWatch = {
  brand: 'Rolex',
  model: 'Submariner',
  reference_number: '116610LN',
  price: 10000,
  condition: 'Excellent'
};
```

### 4. Coverage Targets
- Unit Tests: 80% coverage
- Integration Tests: 70% coverage
- Critical Paths: 100% E2E coverage

## 📊 Monitoring Test Health

### Coverage Reports
- View HTML reports: `open coverage/index.html`
- Track coverage trends over time
- Set up coverage badges in README

### Test Performance
- Monitor test execution time
- Optimize slow tests
- Parallelize test execution

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Memory Server fails to start**
   ```bash
   # Clear cache
   rm -rf node_modules/.cache/mongodb-memory-server
   ```

2. **Jest/Vitest conflicts**
   ```bash
   # Clear cache
   pnpm store prune
   rm -rf node_modules
   pnpm install
   ```

3. **Test timeouts**
   ```javascript
   // Increase timeout for slow tests
   it('slow test', async () => {
     // test code
   }, 10000); // 10 second timeout
   ```

## 🎉 Success Metrics

- [ ] All critical user paths have E2E tests
- [ ] API endpoints have >85% code coverage
- [ ] Frontend components have >80% code coverage
- [ ] Tests run in <5 minutes in CI
- [ ] Zero flaky tests
- [ ] All tests pass before merge

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

---

This test plan provides a comprehensive foundation for testing the Juno Marketplace application. Start with unit tests for critical business logic, then expand to integration and E2E tests for complete coverage.