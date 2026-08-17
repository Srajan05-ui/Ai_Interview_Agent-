import redis.asyncio as redis
import os

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

class MockRedis:
    def __init__(self):
        self.store = {}
    async def get(self, key):
        return self.store.get(key)
    async def set(self, key, value):
        self.store[key] = value
    async def ping(self):
        return True

async def get_redis_client():
    try:
        client = redis.from_url(redis_url, decode_responses=True)
        await client.ping()
        return client
    except Exception as e:
        print(f"Redis not available, using in-memory mock. Error: {e}")
        return MockRedis()
