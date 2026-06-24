import psycopg2
from backend.config import settings, logger

def verify_db():
    logger.info("Connecting to database for verification...")
    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
        tables = [row[0] for row in cur.fetchall()]
        logger.info(f"Discovered tables: {tables}")
        
        # Check specific tables
        expected = ['assets', 'asset_risk_scores', 'documents', 'document_chunks', 
                    'incidents', 'maintenance_logs', 'compliance_records', 
                    'knowledge_nodes', 'knowledge_edges']
        
        missing = [t for t in expected if t not in tables]
        if not missing:
            logger.info("Verification SUCCESS: All expected tables exist!")
            return True
        else:
            logger.error(f"Verification FAILED: Missing tables: {missing}")
            return False
    except Exception as e:
        logger.error(f"Verification error: {e}")
        return False

if __name__ == "__main__":
    verify_db()
