const Redis = require('ioredis');

console.log('Testing Redis connection...');
console.log('REDIS_URL from env:', process.env.REDIS_URL ? 'SET' : 'NOT SET');

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
  retryStrategy(times) {
    console.log(`Retry attempt ${times}`);
    if (times > 3) {
      console.error('Max retries reached');
      return null;
    }
    return Math.min(times * 100, 3000);
  },
});

redis.on('connect', () => {
  console.log('✅ Redis connecting...');
});

redis.on('ready', () => {
  console.log('✅ Redis is ready!');
  redis.ping()
    .then(() => {
      console.log('✅ PING successful');
      redis.quit();
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ PING failed:', err.message);
      redis.quit();
      process.exit(1);
    });
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

redis.on('close', () => {
  console.log('⚠️  Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('⚠️  Redis reconnecting...');
});

redis.on('end', () => {
  console.log('⚠️  Redis connection ended');
});

setTimeout(() => {
  console.error('❌ Connection timeout after 15 seconds');
  redis.quit();
  process.exit(1);
}, 15000);
