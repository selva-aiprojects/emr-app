export function currency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
}

export function patientName(patientId, patients) {
  const p = patients.find((x) => x.id === patientId);
  return p ? `${p.firstName} ${p.lastName}` : 'Unknown';
}

export function userName(userId, users) {
  return users.find((x) => x.id === userId)?.name || 'Unknown';
}
