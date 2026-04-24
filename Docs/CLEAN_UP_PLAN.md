# Documentation Consolidation and Repository Cleanup Plan

## 1. Documentation Consolidation
I will consolidate the fragmented information into three main authoritative documents in the `docs/` folder, as referenced in the root `README.md`.

| Authoritative Doc | Source Files to Merge |
|-------------------|-------------------|
| **`docs/SCOPE_AND_REQUIREMENTS.md`** | `docs/02-Requirements/REQUIREMENTS_SPECIFICATION.md`, `docs/02-Requirements/SCOPE_AND_REQUIREMENTS.md`, `docs/02-Requirements/SCOPE_DOCUMENT.md`, `scope_extracted.txt` |
| **`docs/TECHNICAL_DESIGN.md`** | `docs/03-Technical-Design/TECHNICAL_DESIGN.md`, `docs/03-Technical-Design/ARCHITECTURE_DESIGN.md`, `docs/03-Technical-Design/DATA_FLOW_DIAGRAMS.md`, `docs/03-Technical-Design/TECHNICAL_DESIGN_ARCHITECTURE.md`, `HEALTHCARE_DESIGN_STANDARDS.md`, `tech_extracted.txt` |
| **`docs/USER_MANUAL.md`** | `docs/05-User-Guides/USER_MANUAL.md`, `DEMO_LOGINS.md`, `CORRECTED_CREDENTIALS.md`, `ENTERPRISE_TENANT_GUIDE.md`, `KIDZ_CLINIC_ROLES.md`, `docs/05-User-Guides/user-manual-kidz-clinic.md` |

## 2. Root Directory Cleanup
I will remove the following categories of "unwanted" files from the root directory:
- **Temporary Test Files**: `test-*.mjs`, `test-*.js`, `test.txt`, `test.log`, `test_*.txt`
- **Check Scripts**: `check-*.js`, `check_*.cjs`, `check_*.js`, `check_*.mjs`
- **Screenshots & Temporary UI**: `tmp_*.png`, `tmp_*.html`, `tmp_*.json`
- **Redundant Development Trackers**: `PROGRESS_REPORT_WAVE*`, `PHASE_IMPLEMENTATION_TRACKER.md`, `EMR_SCALING_IMPLEMENTATION_TRACKER.md`
- **Extracted Text Logs**: `*_extracted.txt`, `log_extract.txt`, `output.txt`
- **Miscellaneous Duplicates**: `README_*.md`, `QUICK_START*.md`

## 3. Documentation Folder Cleanup
- Remove the numbered subdirectories (`01-Project-Setup` to `09-Assets`) after consolidation.
- Keep the `docs/README.md` but update it to point to the new flat structure.

## 4. Maintenance / Critical Files (To Keep)
- `.env`, `.gitignore`, `package.json`, `prisma/`
- `server/`, `client/`, `app.js`
- `DEPLOYMENT.md` (Authored for production)
- `README.md` (Main entry point)
