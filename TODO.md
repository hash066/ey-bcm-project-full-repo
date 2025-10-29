# BCM Plan Implementation TODO

## Overview
Implement organization-level and departmental-level BCM Plan pages based on the PDF specifications. Organization-level users see the organization BCM plan, departmental users see their departmental BCM plan.

## Backend Tasks

### 1. Enhance BCMPlanService (backend_brt/app/services/bcm_plan_service.py)
- [x] Add method `generate_organization_level_bcm_plan()` with sections from Organization Level PDF:
  - Introduction
  - Purpose and Objective
  - Emergency Communication Procedures (External, Diffusion)
  - Emergency Notification and Alert System
  - Emergency Response Plan Activation
  - Emergency Services Contact Information
  - Post Crisis Response Plan
  - Crisis Management Framework Checklist
  - Glossary
- [x] Add method `generate_departmental_level_bcm_plan(department_id)` with sections from Departmental Level PDF:
  - Critical Applications and Data Backup Strategies
  - Response & Escalation Matrix (disruption levels: Minor, Moderate, Major, Critical)
  - Recovery Objectives and Prioritized Activities (RTO, MTPD)
  - Roles and Responsibilities (Board, Operational Risk Team, FRP Coordinator)
  - Critical Resource and Asset Requirements
  - Training & Awareness
  - Testing
  - Review & Maintenance
- [x] Update existing `generate_bcm_plan()` to use the new specific methods based on context

### 2. Update BCM Router (backend_brt/app/routers/bcm_router.py)
- [x] Add endpoint `/organization-plan` for organization-level BCM plan
- [x] Add endpoint `/department-plan/{department_id}` for departmental-level BCM plan
- [ ] Update PDF generation endpoint to support both organization and departmental plans
- [x] Add proper error handling and validation

## Frontend Tasks

### 3. Create Organization Level BCM Plan Component
- [x] Create `EY-Catalyst-front-end/src/modules/bcm/OrganizationBCMPlan.jsx`
- [x] Display organization-level BCM plan sections with proper styling
- [x] Add PDF download functionality
- [x] Add edit capabilities for authorized users
- [x] Integrate with backend API

### 4. Create Departmental Level BCM Plan Component
- [x] Create `EY-Catalyst-front-end/src/modules/bcm/DepartmentalBCMPlan.jsx`
- [x] Display departmental-level BCM plan sections with proper styling
- [x] Add PDF download functionality
- [x] Add edit capabilities for authorized users
- [x] Integrate with backend API and department context

### 5. Update App Routing (EY-Catalyst-front-end/src/modules/core/App.jsx)
- [x] Add route `/organization-bcm-plan` for organization-level users
- [x] Add route `/departmental-bcm-plan` for departmental users
- [ ] Add role-based access control (organization vs departmental)

### 6. Update Sidebar Navigation
- [ ] Update `EY-Catalyst-front-end/src/common/components/Sidebar.jsx` to include BCM Plan links
- [ ] Ensure proper navigation based on user role

## Testing and Validation

### 7. Test Backend APIs
- [ ] Test organization-level BCM plan generation
- [ ] Test departmental-level BCM plan generation
- [ ] Test PDF generation for both types
- [ ] Validate content accuracy against PDF specifications

### 8. Test Frontend Components
- [ ] Test organization-level BCM plan display
- [ ] Test departmental-level BCM plan display
- [ ] Test PDF download functionality
- [ ] Test role-based access control

## Final Steps

### 9. Integration Testing
- [ ] End-to-end testing of complete BCM plan workflow
- [ ] User acceptance testing for both organization and departmental views

### 10. Documentation
- [ ] Update README with BCM plan functionality
- [ ] Document API endpoints and usage
