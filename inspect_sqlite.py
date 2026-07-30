import sqlite3
import os
from pathlib import Path

for root in [Path('.'), Path('prisma')]:
    db_path = root / 'dev.db'
    print('DB PATH:', db_path.resolve(), 'EXISTS:', db_path.exists())
    if db_path.exists():
        conn = sqlite3.connect(str(db_path))
        cur = conn.cursor()
        cur.execute('PRAGMA table_info("Wedding")')
        rows = cur.fetchall()
        print('WEDDING COLUMNS:', len(rows))
        for row in rows:
            print(row)
        conn.close()
    print()
