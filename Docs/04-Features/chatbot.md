# EMR Chatbot

## Overview

A tenant-scoped, client-side chatbot assistant that helps users query EMR data, navigate modules, and get quick stats — all without an external AI API.

## How It Works

The chatbot runs entirely in the browser using existing app state. It uses **keyword-based intent matching** via `chatEngine.js` to understand queries and return formatted responses from live tenant data.

### Architecture

```
User Input → chatEngine.processMessage() → Response
                    ↓
            Intent Matching:
            - Patient lookup → searches patients[]
            - Stats query   → aggregates invoices[], appointments[]
            - Navigation    → calls setView()
            - Help          → returns capability list
```

## Capabilities

| Category | Example Queries |
|----------|----------------|
| **Patient Lookup** | "Find patient Meena", "How many patients?", "List all patients" |
| **Appointments** | "Today's appointments", "Upcoming appointments", "Appointment count" |
| **Walk-ins** | "Pending walk-ins", "How many walk-ins?" |
| **Billing** | "Revenue summary", "Unpaid invoices" |
| **Inventory** | "Low stock items", "Inventory count" |
| **Employees** | "Employee count", "Who is on leave?" |
| **Navigation** | "Go to billing", "Open patients", "Show inventory" |
| **Summary** | "Give me a summary", "Stats", "Overview" |
| **Help** | "Help", "What can you do?" |

## Files

| File | Purpose |
|------|---------|
| `client/src/components/Chatbot.jsx` | Floating chat widget UI |
| `client/src/utils/chatEngine.js` | Intent matching engine |
| `client/src/index.css` (chatbot section) | Chat panel & FAB styles |

## UI

- **Floating Action Button** (bottom-right) with pulse animation
- **Chat panel** with slide-up animation
- **Message bubbles** (user = green gradient, bot = light gray)
- **Tenant-branded** header showing organization name
- **Auto-scroll** to latest message
- **Bold text** rendering for emphasis in responses

## Tenant Scoping

The chatbot only accesses data for the currently logged-in tenant. It receives the following context from `App.jsx`:

- `patients`, `appointments`, `walkins`, `encounters`
- `invoices`, `inventory`, `employees`, `employeeLeaves`
- `tenant` (name, code), `activeUser` (name, role)
- `setView` (for navigation commands)
