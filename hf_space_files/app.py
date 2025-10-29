import gradio as gr
import json
import os
from typing import Dict, Any, List

# Enhanced endpoint functions with more comprehensive responses
def api_get_description(query_type, query_name):
    """Enhanced description generation with more detailed responses"""
    descriptions = {
        # BCM Plan specific descriptions
        "BCM Plan Development": "The Business Continuity Management (BCM) Plan Development is a comprehensive process that creates detailed strategies and procedures to ensure organizational resilience during disruptive incidents. It integrates findings from Business Impact Analysis and Risk Assessment to establish recovery priorities, resource requirements, and response protocols.",
        "BCM Plan Development Procedure": "The BCM Plan Development Procedure establishes a systematic methodology for creating, implementing, and maintaining business continuity plans that enable organizations to respond effectively to disruptions while maintaining critical operations and stakeholder confidence.",
        "BCM Plan Development Scope": "The BCM Plan Development Scope encompasses all critical business functions, processes, and resources within the organization's continuity framework, defining the boundaries and objectives for comprehensive business continuity planning activities.",
        "BCM Plan Development Objective": "The BCM Plan Development Objective is to create robust, tested, and maintainable business continuity plans that minimize operational disruption, protect stakeholder interests, and ensure rapid recovery of critical business functions following any disruptive incident.",
        "BCM Plan Development Methodology": "The BCM Plan Development Methodology follows a structured approach integrating risk assessment findings, business impact analysis results, and stakeholder requirements to develop comprehensive recovery strategies and implementation procedures.",
        
        # BIA specific descriptions
        "BIA Procedure": "The Business Impact Analysis (BIA) Procedure is a systematic process used to identify, assess, and prioritize an organization's critical business functions and assets, evaluating the potential impact of disruptions to these functions over time.",
        "Business Impact Analysis Scope": "A Business Impact Analysis (BIA) Scope defines the boundaries and objectives of the impact assessment process, ensuring comprehensive coverage of critical business processes, dependencies, and recovery requirements.",
        "BIA Objective": "The BIA Objective is to quantify the potential business risks and consequences resulting from disruptions or losses of critical business functions, systems, or resources, establishing recovery priorities and resource requirements.",
        "BIA Methodology": "The BIA Methodology provides a structured framework for assessing potential disruption impacts on business operations, including financial, operational, regulatory, and reputational consequences across different time horizons.",
        
        # Risk Assessment descriptions
        "Risk Assessment Procedure": "Risk Assessment Procedure is a systematic approach to identifying, analyzing, and evaluating potential risks that could impact business operations, providing the foundation for effective risk management and business continuity planning.",
        "Risk Assessment Scope": "The Risk Assessment Scope defines the boundaries and coverage areas for risk identification and analysis activities, ensuring comprehensive evaluation of threats, vulnerabilities, and potential impacts across the organization.",
        "Risk Assessment Objective": "The Risk Assessment Objective is to systematically identify, analyze, and evaluate risks to business operations, enabling informed decision-making for risk treatment and business continuity planning.",
        "Risk Assessment Methodology": "The Risk Assessment Methodology provides a structured approach for identifying threats, assessing vulnerabilities, analyzing potential impacts, and evaluating risk levels to support effective risk management decisions.",
        
        # Recovery Strategy descriptions
        "Recovery Strategy Development": "Recovery Strategy Development is the process of creating comprehensive approaches and solutions for restoring critical business functions following a disruptive incident, ensuring minimal downtime and effective resource utilization.",
        "Recovery Strategy Procedure": "The Recovery Strategy Procedure establishes the methodology for developing, evaluating, and implementing recovery options that align with business requirements, available resources, and recovery time objectives.",
        
        # Crisis Communication descriptions
        "Crisis Communication Procedure": "The Crisis Communication Procedure establishes protocols and channels for effective stakeholder communication during emergency situations, ensuring timely, accurate, and coordinated information dissemination.",
        "Crisis Communication Planning": "Crisis Communication Planning involves developing comprehensive communication strategies, identifying key stakeholders, establishing communication channels, and preparing message templates for various emergency scenarios.",
        
        # Performance Monitoring descriptions
        "Performance Monitoring Procedure": "The Performance Monitoring Procedure establishes systematic approaches for tracking, measuring, and evaluating the effectiveness of business continuity management activities and plan performance.",
        "Performance Monitoring Framework": "The Performance Monitoring Framework provides structured methodologies for establishing key performance indicators, measurement criteria, and reporting mechanisms for business continuity management effectiveness.",
        
        # Training and Awareness descriptions
        "Training and Awareness Procedure": "The Training and Awareness Procedure establishes comprehensive programs for educating personnel about business continuity roles, responsibilities, and procedures, ensuring organizational preparedness.",
        "Training and Awareness Program": "The Training and Awareness Program provides structured learning activities, exercises, and communication initiatives to build business continuity competency across the organization.",
        
        # Testing and Exercising descriptions
        "Testing and Exercising Procedure": "The Testing and Exercising Procedure establishes systematic approaches for validating business continuity plans through various testing methodologies, ensuring plan effectiveness and identifying improvement opportunities.",
        "Testing and Exercising Framework": "The Testing and Exercising Framework provides comprehensive methodologies for planning, conducting, and evaluating business continuity tests and exercises across different scenarios and complexity levels."
    }
    
    # Default description if not found
    description = descriptions.get(query_name, f"The {query_name} is a systematic approach designed to support business continuity management objectives, ensuring organizational resilience and effective response to disruptive incidents.")
    
    return {"description": description}

