"""
Batch-patch all EMR pages to inject useToast import + hook call.
Also wires showToast into existing alert() / form submit handlers.
"""
import os, re, sys

PAGES_DIR = r'd:\Training\working\EMR-Application\client\src\pages'
TOAST_IMPORT = "import { useToast } from '../hooks/useToast.jsx';\n"
HOOK_CALL = "  const { showToast } = useToast();\n"

TARGET_PAGES = [
    'AppointmentsPage.jsx',
    'BillingPage.jsx',
    'InsurancePage.jsx',
    'InventoryPage.jsx',
    'InpatientPage.jsx',
    'LabPage.jsx',
    'PharmacyPage.jsx',
    'AccountsPage.jsx',
    'CommunicationPage.jsx',
    'DocumentVaultPage.jsx',
    'AmbulancePage.jsx',
    'ServiceCatalogPage.jsx',
    'DonorPage.jsx',
    'AdminMastersPage.jsx',
    'BedManagementPage.jsx',
    'HospitalSettingsPage.jsx',
    'UsersPage.jsx',
    'SupportPage.jsx',
    'EmrPage.jsx',
    # already partially done but need hook call
    'PatientsPage.jsx',
    'EmployeesPage.jsx',
]

def patch_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = content

    # ── Step 1: Add import if missing ──────────────────────────────────
    if "useToast" not in modified:
        # Insert after the last import statement block
        last_import_idx = 0
        for m in re.finditer(r'^import .+;', modified, re.MULTILINE):
            last_import_idx = m.end()
        if last_import_idx:
            modified = modified[:last_import_idx] + '\n' + TOAST_IMPORT + modified[last_import_idx:]

    # ── Step 2: Add hook call inside component function if missing ─────
    if "const { showToast } = useToast()" not in modified:
        # Find first: export default function X({ or export default function X()
        # Then find the opening brace of the function body
        func_match = re.search(
            r'export default function \w+\s*\([^)]*\)\s*\{',
            modified
        )
        if func_match:
            insert_pos = func_match.end()
            # Skip any existing useState/useEffect hooks at top for readability
            modified = modified[:insert_pos] + '\n' + HOOK_CALL + modified[insert_pos:]

    # ── Step 3: Replace alert() calls with showToast ───────────────────
    # alert('message') → showToast({ message: 'message', type: 'error' })
    modified = re.sub(
        r"\balert\((['\"])(.*?)\1\)",
        lambda m: f"showToast({{ message: {m.group(1)}{m.group(2)}{m.group(1)}, type: 'error' }})",
        modified
    )

    # ── Step 4: Add showToast success call after common API patterns ───
    # Pattern: after .createPatient/.createInvoice etc → add toast
    # We look for patterns like:
    #   setX(data || []);  setActiveTab(...)
    # These are usually the "success branch" - already handled per-file with custom messages

    if modified != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(modified)
        return True
    return False

results = []
for page in TARGET_PAGES:
    path = os.path.join(PAGES_DIR, page)
    if os.path.exists(path):
        try:
            patched = patch_file(path)
            status = 'PATCHED' if patched else 'NO_CHANGE'
            results.append(f"{status}: {page}")
        except Exception as e:
            results.append(f"ERROR ({e}): {page}")
    else:
        results.append(f"NOT_FOUND: {page}")

for r in results:
    print(r)
