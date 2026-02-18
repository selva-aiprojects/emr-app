const state = {
  activeTenantId: "t1",
  activeUserId: "u1",
  activeView: "dashboard",
  tenants: [
    {
      id: "t1",
      name: "Selva Care Hospital",
      code: "SCH",
      subdomain: "selva-care",
      theme: { primary: "#0f5a6e", accent: "#f57f17" },
      features: { inventory: true, telehealth: true }
    },
    {
      id: "t2",
      name: "Nila Health Center",
      code: "NHC",
      subdomain: "nila-health",
      theme: { primary: "#1b5e20", accent: "#ef6c00" },
      features: { inventory: true, telehealth: false }
    },
    {
      id: "t3",
      name: "Riverway Community Clinic",
      code: "RCC",
      subdomain: "riverway",
      theme: { primary: "#6a1b9a", accent: "#00897b" },
      features: { inventory: false, telehealth: false }
    }
  ],
  users: [
    { id: "u1", tenantId: "t1", name: "Anita Admin", role: "Admin" },
    { id: "u2", tenantId: "t1", name: "Dr. Kumar", role: "Doctor" },
    { id: "u3", tenantId: "t1", name: "Nurse Priya", role: "Nurse" },
    { id: "u4", tenantId: "t1", name: "Front Desk Ravi", role: "Front Office" },
    { id: "u5", tenantId: "t2", name: "Bala Admin", role: "Admin" },
    { id: "u6", tenantId: "t2", name: "Dr. Noor", role: "Doctor" },
    { id: "u7", tenantId: "t3", name: "Kala Billing", role: "Billing" },
    { id: "u8", tenantId: "t3", name: "Rafi Inventory", role: "Inventory" }
  ],
  patients: [
    {
      id: "p1",
      tenantId: "t1",
      mrn: "SCH-1001",
      firstName: "Meena",
      lastName: "R",
      dob: "1990-02-10",
      gender: "Female",
      phone: "9001001001"
    }
  ],
  appointments: [
    {
      id: "a1",
      tenantId: "t1",
      patientId: "p1",
      providerId: "u2",
      start: nextHour(2),
      end: nextHour(3),
      status: "scheduled",
      reason: "Fever review"
    }
  ],
  encounters: [],
  invoices: [],
  inventory: [
    {
      id: "i1",
      tenantId: "t1",
      code: "MED001",
      name: "Paracetamol 500mg",
      category: "Medicine",
      stock: 18,
      reorder: 20
    }
  ],
  auditLogs: []
};

const permissions = {
  Admin: ["dashboard", "patients", "appointments", "emr", "billing", "inventory", "reports", "admin"],
  Doctor: ["dashboard", "patients", "appointments", "emr", "reports"],
  Nurse: ["dashboard", "patients", "appointments", "emr"],
  "Front Office": ["dashboard", "patients", "appointments"],
  Billing: ["dashboard", "billing", "reports"],
  Inventory: ["dashboard", "inventory", "reports"]
};

const moduleMeta = {
  dashboard: { title: "Dashboard", subtitle: "Operational overview", icon: "fa-solid fa-chart-line" },
  patients: { title: "Patients", subtitle: "Registration and demographics", icon: "fa-solid fa-user-injured" },
  appointments: { title: "Appointments", subtitle: "Scheduling and queue", icon: "fa-solid fa-calendar-check" },
  emr: { title: "EMR", subtitle: "Encounter and charting", icon: "fa-solid fa-notes-medical" },
  billing: { title: "Billing", subtitle: "Invoice and payment operations", icon: "fa-solid fa-file-invoice-dollar" },
  inventory: { title: "Inventory", subtitle: "Stock and reorder tracking", icon: "fa-solid fa-box-open" },
  reports: { title: "Reports", subtitle: "KPIs and audit intelligence", icon: "fa-solid fa-chart-pie" },
  admin: { title: "Admin", subtitle: "Tenant configuration and RBAC", icon: "fa-solid fa-shield-halved" }
};

