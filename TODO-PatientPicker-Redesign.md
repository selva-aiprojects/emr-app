# Clinical Patient Selection Workflow Redesign
Status: 🔄 In Progress

## Current Problem
PatientSearch.jsx is **search-only** - no patients show without typing. Users expect full list.

## Redesign Goals
- [ ] Full-screen PatientPicker modal
- [ ] Tabs: Recent | All | Search | New
- [ ] Pre-load 30 patients, recent pinned
- [ ] Keyboard nav, MRN quick-search
- [ ] Replace all PatientSearch uses

## Steps
## [ ] 1. Create PatientPicker.jsx
- Tabs + list + search + register
- Reuse in EmrPage, PatientsPage

## [ ] 2. Update EmrPage.jsx
```jsx
<PatientPicker patients={patients} onSelect={setSelectedPatientId} />
```

## [ ] 3. Test Flow
- Clinical → Picker → select patient → form loads

## [ ] 4. Global Replace
- PatientSearch → PatientPicker everywhere

**Est. Time**: 20 mins

