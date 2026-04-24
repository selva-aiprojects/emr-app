# EMR Workflow Navigation Guide

## Overview

The EMR system features a sophisticated workflow navigation system that integrates seamlessly with the main application sidebar while maintaining independent workflow state management.

## Navigation Architecture

### 1. Sidebar Integration
- **Database-Driven Menus**: EMR module configured through database menu system
- **Dynamic Navigation**: Menu items derived from `menu_header` and `menu_item` tables
- **Subscription-Based**: Menu visibility controlled by tenant subscription plans
- **Role-Based Access**: Menu items filtered by user roles via `role_menu_access` table
- **Workflow Reset**: Sidebar navigation resets EMR to dashboard state
- **State Preservation**: Internal workflow state preserved during EMR navigation

### 2. Internal Workflow Navigation
- **Event-Driven**: Custom events for workflow state changes
- **Component Isolation**: Each workflow manages its own navigation
- **Centralized Control**: WorkflowNavigation utility for consistent navigation

## Workflow States

### Available Workflows
```javascript
export const WORKFLOWS = {
  DASHBOARD: 'dashboard',           // Main EMR dashboard
  NEW_ENCOUNTER: 'new-encounter', // Create new encounter
  ENCOUNTER_LIST: 'encounter-list', // View encounter history
  PATIENT_DETAIL: 'patient-detail', // Patient information view
  ENCOUNTER_DETAIL: 'encounter-detail' // Detailed encounter view
};
```

### State Management
- **External Control**: Sidebar can set workflow via `emrWorkflowChange` event
- **Internal Control**: Components use `WorkflowNavigation` utilities
- **State Synchronization**: Internal and external states kept in sync

## Navigation Patterns

### 1. Sidebar to EMR
```javascript
// User clicks EMR in sidebar
setView('emr');
// Dispatches event to reset EMR to dashboard
const event = new CustomEvent('emrWorkflowChange', { detail: 'dashboard' });
window.dispatchEvent(event);
```

### 2. Internal Workflow Navigation
```javascript
import { navigateToWorkflow, resetToDashboard } from '../components/emr/WorkflowNavigation.jsx';

// Navigate to specific workflow
navigateToWorkflow(WORKFLOWS.NEW_ENCOUNTER);

// Reset to dashboard
resetToDashboard();
```

### 3. Back Navigation
- **Consistent Behavior**: All back buttons return to dashboard
- **Context Preservation**: Patient selection preserved when appropriate
- **Breadcrumb Trail**: Users can track their navigation path

## User Workflows

### 1. Dashboard Access
**Entry Points:**
- Sidebar EMR module
- Direct URL navigation
- Internal navigation from other workflows

**Features:**
- Patient statistics
- Quick actions (New Encounter, Find Patient, History)
- Recent activity display

### 2. New Encounter Workflow
**Navigation Path:**
```
Dashboard -> New Encounter -> [Patient Selection] -> Form -> Encounter Detail
```

**Key Features:**
- Step-by-step encounter creation
- Patient selection integration
- AI clinical assistance
- Form validation and submission

### 3. Patient Detail Workflow
**Navigation Path:**
```
Dashboard -> Find Patient -> Patient Detail -> [Actions]
```

**Key Features:**
- Patient information display
- Quick action buttons
- Historical data access

### 4. Encounter Management
**Navigation Path:**
```
Dashboard -> Encounter List -> Encounter Detail -> [Actions]
```

**Key Features:**
- Encounter history
- Detailed clinical information
- Print functionality
- Quick clinical actions

## Database Menu Configuration

### Menu Tables Structure
```sql
-- Menu Headers (Categories)
emr.menu_header:
  - id, name, code, description, sort_order, icon_name
  - tenant_id (NULL = global, specific = custom)

-- Menu Items (Individual modules)
emr.menu_item:
  - id, header_id, name, code, description, icon_name, route
  - requires_subscription, subscription_plans, workflow_data
  - tenant_id (NULL = global, specific = custom)

-- Role Access Control
emr.role_menu_access:
  - role_name, menu_item_id, is_visible, tenant_id
```

### EMR Menu Configuration
```sql
-- Main EMR item (in "Bed & Patient Care" header)
INSERT INTO emr.menu_item (header_id, name, code, description, icon_name, route, workflow_data)
VALUES (
  (SELECT id FROM emr.menu_header WHERE code = 'patient_care'),
  'EMR', 'emr', 'Electronic Medical Records', 'Stethoscope', '/emr',
  '{"resets_workflow": true, "default_workflow": "dashboard", "workflow_group": "emr"}'
);

-- EMR Workflow Items (optional for direct access)
INSERT INTO emr.menu_item (header_id, name, code, description, icon_name, route, workflow_data)
VALUES 
  (header_id, 'New Encounter', 'emr_new_encounter', 'Create new clinical encounter', 'Plus', '/emr/new-encounter', '{"target_workflow": "new-encounter", "workflow_group": "emr"}'),
  (header_id, 'Encounter List', 'emr_encounter_list', 'View encounter history', 'History', '/emr/encounter-list', '{"target_workflow": "encounter-list", "workflow_group": "emr"}');
```