const el = {
  tenantSelect: byId("tenantSelect"),
  userSelect: byId("userSelect"),
  moduleNav: byId("moduleNav"),
  pageTitle: byId("pageTitle"),
  pageSubtitle: byId("pageSubtitle"),
  roleBadge: byId("roleBadge"),
  tenantName: byId("tenantName"),
  tenantCode: byId("tenantCode"),
  tenantLogo: byId("tenantLogo"),
  dashboardCards: byId("dashboardCards"),
  todayAppointments: byId("todayAppointments"),
  lowStockList: byId("lowStockList"),
  patientTable: byId("patientTable"),
  appointmentTable: byId("appointmentTable"),
  encounterTable: byId("encounterTable"),
  invoiceTable: byId("invoiceTable"),
  inventoryTable: byId("inventoryTable"),
  reportMetrics: byId("reportMetrics"),
  auditList: byId("auditList"),
  rbacList: byId("rbacList"),
  appointmentPatient: byId("appointmentPatient"),
  appointmentProvider: byId("appointmentProvider"),
  encounterPatient: byId("encounterPatient"),
  encounterProvider: byId("encounterProvider"),
  invoicePatient: byId("invoicePatient")
};

const forms = {
  patient: byId("patientForm"),
  appointment: byId("appointmentForm"),
  encounter: byId("encounterForm"),
  invoice: byId("invoiceForm"),
  inventory: byId("inventoryForm"),
  settings: byId("settingsForm")
};

init();

function init() {
  bindEvents();
  seedAudit();
  renderTenantSelect();
  renderUserSelect();
  renderNav();
  renderAll();
  setInterval(simulateRealtime, 12000);
}

function bindEvents() {
  el.tenantSelect.addEventListener("change", (e) => {
    state.activeTenantId = e.target.value;
    const tenantUsers = getTenantUsers();
    state.activeUserId = tenantUsers[0]?.id || "";
    renderUserSelect();
    renderNav();
    renderAll();
  });

  el.userSelect.addEventListener("change", (e) => {
    state.activeUserId = e.target.value;
    renderNav();
    renderAll();
  });

  forms.patient.addEventListener("submit", onAddPatient);
  forms.appointment.addEventListener("submit", onAddAppointment);
  forms.encounter.addEventListener("submit", onAddEncounter);
  forms.invoice.addEventListener("submit", onAddInvoice);
  forms.inventory.addEventListener("submit", onAddInventory);
  forms.settings.addEventListener("submit", onSaveSettings);

  document.body.addEventListener("click", (e) => {
    const act = e.target.dataset.action;
    const id = e.target.dataset.id;
    if (!act || !id) {
      return;
    }
    if (act === "completeAppointment") {
      setAppointmentStatus(id, "completed");
    }
    if (act === "cancelAppointment") {
      setAppointmentStatus(id, "cancelled");
    }
    if (act === "payInvoice") {
      markInvoicePaid(id);
    }
    if (act === "issueStock") {
      changeStock(id, -1);
    }
    if (act === "restock") {
      changeStock(id, 10);
    }
  });
}

function renderTenantSelect() {
  el.tenantSelect.innerHTML = state.tenants
    .map((t) => `<option value="${t.id}">${t.name}</option>`)
    .join("");
  el.tenantSelect.value = state.activeTenantId;
}

function renderUserSelect() {
  const users = getTenantUsers();
  el.userSelect.innerHTML = users
    .map((u) => `<option value="${u.id}">${u.name} (${u.role})</option>`)
    .join("");
  if (!users.some((u) => u.id === state.activeUserId)) {
    state.activeUserId = users[0]?.id || "";
  }
  el.userSelect.value = state.activeUserId;
}

function renderNav() {
  const allowed = getAllowedViews();
  el.moduleNav.innerHTML = allowed
    .map(
      (view) => `<button class="${view === state.activeView ? "active" : ""}" data-view="${view}">
        <i class="${moduleMeta[view].icon}"></i>
        <span>${moduleMeta[view].title}</span>
      </button>`
    )
    .join("");

  if (!allowed.includes(state.activeView)) {
    state.activeView = "dashboard";
  }

  Array.from(el.moduleNav.querySelectorAll("button")).forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeView = btn.dataset.view;
      renderNav();
      renderAll();
    });
  });
}

