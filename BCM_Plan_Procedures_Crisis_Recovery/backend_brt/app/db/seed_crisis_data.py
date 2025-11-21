"""
Database seeding script for crisis management module.
"""
import uuid
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.postgres import get_db
from app.models.crisis_management_models import CrisisTemplate, CrisisPlan, CrisisPlanSection, CrisisCommunicationPlan
from app.models.global_models import GlobalOrganization
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_crisis_data():
    """
    Add sample crisis management data to the database.
    """
    # Get the database URL from settings
    SQLALCHEMY_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI

    # Create engine
    from sqlalchemy import create_engine
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

    # Create a session
    db = Session(bind=engine)

    try:
        # Check if organization exists, if not create one
        org = db.query(GlobalOrganization).first()
        if not org:
            org = GlobalOrganization(
                id=uuid.uuid4(),
                name="Sample Organization",
                description="This is a sample organization for testing purposes"
            )
            db.add(org)
            db.commit()
            db.refresh(org)
            logger.info("Created sample organization")

        # Create a sample crisis template
        template = CrisisTemplate(
            id=uuid.uuid4(),
            organization_id=org.id,
            name="Crisis Management Template",
            file_path="crisis_management/sample_template.pdf",
            file_size=1024,
            content_type="application/pdf",
            extracted_text="This is a sample crisis management template. It contains guidelines and procedures for handling various types of crises.",
            missing_fields=[
                {"name": "organization_name", "label": "Organization Name", "type": "text"},
                {"name": "crisis_team_lead", "label": "Crisis Team Lead", "type": "text"},
                {"name": "emergency_contact", "label": "Emergency Contact Number", "type": "text"}
            ]
        )
        db.add(template)
        db.commit()
        db.refresh(template)
        logger.info("Created sample crisis template")

        # Create a sample crisis plan
        crisis_plan = CrisisPlan(
            id=uuid.uuid4(),
            template_id=template.id,
            organization_id=org.id,
            name="Sample Crisis Plan",
            status="draft"
        )
        db.add(crisis_plan)
        db.commit()
        db.refresh(crisis_plan)
        logger.info("Created sample crisis plan")

        # Create sample crisis plan sections
        sections = [
            {"heading": "Executive Summary", "content": "This is the executive summary of our crisis management plan.", "order": 1},
            {"heading": "Action Plan", "content": "Our action plan includes steps for identifying, responding to, and recovering from crises.", "order": 2},
            {"heading": "Crisis Management Team", "content": "Our crisis management team consists of key personnel from various departments.", "order": 3},
            {"heading": "Communication Plan", "content": "We have a detailed communication plan for internal and external stakeholders.", "order": 4}
        ]

        for section_data in sections:
            section = CrisisPlanSection(
                crisis_plan_id=crisis_plan.id,
                heading=section_data["heading"],
                content=section_data["content"],
                order=section_data["order"]
            )
            db.add(section)

        # Create a sample crisis communication plan
        communication_plan = CrisisCommunicationPlan(
            id=uuid.uuid4(),
            crisis_plan_id=crisis_plan.id,
            organization_id=org.id,
            media_statement="Our organization is committed to transparency and timely communication during crises.",
            faq=[
                {"question": "What is a crisis?", "answer": "A crisis is an unexpected event that threatens operations."},
                {"question": "How do you report a crisis?", "answer": "Contact the crisis management team immediately."}
            ],
            stakeholder_communications={
                "internal": ["Employees", "Management"],
                "external": ["Customers", "Suppliers", "Regulators"]
            }
        )
        db.add(communication_plan)
        db.commit()
        logger.info("Created sample crisis communication plan and sections")

        logger.info("Crisis management data seeded successfully")

    except Exception as e:
        logger.error(f"Error seeding crisis management data: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_crisis_data()
