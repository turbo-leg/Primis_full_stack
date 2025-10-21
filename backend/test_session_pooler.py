from sqlalchemy import create_engine, text

url = "postgresql://postgres.zizleblpekdmfqkzbkan:U0zuDzleL1H5Y0va@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
print(f'Testing connection (port 5432 - Session mode)...')
print()

try:
    engine = create_engine(url, connect_args={"keepalives": 1, "keepalives_idle": 30})
    with engine.connect() as conn:
        result = conn.execute(text('SELECT version()'))
        version = result.scalar()
        print(f'✅ SUCCESS! Connected to PostgreSQL')
        print(f'   Version: {version[:60]}...')
    engine.dispose()
except Exception as e:
    print(f'❌ FAILED: {str(e)[:150]}')
