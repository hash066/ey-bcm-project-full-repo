"""
Verify BCM plans have been populated.
"""
from sqlalchemy import create_engine, text
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verify_bcm_plans():
    """Verify BCM plans in database."""
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT name, description FROM department ORDER BY name"))
        departments = result.fetchall()
        
        logger.info(f"\n{'='*60}")
        logger.info(f"BCM Plan Verification")
        logger.info(f"{'='*60}\n")
        
        for dept in departments:
            dept_name = dept[0]
            description = dept[1]
            
            has_bcm = False
            if description and 'bcm_plan' in description:
                bcm_plan = description['bcm_plan']
                has_bcm = True
                logger.info(f"✅ {dept_name}")
                logger.info(f"   Organization: {bcm_plan.get('organization_name', 'N/A')}")
                logger.info(f"   Plan Version: {bcm_plan.get('plan_version', 'N/A')}")
                logger.info(f"   Generated: {bcm_plan.get('generated_date', 'N/A')}")
                logger.info(f"   Sections: {len([k for k in bcm_plan.keys() if not k.startswith('plan_') and k not in ['organization_name', 'department_name', 'generated_date', 'last_updated']])}")
            else:
                logger.info(f"❌ {dept_name} - No BCM Plan")
            
            logger.info("")
        
        total = len(departments)
        with_plans = sum(1 for d in departments if d[1] and 'bcm_plan' in d[1])
        
        logger.info(f"{'='*60}")
        logger.info(f"Summary: {with_plans}/{total} departments have BCM plans")
        logger.info(f"{'='*60}")

if __name__ == "__main__":
    verify_bcm_plans()
