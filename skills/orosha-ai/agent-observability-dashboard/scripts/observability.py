#!/usr/bin/env python3
"""
Agent Observability Dashboard v0.1 — Metrics, traces, and performance insights

Features:
- Metrics tracking (latency, success rate, token usage)
- Trace visualization (tool chains, decision flows)
- Cross-agent aggregation
- Exportable reports
- Alert thresholds
"""

import argparse
import json
import sqlite3
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime, timedelta

# Configuration
DB_PATH = Path.home() / ".openclaw" / "workspace" / "agent-observability" / "metrics.db"
DEFAULT_ALERTS = {
    'latency_ms': 5000,
    'success_rate': 0.7,
    'error_count': 10
}


class MetricsRecord:
    """Single metric record."""
    
    def __init__(self, session_id: str, tool_name: str, latency_ms: float,
                 success: bool, tokens_used: int = 0, error: str = ""):
        self.session_id = session_id
        self.tool_name = tool_name
        self.latency_ms = latency_ms
        self.success = success
        self.tokens_used = tokens_used
        self.error = error
        self.timestamp = datetime.utcnow()


class ObservabilityStore:
    """Metrics storage and analytics."""
    
    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(db_path))
        self._init_db()
        
    def _init_db(self):
        """Initialize metrics database."""
        cursor = self.conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS metrics (
            id INTEGER PRIMARY KEY,
            session_id TEXT NOT NULL,
            tool_name TEXT NOT NULL,
            latency_ms REAL,
            success INTEGER NOT NULL,
            tokens_used INTEGER DEFAULT 0,
            error TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            start_time TIMESTAMP,
            end_time TIMESTAMP
        )
        """)
        self.conn.commit()
    
    def record_metric(self, record: MetricsRecord):
        """Record a single metric."""
        cursor = self.conn.cursor()
        cursor.execute("""
        INSERT INTO metrics (session_id, tool_name, latency_ms, success, tokens_used, error)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (record.session_id, record.tool_name, record.latency_ms,
               1 if record.success else 0, record.tokens_used, record.error))
        self.conn.commit()
    
    def start_session(self, session_id: str):
        """Mark a session as started."""
        cursor = self.conn.cursor()
        cursor.execute("""
        INSERT OR REPLACE INTO sessions (id, start_time)
        VALUES (?, CURRENT_TIMESTAMP)
        """, (session_id,))
        self.conn.commit()
    
    def end_session(self, session_id: str):
        """Mark a session as ended."""
        cursor = self.conn.cursor()
        cursor.execute("""
        UPDATE sessions SET end_time = CURRENT_TIMESTAMP
        WHERE id = ?
        """, (session_id,))
        self.conn.commit()
    
    def get_session_trace(self, session_id: str) -> List[Dict]:
        """Get full trace for a session."""
        cursor = self.conn.cursor()
        cursor.execute("""
        SELECT tool_name, latency_ms, success, tokens_used, error, timestamp
        FROM metrics
        WHERE session_id = ?
        ORDER BY timestamp ASC
        """, (session_id,))
        
        trace = []
        for row in cursor.fetchall():
            trace.append({
                'tool': row[0],
                'latency_ms': row[1],
                'success': bool(row[2]),
                'tokens_used': row[3],
                'error': row[4],
                'timestamp': row[5]
            })
        
        return trace
    
    def get_aggregates(self, period: str = "24h") -> Dict:
        """Get aggregated metrics for a period."""
        cursor = self.conn.cursor()
        
        # Calculate time threshold
        if period == "1h":
            threshold = datetime.utcnow() - timedelta(hours=1)
        elif period == "24h":
            threshold = datetime.utcnow() - timedelta(hours=24)
        elif period == "7d":
            threshold = datetime.utcnow() - timedelta(days=7)
        else:
            threshold = datetime.utcnow() - timedelta(hours=24)
        
        # Get aggregates
        cursor.execute("""
        SELECT 
            COUNT(*) as total_calls,
            SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
            AVG(latency_ms) as avg_latency,
            SUM(tokens_used) as total_tokens,
            COUNT(DISTINCT session_id) as sessions
        FROM metrics
        WHERE timestamp >= ?
        """, (threshold.isoformat(),))
        
        row = cursor.fetchone()
        if not row or row[0] == 0:
            return {'period': period, 'total_calls': 0}
        
        total, successful, avg_latency, total_tokens, sessions = row
        success_rate = successful / total if total > 0 else 0
        
        return {
            'period': period,
            'total_calls': total,
            'successful': successful,
            'success_rate': round(success_rate, 3),
            'avg_latency_ms': round(avg_latency, 2) if avg_latency else 0,
            'total_tokens': total_tokens,
            'unique_sessions': sessions
        }
    
    def check_alerts(self, thresholds: Dict[str, float] = None) -> List[str]:
        """Check if any metrics exceed thresholds."""
        if thresholds is None:
            thresholds = DEFAULT_ALERTS
        
        cursor = self.conn.cursor()
        alerts = []
        
        # Check latency (last 100 calls)
        cursor.execute("""
        SELECT AVG(latency_ms) as avg_lat
        FROM (SELECT latency_ms FROM metrics ORDER BY timestamp DESC LIMIT 100)
        """)
        row = cursor.fetchone()
        if row and row[0] and row[0] > thresholds['latency_ms']:
            alerts.append(f"⚠️ High latency: {row[0]:.0f}ms (threshold: {thresholds['latency_ms']}ms)")
        
        # Check success rate (last 24h)
        cursor.execute("""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful
        FROM metrics
        WHERE timestamp >= datetime('now', '-24 hours')
        """)
        row = cursor.fetchone()
        if row:
            total, successful = row
            if total > 0:
                rate = successful / total
                if rate < thresholds['success_rate']:
                    alerts.append(f"⚠️ Low success rate: {rate*100:.1f}% (threshold: {thresholds['success_rate']*100:.0f}%)")
        
        # Check error count (last 24h)
        cursor.execute("""
        SELECT COUNT(*) as error_count
        FROM metrics
        WHERE success = 0 AND timestamp >= datetime('now', '-24 hours')
        """)
        row = cursor.fetchone()
        if row and row[0] > thresholds['error_count']:
            alerts.append(f"⚠️ High error count: {row[0]} (threshold: {thresholds['error_count']})")
        
        return alerts
    
    def export_metrics(self, output_file: str = "metrics.json"):
        """Export metrics to JSON."""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM metrics ORDER BY timestamp DESC")
        
        rows = cursor.fetchall()
        metrics = []
        for row in rows:
            metrics.append({
                'id': row[0],
                'session_id': row[1],
                'tool_name': row[2],
                'latency_ms': row[3],
                'success': bool(row[4]),
                'tokens_used': row[5],
                'error': row[6],
                'timestamp': row[7]
            })
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(metrics, f, indent=2)
        
        print(f"✓ Exported {len(metrics)} metrics to {output_file}")
    
    def export_report(self, period: str = "24h") -> Dict:
        """Generate human-readable report."""
        aggregates = self.get_aggregates(period)
        alerts = self.check_alerts()
        
        report = {
            'summary': aggregates,
            'alerts': alerts,
            'generated_at': datetime.utcnow().isoformat()
        }
        
        return report
    
    def close(self):
        self.conn.close()


