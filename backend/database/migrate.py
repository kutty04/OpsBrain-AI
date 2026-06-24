import os
import psycopg2
from backend.config import settings, logger

def run_migration():
    logger.info("Starting database migration...")
    
    migration_file_path = os.path.join(os.path.dirname(__file__), "migration.sql")
    if not os.path.exists(migration_file_path):
        logger.error(f"Migration SQL file not found at {migration_file_path}")
        return False
        
    with open(migration_file_path, "r", encoding="utf-8") as f:
        sql_commands = f.read()

    try:
        logger.info(f"Connecting to database...")
        conn = psycopg2.connect(settings.DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        logger.info("Executing DDL schema commands...")
        cursor.execute(sql_commands)
        logger.info("DDL Schema executed successfully.")
        
        cursor.close()
        conn.close()
        logger.info("Database migration completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Database migration failed: {e}")
        return False

if __name__ == "__main__":
    run_migration()
