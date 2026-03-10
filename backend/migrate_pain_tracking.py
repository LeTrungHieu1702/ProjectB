"""
Database Migration: Add Pain Recognition Support
Adds pain tracking fields to sessions table and creates pain_events table
"""

import mysql.connector
from datetime import datetime

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "123456",  # Change to your MySQL password
    "database": "rehab_v3"
}

def migrate_pain_tracking():
    """Add pain tracking capabilities to the database"""
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("PAIN RECOGNITION DATABASE MIGRATION")
    print("=" * 60)
    
    try:
        # 1. Add pain tracking fields to sessions table
        print("\n1. Adding pain tracking fields to sessions table...")
        
        # Check if columns already exist
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = 'rehab_v3' 
            AND TABLE_NAME = 'sessions' 
            AND COLUMN_NAME = 'pain_detected'
        """)
        
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                ALTER TABLE sessions
                ADD COLUMN pain_detected BOOLEAN DEFAULT FALSE,
                ADD COLUMN max_pain_level VARCHAR(20) DEFAULT 'none'
            """)
            conn.commit()
            print("   ✓ Added pain_detected and max_pain_level columns")
        else:
            print("   ✓ Pain tracking columns already exist")
        
        # 2. Create pain_events table
        print("\n2. Creating pain_events table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pain_events (
                id INT PRIMARY KEY AUTO_INCREMENT,
                session_id INT NOT NULL,
                timestamp VARCHAR(255) NOT NULL,
                pain_level VARCHAR(20) NOT NULL,
                pain_score FLOAT NOT NULL,
                pain_indicators JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
                INDEX idx_session_id (session_id),
                INDEX idx_pain_level (pain_level),
                INDEX idx_timestamp (timestamp)
            )
        """)
        conn.commit()
        print("   ✓ Created pain_events table")
        
        # 3. Verify tables
        print("\n3. Verifying database structure...")
        
        # Check sessions table
        cursor.execute("""
            SHOW COLUMNS FROM sessions LIKE 'pain%'
        """)
        pain_columns = cursor.fetchall()
        print(f"   ✓ Sessions table has {len(pain_columns)} pain-related columns")
        
        # Check pain_events table
        cursor.execute("""
            SHOW TABLES LIKE 'pain_events'
        """)
        if cursor.fetchone():
            cursor.execute("DESCRIBE pain_events")
            columns = cursor.fetchall()
            print(f"   ✓ pain_events table created with {len(columns)} columns")
        
        print("\n" + "=" * 60)
        print("MIGRATION COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print("\nNew Features:")
        print("  • Pain detection during exercise sessions")
        print("  • Pain level tracking (mild, moderate, severe)")
        print("  • Detailed pain events logging")
        print("  • Pain indicators and timestamps")
        print("\nNote: Run 'pip install -r requirements.txt' to install scipy")
        print("=" * 60)
        
    except mysql.connector.Error as err:
        print(f"\n❌ ERROR: {err}")
        conn.rollback()
        raise
    
    finally:
        cursor.close()
        conn.close()

def rollback_pain_tracking():
    """Remove pain tracking features (rollback migration)"""
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("ROLLING BACK PAIN RECOGNITION MIGRATION")
    print("=" * 60)
    
    try:
        # Drop pain_events table
        print("\n1. Dropping pain_events table...")
        cursor.execute("DROP TABLE IF EXISTS pain_events")
        conn.commit()
        print("   ✓ Dropped pain_events table")
        
        # Remove pain columns from sessions
        print("\n2. Removing pain columns from sessions table...")
        
        # Check if columns exist before dropping
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = 'rehab_v3' 
            AND TABLE_NAME = 'sessions' 
            AND COLUMN_NAME = 'pain_detected'
        """)
        
        if cursor.fetchone()[0] > 0:
            cursor.execute("""
                ALTER TABLE sessions
                DROP COLUMN pain_detected,
                DROP COLUMN max_pain_level
            """)
            conn.commit()
            print("   ✓ Removed pain tracking columns")
        else:
            print("   ✓ Pain columns already removed")
        
        print("\n" + "=" * 60)
        print("ROLLBACK COMPLETED")
        print("=" * 60)
        
    except mysql.connector.Error as err:
        print(f"\n❌ ERROR: {err}")
        conn.rollback()
        raise
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        # Rollback migration
        response = input("\n⚠️  This will remove all pain tracking data. Continue? (yes/no): ")
        if response.lower() == 'yes':
            rollback_pain_tracking()
        else:
            print("Rollback cancelled.")
    else:
        # Run migration
        migrate_pain_tracking()