function renderAll() {
  applyTenantTheme();
  renderHeader();
  toggleViews();
  renderDashboard();
  renderPatients();
  renderAppointments();
  renderEncounters();
  renderInvoices();
  renderInventory();
  renderReports();
  renderAdmin();
  fillReferenceSelectors();
}

function renderHeader() {
  const tenant = getTenant();
  const user = getUser();
  const meta = moduleMeta[state.activeView];
  el.pageTitle.textContent = meta.title;
  el.pageSubtitle.textContent = meta.subtitle;
  el.roleBadge.textContent = user?.role || "No User";
  el.tenantName.textContent = tenant.name;
  el.tenantCode.textContent = `${tenant.code} | ${tenant.subdomain}.example.com`;
  el.tenantLogo.textContent = tenant.code;
}

function toggleViews() {
  Array.from(document.querySelectorAll(".view")).forEach((view) => {
    view.classList.toggle("active", view.id === state.activeView);
  });
}

function renderDashboard() {
  const patients = getTenantPatients();
  const appointments = getTenantAppointments();
  const encounters = getTenantEncounters();
  const invoices = getTenantInvoices();
  const inventory = getTenantInventory();

  const totalRevenue = invoices.reduce((sum, i) => sum + i.paid, 0);
  const openInvoices = invoices.filter((i) => i.status !== "paid").length;

  renderCards(el.dashboardCards, [
    ["Patients", patients.length, "fa-solid fa-users"],
    ["Appointments", appointments.length, "fa-solid fa-calendar-day"],
    ["Open Encounters", encounters.filter((e) => e.status === "open").length, "fa-solid fa-user-doctor"],
    ["Revenue", currency(totalRevenue), "fa-solid fa-dollar-sign"],
    ["Open Invoices", openInvoices, "fa-solid fa-file-invoice"],
    ["Low Stock", inventory.filter((x) => x.stock <= x.reorder).length, "fa-solid fa-boxes-stacked"]
  ]);

  const today = dayKey(new Date().toISOString());
  const todaysAppointments = appointments.filter((a) => dayKey(a.start) === today);
  el.todayAppointments.innerHTML = todaysAppointments.length
    ? todaysAppointments
      .map((a) => `<li>${patientName(a.patientId)} with ${userName(a.providerId)} at ${timeOnly(a.start)} (${a.status})</li>`)
      .join("")
    : "<li>No appointments today.</li>";

  const lowStock = inventory.filter((item) => item.stock <= item.reorder);
  el.lowStockList.innerHTML = lowStock.length
    ? lowStock.map((i) => `<li>${i.name} stock ${i.stock} (reorder ${i.reorder})</li>`).join("")
    : "<li>No low-stock items.</li>";
}

function renderPatients() {
  el.patientTable.innerHTML = getTenantPatients()
    .map(
      (p) =>
        `<tr><td>${p.mrn}</td><td>${p.firstName} ${p.lastName}</td><td>${p.dob}</td><td>${p.gender}</td><td>${p.phone}</td></tr>`
    )
    .join("");
}

function renderAppointments() {
  el.appointmentTable.innerHTML = getTenantAppointments()
    .sort((a, b) => a.start.localeCompare(b.start))
    .map(
      (a) => `<tr>
        <td>${patientName(a.patientId)}</td>
        <td>${userName(a.providerId)}</td>
        <td>${formatDateTime(a.start)}</td>
        <td>${a.status}</td>
        <td>
          <button class="action-btn" data-action="completeAppointment" data-id="${a.id}">Complete</button>
          <button class="action-btn warn" data-action="cancelAppointment" data-id="${a.id}">Cancel</button>
        </td>
      </tr>`
    )
    .join("");
}

