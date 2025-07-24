from redis import Redis

session_storage = Redis(
  host="localhost",
  port=6379,
  db=0,
  decode_responses=True
)

cache_storage = Redis(
  host="localhost",
  port=6379,
  db=1,
  decode_responses=True
)
