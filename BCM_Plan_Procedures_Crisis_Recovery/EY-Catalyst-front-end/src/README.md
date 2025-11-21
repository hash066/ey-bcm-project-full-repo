# Modular Structure (Proposed)

## src/modules/
- Each feature or business domain gets its own folder.
- Example: `bia/` for Business Impact Analysis, `service-mapping/` for service mapping, etc.
- Each module contains its own components, styles, and logic.

## src/common/
- Shared components, hooks, utilities, and styles used across modules.
- Example: `Sidebar`, modals, shared tables, etc.

## src/services/
- API and business logic services. Module-specific services can be moved into their respective module folders if not shared.

## src/assets/
- Images, icons, and static assets used across the app.

## Example Structure

```
src/
  modules/
    bia/
      components/
        BIAContainer.jsx
        BIAInformation.jsx
        ImpactScale.jsx
        ImpactAnalysis.jsx
      styles/
        BIAStyles.css
      services/
        biaService.js
      index.js
    service-mapping/
      ...
  common/
    components/
      Sidebar.jsx
      ProcessDetailModal.jsx
    styles/
      Sidebar.css
      ProcessDetailModal.css
    utils/
      ...
  services/
    adminService.js
    authService.js
  assets/
    react.svg
  App.jsx
  main.jsx
  ...
```

- **Start by moving BIA files into `src/modules/bia/` as shown above.**
- Move shared components and styles into `src/common/`.
- Update imports throughout the codebase to reflect the new paths. 