def main():
    parser = argparse.ArgumentParser(description="Agent Observability Dashboard v0.1")
    parser.add_argument("--record", action="store_true", help="Record a metric interactively")
    parser.add_argument("--session", type=str, help="Session ID for recording")
    parser.add_argument("--latency", type=float, help="Latency in ms")
    parser.add_argument("--success", action="store_true", help="Mark as successful")
    parser.add_argument("--tokens", type=int, default=0, help="Tokens used")
    parser.add_argument("--error", type=str, default="", help="Error message")
    
    parser.add_argument("--trace", type=str, help="Get session trace")
    parser.add_argument("--report", type=str, help="Generate report (period: 1h/24h/7d)")
    
    parser.add_argument("--alerts", action="store_true", help="Check alert thresholds")
    parser.add_argument("--export", type=str, help="Export metrics to JSON")
    
    args = parser.parse_args()
    
    store = ObservabilityStore()
    
    try:
        if args.record:
            if not args.session:
                print("Error: --session required for recording")
                return
            
            if not args.latency:
                print("Error: --latency required for recording")
                return
            
            record = MetricsRecord(
                session_id=args.session,
                tool_name=input("Tool name: "),
                latency_ms=args.latency,
                success=args.success,
                tokens_used=args.tokens,
                error=args.error
            )
            store.record_metric(record)
            print("✓ Metric recorded")
        
        if args.trace:
            trace = store.get_session_trace(args.trace)
            print(f"\n📊 Trace for session: {args.trace}\n")
            for i, step in enumerate(trace, 1):
                status = "✓" if step['success'] else "✗"
                print(f"{i}. {status} {step['tool']} ({step['latency_ms']}ms)")
                if step['tokens_used']:
                    print(f"   Tokens: {step['tokens_used']}")
                if step['error']:
                    print(f"   Error: {step['error']}")
        
        if args.report:
            period = args.report if args.report else "24h"
            report = store.export_report(period)
            print(f"\n📊 Report ({period})\n")
            print(f"Total calls: {report['summary']['total_calls']}")
            print(f"Success rate: {report['summary']['success_rate']*100:.1f}%")
            print(f"Avg latency: {report['summary']['avg_latency_ms']}ms")
            print(f"Total tokens: {report['summary']['total_tokens']}")
            print(f"Sessions: {report['summary']['unique_sessions']}")
            
            if report['alerts']:
                print("\n⚠️ Alerts:")
                for alert in report['alerts']:
                    print(f"  {alert}")
        
        if args.alerts:
            alerts = store.check_alerts()
            print("\n⚠️ Alerts:")
            if alerts:
                for alert in alerts:
                    print(f"  {alert}")
            else:
                print("  All metrics within thresholds ✓")
        
        if args.export:
            store.export_metrics(args.export)
            
    finally:
        store.close()


if __name__ == "__main__":
    main()
