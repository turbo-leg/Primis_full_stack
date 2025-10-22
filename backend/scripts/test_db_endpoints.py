#!/usr/bin/env python3
"""
Test different connection approaches to Supabase
"""
from sqlalchemy import create_engine, text
import os

# Try different connection parameters
configs = {
    "Direct (default)": {
        "url": "postgresql://postgres:U0zuDzleL1H5Y0va@db.zizleblpekdmfqkzbkan.supabase.co:5432/postgres",
        "connect_args": {}
    },
    "IPv4 only": {
        "url": "postgresql://postgres:U0zuDzleL1H5Y0va@db.zizleblpekdmfqkzbkan.supabase.co:5432/postgres",
        "connect_args": {"keepalives": 1, "keepalives_idle": 30}
    },
    "Connection pooler": {
        "url": "postgresql://postgres.zizleblpekdmfqkzbkan:U0zuDzleL1H5Y0va@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
        "connect_args": {}
    },
}

print("Testing database connections...\n")

for name, config in configs.items():
    try:
        print(f"🔍 {name}...")
        engine = create_engine(config["url"], connect_args=config["connect_args"], pool_pre_ping=True, pool_recycle=3600)
        with engine.begin() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"✅ SUCCESS: Connected!")
            print(f"   PostgreSQL: {version[:50]}...\n")
        engine.dispose()
    except Exception as e:
        error_msg = str(e)[:100]
        print(f"❌ FAILED: {error_msg}\n")

print("\n📝 Summary:")
print("- If Direct works: Use that on Render")
print("- If only Pooler works: Update Render DATABASE_URL to pooler endpoint")
print("- If none work from Render: Check if outbound network is blocked")
