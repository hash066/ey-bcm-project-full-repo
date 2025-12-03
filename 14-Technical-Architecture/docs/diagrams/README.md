# Architecture Diagrams

This directory contains all architecture diagrams in Mermaid format. These can be:
- Rendered in GitHub/GitLab markdown
- Converted to PNG/SVG using Mermaid CLI
- Imported into documentation tools

## Diagram Files

- `hld_system_overview.mmd` - High-level system architecture
- `lld_auth_module.mmd` - Authentication module LLD
- `lld_bia_module.mmd` - BIA module LLD
- `lld_ra_module.mmd` - Risk Assessment module LLD
- `lld_dashboard_module.mmd` - Dashboard module LLD
- `lld_export_module.mmd` - Export module LLD
- `er_diagram.mmd` - Complete ER diagram
- `dataflow_system.mmd` - System-level data flow
- `dataflow_ra.mmd` - Risk Assessment data flow
- `deployment_k8s.mmd` - Kubernetes deployment
- `security_architecture.mmd` - Security architecture
- `integration_architecture.mmd` - Integration architecture

## Converting to Images

```bash
# Install Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Convert to PNG
mmdc -i hld_system_overview.mmd -o hld_system_overview.png

# Convert to SVG
mmdc -i hld_system_overview.mmd -o hld_system_overview.svg
```