function renderEncounters() {
  el.encounterTable.innerHTML = getTenantEncounters()
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate))
    .map(
      (e) => `<tr>
        <td>${e.visitDate}</td>
        <td>${patientName(e.patientId)}</td>
        <td>${userName(e.providerId)}</td>
        <td>${e.type}</td>
        <td>${e.status}</td>
      </tr>`
    )
    .join("");
}

function renderInvoices() {
  el.invoiceTable.innerHTML = getTenantInvoices()
    .sort((a, b) => b.number.localeCompare(a.number))
    .map(
      (i) => `<tr>
        <td>${i.number}</td>
        <td>${patientName(i.patientId)}</td>
        <td>${currency(i.total)}</td>
        <td>${currency(i.paid)}</td>
        <td>${i.status}</td>
        <td><button class="action-btn" data-action="payInvoice" data-id="${i.id}">Mark Paid</button></td>
      </tr>`
    )
    .join("");
}

function renderInventory() {
  const items = getTenantInventory();
  el.inventoryTable.innerHTML = items
    .map(
      (i) => `<tr>
        <td>${i.code}</td>
        <td>${i.name}</td>
        <td>${i.category}</td>
        <td>${i.stock}</td>
        <td>${i.reorder}</td>
        <td>
          <button class="action-btn" data-action="issueStock" data-id="${i.id}">Issue -1</button>
          <button class="action-btn" data-action="restock" data-id="${i.id}">Restock +10</button>
        </td>
      </tr>`
    )
    .join("");
}

function renderReports() {
  const appointments = getTenantAppointments();
  const invoices = getTenantInvoices();
  const encounters = getTenantEncounters();
  const cancelledRate = appointments.length
    ? Math.round((appointments.filter((a) => a.status === "cancelled").length / appointments.length) * 100)
    : 0;

  renderCards(el.reportMetrics, [
    ["Completed Visits", encounters.filter((e) => e.status === "closed").length, "fa-solid fa-check-double"],
    ["Scheduled vs Completed", `${appointments.length} / ${appointments.filter((a) => a.status === "completed").length}`, "fa-solid fa-calendar-check"],
    ["Cancellation Rate", `${cancelledRate}%`, "fa-solid fa-ban"],
    ["Outstanding AR", currency(invoices.reduce((s, i) => s + (i.total - i.paid), 0)), "fa-solid fa-hand-holding-dollar"]
  ]);

  el.auditList.innerHTML = getTenantAudits()
    .slice(-8)
    .reverse()
    .map((a) => `<li>${a.when} - ${a.action} by ${a.userName}</li>`)
    .join("");
}

function renderAdmin() {
  const tenant = getTenant();
  forms.settings.displayName.value = tenant.name;
  forms.settings.primaryColor.value = tenant.theme.primary;
  forms.settings.accentColor.value = tenant.theme.accent;
  forms.settings.featureInventory.checked = !!tenant.features.inventory;
  forms.settings.featureTelehealth.checked = !!tenant.features.telehealth;

  const roleMatrix = Object.entries(permissions)
    .map(([role, modules]) => `<li><strong>${role}:</strong> ${modules.join(", ")}</li>`)
    .join("");
  el.rbacList.innerHTML = roleMatrix;
}

function fillReferenceSelectors() {
  const patients = getTenantPatients();
  const providers = getTenantUsers().filter((u) => ["Doctor", "Nurse", "Admin"].includes(u.role));
  const patientOptions = patients.length
    ? patients.map((p) => `<option value="${p.id}">${p.mrn} - ${p.firstName} ${p.lastName}</option>`).join("")
    : '<option value="">No patients</option>';

  const providerOptions = providers.length
    ? providers.map((p) => `<option value="${p.id}">${p.name}</option>`).join("")
    : '<option value="">No providers</option>';

  [el.appointmentPatient, el.encounterPatient, el.invoicePatient].forEach((select) => {
    select.innerHTML = patientOptions;
  });

  [el.appointmentProvider, el.encounterProvider].forEach((select) => {
    select.innerHTML = providerOptions;
  });
}

