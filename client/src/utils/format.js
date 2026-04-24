export function currency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
}

export function patientName(patientId, patients) {
  if (!Array.isArray(patients)) return 'Unknown';
  const p = patients.find((x) => x.id === patientId);
  if (!p) return 'Unknown';
  
  // Handle different possible name field formats
  if (p.firstName && p.lastName) {
    return `${p.firstName} ${p.lastName}`;
  }
  if (p.first_name && p.last_name) {
    return `${p.first_name} ${p.last_name}`;
  }
  if (p.name) {
    return p.name;
  }
  if (p.patient_name) {
    return p.patient_name;
  }
  
  return 'Unknown Patient';
}

export function userName(userId, users) {
  if (!Array.isArray(users)) return 'Unknown';
  return users.find((x) => x.id === userId)?.name || 'Unknown';
}
