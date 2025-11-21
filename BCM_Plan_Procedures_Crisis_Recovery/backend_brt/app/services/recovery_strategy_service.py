from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text
from typing import List
import logging
import uuid
from datetime import datetime

from app.models.global_models import GlobalDepartment, GlobalSubdepartment, GlobalProcess, GlobalOrganization
from app.models.bia_models import BIAProcessInfo
from app.models.recovery_strategy_models import RecoveryStrategy
from app.db.postgres import SQLALCHEMY_DATABASE_URL
from app.schemas.recovery_strategy_schemas import DepartmentWithStrategies, SubDepartment, Function, RecoveryStrategyInDB

logger = logging.getLogger(__name__)

class RecoveryStrategyService:
    """
    Service for fetching recovery strategy data.
    """
    
    @staticmethod
    def create_sample_data(db: Session):
        """Create sample departments, subdepartments, processes, and recovery strategies."""
        try:
            bind = db.get_bind()
            use_str_id = bind.dialect.name == 'sqlite'
            gen_id = (lambda: str(uuid.uuid4())) if use_str_id else (lambda: uuid.uuid4())
            # Check if data already exists
            existing_dept = db.query(GlobalDepartment).first()
            if existing_dept:
                logger.info("Sample data already exists")
                return
            
            # Create sample departments
            it_dept = GlobalDepartment(
                id=gen_id(),
                name="Information Technology",
                organization_id=gen_id(),
                description="{}"
            )
            
            hr_dept = GlobalDepartment(
                id=gen_id(),
                name="Human Resources",
                organization_id=it_dept.organization_id,
                description="{}"
            )
            
            finance_dept = GlobalDepartment(
                id=gen_id(),
                name="Finance",
                organization_id=it_dept.organization_id,
                description="{}"
            )
            
            db.add_all([it_dept, hr_dept, finance_dept])
            db.flush()
            
            # Create subdepartments
            infra_subdept = GlobalSubdepartment(
                id=gen_id(),
                name="Infrastructure",
                department_id=it_dept.id
            )
            
            dev_subdept = GlobalSubdepartment(
                id=gen_id(),
                name="Application Development",
                department_id=it_dept.id
            )
            
            recruitment_subdept = GlobalSubdepartment(
                id=gen_id(),
                name="Recruitment",
                department_id=hr_dept.id
            )
            
            accounting_subdept = GlobalSubdepartment(
                id=gen_id(),
                name="Accounting",
                department_id=finance_dept.id
            )
            
            db.add_all([infra_subdept, dev_subdept, recruitment_subdept, accounting_subdept])
            db.flush()
            
            # Create processes
            processes = [
                GlobalProcess(id=gen_id(), name="Server Management", subdepartment_id=infra_subdept.id),
                GlobalProcess(id=gen_id(), name="Network Operations", subdepartment_id=infra_subdept.id),
                GlobalProcess(id=gen_id(), name="Software Development", subdepartment_id=dev_subdept.id),
                GlobalProcess(id=gen_id(), name="Talent Acquisition", subdepartment_id=recruitment_subdept.id),
                GlobalProcess(id=gen_id(), name="Financial Reporting", subdepartment_id=accounting_subdept.id),
                GlobalProcess(id=gen_id(), name="Payroll Processing", subdepartment_id=accounting_subdept.id),
            ]
            
            db.add_all(processes)
            db.flush()
            
            # Create BIA process info for each process
            bia_processes = []
            for process in processes:
                bia_process = BIAProcessInfo(
                    id=gen_id(),
                    process_id=process.id,
                    description=f"Business process for {process.name}",
                    peak_period="Business Hours",
                    spoc="Process Owner"
                )
                bia_processes.append(bia_process)
            
            db.add_all(bia_processes)
            db.flush()
            
            # Create recovery strategies for most processes (leave one without strategy)
            recovery_strategies = []
            for i, bia_process in enumerate(bia_processes[:-1]):  # Skip last one
                strategy = RecoveryStrategy(
                    process_id=bia_process.id,
                    people_unavailability_strategy="Cross-train team members and establish backup personnel",
                    people_reasoning="Ensures continuity when key personnel are unavailable",
                    technology_data_unavailability_strategy="Implement cloud backup and redundant systems",
                    technology_reasoning="Prevents data loss and system downtime",
                    site_unavailability_strategy="Establish alternate work locations and remote work capabilities",
                    site_reasoning="Maintains operations during site disruptions",
                    third_party_vendors_unavailability_strategy="Identify backup vendors and maintain service agreements",
                    vendor_reasoning="Reduces dependency on single vendors"
                )
                recovery_strategies.append(strategy)
            
            db.add_all(recovery_strategies)
            db.commit()
            logger.info("Sample data created successfully")
            
        except Exception as e:
            logger.error(f"Error creating sample data: {str(e)}")
            db.rollback()
            raise
    
    @staticmethod
    async def get_all_departments_with_strategies(db: Session) -> List[DepartmentWithStrategies]:
        """
        Get all departments with their recovery strategies from the database.
        """
        try:
            # First, ensure sample data exists
            RecoveryStrategyService.create_sample_data(db)
            
            # Query departments with all related data
            departments = (
                db.query(GlobalDepartment)
                .options(
                    joinedload(GlobalDepartment.subdepartments)
                    .joinedload(GlobalSubdepartment.processes)
                    .joinedload(GlobalProcess.bia_process_info)
                    .joinedload(BIAProcessInfo.recovery_strategy)
                )
                .all()
            )
            
            result = []
            for dept in departments:
                department_subdepartments = []
                
                for sub_dept in dept.subdepartments:
                    subdepartment_functions = []
                    
                    for process in sub_dept.processes:
                        if process.bia_process_info:
                            recovery_strategies = []
                            for bia_process in process.bia_process_info:
                                if bia_process.recovery_strategy:
                                    strategy_data = {
                                        'process_id': str(bia_process.recovery_strategy.process_id),
                                        'people_unavailability_strategy': bia_process.recovery_strategy.people_unavailability_strategy,
                                        'people_reasoning': bia_process.recovery_strategy.people_reasoning,
                                        'technology_data_unavailability_strategy': bia_process.recovery_strategy.technology_data_unavailability_strategy,
                                        'technology_reasoning': bia_process.recovery_strategy.technology_reasoning,
                                        'site_unavailability_strategy': bia_process.recovery_strategy.site_unavailability_strategy,
                                        'site_reasoning': bia_process.recovery_strategy.site_reasoning,
                                        'third_party_vendors_unavailability_strategy': bia_process.recovery_strategy.third_party_vendors_unavailability_strategy,
                                        'vendor_reasoning': bia_process.recovery_strategy.vendor_reasoning,
                                        'people_status': getattr(bia_process.recovery_strategy, 'people_status', 'Not Implemented'),
                                        'technology_status': getattr(bia_process.recovery_strategy, 'technology_status', 'Not Implemented'),
                                        'site_status': getattr(bia_process.recovery_strategy, 'site_status', 'Not Implemented'),
                                        'vendor_status': getattr(bia_process.recovery_strategy, 'vendor_status', 'Not Implemented'),
                                        'created_at': bia_process.recovery_strategy.created_at,
                                        'updated_at': bia_process.recovery_strategy.updated_at
                                    }
                                    recovery_strategies.append(RecoveryStrategyInDB(**strategy_data))
                            
                            subdepartment_functions.append(
                                Function(
                                    id=str(process.id),
                                    name=process.name,
                                    recovery_strategies=recovery_strategies
                                )
                            )
                    
                    if subdepartment_functions:
                        department_subdepartments.append(
                            SubDepartment(
                                id=str(sub_dept.id),
                                name=sub_dept.name,
                                functions=subdepartment_functions
                            )
                        )
                
                if department_subdepartments:
                    result.append(
                        DepartmentWithStrategies(
                            id=str(dept.id),
                            name=dept.name,
                            sub_departments=department_subdepartments
                        )
                    )
            
            return result
            
        except Exception as e:
            logger.error(f"Error fetching recovery strategies: {str(e)}")
            raise

    @staticmethod
    def seed_more_data(db: Session):
        try:
            use_str_id = SQLALCHEMY_DATABASE_URL.startswith('sqlite')
            gen_id = (lambda: str(uuid.uuid4())) if use_str_id else (lambda: uuid.uuid4())

            from sqlalchemy import text
            org_id = gen_id()
            db.execute(
                text("INSERT INTO organization (id, name) VALUES (:id, :name)"),
                {"id": org_id, "name": "Seed Organization"}
            )
            db.commit()
            ops_id = gen_id()
            support_id = gen_id()
            db.execute(
                text("INSERT INTO department (id, name, organization_id, description, created_at) VALUES (:id, :name, :org_id, :desc, :created_at)"),
                {"id": ops_id, "name": "Operations", "org_id": org_id, "desc": "{}", "created_at": datetime.utcnow()}
            )
            db.execute(
                text("INSERT INTO department (id, name, organization_id, description, created_at) VALUES (:id, :name, :org_id, :desc, :created_at)"),
                {"id": support_id, "name": "Customer Support", "org_id": org_id, "desc": "{}", "created_at": datetime.utcnow()}
            )

            datacenter_id = gen_id()
            secops_id = gen_id()
            service_desk_id = gen_id()
            onboarding_id = gen_id()
            db.execute(text("INSERT INTO subdepartment (id, name, department_id, created_at) VALUES (:id, :name, :dept_id, :created_at)"),
                       {"id": datacenter_id, "name": "Data Center Operations", "dept_id": ops_id, "created_at": datetime.utcnow()})
            db.execute(text("INSERT INTO subdepartment (id, name, department_id, created_at) VALUES (:id, :name, :dept_id, :created_at)"),
                       {"id": secops_id, "name": "Security Operations", "dept_id": ops_id, "created_at": datetime.utcnow()})
            db.execute(text("INSERT INTO subdepartment (id, name, department_id, created_at) VALUES (:id, :name, :dept_id, :created_at)"),
                       {"id": service_desk_id, "name": "Service Desk", "dept_id": support_id, "created_at": datetime.utcnow()})
            db.execute(text("INSERT INTO subdepartment (id, name, department_id, created_at) VALUES (:id, :name, :dept_id, :created_at)"),
                       {"id": onboarding_id, "name": "Onboarding", "dept_id": support_id, "created_at": datetime.utcnow()})

            proc_ids = [gen_id(), gen_id(), gen_id(), gen_id()]
            proc_data = [
                (proc_ids[0], "Database Administration", datacenter_id),
                (proc_ids[1], "Incident Response", secops_id),
                (proc_ids[2], "Customer Onboarding", onboarding_id),
                (proc_ids[3], "Ticket Resolution", service_desk_id),
            ]
            for pid, pname, sid in proc_data:
                db.execute(text("INSERT INTO process (id, name, subdepartment_id, created_at, department_id) VALUES (:id, :name, :sid, :created_at, :dept_id)"),
                           {"id": pid, "name": pname, "sid": sid, "created_at": datetime.utcnow(), "dept_id": ops_id if sid in [datacenter_id, secops_id] else support_id})

            for pid, pname, _ in proc_data:
                db.execute(text("INSERT INTO bia_process_info (id, process_id, description, peak_period, spoc, review_status, created_at, updated_at) VALUES (:id, :process_id, :description, :peak_period, :spoc, :review_status, :created_at, :updated_at)"),
                           {"id": gen_id(), "process_id": pid, "description": f"Business process for {pname}", "peak_period": "Business Hours", "spoc": "Process Owner", "review_status": "Draft", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()})
            db.commit()
        except Exception as e:
            db.rollback()
            raise
    
    @staticmethod
    def seed_strategies_for_existing_processes(db: Session) -> int:
        try:
            count = 0
            bia_items = db.query(BIAProcessInfo).all()
            for bia in bia_items:
                exists = db.query(RecoveryStrategy).filter(RecoveryStrategy.process_id == bia.id).first()
                if exists:
                    continue
                process = db.query(GlobalProcess).filter(GlobalProcess.id == bia.process_id).first()
                pname = process.name if process else "Process"
                idx = count % 5
                people_status = ["Implemented", "In Progress", "Not Implemented", "Implemented", "In Progress"][idx]
                technology_status = ["In Progress", "Implemented", "Not Implemented", "In Progress", "Implemented"][idx]
                site_status = ["Not Implemented", "In Progress", "Implemented", "Not Implemented", "Implemented"][idx]
                vendor_status = ["Implemented", "Not Implemented", "In Progress", "Implemented", "In Progress"][idx]
                pv_status = ["In Progress", "Implemented", "Not Implemented", "In Progress", "Implemented"][idx]
                strategy = RecoveryStrategy(
                    process_id=bia.id,
                    people_unavailability_strategy=f"Cross-train {pname} team members, maintain backup personnel, and document critical procedures.",
                    people_reasoning=f"Ensures {pname} continuity when key personnel are unavailable.",
                    technology_data_unavailability_strategy=f"Enable daily encrypted backups, replication, and verified restore procedures for {pname} data.",
                    technology_reasoning=f"Prevents data loss and reduces downtime for {pname}.",
                    site_unavailability_strategy=f"Activate remote work, use alternate workspace, and reroute operations for {pname}.",
                    site_reasoning=f"Maintains operations during building or campus disruptions impacting {pname}.",
                    third_party_vendors_unavailability_strategy=f"Maintain dual vendors, pre-approved SLAs, and escalation paths for {pname} dependencies.",
                    vendor_reasoning=f"Reduces single-vendor risk and improves resilience for {pname}.",
                    process_vulnerability_strategy=f"Identify single points of failure in {pname}, add redundancies, and perform quarterly drills.",
                    process_vulnerability_reasoning=f"Mitigates critical risks and improves recovery posture for {pname}.",
                    people_status=people_status,
                    technology_status=technology_status,
                    site_status=site_status,
                    vendor_status=vendor_status,
                    process_vulnerability_status=pv_status,
                )
                db.add(strategy)
                count += 1
            if count:
                db.commit()
            return count
        except Exception as e:
            db.rollback()
            raise
    
    @staticmethod
    async def create_recovery_strategy(db: Session, process_id: str, strategy_data: dict) -> RecoveryStrategyInDB:
        """Create a new recovery strategy for a process."""
        try:
            # Find the BIA process info
            bia_process = db.query(BIAProcessInfo).filter(
                BIAProcessInfo.process_id == uuid.UUID(process_id)
            ).first()
            
            if not bia_process:
                raise ValueError(f"BIA process not found for process ID: {process_id}")
            
            # Create new recovery strategy
            new_strategy = RecoveryStrategy(
                process_id=bia_process.id,
                **strategy_data
            )
            
            db.add(new_strategy)
            db.commit()
            db.refresh(new_strategy)
            
            return RecoveryStrategyInDB(
                process_id=str(new_strategy.process_id),
                people_unavailability_strategy=new_strategy.people_unavailability_strategy,
                people_reasoning=new_strategy.people_reasoning,
                technology_data_unavailability_strategy=new_strategy.technology_data_unavailability_strategy,
                technology_reasoning=new_strategy.technology_reasoning,
                site_unavailability_strategy=new_strategy.site_unavailability_strategy,
                site_reasoning=new_strategy.site_reasoning,
                third_party_vendors_unavailability_strategy=new_strategy.third_party_vendors_unavailability_strategy,
                vendor_reasoning=new_strategy.vendor_reasoning,
                created_at=new_strategy.created_at,
                updated_at=new_strategy.updated_at
            )
            
        except Exception as e:
            logger.error(f"Error creating recovery strategy: {str(e)}")
            db.rollback()
            raise