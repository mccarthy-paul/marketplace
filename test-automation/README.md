# Test Automation Sub-Agent

A comprehensive test automation framework for the Juno Marketplace and Admin applications.

## Overview

The Test Automation Sub-Agent provides automated testing capabilities for:
- Marketplace application (customer-facing)
- Admin application (administrative interface)
- API endpoints and services
- Integration tests across services
- End-to-end user workflows

## Quick Start

```bash
# Install dependencies
cd test-automation
pnpm install

# Run all tests
pnpm test:all

# Run specific test suites
pnpm test:marketplace    # Test marketplace app
pnpm test:admin         # Test admin app
pnpm test:api           # Test API endpoints
pnpm test:e2e           # Run E2E tests
```

## Test Structure

```
test-automation/
├── config/              # Test configuration
├── fixtures/            # Test data and fixtures
├── lib/                 # Core test utilities
├── suites/              # Test suites
│   ├── marketplace/     # Marketplace tests
│   ├── admin/          # Admin tests
│   ├── api/            # API tests
│   └── e2e/            # End-to-end tests
├── reports/            # Test reports
└── scripts/            # Test runner scripts
```

## Test Commands

```bash
# Development
pnpm test:watch         # Run tests in watch mode
pnpm test:debug         # Run tests with debugging

# Coverage
pnpm test:coverage      # Generate coverage report
pnpm test:coverage:view # View HTML coverage report

# Specific environments
pnpm test:local         # Test local environment
pnpm test:staging       # Test staging environment
pnpm test:production    # Test production environment

# Reports
pnpm report:generate    # Generate test report
pnpm report:publish     # Publish test results
```

## Test Types

### Unit Tests
- Component testing
- Utility function testing
- Model validation
- Service logic

### Integration Tests
- API endpoint testing
- Database operations
- Authentication flows
- Service integrations

### E2E Tests
- User workflows
- Cross-application flows
- Payment processing
- Admin operations

### Performance Tests
- Load testing
- Stress testing
- Response time monitoring
- Resource usage

## Configuration

Create a `.env.test` file:

```env
# Test Environment
TEST_ENV=local

# Application URLs
MARKETPLACE_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
API_URL=http://localhost:8001

# Test Database
TEST_DB_URI=mongodb://localhost:27017/junoauth-test

# Test Users
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword
TEST_ADMIN_EMAIL=admin@luxe24.com
TEST_ADMIN_PASSWORD=admin123

# Test Configuration
TEST_TIMEOUT=30000
TEST_RETRY_COUNT=3
```

## CI/CD Integration

The test suite integrates with CI/CD pipelines:

```yaml
# Example GitHub Actions integration
- name: Run Test Suite
  run: |
    cd test-automation
    pnpm install
    pnpm test:all
    pnpm report:generate
```

## Test Reporting

Test results are generated in multiple formats:
- HTML reports for detailed analysis
- JSON for programmatic access
- JUnit XML for CI integration
- Coverage reports with lcov

## Contributing

When adding new tests:
1. Follow the existing test structure
2. Use descriptive test names
3. Include proper assertions
4. Add test data to fixtures
5. Update this README if needed

## Troubleshooting

### Common Issues

**Tests timing out**
- Increase TEST_TIMEOUT in .env.test
- Check network connectivity
- Verify services are running

**Database connection errors**
- Ensure MongoDB is running
- Check TEST_DB_URI configuration
- Verify database permissions

**Authentication failures**
- Update test credentials
- Check session management
- Verify OAuth configuration