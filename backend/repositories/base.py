from contextlib import contextmanager
from backend.database import get_db_connection, release_db_connection
from backend.config import logger
import psycopg2.extras

class BaseRepository:
    @contextmanager
    def get_cursor(self):
        conn = None
        try:
            conn = get_db_connection()
            # Use RealDictCursor to return rows as dictionaries
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            yield cur
            conn.commit()
            cur.close()
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Database query error in repository execution: {e}")
            raise e
        finally:
            if conn:
                release_db_connection(conn)
