#!/bin/bash

echo "🎬 Starting Visual Test Demo"
echo "================================"
echo ""
echo "You will see browser windows open and perform the following:"
echo "1. Browse the marketplace homepage"
echo "2. Search and filter watches"
echo "3. View watch details"
echo "4. Login to admin dashboard"
echo "5. Navigate admin sections"
echo ""
echo "Starting in 3 seconds..."
sleep 3

# Run the demo tests with visual feedback
npx playwright test suites/e2e/demo.spec.js \
  --headed \
  --timeout=60000 \
  --workers=1 \
  --retries=0 \
  --reporter=line

echo ""
echo "✅ Visual test demo complete!"
echo ""
echo "To run more test modes:"
echo "  • Interactive UI Mode: npx playwright test --ui"
echo "  • Debug Mode: npx playwright test --debug"
echo "  • Watch API Tests: npx vitest --ui"
echo ""