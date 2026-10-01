"""Online status, kept in Redis as a count of open sockets per user.

A counter (not a flag) handles users with several tabs open: they are only
offline once the last tab disconnects.
"""

import redis
from django.conf import settings

_redis = redis.Redis.from_url(settings.REDIS_URL)


def _key(user_id):
    return f"presence:{user_id}"


def connect(user_id):
    """Register a socket. Return True if the user just came online."""
    return _redis.incr(_key(user_id)) == 1


def disconnect(user_id):
    """Unregister a socket. Return True if the user just went offline."""
    return _redis.decr(_key(user_id)) <= 0


def online_ids(user_ids):
    if not user_ids:
        return set()
    counts = _redis.mget([_key(user_id) for user_id in user_ids])
    return {
        user_id
        for user_id, count in zip(user_ids, counts)
        if count is not None and int(count) > 0
    }
