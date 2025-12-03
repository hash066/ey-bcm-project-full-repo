# EY Business Continuity Management (BCM) Project

A comprehensive, modular Business Continuity Management system built for enterprise-level disaster recovery, risk assessment, and crisis management. This project provides a complete suite of BCM tools organized into 16 standalone modules that can be deployed independently or as part of a unified BCM platform.

## 🏗️ Project Overview

This repository contains a full-featured BCM system designed to help organizations:
- Assess and mitigate business risks
- Develop comprehensive business continuity plans
- Manage crisis situations effectively
- Conduct business impact analyses
- Implement recovery strategies
- Monitor BCM maturity and key risk indicators

## 📁 Module Structure

The project is organized into 16 independent modules, each addressing specific aspects of business continuity management:

| Module # | Name | Description | Tech Stack | Ports |
|----------|------|-------------|------------|-------|
| 01 | Landing Page | Public-facing landing page | React/Vite | FE: 3001 |
| 02 | Login Admin RBAC | Authentication & Role-Based Access Control | FastAPI/React | BE: 8002, FE: 3002 |
| 03 | Overall BCM Dashboard | Main BCM dashboard overview | FastAPI/React | BE: 8003, FE: 3003 |
| 04 | Process Service Mapping | Process and service dependency mapping | React/Vite | FE: 3004 |
| 05 | BC Policy | Business Continuity Policy Management | FastAPI | BE: 8009 |
| 06 | Risk Assessment | Enterprise risk assessment tools | Python/React | BE: 8006, FE: 3006 |
| 07 | Business Impact Analysis | BIA assessment and reporting | FastAPI/React | BE: 8007, FE: 3007 |
| 08 | BCM Gap Assessment | BCM compliance gap analysis | FastAPI/React | BE: 8008, FE: 3008 |
| 09 | BCM Maturity KRI Audit | Maturity assessment and KRI monitoring | FastAPI/React | BE: ~8013, FE: 3013 |
| 10 | BCM Plan Procedures Crisis Recovery | Comprehensive BCM planning | FastAPI/React | BE: 8014, FE: 3014 |
| 11 | BCM Procedures | BCM procedure management | FastAPI/React | BE: 8015, FE: 3015 |
| 12 | Crisis Management | Crisis management tools | FastAPI/React | BE: 8016, FE: 3016 |
| 13 | Recovery Strategy | Recovery strategy development | FastAPI/React | BE: 8017, FE: 3017 |
| 14 | Technical Architecture | System architecture documentation | Docs/PDFs | N/A |
| 15 | Access Control | Access control management | React/Vite | FE: 3015 |
| 16 | Demo Gap Scoring AI | AI-powered gap scoring demo | TBD | N/A |

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** (for backend modules)
- **Node.js 16+** (for frontend modules)
- **Git**
- **Virtual environment** (recommended for Python)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hash066/ey-bcm-project-full-repo.git
   cd ey-bcm-project-full-repo
   ```

2. **Set up individual modules:**
   Each module is standalone. Navigate to any module directory and follow its SETUP_GUIDE.md

   **Example for Risk Assessment (06):**
   ```bash
   cd 06-Risk-Assessment
   # Backend setup
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python app.py  # Starts on port 8006

   # Frontend setup (new terminal)
   cd dashboard-ra
   npm install
   npm run dev  # Starts on port 3006
   ```

3. **Environment Variables:**
   Some modules require API keys (e.g., GROQ_API_KEY for AI features). Check each module's SETUP_GUIDE.md for specific requirements.

## 🏛️ Architecture

### Backend Architecture
- **FastAPI**: Primary web framework for REST APIs
- **Database**: SQLite/PostgreSQL/Supabase support
- **Authentication**: RBAC with LDAP/AD integration
- **AI Integration**: Groq API for intelligent assessments

### Frontend Architecture
- **React**: UI framework with TypeScript
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library

### Key Features
- 🔐 **Role-Based Access Control**: Comprehensive user management
- 📊 **Real-time Dashboards**: Live monitoring and analytics
- 🤖 **AI-Powered Analysis**: Automated risk and gap assessments
- 📱 **Responsive Design**: Mobile-friendly interfaces
- 🔄 **Modular Architecture**: Independent deployment of modules
- 📋 **Compliance Reporting**: Regulatory compliance tools

## 📚 Documentation

- **Technical Architecture**: See `14-Technical-Architecture/` for detailed system design
- **API Documentation**: Available in module-specific documentation files
- **Setup Guides**: Each module contains its own SETUP_GUIDE.md
- **Source Code & API Docs**: Refer to `Source Code & API Documentation.docx`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

## 📄 License

This project is proprietary software developed for EY. All rights reserved.

## 🆘 Support

For support or questions:
- Check individual module READMEs and SETUP_GUIDE.md files
- Refer to the verification report in `info.md`
- Contact the development team

---

**Note**: All modules are designed to run independently with unique ports to avoid conflicts. Each module includes its own dependencies and can be deployed separately or as part of the complete BCM system.