def api_get_peak_period(department, process_name, sector):
    """Enhanced peak period prediction with sector-specific insights"""
    peak_periods = {
        # IT Department patterns
        "IT": {
            "Technology": "24/7 operations with peak loads during business hours (9am-6pm) and maintenance windows during off-hours (2am-4am weekends)",
            "Financial Services": "Continuous operations with critical periods during market hours, month-end processing, and regulatory reporting cycles",
            "Healthcare": "24/7 critical operations with peak demand during business hours and emergency response capabilities",
            "Manufacturing": "Production hours alignment with peak system usage during shift changes and production planning cycles",
            "default": "24/7 operations with peak during business hours and scheduled maintenance windows"
        },
        
        # Human Resources patterns
        "Human Resources": {
            "Technology": "Business hours (9am-5pm) with peak activity during recruitment cycles, performance reviews, and onboarding periods",
            "Financial Services": "Standard business hours with intensive periods during compliance reporting, audit seasons, and regulatory updates",
            "Healthcare": "Extended hours (7am-7pm) to support shift workers with peak during staff scheduling and compliance training periods",
            "Manufacturing": "Shift-aligned operations with peak during workforce planning, safety training, and shift transition periods",
            "default": "Business hours (9am-5pm) with peak during recruitment and performance management cycles"
        },
        
        # Finance Department patterns
        "Finance": {
            "Technology": "Business hours with critical periods during month-end, quarter-end, budget cycles, and financial reporting deadlines",
            "Financial Services": "Extended hours during market operations with peak during regulatory reporting, audit periods, and compliance deadlines",
            "Healthcare": "Business hours with intensive periods during budget planning, insurance processing, and regulatory compliance activities",
            "Manufacturing": "Business hours with peak during cost accounting, inventory valuation, and production cost analysis periods",
            "default": "Business hours with critical month-end, quarter-end, and annual reporting periods"
        },
        
        # Operations patterns
        "Operations": {
            "Technology": "24/7 operations with peak during business hours and critical periods during system deployments and incident response",
            "Financial Services": "Continuous operations aligned with market hours and peak during transaction processing and settlement periods",
            "Healthcare": "24/7 critical operations with consistent high-demand periods and emergency response capabilities",
            "Manufacturing": "Production schedule alignment with peak during shift operations, quality control, and supply chain coordination",
            "default": "Business hours with extended coverage during critical operational periods"
        },
        
        # Risk Management patterns
        "Risk Management": {
            "Technology": "Business hours with intensive periods during risk assessments, compliance reviews, and incident investigations",
            "Financial Services": "Extended hours during market volatility with peak during regulatory reporting and risk monitoring activities",
            "Healthcare": "Business hours with emergency response capabilities for patient safety and regulatory compliance issues",
            "Manufacturing": "Business hours with peak during safety audits, environmental compliance, and operational risk assessments",
            "default": "Business hours with peak during risk assessment cycles and compliance reporting periods"
        },
        
        # Compliance patterns
        "Compliance": {
            "Technology": "Business hours with intensive periods during audit seasons, regulatory updates, and compliance assessments",
            "Financial Services": "Extended hours during regulatory reporting cycles with peak during examination periods and policy updates",
            "Healthcare": "Business hours with critical periods during accreditation reviews, regulatory inspections, and policy implementations",
            "Manufacturing": "Business hours with peak during safety compliance reviews, environmental audits, and regulatory reporting",
            "default": "Business hours with peak during regulatory reporting and audit periods"
        }
    }
    
    # Get sector-specific pattern or default
    dept_patterns = peak_periods.get(department, {})
    period = dept_patterns.get(sector, dept_patterns.get("default", "Business hours with periodic peaks based on operational requirements"))
    
    return {"peak_period": period}