function onAddPatient(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const index = getTenantPatients().length + 1001;
  const tenant = getTenant();
  const patient = {
    id: uid("p"),
    tenantId: tenant.id,
    mrn: `${tenant.code}-${index}`,
    firstName: form.get("firstName"),
    lastName: form.get("lastName"),
    dob: form.get("dob"),
    gender: form.get("gender"),
    phone: form.get("phone")
  };
  state.patients.push(patient);
  logAudit(`patient.create ${patient.mrn}`);
  e.target.reset();
  renderAll();
}

function onAddAppointment(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const start = form.get("start");
  const end = form.get("end");
  if (new Date(end) <= new Date(start)) {
    alert("End time must be after start time.");
    return;
  }
  const appointment = {
    id: uid("a"),
    tenantId: state.activeTenantId,
    patientId: form.get("patientId"),
    providerId: form.get("providerId"),
    start,
    end,
    reason: form.get("reason"),
    status: "scheduled"
  };
  state.appointments.push(appointment);
  logAudit(`appointment.create ${appointment.id}`);
  e.target.reset();
  renderAll();
}

function onAddEncounter(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const encounter = {
    id: uid("e"),
    tenantId: state.activeTenantId,
    patientId: form.get("patientId"),
    providerId: form.get("providerId"),
    type: form.get("type"),
    complaint: form.get("complaint"),
    diagnosis: form.get("diagnosis"),
    notes: form.get("notes"),
    visitDate: nowDate(),
    status: "open"
  };
  state.encounters.push(encounter);
  logAudit(`encounter.create ${encounter.id}`);
  e.target.reset();
  renderAll();
}

function onAddInvoice(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const amount = Number(form.get("amount"));
  const invoice = {
    id: uid("inv"),
    tenantId: state.activeTenantId,
    patientId: form.get("patientId"),
    number: `${getTenant().code}-INV-${String(getTenantInvoices().length + 1).padStart(4, "0")}`,
    description: form.get("description"),
    total: amount,
    paid: 0,
    status: "issued"
  };
  state.invoices.push(invoice);
  logAudit(`invoice.issue ${invoice.number}`);
  e.target.reset();
  renderAll();
}

function onAddInventory(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const item = {
    id: uid("i"),
    tenantId: state.activeTenantId,
    code: form.get("code"),
    name: form.get("name"),
    category: form.get("category"),
    stock: Number(form.get("stock")),
    reorder: Number(form.get("reorder"))
  };
  state.inventory.push(item);
  logAudit(`inventory.create ${item.code}`);
  e.target.reset();
  renderAll();
}

function onSaveSettings(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const tenant = getTenant();
  tenant.name = form.get("displayName");
  tenant.theme.primary = form.get("primaryColor");
  tenant.theme.accent = form.get("accentColor");
  tenant.features.inventory = form.get("featureInventory") === "on";
  tenant.features.telehealth = form.get("featureTelehealth") === "on";
  logAudit("tenant.settings.update");
  renderAll();
}

function setAppointmentStatus(id, status) {
  const appointment = state.appointments.find((a) => a.id === id && a.tenantId === state.activeTenantId);
  if (!appointment) {
    return;
  }
  appointment.status = status;
  if (status === "completed") {
    const linked = state.encounters.find((e) => e.tenantId === state.activeTenantId && e.patientId === appointment.patientId && e.status === "open");
    if (linked) {
      linked.status = "closed";
    }
  }
  logAudit(`appointment.${status} ${id}`);
  renderAll();
}

function markInvoicePaid(id) {
  const invoice = state.invoices.find((i) => i.id === id && i.tenantId === state.activeTenantId);
  if (!invoice) {
    return;
  }
  invoice.paid = invoice.total;
  invoice.status = "paid";
  logAudit(`invoice.paid ${invoice.number}`);
  renderAll();
}

function changeStock(id, delta) {
  const item = state.inventory.find((i) => i.id === id && i.tenantId === state.activeTenantId);
  if (!item) {
    return;
  }
  item.stock = Math.max(0, item.stock + delta);
  logAudit(`inventory.${delta > 0 ? "receipt" : "issue"} ${item.code}`);
  renderAll();
}

