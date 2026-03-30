import { useState, useEffect } from 'react';
import { Plus, Users, Calendar, Phone, AlertCircle, Clock } from 'lucide-react';
import { api } from '../api.js';

export default function TokenGeneration({ tenantId, onTokenGenerated, patients, departments, doctors }) {
  const [formData, setFormData] = useState({
    patientId: '',
    departmentId: '',
    doctorId: '',
    priority: 'general',
    visitType: 'new',
    chiefComplaint: '',
    appointmentId: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone?.includes(searchTerm)
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients([]);
    }
  }, [searchTerm, patients]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePatientSelect = (patient) => {
    setFormData(prev => ({ ...prev, patientId: patient.id }));
    setSearchTerm('');
    setFilteredPatients([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.patientId || !formData.departmentId) {
      alert('Please select patient and department');
      return;
    }

    setLoading(true);
    try {
      const token = await api.post('/opd-tokens', {
        patientId: formData.patientId,
        departmentId: formData.departmentId,
        doctorId: formData.doctorId || null,
        priority: formData.priority,
        visitType: formData.visitType,
        chiefComplaint: formData.chiefComplaint,
        appointmentId: formData.appointmentId || null
      });

      // Reset form
      setFormData({
        patientId: '',
        departmentId: '',
        doctorId: '',
        priority: 'general',
        visitType: 'new',
        chiefComplaint: '',
        appointmentId: ''
      });

      if (onTokenGenerated) {
        onTokenGenerated(token);
      }

      alert(`Token ${token.full_token} generated successfully!`);
    } catch (error) {
      console.error('Error generating token:', error);
      alert('Failed to generate token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Plus className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-bold text-slate-900">Generate OPD Token</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Patient Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {filteredPatients.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => handlePatientSelect(patient)}
                      className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
                    >
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-xs text-slate-500">{patient.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {formData.patientId && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-medium text-blue-900">
                  {patients.find(p => p.id === formData.patientId)?.name || 'Selected Patient'}
                </div>
              </div>
            )}
            <input
              type="hidden"
              name="patientId"
              value={formData.patientId}
              required
            />
          </div>

          {/* Department Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Department *
            </label>
            <select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Department...</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Doctor Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Doctor
            </label>
            <select
              name="doctorId"
              value={formData.doctorId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Doctor (Optional)...</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>Dr. {doctor.name}</option>
              ))}
            </select>
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="general">General</option>
              <option value="urgent">Urgent</option>
              <option value="senior_citizen">Senior Citizen</option>
              <option value="follow_up">Follow Up</option>
            </select>
          </div>

          {/* Visit Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Visit Type
            </label>
            <select
              name="visitType"
              value={formData.visitType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="new">New Visit</option>
              <option value="follow_up">Follow Up</option>
              <option value="consultation">Consultation</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
        </div>

        {/* Chief Complaint */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Chief Complaint
          </label>
          <textarea
            name="chiefComplaint"
            value={formData.chiefComplaint}
            onChange={handleInputChange}
            placeholder="Describe the patient's chief complaint..."
            rows="3"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating Token...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Generate Token
              </>
            )}
          </button>
        </div>
      </form>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Quick Instructions</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Search and select patient from the dropdown</li>
          <li>• Select the appropriate department</li>
          <li>• Assign priority for urgent cases</li>
          <li>• Add chief complaint for reference</li>
          <li>• Token number will be generated automatically</li>
        </ul>
      </div>
    </div>
  );
}
