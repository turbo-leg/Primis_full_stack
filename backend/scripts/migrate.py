#!/usr/bin/env python3
"""
Database migration helper script for Alembic

Usage:
    python scripts/migrate.py init        # Create initial migration
    python scripts/migrate.py create "description"  # Create new migration
    python scripts/migrate.py upgrade     # Apply all pending migrations
    python scripts/migrate.py downgrade   # Rollback one migration
    python scripts/migrate.py current     # Show current revision
    python scripts/migrate.py history     # Show migration history
"""

import sys
import os
import subprocess

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


def run_alembic_command(args):
    """Run an alembic command"""
    try:
        result = subprocess.run(
            ['alembic'] + args,
            cwd=os.path.dirname(os.path.dirname(__file__)),
            capture_output=True,
            text=True
        )
        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        return result.returncode
    except Exception as e:
        print(f"Error running alembic: {e}", file=sys.stderr)
        return 1


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1

    command = sys.argv[1].lower()

    if command == 'init':
        print("Creating initial migration from current models...")
        return run_alembic_command([
            'revision',
            '--autogenerate',
            '-m', 'Initial migration'
        ])

    elif command == 'create':
        if len(sys.argv) < 3:
            print("Error: Please provide a migration message")
            print("Usage: python scripts/migrate.py create 'Add user table'")
            return 1
        message = sys.argv[2]
        print(f"Creating new migration: {message}")
        return run_alembic_command([
            'revision',
            '--autogenerate',
            '-m', message
        ])

    elif command == 'upgrade':
        print("Applying all pending migrations...")
        return run_alembic_command(['upgrade', 'head'])

    elif command == 'downgrade':
        steps = sys.argv[2] if len(sys.argv) > 2 else '-1'
        print(f"Rolling back migration ({steps})...")
        return run_alembic_command(['downgrade', steps])

    elif command == 'current':
        print("Current database revision:")
        return run_alembic_command(['current'])

    elif command == 'history':
        print("Migration history:")
        return run_alembic_command(['history'])

    elif command == 'stamp':
        if len(sys.argv) < 3:
            print("Error: Please provide a revision")
            print("Usage: python scripts/migrate.py stamp head")
            return 1
        revision = sys.argv[2]
        print(f"Stamping database as revision: {revision}")
        return run_alembic_command(['stamp', revision])

    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        return 1


if __name__ == '__main__':
    sys.exit(main())
