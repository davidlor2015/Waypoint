from slowapi import Limiter
from slowapi.util import get_remote_address

# Module-level singleton shared by all route decorators.
# key_func=get_remote_address keys limits by the client IP extracted from the
# ASGI request.  For authenticated APIs, IP-based limiting is the standard
# first line of defence — it catches unauthenticated abuse before JWT validation.
limiter = Limiter(key_func=get_remote_address)
