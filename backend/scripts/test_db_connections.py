#!/usr/bin/env python3
"""
Test database connections with different endpoints
"""
from sqlalchemy import create_engine, text
import sys

# Direct endpoint (current - failing)
direct_url = "postgresql://postgres:U0zuDzleL1H5Y0va@db.zizleblpekdmfqkzbkan.supabase.co:5432/postgres"

# Pooler endpoint (likely - needs testing)
pooler_url = "postgresql://postgres.zizleblpekdmfqkzbkan:U0zuDzleL1H5Y0va@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

urls = {
    "Direct": direct_url,
    "Pooler": pooler_url,
}

for name, url in urls.items():
    try:
        print(f"\n🔍 Testing {name} endpoint...")
        engine = create_engine(url, connect_args={"connect_timeout": 5})
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print(f"✅ {name} endpoint works!")
            engine.dispose()
    except Exception as e:
        print(f"❌ {name} endpoint failed: {str(e)[:150]}")
        if 'engine' in locals():
            engine.dispose()

print("\n📝 Update Render DATABASE_URL to the working endpoint above")
