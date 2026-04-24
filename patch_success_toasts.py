"""
Add explicit showToast SUCCESS calls after key API operations across transaction pages.
"""
import os, re

PAGES_DIR = r'd:\Training\working\EMR-Application\client\src\pages'

# Map of file → list of (search_pattern, replacement)
PATCHES = {
    'AppointmentsPage.jsx': [
        # After creating an appointment
        (
            r"(await api\.createAppointment\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Appointment scheduled successfully!', type: 'success', title: 'Appointment' });\n"
        ),
        (
            r"(await api\.updateAppointmentStatus\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Appointment status updated.', type: 'success', title: 'Appointment' });\n"
        ),
    ],
    'BillingPage.jsx': [
        (
            r"(await api\.createInvoice\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Invoice created successfully!', type: 'success', title: 'Billing' });\n"
        ),
        (
            r"(await api\.payInvoice\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Payment recorded successfully!', type: 'success', title: 'Billing' });\n"
        ),
    ],
    'LabPage.jsx': [
        (
            r"(await api\.createLabOrder\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Lab order submitted successfully!', type: 'success', title: 'Lab' });\n"
        ),
        (
            r"(await api\.recordLabResults\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Lab results recorded!', type: 'success', title: 'Lab' });\n"
        ),
    ],
    'PharmacyPage.jsx': [
        (
            r"(await api\.dispenseMedication\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Medication dispensed successfully!', type: 'success', title: 'Pharmacy' });\n"
        ),
        (
            r"(await api\.createPrescription\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Prescription created!', type: 'success', title: 'Pharmacy' });\n"
        ),
    ],
    'InsurancePage.jsx': [
        (
            r"(await api\.createClaim\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Insurance claim submitted!', type: 'success', title: 'Insurance' });\n"
        ),
    ],
    'InpatientPage.jsx': [
        (
            r"(await api\.createEncounter\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Patient admitted successfully!', type: 'success', title: 'Inpatient' });\n"
        ),
        (
            r"(await api\.dischargePatient\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Patient discharged!', type: 'success', title: 'Inpatient' });\n"
        ),
    ],
    'AmbulancePage.jsx': [
        (
            r"(await api\.createAmbulance\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Ambulance dispatch logged!', type: 'success', title: 'Ambulance' });\n"
        ),
    ],
    'CommunicationPage.jsx': [
        (
            r"(await api\.createNotice\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Notice published successfully!', type: 'success', title: 'Communication' });\n"
        ),
    ],
    'DocumentVaultPage.jsx': [
        (
            r"(await api\.createDocument\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Document saved to vault!', type: 'success', title: 'Documents' });\n"
        ),
    ],
    'UsersPage.jsx': [
        (
            r"(await api\.createUser\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'User account created!', type: 'success', title: 'Users' });\n"
        ),
    ],
    'AdminMastersPage.jsx': [
        (
            r"(await api\.createDepartment\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Department saved!', type: 'success', title: 'Masters' });\n"
        ),
        (
            r"(await api\.createService\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Service entry saved!', type: 'success', title: 'Masters' });\n"
        ),
    ],
    'BedManagementPage.jsx': [
        (
            r"(await api\.createBed\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Bed record saved!', type: 'success', title: 'Bed Management' });\n"
        ),
    ],
    'HospitalSettingsPage.jsx': [
        (
            r"(await api\.updateTenantSettings\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Settings saved successfully!', type: 'success', title: 'Settings' });\n"
        ),
    ],
    'SupportPage.jsx': [
        (
            r"(await api\.createSupportTicket\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Support ticket raised!', type: 'success', title: 'Support' });\n"
        ),
    ],
    'AccountsPage.jsx': [
        (
            r"(await api\.addExpense\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Expense entry recorded!', type: 'success', title: 'Accounts' });\n"
        ),
    ],
    'DonorPage.jsx': [
        (
            r"(await api\.createBloodUnit\([^)]+\);?\s*\n)",
            r"\1      showToast({ message: 'Donor record saved!', type: 'success', title: 'Blood Bank' });\n"
        ),
    ],
}

results = []
for filename, patches in PATCHES.items():
    path = os.path.join(PAGES_DIR, filename)
    if not os.path.exists(path):
        results.append(f"NOT_FOUND: {filename}")
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    count = 0
    for pattern, replacement in patches:
        new_content, n = re.subn(pattern, replacement, content)
        content = new_content
        count += n
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        results.append(f"PATCHED ({count} hooks): {filename}")
    else:
        results.append(f"NO_MATCH (API call pattern not found): {filename}")

for r in results:
    print(r)
