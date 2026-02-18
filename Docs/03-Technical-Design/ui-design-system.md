# UI/UX Design System (Premium Med-Grade v2.0)

## Design Philosophy: "Confidence & Clarity"
The MedFlow v2.0 design system focuses on **Hospital-Grade Premium Aesthetics**. It uses a "Glassmorphic" interface layer to provide depth, while maintaining high contrast for clinical readability.

## Typography
- **Primary Font**: [Inter](https://fonts.google.com/specimen/Inter) (weights: 400, 500, 600, 700, 800)
- **Clinical/Specialty**: [Outfit](https://fonts.google.com/specimen/Outfit) for headers and branding.
- **Monospaced**: System Mono for Patient IDs and Registry Codes.

## Color Palette (Dynamic & Adaptive)

### Global Design Tokens
The system uses CSS Custom Properties (Variables) specifically prefixed with `--tenant-*` to allow real-time facility branding.

| Token | Default | Usage |
|-------|---------|-------|
| `--tenant-primary` | `#10b981` | Core branding, primary actions, active states. |
| `--tenant-accent` | `#3b82f6` | Secondary highlights, information badges. |

### Semantic Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--success` | `#10b981` | Optimal stock levels, completed encounters, paid bills. |
| `--warning` | `#f59e0b` | Pending tasks, low stock warnings. |
| `--danger` | `#ef4444` | Critical stock alerts, cancelled orders, high-risk vitals. |

## Structural Components

### 1. Premium Glass Panels (`.premium-glass`)
Used for all main cards and workspace containers.
- **Background**: `rgba(255, 255, 255, 0.8)`
- **Blur**: `backdrop-filter: blur(20px)`
- **Border**: `1px solid rgba(226, 232, 240, 0.7)`
- **Shadow**: `0 4px 25px rgba(0,0,0,0.03)`

### 2. Clinical Sidebar (`.clinical-sidebar`)
Specialized sidebar for EMR and Inventory management.
- **Glass-morphic translucent finish**.
- **Contextual Search**: Integrated debounced patient/inventory search.
- **Subject Profile Cards**: Compact summaries of the active patient/item.

### 3. Workspace Header (`.workspace-header`)
- **Tabbed Navigation**: Horizontal toggle with active indicator glow.
- **Live Badges**: Real-time status indicators (e.g., "LIVE", "WAITING").

### 4. Premium Data Ledgers (`.premium-table`)
High-density clinical data tables.
- **Registry Time Cells**: Stacked Date/Time with font-weight contrast.
- **Subject Cells**: Avatar-prefixed patient names.
- **Action Cells**: Right-aligned buttons with hover elevation.

## Specialized Workflows

### EMR Consultation Workspace
- **Clinical Record Journal**: Chronological timeline of clinical events with section-based icons.
*   **Rx Module**: Specialized line-item entry for medications with "usage protocol" fields.
- **Digital Print Prescriptions**: Professional documents with clinic branding and digital signature blocks.

### Pharmacy & Inventory
- **Stock Meters**: Horizontal progress bars showing current stock vs. reorder points.
- **Status Chips**: High-contrast, transparent-bg chips for "Pending", "Dispensed", and "Cancelled".

## Responsive Breakpoints
- **Desktop (>1024px)**: Full dual-column workspace.
- **Tablet (768px - 1024px)**: Collapsed sidebar, stacked consultation forms.
- **Mobile (<768px)**: Unified vertical stack, full-screen medical records.
