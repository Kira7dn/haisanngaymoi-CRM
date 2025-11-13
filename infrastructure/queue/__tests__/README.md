# Queue Infrastructure Tests

This directory contains both unit tests and integration tests for the queue infrastructure.

## Test Types

### Unit Tests (Mock-based)

- `bullmq-adapter.spec.ts` - Tests for BullMQ adapter with mocked dependencies
- `order-queue.spec.ts` - Tests for order queue initialization with mocks
- `order-worker.spec.ts` - Tests for order worker job processing logic with mocks

These tests run quickly and don't require external services.

### Integration Tests (Redis-based)

- `bullmq-adapter.integration.spec.ts` - Full integration tests for BullMQ adapter with real Redis
- `order-queue.integration.spec.ts` - Full integration tests for order queue with real Redis
- `order-worker.integration.spec.ts` - Full integration tests for order worker with real job processing

These tests require a running Redis server.

## Running Tests

### Run Unit Tests Only

```bash
npm test -- infrastructure/queue/__tests__/*.spec.ts --run
```

### Run Integration Tests

**Prerequisites:**
- Redis server must be running (default: `redis://localhost:6379`)
- Set `REDIS_URL` environment variable if using a different Redis instance

```bash
# Start Redis (if not already running)
# On macOS/Linux with Homebrew:
brew services start redis

# On Windows with Docker:
docker run -d -p 6379:6379 redis:latest

# Run integration tests
npm run test:integration -- infrastructure/queue/__tests__/*.integration.spec.ts
```

### Run All Queue Tests

```bash
npm test -- infrastructure/queue/__tests__/
```

## Environment Variables

- `REDIS_URL` - Redis connection URL (default: `redis://localhost:6379`)

## Test Coverage

The integration tests cover:

### BullMQ Adapter Integration
- Adding jobs to queues
- Job data integrity
- Queue lifecycle management
- Redis connection handling
- Error handling and recovery

### Order Queue Integration
- Queue initialization and configuration
- Job addition with various options (delay, priority)
- Event emission (completed, failed)
- Job retrieval and management
- Job lifecycle and state transitions
- Queue cleanup and maintenance

### Order Worker Integration
- Worker configuration and initialization
- Job processing for different job types
- Payment gateway integration
- Concurrent job processing
- Rate limiting
- Error handling and retry logic
- Event listeners

## Debugging Integration Tests

If integration tests fail:

1. Ensure Redis is running:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. Check Redis logs for errors

3. Verify no port conflicts on 6379

4. Clear Redis data if needed:
   ```bash
   redis-cli FLUSHALL
   ```

5. Run tests with verbose output:
   ```bash
   npm test -- infrastructure/queue/__tests__/*.integration.spec.ts --reporter=verbose
   ```

## Test Isolation

Each integration test:
- Uses unique queue names to avoid conflicts
- Cleans up Redis keys before and after each test
- Properly closes all connections
- Can run in parallel with proper isolation