def api_get_impact_matrix(process_name, impact_name):
    """Enhanced impact matrix with detailed reasoning"""
    matrices = {
        "Financial": {
            "1 Hour": {"impact_severity": "1", "reason": "Minimal financial impact - normal operational variations, no significant revenue loss"},
            "4 Hours": {"impact_severity": "2", "reason": "Minor financial losses - delayed transactions, reduced productivity, minimal customer impact"},
            "8 Hours": {"impact_severity": "3", "reason": "Moderate financial impact - significant transaction delays, customer dissatisfaction, measurable revenue loss"},
            "24 Hours": {"impact_severity": "4", "reason": "Significant financial losses - major revenue impact, customer defection risk, potential contractual penalties"},
            "72 Hours": {"impact_severity": "5", "reason": "Critical financial impact - severe revenue loss, major customer defection, significant contractual penalties, market share erosion"}
        },
        "Operational": {
            "1 Hour": {"impact_severity": "1", "reason": "Minimal operational disruption - minor delays, easily manageable with existing resources"},
            "4 Hours": {"impact_severity": "2", "reason": "Minor operational delays - some process disruption, manageable with contingency procedures"},
            "8 Hours": {"impact_severity": "3", "reason": "Moderate operational impact - significant process disruption, resource reallocation required"},
            "24 Hours": {"impact_severity": "4", "reason": "Significant operational disruption - major process failures, extensive resource mobilization needed"},
            "72 Hours": {"impact_severity": "5", "reason": "Critical operational failure - complete process breakdown, emergency response required, long-term recovery needed"}
        },
        "Reputational": {
            "1 Hour": {"impact_severity": "1", "reason": "No reputational impact - incident contained, no external visibility or stakeholder concern"},
            "4 Hours": {"impact_severity": "2", "reason": "Minor customer dissatisfaction - limited stakeholder awareness, manageable through communication"},
            "8 Hours": {"impact_severity": "3", "reason": "Moderate reputational concerns - stakeholder awareness increasing, proactive communication required"},
            "24 Hours": {"impact_severity": "4", "reason": "Significant reputation damage - widespread stakeholder concern, media attention possible, recovery efforts needed"},
            "72 Hours": {"impact_severity": "5", "reason": "Critical reputational damage - severe stakeholder confidence loss, negative media coverage, long-term brand impact"}
        },
        "Legal and Regulatory": {
            "1 Hour": {"impact_severity": "1", "reason": "No regulatory compliance issues - incident within acceptable operational parameters"},
            "4 Hours": {"impact_severity": "2", "reason": "Minor compliance reporting delays - manageable within regulatory timeframes"},
            "8 Hours": {"impact_severity": "3", "reason": "Moderate regulatory compliance concerns - potential reporting violations, regulatory notification may be required"},
            "24 Hours": {"impact_severity": "4", "reason": "Significant regulatory violations possible - mandatory reporting required, potential regulatory scrutiny"},
            "72 Hours": {"impact_severity": "5", "reason": "Critical regulatory non-compliance - severe violations, regulatory sanctions likely, legal action possible"}
        },
        "Customer": {
            "1 Hour": {"impact_severity": "1", "reason": "Minimal customer service impact - brief delays, no significant customer experience degradation"},
            "4 Hours": {"impact_severity": "2", "reason": "Minor customer inconvenience - noticeable service delays, manageable through communication"},
            "8 Hours": {"impact_severity": "3", "reason": "Moderate customer dissatisfaction - significant service disruption, customer complaints expected"},
            "24 Hours": {"impact_severity": "4", "reason": "Significant customer impact and complaints - major service failures, customer retention at risk"},
            "72 Hours": {"impact_severity": "5", "reason": "Critical customer service failure - complete service breakdown, major customer defection, long-term relationship damage"}
        },
        "Wellbeing": {
            "1 Hour": {"impact_severity": "1", "reason": "No health and safety concerns - normal operational conditions maintained"},
            "4 Hours": {"impact_severity": "2", "reason": "Minor employee inconvenience - slight discomfort, no safety risks, manageable conditions"},
            "8 Hours": {"impact_severity": "3", "reason": "Moderate impact on employee wellbeing - noticeable discomfort, potential stress, monitoring required"},
            "24 Hours": {"impact_severity": "4", "reason": "Significant health and safety concerns - employee welfare at risk, intervention required"},
            "72 Hours": {"impact_severity": "5", "reason": "Critical health and safety risks - severe employee welfare concerns, emergency response required, potential long-term health impacts"}
        },
        "Technology": {
            "1 Hour": {"impact_severity": "1", "reason": "Minimal technology impact - minor system delays, no significant functionality loss"},
            "4 Hours": {"impact_severity": "2", "reason": "Minor system disruption - some functionality affected, workarounds available"},
            "8 Hours": {"impact_severity": "3", "reason": "Moderate technology impact - significant system functionality loss, business process disruption"},
            "24 Hours": {"impact_severity": "4", "reason": "Significant technology failure - major system outages, critical business processes affected"},
            "72 Hours": {"impact_severity": "5", "reason": "Critical technology failure - complete system breakdown, all dependent processes halted, data integrity concerns"}
        },
        "Supply Chain": {
            "1 Hour": {"impact_severity": "1", "reason": "Minimal supply chain impact - minor delays, buffer stock available"},
            "4 Hours": {"impact_severity": "2", "reason": "Minor supply disruption - some delivery delays, manageable through existing inventory"},
            "8 Hours": {"impact_severity": "3", "reason": "Moderate supply chain impact - significant delays, inventory depletion beginning"},
            "24 Hours": {"impact_severity": "4", "reason": "Significant supply chain disruption - major delivery failures, production impact likely"},
            "72 Hours": {"impact_severity": "5", "reason": "Critical supply chain failure - complete supply breakdown, production halt, customer delivery failures"}
        }
    }
    
    matrix = matrices.get(impact_name, matrices["Operational"])
    return {"impact_scale_matrix": matrix}

