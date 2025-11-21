"""
Database management script for crisis management module.
"""
import argparse
import logging
from init_db import create_tables
from seed_crisis_data import seed_crisis_data

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description='Database management script')
    parser.add_argument('command', choices=['init', 'seed', 'reset'], 
                        help='Command to execute: init (create tables), seed (add sample data), reset (drop and recreate tables)')

    args = parser.parse_args()

    if args.command == 'init':
        logger.info("Creating database tables...")
        create_tables()
        logger.info("Database tables created successfully")

    elif args.command == 'seed':
        logger.info("Seeding database with sample data...")
        seed_crisis_data()
        logger.info("Database seeded successfully")

    elif args.command == 'reset':
        logger.info("Resetting database...")
        # Import drop_tables function if available
        try:
            from init_db import drop_tables
            drop_tables()
        except ImportError:
            logger.warning("drop_tables function not found, skipping table drop")

        create_tables()
        seed_crisis_data()
        logger.info("Database reset successfully")

if __name__ == "__main__":
    main()