function simulateRealtime() {
  const appointments = getTenantAppointments().filter((a) => a.status === "scheduled");
  if (appointments.length) {
    const pick = appointments[Math.floor(Math.random() * appointments.length)];
    if (new Date(pick.start) < new Date(Date.now() + 60 * 60 * 1000)) {
      pick.status = "completed";
      logAudit(`realtime.appointment.completed ${pick.id}`);
      renderAll();
      return;
    }
  }

  const inventory = getTenantInventory();
  if (inventory.length) {
    const item = inventory[Math.floor(Math.random() * inventory.length)];
    if (item.stock > 0) {
      item.stock -= 1;
      logAudit(`realtime.inventory.issue ${item.code}`);
      renderAll();
    }
  }
}

function seedAudit() {
  logAudit("auth.login success");
}

function getAllowedViews() {
  const user = getUser();
  const roleViews = permissions[user?.role] || ["dashboard"];
  const tenant = getTenant();
  return roleViews.filter((view) => {
    if (view === "inventory" && !tenant.features.inventory) {
      return false;
    }
    return true;
  });
}

function getTenant() {
  return state.tenants.find((t) => t.id === state.activeTenantId);
}

function getUser() {
  return state.users.find((u) => u.id === state.activeUserId);
}

function getTenantUsers() {
  return state.users.filter((u) => u.tenantId === state.activeTenantId);
}

function getTenantPatients() {
  return state.patients.filter((p) => p.tenantId === state.activeTenantId);
}

function getTenantAppointments() {
  return state.appointments.filter((a) => a.tenantId === state.activeTenantId);
}

function getTenantEncounters() {
  return state.encounters.filter((e) => e.tenantId === state.activeTenantId);
}

function getTenantInvoices() {
  return state.invoices.filter((i) => i.tenantId === state.activeTenantId);
}

function getTenantInventory() {
  return state.inventory.filter((i) => i.tenantId === state.activeTenantId);
}

function getTenantAudits() {
  return state.auditLogs.filter((a) => a.tenantId === state.activeTenantId);
}

function logAudit(action) {
  state.auditLogs.push({
    id: uid("log"),
    tenantId: state.activeTenantId,
    userId: state.activeUserId,
    userName: getUser()?.name || "system",
    action,
    when: formatDateTime(new Date().toISOString())
  });
}

function renderCards(container, entries) {
  const template = byId("cardTemplate");
  container.innerHTML = "";
  entries.forEach(([label, value, icon]) => {
    const node = template.content.cloneNode(true);
    node.querySelector("h4").textContent = label;
    node.querySelector("p").textContent = value;
    if (icon) {
      // Create header wrapper if not exists or prepend icon
      const header = document.createElement("div");
      header.className = "metric-card-header";

      const iconDiv = document.createElement("div");
      iconDiv.className = "metric-card-icon";
      iconDiv.innerHTML = `<i class="${icon}"></i>`;

      const title = node.querySelector("h4");
      // Remove title from normal flow to put in header
      title.parentNode.removeChild(title);

      header.appendChild(title);
      header.appendChild(iconDiv);

      node.querySelector("article").prepend(header);
    }
    container.appendChild(node);
  });
}

function applyTenantTheme() {
  const theme = getTenant().theme;
  document.documentElement.style.setProperty("--primary", theme.primary);
  document.documentElement.style.setProperty("--accent", theme.accent);
}

function patientName(patientId) {
  const p = state.patients.find((x) => x.id === patientId);
  return p ? `${p.firstName} ${p.lastName}` : "Unknown";
}

function userName(userId) {
  return state.users.find((u) => u.id === userId)?.name || "Unknown";
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function byId(id) {
  return document.getElementById(id);
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString();
}

function timeOnly(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function nowDate() {
  return new Date().toISOString().slice(0, 10);
}

function nextHour(step) {
  return new Date(Date.now() + step * 60 * 60 * 1000).toISOString().slice(0, 16);
}

function dayKey(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

function currency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}