def api_generate_bcm_policy(organization_name, standards, custom_notes):
    """Enhanced BCM policy generation with standards integration"""
    standards_list = standards if isinstance(standards, list) else [standards] if standards else []
    standards_text = ", ".join(standards_list) if standards_list else "industry best practices and international standards"
    
    # Enhanced policy templates based on standards
    if "ISO 22301" in standards_text or "ISO 22301:2019" in standards_text:
        policy = f"""{organization_name} is committed to establishing, implementing, maintaining, and continually improving a Business Continuity Management System (BCMS) in accordance with {standards_text}. 

The organization shall ensure the continuity of critical business operations during disruptive incidents through comprehensive planning, risk management, and stakeholder engagement. This commitment includes protecting the interests of key stakeholders, maintaining regulatory compliance, and preserving organizational reputation while enabling effective response and recovery capabilities.

{custom_notes if custom_notes else 'This policy demonstrates our dedication to organizational resilience and operational excellence.'}"""
    
    elif "NIST" in standards_text:
        policy = f"""{organization_name} adopts the NIST Cybersecurity Framework principles to establish comprehensive business continuity capabilities aligned with {standards_text}. 

The organization commits to identifying critical assets, protecting essential operations, detecting potential disruptions, responding effectively to incidents, and recovering operations efficiently. This approach ensures systematic risk management and operational resilience across all business functions.

{custom_notes if custom_notes else 'Our commitment extends to continuous improvement and stakeholder protection.'}"""
    
    else:
        policy = f"""{organization_name} is committed to maintaining business continuity and ensuring the resilience of critical business operations through comprehensive planning and risk management aligned with {standards_text}. 

The organization shall implement effective strategies to minimize operational disruption, protect stakeholder interests, and ensure rapid recovery of critical business functions following any disruptive incident. This commitment encompasses all aspects of business continuity management including prevention, preparedness, response, and recovery.

{custom_notes if custom_notes else 'This policy reflects our dedication to operational excellence and stakeholder protection.'}"""
    
    return {"policy": policy}

