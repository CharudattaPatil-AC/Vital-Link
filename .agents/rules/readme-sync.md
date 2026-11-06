---
description: Automatically keeps README.md updated when code or architecture changes occur
trigger: always_on
---

# Automatic README Documentation Maintenance Rule

Whenever you make changes to the codebase in this project, you must ensure `README.md` reflects those changes:

1. **New or Modified Endpoints:** If a new route or controller endpoint is added/modified in `backend/routes/` or `backend/controllers/`, update the Features or API sections in `README.md`.
2. **New Dependencies:** If packages are installed in `backend/package.json` or `frontend/package.json`, update the Tech Stack table in `README.md`.
3. **New Frontend Pages or Components:** If new pages or core components are added in `frontend/src/pages/` or `frontend/src/components/`, list them in the Features and Directory Structure sections.
4. **Environment Variables or Setup Steps:** If `.env` keys, seed routines, or start scripts change, update the "Getting Started" instructions.
5. **Always preserve formatting:** Keep the Mermaid diagrams, badges, demo accounts table, and clear step-by-step layout intact.

