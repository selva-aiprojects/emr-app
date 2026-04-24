import PatientPicker from '../PatientPicker.jsx';

export default function PatientPickerOverlay({
  open,
  onClose,
  tenant,
  patients,
  encounters,
  onSelect
}) {
  if (!open) return null;

  return (
    <PatientPicker
      tenantId={tenant?.id}
      patients={patients}
      encounters={encounters}
      onSelect={onSelect}
    />
  );
}