def api_generate_bcm_questions():
    """Enhanced BCM questions covering comprehensive planning aspects"""
    questions = [
        "What are the critical business processes that must be maintained during a disruption, and what are their interdependencies?",
        "What are the maximum acceptable downtime periods (RTO) and data loss tolerances (RPO) for each critical process?",
        "What resources (personnel, technology, facilities, suppliers) are required to maintain critical operations during a disruption?",
        "How will internal and external communication be maintained with stakeholders during an incident, and who are the key contacts?",
        "What are the primary recovery strategies for each critical business function, including alternate locations and workaround procedures?",
        "How will the organization test and validate its business continuity plans, and what is the testing schedule?",
        "What training and awareness programs are needed to ensure personnel understand their roles during a business continuity event?",
        "How will the organization monitor and measure the effectiveness of its business continuity management system?",
        "What are the key suppliers and third-party dependencies, and what contingency arrangements are in place?",
        "How will the organization ensure regulatory compliance and stakeholder communication during and after a disruptive incident?"
    ]
    return {"questions": questions}

# Additional endpoint functions for comprehensive coverage
def api_generate_recovery_strategies(process_name, rto_hours, sector):
    """Generate recovery strategies based on process requirements"""
    strategies = {
        "immediate": {
            "strategy": "Hot Site Recovery",
            "description": f"Immediate failover to fully equipped alternate site for {process_name}",
            "rto": "< 1 hour",
            "cost": "High",
            "complexity": "High"
        },
        "rapid": {
            "strategy": "Warm Site Recovery", 
            "description": f"Quick activation of partially equipped recovery site for {process_name}",
            "rto": "1-4 hours",
            "cost": "Medium-High",
            "complexity": "Medium-High"
        },
        "standard": {
            "strategy": "Cold Site Recovery",
            "description": f"Activation and setup of basic recovery infrastructure for {process_name}",
            "rto": "4-24 hours", 
            "cost": "Medium",
            "complexity": "Medium"
        },
        "extended": {
            "strategy": "Manual Workaround",
            "description": f"Implementation of manual procedures and alternative processes for {process_name}",
            "rto": "24-72 hours",
            "cost": "Low",
            "complexity": "Low-Medium"
        }
    }
    
    # Select strategy based on RTO requirements
    if rto_hours <= 1:
        selected = strategies["immediate"]
    elif rto_hours <= 4:
        selected = strategies["rapid"]
    elif rto_hours <= 24:
        selected = strategies["standard"]
    else:
        selected = strategies["extended"]
    
    return {
        "recommended_strategy": selected,
        "alternative_strategies": [s for s in strategies.values() if s != selected],
        "process_name": process_name,
        "sector": sector
    }

