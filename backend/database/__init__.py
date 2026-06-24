import psycopg2.pool
from backend.config import settings, logger

db_pool = None

try:
    # Initialize Connection Pool
    db_pool = psycopg2.pool.SimpleConnectionPool(
        1, 10,
        settings.DATABASE_URL
    )
    logger.info("PostgreSQL Connection Pool initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize PostgreSQL Connection Pool: {e}")

def get_db_connection():
    if not db_pool:
        raise Exception("Database connection pool not initialized")
    return db_pool.getconn()

def release_db_connection(conn):
    if db_pool and conn:
        db_pool.putconn(conn)