### Role-Based Menu Access
```sql
-- Grant access to clinical roles
INSERT INTO emr.role_menu_access (role_name, menu_item_id, is_visible)
SELECT 'doctor', mi.id, true FROM emr.menu_item mi WHERE mi.code LIKE 'emr%';

-- Restrict workflow items from non-clinical roles
UPDATE emr.role_menu_access SET is_visible = false
WHERE role_name = 'receptionist' AND menu_item_id IN (
  SELECT id FROM emr.menu_item WHERE code LIKE 'emr_%'
);
```

## Technical Implementation

### 1. Event System
```javascript
// Workflow change event
window.addEventListener('emrWorkflowChange', (event) => {
  const workflow = event.detail;
  setActiveWorkflow(workflow);
});

// Patient selection event
window.addEventListener('patientSelected', (event) => {
  const patient = event.detail;
  setSelectedPatient(patient);
});
```

### 2. State Management
```javascript
// External workflow control
const [externalWorkflow, setExternalWorkflow] = useState(null);

// Internal workflow state
const [activeWorkflow, setActiveWorkflow] = useState(WORKFLOWS.DASHBOARD);
const [selectedPatient, setSelectedPatient] = useState(null);
const [selectedEncounter, setSelectedEncounter] = useState(null);
```

### 3. Component Communication
```javascript
// Parent component orchestrates workflow
{activeWorkflow === WORKFLOWS.DASHBOARD && (
  <EmrDashboard
    onNewEncounter={() => setActiveWorkflow(WORKFLOWS.NEW_ENCOUNTER)}
    onFindPatient={() => setShowPatientPicker(true)}
    onHistory={() => setActiveWorkflow(WORKFLOWS.ENCOUNTER_LIST)}
  />
)}
```

## Integration Points

### 1. Sidebar Navigation (AppLayout.jsx)
```javascript
onClick={() => {
  if (moduleName === 'emr') {
    setView(moduleName);
    const event = new CustomEvent('emrWorkflowChange', { detail: 'dashboard' });
    window.dispatchEvent(event);
  } else {
    setView(moduleName);
  }
}}
```

### 2. Main Application (App.jsx)
```javascript
{view === 'emr' && (
  <EmrPage
    tenant={tenant}
    activeUser={activeUser}
    // ... other props
  />
)}
```

### 3. Workflow Navigation Utility
```javascript
export const navigateToWorkflow = (workflow) => {
  const event = new CustomEvent('emrWorkflowChange', { detail: workflow });
  window.dispatchEvent(event);
};
```

## Best Practices

### 1. Navigation Consistency
- Use `WorkflowNavigation` utilities for internal navigation
- Maintain consistent back button behavior
- Preserve user context when appropriate

### 2. State Management
- Keep state in shell components
- Use events for cross-component communication
- Clean up event listeners properly

### 3. User Experience
- Provide clear navigation indicators
- Maintain breadcrumb context
- Ensure smooth transitions between workflows

### 4. Performance
- Lazy load workflow components
- Minimize unnecessary re-renders
- Optimize event listener management

## Troubleshooting

### Common Issues

1. **Workflow Not Updating**
   - Check event listener registration
   - Verify workflow constants
   - Ensure proper event dispatching

2. **State Not Preserved**
   - Check state reset logic
   - Verify external workflow handling
   - Ensure proper cleanup

3. **Navigation Not Working**
   - Check component prop passing
   - Verify event handler binding
   - Ensure proper workflow constants

### Debug Tools

1. **Event Monitoring**
```javascript
// Monitor workflow changes
window.addEventListener('emrWorkflowChange', console.log);
```

2. **State Inspection**
```javascript
// Log current workflow state
console.log('Active Workflow:', activeWorkflow);
console.log('External Workflow:', externalWorkflow);
```

3. **Navigation Tracking**
```javascript
// Track navigation events
console.log('Navigation triggered:', workflow);
```

## Future Enhancements

### Planned Features
1. **URL Routing**: Add browser history support
2. **Deep Linking**: Direct workflow access via URLs
3. **Navigation Breadcrumbs**: Visual navigation trail
4. **Workflow Persistence**: Save/restore workflow state
5. **Analytics Integration**: Track user navigation patterns

### Scalability Considerations
1. **Micro-Frontend Support**: Independent workflow deployment
2. **Plugin Architecture**: Extensible workflow system
3. **Real-time Updates**: Live workflow state synchronization
4. **Mobile Optimization**: Touch-friendly navigation

This workflow navigation system provides a robust foundation for the EMR application while maintaining flexibility for future enhancements and scalability requirements.