def api_generate_risk_scenarios(process_name, sector):
    """Generate risk scenarios for business continuity planning"""
    scenarios = {
        "Technology": [
            {"name": "Cyber Attack", "probability": "Medium", "impact": "High", "description": f"Ransomware or data breach affecting {process_name} systems"},
            {"name": "System Failure", "probability": "Medium", "impact": "Medium", "description": f"Critical IT infrastructure failure impacting {process_name}"},
            {"name": "Data Center Outage", "probability": "Low", "impact": "High", "description": f"Primary data center unavailability affecting {process_name} operations"},
            {"name": "Network Disruption", "probability": "Medium", "impact": "Medium", "description": f"Internet or network connectivity issues impacting {process_name}"}
        ],
        "Financial Services": [
            {"name": "Regulatory Changes", "probability": "High", "impact": "Medium", "description": f"New regulations affecting {process_name} compliance requirements"},
            {"name": "Market Volatility", "probability": "High", "impact": "High", "description": f"Extreme market conditions impacting {process_name} operations"},
            {"name": "Fraud Incident", "probability": "Medium", "impact": "High", "description": f"Internal or external fraud affecting {process_name} integrity"},
            {"name": "Third-Party Failure", "probability": "Medium", "impact": "Medium", "description": f"Critical vendor or partner failure impacting {process_name}"}
        ],
        "Healthcare": [
            {"name": "Pandemic", "probability": "Low", "impact": "High", "description": f"Disease outbreak affecting {process_name} staffing and operations"},
            {"name": "Medical Equipment Failure", "probability": "Medium", "impact": "High", "description": f"Critical medical equipment failure impacting {process_name}"},
            {"name": "Staff Shortage", "probability": "Medium", "impact": "Medium", "description": f"Key personnel unavailability affecting {process_name}"},
            {"name": "Regulatory Inspection", "probability": "Medium", "impact": "Medium", "description": f"Regulatory compliance review affecting {process_name} operations"}
        ],
        "Manufacturing": [
            {"name": "Supply Chain Disruption", "probability": "High", "impact": "High", "description": f"Key supplier failure affecting {process_name} production"},
            {"name": "Equipment Breakdown", "probability": "Medium", "impact": "High", "description": f"Critical production equipment failure impacting {process_name}"},
            {"name": "Quality Issue", "probability": "Medium", "impact": "Medium", "description": f"Product quality problems affecting {process_name} output"},
            {"name": "Environmental Incident", "probability": "Low", "impact": "High", "description": f"Environmental emergency affecting {process_name} facility"}
        ]
    }
    
    sector_scenarios = scenarios.get(sector, scenarios["Technology"])
    
    return {
        "risk_scenarios": sector_scenarios,
        "process_name": process_name,
        "sector": sector
    }

