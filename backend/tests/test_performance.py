import unittest
import time
import statistics
from backend.repositories.assets import AssetsRepository
from backend.repositories.graph import GraphRepository
from backend.services.graph import GraphService
from backend.services.rag import RAGService
from backend.config import logger

class TestSystemPerformance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.assets_repo = AssetsRepository()
        cls.graph_repo = GraphRepository()
        cls.graph_service = GraphService()
        cls.rag_service = RAGService()
        
        # Verify that we have some assets loaded in DB (e.g. from Vizag seeder)
        # If no assets exist, we insert a couple for safe benchmarking
        with cls.assets_repo.get_cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM assets;")
            count = list(cur.fetchone().values())[0]
            if count == 0:
                logger.info("No assets found. Seeding basic assets for performance runs...")
                cur.execute("INSERT INTO assets (tag_number, name, category) VALUES ('P-PERF-01', 'Perf Pump 1', 'Pump');")
                cur.execute("INSERT INTO assets (tag_number, name, category) VALUES ('P-PERF-02', 'Perf Pump 2', 'Pump');")
                cur.execute("INSERT INTO assets (tag_number, name, category) VALUES ('V-PERF-03', 'Perf Vessel 3', 'Vessel');")
                
                # Fetch IDs
                cur.execute("SELECT id FROM assets;")
                ids = [r["id"] for r in cur.fetchall()]
                
                # Add nodes
                cur.execute("INSERT INTO knowledge_nodes (name, type, asset_id) VALUES ('P-PERF-01', 'Asset', %s);", (ids[0],))
                cur.execute("INSERT INTO knowledge_nodes (name, type, asset_id) VALUES ('P-PERF-02', 'Asset', %s);", (ids[1],))
                cur.execute("INSERT INTO knowledge_nodes (name, type, asset_id) VALUES ('V-PERF-03', 'Asset', %s);", (ids[2],))
                
                # Fetch node IDs
                cur.execute("SELECT id FROM knowledge_nodes;")
                nids = [r["id"] for r in cur.fetchall()]
                
                # Add edges
                cur.execute("INSERT INTO knowledge_edges (source_id, target_id, relation_type) VALUES (%s, %s, 'FLOWS_TO');", (nids[0], nids[1]))
                cur.execute("INSERT INTO knowledge_edges (source_id, target_id, relation_type) VALUES (%s, %s, 'FLOWS_TO');", (nids[1], nids[2]))

    def test_run_benchmarks(self):
        logger.info("==============================================")
        logger.info("   OPSBRAIN PERFORMANCE BENCHMARK SUITE   ")
        logger.info("==============================================")
        
        # 1. Fetch random asset tag for query testing
        with self.assets_repo.get_cursor() as cur:
            cur.execute("SELECT tag_number, id FROM assets LIMIT 1;")
            row = cur.fetchone()
            if not row:
                self.skipTest("No assets available in database for benchmarking.")
            test_tag = row["tag_number"]
            test_asset_id = row["id"]
            
            cur.execute("SELECT id FROM knowledge_nodes LIMIT 2;")
            node_rows = cur.fetchall()
            node_ids = [n["id"] for n in node_rows]

        # --- Benchmark 1: Asset Details Aggregation Query ---
        latencies_details = []
        for _ in range(30):
            start = time.perf_counter()
            # Simulate detailed payload assembly
            latest_risk = self.assets_repo.get_latest_risk_score(test_asset_id)
            # execute direct check using a new cursor
            with self.assets_repo.get_cursor() as cur_bench:
                cur_bench.execute("SELECT * FROM compliance_records WHERE asset_id = %s;", (test_asset_id,))
                cur_bench.fetchall()
                cur_bench.execute("SELECT * FROM incidents WHERE asset_id = %s;", (test_asset_id,))
                cur_bench.fetchall()
                cur_bench.execute("SELECT * FROM maintenance_logs WHERE asset_id = %s;", (test_asset_id,))
                cur_bench.fetchall()
            self.graph_service.get_neighborhood(asset_id=test_asset_id, depth=2)
            
            end = time.perf_counter()
            latencies_details.append((end - start) * 1000) # milliseconds
            
        mean_details = statistics.mean(latencies_details)
        p95_details = statistics.quantiles(latencies_details, n=20)[18] # 95th percentile
        logger.info(f"Asset Telemetry Aggregation (30 runs): Mean={mean_details:.2f}ms, P95={p95_details:.2f}ms")
        self.assertLess(mean_details, 3000, "Telemetry queries are too slow")

        # --- Benchmark 2: Recursive CTE Shortest Path ---
        if len(node_ids) == 2:
            latencies_path = []
            for _ in range(30):
                start = time.perf_counter()
                self.graph_service.get_shortest_path(source_id=node_ids[0], target_id=node_ids[1], max_depth=5)
                end = time.perf_counter()
                latencies_path.append((end - start) * 1000)
            
            mean_path = statistics.mean(latencies_path)
            p95_path = statistics.quantiles(latencies_path, n=20)[18]
            logger.info(f"Recursive Shortest Path CTE (30 runs): Mean={mean_path:.2f}ms, P95={p95_path:.2f}ms")
            self.assertLess(mean_path, 3000, "Recursive shortest path calculations are too slow")

        # --- Benchmark 3: BGE Embedding & PGVector Search ---
        latencies_search = []
        for _ in range(20):
            start = time.perf_counter()
            # Perform a vector similarity search
            self.rag_service.embeddings_service.search_similar_chunks("pressure spike safety manual", limit=3, threshold=0.3)
            end = time.perf_counter()
            latencies_search.append((end - start) * 1000)

        mean_search = statistics.mean(latencies_search)
        p95_search = statistics.quantiles(latencies_search, n=20)[18]
        logger.info(f"BGE Embeddings + Vector search (20 runs): Mean={mean_search:.2f}ms, P95={p95_search:.2f}ms")
        self.assertLess(mean_search, 3000, "Vector hybrid search is too slow")

if __name__ == "__main__":
    unittest.main()
