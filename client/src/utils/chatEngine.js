/**
 * EMR Chatbot Engine – tenant-scoped, client-side intent matching
 * Processes natural-language queries against live app state.
 */

const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];

const helpText = `I can help you with:
• **Patient lookup** — "Find patient Meena", "How many patients?"
• **Appointments** — "Today's appointments", "Upcoming appointments"
• **Walk-ins** — "How many walk-ins?", "Pending walk-ins"
• **Billing** — "Revenue summary", "Unpaid invoices"
• **Inventory** — "Low stock items", "Inventory count"
• **Employees** — "Employee count", "Who is on leave?"
• **Navigation** — "Go to billing", "Open patients"
• **Stats** — "Give me a summary"

Just type your question!`;

/**
 * Process a user message and return a bot response.
 * @param {string} message - user input
 * @param {object} ctx - app state context
 * @returns {{ text: string, action?: { type: string, payload?: any } }}
 */
export function processMessage(message, ctx) {
    const msg = message.toLowerCase().trim();
    const { patients, appointments, walkins, encounters, invoices, inventory, employees, employeeLeaves, tenant, activeUser, setView } = ctx;

    // --- Greetings ---
    if (greetings.some(g => msg === g || msg.startsWith(g + ' '))) {
        const name = activeUser?.name?.split(' ')[0] || 'there';
        return { text: `Hello ${name}! 👋 I'm your EMR assistant for **${tenant?.name || 'this organization'}**. ${helpText}` };
    }

    // --- Help ---
    if (msg === 'help' || msg === '?' || msg.includes('what can you do') || msg.includes('what do you do')) {
        return { text: helpText };
    }

    // --- Navigation ---
    const navMap = {
        dashboard: ['dashboard', 'home', 'overview'],
        patients: ['patient', 'patients', 'registration'],
        appointments: ['appointment', 'appointments', 'schedule', 'scheduling'],
        emr: ['emr', 'encounter', 'encounters', 'charting', 'clinical'],
        billing: ['billing', 'invoice', 'invoices', 'payment', 'payments'],
        inventory: ['inventory', 'stock', 'supplies', 'pharmacy'],
        employees: ['employee', 'employees', 'staff', 'hr', 'human resources'],
        reports: ['report', 'reports', 'analytics'],
        admin: ['admin', 'settings', 'configuration', 'tenant settings'],
    };

    if (msg.startsWith('go to') || msg.startsWith('open') || msg.startsWith('show me') || msg.startsWith('navigate to') || msg.startsWith('switch to')) {
        for (const [view, keywords] of Object.entries(navMap)) {
            if (keywords.some(k => msg.includes(k))) {
                return {
                    text: `Navigating to **${view.charAt(0).toUpperCase() + view.slice(1)}** 🧭`,
                    action: { type: 'navigate', payload: view }
                };
            }
        }
    }

    // --- Patient queries ---
    if (msg.includes('how many patient') || msg.includes('patient count') || msg.includes('total patient')) {
        return { text: `You currently have **${patients.length}** registered patients.` };
    }

    if (msg.includes('find patient') || msg.includes('search patient') || msg.includes('lookup patient') || msg.includes('look up patient')) {
        const searchTerm = msg.replace(/find patient|search patient|lookup patient|look up patient/i, '').trim();
        if (!searchTerm) {
            return { text: 'Please specify a patient name. Example: "Find patient Meena"' };
        }
        const matches = patients.filter(p =>
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm) ||
            p.mrn?.toLowerCase().includes(searchTerm)
        );
        if (matches.length === 0) {
            return { text: `No patients found matching "**${searchTerm}**".` };
        }
        const list = matches.slice(0, 5).map(p => `• **${p.firstName} ${p.lastName}** (MRN: ${p.mrn}) — DOB: ${p.dob || 'N/A'}`).join('\n');
        return { text: `Found **${matches.length}** patient(s):\n${list}` };
    }

    if (msg.includes('patient') && (msg.includes('list') || msg.includes('all'))) {
        if (patients.length === 0) return { text: 'No patients registered yet.' };
        const list = patients.slice(0, 8).map(p => `• **${p.firstName} ${p.lastName}** (${p.mrn})`).join('\n');
        const more = patients.length > 8 ? `\n...and ${patients.length - 8} more` : '';
        return { text: `**Patients** (${patients.length} total):\n${list}${more}` };
    }

    // --- Appointment queries ---
    if (msg.includes('appointment')) {
        if (msg.includes('how many') || msg.includes('count') || msg.includes('total')) {
            return { text: `There are **${appointments.length}** appointments on record.` };
        }
        if (msg.includes('today')) {
            const today = new Date().toISOString().slice(0, 10);
            const todayAppts = appointments.filter(a => a.start?.slice(0, 10) === today);
            if (todayAppts.length === 0) return { text: "No appointments scheduled for today." };
            const list = todayAppts.slice(0, 5).map(a => `• ${a.start?.slice(11, 16)} — Patient: ${a.patientName || a.patient_id?.slice(0, 8)}`).join('\n');
            return { text: `**Today's appointments** (${todayAppts.length}):\n${list}` };
        }
        if (msg.includes('upcoming') || msg.includes('next') || msg.includes('scheduled')) {
            const now = new Date().toISOString();
            const upcoming = appointments.filter(a => a.start > now && a.status !== 'cancelled').slice(0, 5);
            if (upcoming.length === 0) return { text: 'No upcoming appointments found.' };
            const list = upcoming.map(a => `• ${a.start?.slice(0, 16).replace('T', ' ')} — Status: ${a.status}`).join('\n');
            return { text: `**Upcoming appointments:**\n${list}` };
        }
        return { text: `📅 **${appointments.length}** total appointments. Try "today's appointments" or "upcoming appointments"!` };
    }

    // --- Walk-in queries ---
    if (msg.includes('walk-in') || msg.includes('walkin') || msg.includes('walk in')) {
        const pending = walkins.filter(w => w.status !== 'converted');
        if (msg.includes('pending') || msg.includes('waiting') || msg.includes('active')) {
            return { text: `There are **${pending.length}** pending walk-ins waiting to be converted.` };
        }
        return { text: `**Walk-ins:** ${walkins.length} total, **${pending.length}** pending conversion.` };
    }

    // --- Billing / Revenue ---
    if (msg.includes('revenue') || msg.includes('income') || msg.includes('earning')) {
        const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.paid || 0), 0);
        const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.total || inv.amount || 0), 0);
        return { text: `💰 **Revenue Summary:**\n• Total billed: ₹${totalBilled.toLocaleString()}\n• Collected: ₹${totalRevenue.toLocaleString()}\n• Invoices: ${invoices.length}` };
    }

    if (msg.includes('unpaid') || msg.includes('outstanding') || msg.includes('pending invoice')) {
        const unpaid = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'Paid');
        if (unpaid.length === 0) return { text: '✅ All invoices are paid!' };
        const total = unpaid.reduce((s, inv) => s + Number(inv.total || inv.amount || 0), 0);
        return { text: `⚠️ **${unpaid.length}** unpaid invoices totalling **₹${total.toLocaleString()}**.` };
    }

    if (msg.includes('invoice') || msg.includes('billing')) {
        return { text: `📄 **${invoices.length}** invoices on record. Try "revenue summary" or "unpaid invoices".`, action: { type: 'navigate', payload: 'billing' } };
    }

    // --- Inventory ---
    if (msg.includes('inventory') || msg.includes('stock') || msg.includes('supplies')) {
        if (msg.includes('low') || msg.includes('reorder') || msg.includes('critical')) {
            const lowStock = inventory.filter(i => Number(i.stock) <= Number(i.reorder));
            if (lowStock.length === 0) return { text: '✅ All items are adequately stocked!' };
            const list = lowStock.slice(0, 5).map(i => `• **${i.name}** (${i.code}) — Stock: ${i.stock}, Reorder at: ${i.reorder}`).join('\n');
            return { text: `⚠️ **${lowStock.length}** items at/below reorder level:\n${list}` };
        }
        return { text: `📦 **${inventory.length}** inventory items tracked. Try "low stock items" for alerts.` };
    }

    // --- Employee queries ---
    if (msg.includes('employee') || msg.includes('staff') || msg.includes('team')) {
        if (msg.includes('how many') || msg.includes('count') || msg.includes('total')) {
            return { text: `You have **${employees.length}** employees on record.` };
        }
        if (msg.includes('leave') || msg.includes('absent') || msg.includes('off')) {
            if (!employeeLeaves || employeeLeaves.length === 0) return { text: 'No leave records found.' };
            return { text: `📋 **${employeeLeaves.length}** leave records on file. Navigate to Employees for details.`, action: { type: 'navigate', payload: 'employees' } };
        }
        return { text: `👥 **${employees.length}** employees. Try "employee count" or "who is on leave?"` };
    }

    // --- Encounter queries ---
    if (msg.includes('encounter') || msg.includes('visit') || msg.includes('consultation')) {
        return { text: `🏥 **${encounters.length}** encounters/visits on record.` };
    }

    // --- Summary / Overview ---
    if (msg.includes('summary') || msg.includes('overview') || msg.includes('stats') || msg.includes('status')) {
        const revenue = invoices.reduce((s, inv) => s + Number(inv.paid || 0), 0);
        const pending = walkins.filter(w => w.status !== 'converted').length;
        return {
            text: `📊 **${tenant?.name || 'Tenant'} Summary:**
• Patients: **${patients.length}**
• Appointments: **${appointments.length}**
• Walk-ins pending: **${pending}**
• Encounters: **${encounters.length}**
• Invoices: **${invoices.length}**
• Revenue collected: **₹${revenue.toLocaleString()}**
• Employees: **${employees.length}**
• Inventory items: **${inventory.length}**`
        };
    }

    // --- Fallback ---
    return {
        text: `I'm not sure how to answer that. Try asking about **patients**, **appointments**, **billing**, **inventory**, or **employees**. Type "**help**" for all options.`
    };
}