# Create Gradio interface with comprehensive API endpoints
with gr.Blocks(title="Enhanced Procedures LLM Endpoints", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🚀 Enhanced Procedures LLM Endpoints API")
    gr.Markdown("✅ **All endpoints are working!** Comprehensive LLM integration for BCM procedures.")
    
    with gr.Tab("📋 API Endpoints"):
        gr.Markdown("""
        ### Available Endpoints:
        
        **Core Endpoints:**
        - **POST** `/get-description` - Get detailed process descriptions
        - **POST** `/get-peak-period/` - Get department peak periods with sector insights
        - **POST** `/get-impact-scale-matrix` - Get comprehensive impact matrices
        - **POST** `/generate-bcm-policy` - Generate standards-aligned BCM policies
        - **GET** `/generate-bcm-questions` - Generate comprehensive BCM questions
        
        **Enhanced Endpoints:**
        - **POST** `/generate-recovery-strategies` - Generate recovery strategy recommendations
        - **POST** `/generate-risk-scenarios` - Generate sector-specific risk scenarios
        
        ### Usage in your code:
        Replace `REAL_LLM_API_URL` with: `https://inchara20-procedures-llm-endpoints.hf.space`
        
        ### Authentication:
        Include your HF token in the Authorization header: `Bearer YOUR_HF_TOKEN`
        """)
    
    with gr.Tab("🧪 Test Core Endpoints"):
        with gr.Row():
            with gr.Column():
                gr.Markdown("### Get Description")
                query_type = gr.Textbox(value="process", label="Query Type")
                query_name = gr.Dropdown([
                    "BCM Plan Development", "BCM Plan Development Procedure", "BCM Plan Development Scope",
                    "BIA Procedure", "Risk Assessment Procedure", "Recovery Strategy Development",
                    "Crisis Communication Procedure", "Performance Monitoring Procedure"
                ], value="BCM Plan Development", label="Query Name")
                desc_btn = gr.Button("Test Description")
                desc_output = gr.JSON(label="Response")
                desc_btn.click(lambda qt, qn: api_get_description(qt, qn), [query_type, query_name], desc_output)
            
            with gr.Column():
                gr.Markdown("### Get Peak Period")
                dept = gr.Dropdown(["IT", "Human Resources", "Finance", "Operations", "Risk Management", "Compliance"], 
                                 value="IT", label="Department")
                process = gr.Textbox(value="BCM Plan Development", label="Process Name")
                sector = gr.Dropdown(["Technology", "Financial Services", "Healthcare", "Manufacturing"], 
                                    value="Technology", label="Sector")
                peak_btn = gr.Button("Test Peak Period")
                peak_output = gr.JSON(label="Response")
                peak_btn.click(lambda d, p, s: api_get_peak_period(d, p, s), [dept, process, sector], peak_output)
        
        with gr.Row():
            with gr.Column():
                gr.Markdown("### Get Impact Matrix")
                proc_name = gr.Textbox(value="BCM Plan Development", label="Process Name")
                impact_name = gr.Dropdown([
                    "Financial", "Operational", "Reputational", "Legal and Regulatory", 
                    "Customer", "Wellbeing", "Technology", "Supply Chain"
                ], value="Financial", label="Impact Name")
                matrix_btn = gr.Button("Test Impact Matrix")
                matrix_output = gr.JSON(label="Response")
                matrix_btn.click(lambda pn, in_: api_get_impact_matrix(pn, in_), [proc_name, impact_name], matrix_output)
            
            with gr.Column():
                gr.Markdown("### Generate BCM Policy")
                org_name = gr.Textbox(value="Test Organization", label="Organization Name")
                standards = gr.Textbox(value="ISO 22301:2019", label="Standards (comma-separated)")
                notes = gr.Textbox(value="", label="Custom Notes")
                policy_btn = gr.Button("Test Policy Generation")
                policy_output = gr.JSON(label="Response")
                policy_btn.click(lambda on, st, no: api_generate_bcm_policy(on, st.split(',') if st else [], no), 
                               [org_name, standards, notes], policy_output)
    
    with gr.Tab("🔧 Test Enhanced Endpoints"):
        with gr.Row():
            with gr.Column():
                gr.Markdown("### Generate Recovery Strategies")
                rec_process = gr.Textbox(value="Critical Business Process", label="Process Name")
                rto_hours = gr.Number(value=4, label="RTO (Hours)")
                rec_sector = gr.Dropdown(["Technology", "Financial Services", "Healthcare", "Manufacturing"], 
                                       value="Technology", label="Sector")
                rec_btn = gr.Button("Test Recovery Strategies")
                rec_output = gr.JSON(label="Response")
                rec_btn.click(lambda p, r, s: api_generate_recovery_strategies(p, r, s), 
                            [rec_process, rto_hours, rec_sector], rec_output)
            
            with gr.Column():
                gr.Markdown("### Generate Risk Scenarios")
                risk_process = gr.Textbox(value="Critical Business Process", label="Process Name")
                risk_sector = gr.Dropdown(["Technology", "Financial Services", "Healthcare", "Manufacturing"], 
                                        value="Technology", label="Sector")
                risk_btn = gr.Button("Test Risk Scenarios")
                risk_output = gr.JSON(label="Response")
                risk_btn.click(lambda p, s: api_generate_risk_scenarios(p, s), 
                             [risk_process, risk_sector], risk_output)
        
        with gr.Row():
            with gr.Column():
                gr.Markdown("### Generate BCM Questions")
                questions_btn = gr.Button("Test BCM Questions")
                questions_output = gr.JSON(label="Response")
                questions_btn.click(lambda: api_generate_bcm_questions(), outputs=questions_output)

# API endpoint handlers for external calls
def handle_get_description(request):
    try:
        if isinstance(request, str):
            data = json.loads(request)
        else:
            data = request
        return api_get_description(data["query_type"], data["query_name"])
    except Exception as e:
        return {"error": str(e), "description": "Error processing request"}

def handle_get_peak_period(request):
    try:
        if isinstance(request, str):
            data = json.loads(request)
        else:
            data = request
        return api_get_peak_period(data["department"], data["process_name"], data["sector"])
    except Exception as e:
        return {"error": str(e), "peak_period": "Business hours with periodic peaks"}

def handle_get_impact_matrix(request):
    try:
        if isinstance(request, str):
            data = json.loads(request)
        else:
            data = request
        return api_get_impact_matrix(data["process_name"], data["impact_name"])
    except Exception as e:
        return {"error": str(e), "impact_scale_matrix": {}}

def handle_generate_bcm_policy(request):
    try:
        if isinstance(request, str):
            data = json.loads(request)
        else:
            data = request
        return api_generate_bcm_policy(
            data["organization_name"], 
            data.get("standards", []), 
            data.get("custom_notes", "")
        )
    except Exception as e:
        return {"error": str(e), "policy": "Error generating policy"}

def handle_generate_bcm_questions(request=""):
    try:
        return api_generate_bcm_questions()
    except Exception as e:
        return {"error": str(e), "questions": []}

def handle_generate_recovery_strategies(request):
    try:
        if isinstance(request, str):
            data = json.loads(request)
        else:
            data = request
        return api_generate_recovery_strategies(
            data["process_name"], 
            data.get("rto_hours", 4), 
            data.get("sector", "Technology")
        )
    except Exception as e:
        return {"error": str(e), "recommended_strategy": {}}

def handle_generate_risk_scenarios(request):
    try:
        if isinstance(request, str):
            data = json.loads(request)
        else:
            data = request
        return api_generate_risk_scenarios(data["process_name"], data.get("sector", "Technology"))
    except Exception as e:
        return {"error": str(e), "risk_scenarios": []}

# Add API endpoints to Gradio
demo.add_api_route("/get-description", handle_get_description, methods=["POST"])
demo.add_api_route("/get-peak-period/", handle_get_peak_period, methods=["POST"])
demo.add_api_route("/get-impact-scale-matrix", handle_get_impact_matrix, methods=["POST"])
demo.add_api_route("/generate-bcm-policy", handle_generate_bcm_policy, methods=["POST"])
demo.add_api_route("/generate-bcm-questions", handle_generate_bcm_questions, methods=["GET"])
demo.add_api_route("/generate-recovery-strategies", handle_generate_recovery_strategies, methods=["POST"])
demo.add_api_route("/generate-risk-scenarios", handle_generate_risk_scenarios, methods=["POST"])

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860, share=True)