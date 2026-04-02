import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { 
  Users, 
  Star, 
  Clock, 
  MapPin, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  User,
  ShieldCheck,
  Building2,
  IndianRupee,
  Award
} from 'lucide-react';
import '../styles/critical-care.css';

export default function EmployeeMasterPage({ tenant }) {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [showCredentialForm, setShowCredentialForm] = useState(false);
  const [showAddEmployeeForm, setShowAddEmployeeForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    employeeId: '',
    department: '',
    role: '',
    status: 'Active',
    joinDate: '',
    credentials: {
      rating: 0,
      experience: 0,
      consultationFee: 0,
      location: '',
      availableDays: [],
      specialization: '',
      education: '',
      languages: []
    }
  });

  const [credentialData, setCredentialData] = useState({
    rating: 0,
    experience: 0,
    consultationFee: 0,
    location: '',
    availableDays: [],
    specialization: '',
    education: '',
    languages: []
  });

  const departments = ['All', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine', 'Surgery', 'Radiology', 'Pathology'];
  const roles = ['Doctor', 'Nurse', 'Administrator', 'Support Staff', 'Technician'];

  // Mock employee data - replace with actual API call
  const mockEmployees = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@hospital.com',
      department: 'Cardiology',
      role: 'Doctor',
      status: 'Active',
      joinDate: '2020-03-15',
      employeeId: 'EMP001',
      credentials: {
        rating: 4.8,
        experience: 15,
        consultationFee: 500,
        location: 'Main Hospital Building',
        availableDays: ['Mon', 'Wed', 'Fri'],
        specialization: 'Interventional Cardiology',
        education: 'MD - Harvard Medical School',
        languages: ['English', 'Hindi', 'Tamil']
      }
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      email: 'michael.chen@hospital.com',
      department: 'Neurology',
      role: 'Doctor',
      status: 'Active',
      joinDate: '2018-07-22',
      employeeId: 'EMP002',
      credentials: {
        rating: 4.9,
        experience: 12,
        consultationFee: 600,
        location: 'Neurology Wing',
        availableDays: ['Tue', 'Thu', 'Sat'],
        specialization: 'Neuro-interventional Surgery',
        education: 'MD - Johns Hopkins',
        languages: ['English', 'Mandarin']
      }
    },
    {
      id: 3,
      name: 'Dr. Emily Rodriguez',
      email: 'emily.rodriguez@hospital.com',
      department: 'Pediatrics',
      role: 'Doctor',
      status: 'Active',
      joinDate: '2019-11-10',
      employeeId: 'EMP003',
      credentials: {
        rating: 4.7,
        experience: 8,
        consultationFee: 400,
        location: 'Pediatrics Department',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        specialization: 'Pediatric Cardiology',
        education: 'MD - Stanford Medical School',
        languages: ['English', 'Spanish']
      }
    },
    {
      id: 4,
      name: 'James Wilson',
      email: 'james.wilson@hospital.com',
      department: 'Administration',
      role: 'Nurse',
      status: 'Active',
      joinDate: '2021-01-05',
      employeeId: 'EMP004',
      credentials: null
    }
  ];

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setEmployees(mockEmployees);
        setLoading(false);
      }, 1000);
    } catch (error) {
      showToast({ message: 'Failed to load employees', type: 'error' });
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All' || employee.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      // Simulate API call to add employee
      const newId = Math.max(...employees.map(emp => emp.id), 0) + 1;
      const employeeToAdd = {
        ...newEmployee,
        id: newId,
        joinDate: new Date().toISOString().split('T')[0]
      };
      
      setEmployees([...employees, employeeToAdd]);
      
      showToast({ message: 'Employee added successfully!', type: 'success' });
      setShowAddEmployeeForm(false);
      setNewEmployee({
        name: '',
        email: '',
        employeeId: '',
        department: '',
        role: '',
        status: 'Active',
        joinDate: '',
        credentials: {
          rating: 0,
          experience: 0,
          consultationFee: 0,
          location: '',
          availableDays: [],
          specialization: '',
          education: '',
          languages: []
        }
      });
    } catch (error) {
      showToast({ message: 'Failed to add employee', type: 'error' });
    }
  };

  const handleCredentialSubmit = async (e) => {
    e.preventDefault();
    try {
      // Simulate API call to save credentials
      const updatedEmployees = employees.map(emp => 
        emp.id === selectedEmployee.id 
          ? { ...emp, credentials: { ...credentialData } }
          : emp
      );
      setEmployees(updatedEmployees);
      
      showToast({ message: 'Doctor credentials updated successfully!', type: 'success' });
      setShowCredentialForm(false);
      setSelectedEmployee(null);
      setCredentialData({
        rating: 0,
        experience: 0,
        consultationFee: 0,
        location: '',
        availableDays: [],
        specialization: '',
        education: '',
        languages: []
      });
    } catch (error) {
      showToast({ message: 'Failed to update credentials', type: 'error' });
    }
  };

  const handleEditCredentials = (employee) => {
    setSelectedEmployee(employee);
    setCredentialData(employee.credentials || {
      rating: 0,
      experience: 0,
      consultationFee: 0,
      location: '',
      availableDays: [],
      specialization: '',
      education: '',
      languages: []
    });
    setShowCredentialForm(true);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        className={i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  const renderStarsInput = (rating, onChange) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              size={20}
              className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Employee Master - Doctor Credentials</h1>
        <p className="text-slate-600">Manage employee profiles and doctor professional credentials</p>
      </header>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employees by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => setShowAddEmployeeForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-wider">Employee</th>
                <th className="text-left px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-wider">Department</th>
                <th className="text-left px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-wider">Credentials</th>
                <th className="text-left px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-slate-500">Loading employees...</p>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600">No employees found</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee, index) => (
                  <tr key={employee.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-black text-slate-900">{employee.name}</div>
                          <div className="text-xs text-slate-500">{employee.email}</div>
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">ID: {employee.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
                        {employee.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        employee.role === 'Doctor' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-slate-50 text-slate-700'
                      }`}>
                        {employee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        employee.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {employee.role === 'Doctor' && employee.credentials ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              {renderStars(employee.credentials.rating)}
                            </div>
                            <span className="text-sm font-black text-slate-700">{employee.credentials.rating}</span>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Rating</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-bold text-slate-700">{employee.credentials.experience} years</span>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Experience</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{employee.credentials.location}</span>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Location</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-bold text-slate-700">₹{employee.credentials.consultationFee}</span>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Consultation Fee</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-bold text-slate-700">{employee.credentials.availableDays.join(', ')}</span>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Available Days</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">No credentials</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {employee.role === 'Doctor' && (
                          <button
                            onClick={() => handleEditCredentials(employee)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Credentials"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                          title="Edit Employee"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credential Edit Modal */}
      {showCredentialForm && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Edit Doctor Credentials</h3>
              <p className="text-sm text-slate-600">Update professional credentials for {selectedEmployee.name}</p>
            </div>

            <form onSubmit={handleCredentialSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                  {renderStarsInput(credentialData.rating, (rating) => setCredentialData({...credentialData, rating}))}
                  <div className="text-xs text-slate-500 mt-1">Current: {credentialData.rating}/5</div>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Experience (years)</label>
                  <input
                    type="number"
                    value={credentialData.experience}
                    onChange={(e) => setCredentialData({...credentialData, experience: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    max="50"
                  />
                </div>

                {/* Consultation Fee */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={credentialData.consultationFee}
                    onChange={(e) => setCredentialData({...credentialData, consultationFee: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={credentialData.location}
                    onChange={(e) => setCredentialData({...credentialData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Main Hospital Building"
                  />
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Specialization</label>
                  <input
                    type="text"
                    value={credentialData.specialization}
                    onChange={(e) => setCredentialData({...credentialData, specialization: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Interventional Cardiology"
                  />
                </div>

                {/* Education */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Education</label>
                  <input
                    type="text"
                    value={credentialData.education}
                    onChange={(e) => setCredentialData({...credentialData, education: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., MD - Harvard Medical School"
                  />
                </div>
              </div>

              {/* Available Days */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Available Days</label>
                <div className="grid grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <label key={day} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={credentialData.availableDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCredentialData({...credentialData, availableDays: [...credentialData.availableDays, day]});
                          } else {
                            setCredentialData({...credentialData, availableDays: credentialData.availableDays.filter(d => d !== day)});
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Languages</label>
                <input
                  type="text"
                  value={credentialData.languages.join(', ')}
                  onChange={(e) => setCredentialData({...credentialData, languages: e.target.value.split(',').map(lang => lang.trim()).filter(lang => lang)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., English, Hindi, Tamil"
                />
                <div className="text-xs text-slate-500 mt-1">Separate languages with commas</div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCredentialForm(false);
                    setSelectedEmployee(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployeeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Add New Employee</h3>
              <p className="text-sm text-slate-600">Enter employee details and professional credentials</p>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-wider">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Employee ID *</label>
                    <input
                      type="text"
                      value={newEmployee.employeeId}
                      onChange={(e) => setNewEmployee({...newEmployee, employeeId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., EMP001"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Department *</label>
                    <select
                      value={newEmployee.department}
                      onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Department...</option>
                      {departments.filter(dept => dept !== 'All').map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Role *</label>
                    <select
                      value={newEmployee.role}
                      onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Role...</option>
                      {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <select
                      value={newEmployee.status}
                      onChange={(e) => setNewEmployee({...newEmployee, status: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Join Date</label>
                    <input
                      type="date"
                      value={newEmployee.joinDate}
                      onChange={(e) => setNewEmployee({...newEmployee, joinDate: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Professional Credentials - Only show for Doctors */}
                {newEmployee.role === 'Doctor' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-wider">Professional Credentials</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                      {renderStarsInput(newEmployee.credentials.rating, (rating) => 
                        setNewEmployee({
                          ...newEmployee, 
                          credentials: { ...newEmployee.credentials, rating }
                        })
                      )}
                      <div className="text-xs text-slate-500 mt-1">Current: {newEmployee.credentials.rating}/5</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Experience (years)</label>
                      <input
                        type="number"
                        value={newEmployee.credentials.experience}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee, 
                          credentials: { ...newEmployee.credentials, experience: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        max="50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Consultation Fee (₹)</label>
                      <input
                        type="number"
                        value={newEmployee.credentials.consultationFee}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee, 
                          credentials: { ...newEmployee.credentials, consultationFee: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={newEmployee.credentials.location}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee, 
                          credentials: { ...newEmployee.credentials, location: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Main Hospital Building"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Specialization</label>
                      <input
                        type="text"
                        value={newEmployee.credentials.specialization}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee, 
                          credentials: { ...newEmployee.credentials, specialization: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Interventional Cardiology"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Education</label>
                      <input
                        type="text"
                        value={newEmployee.credentials.education}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee, 
                          credentials: { ...newEmployee.credentials, education: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., MD - Harvard Medical School"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Available Days</label>
                      <div className="grid grid-cols-7 gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                          <label key={day} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newEmployee.credentials.availableDays.includes(day)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewEmployee({
                                    ...newEmployee, 
                                    credentials: { ...newEmployee.credentials, availableDays: [...newEmployee.credentials.availableDays, day] }
                                  });
                                } else {
                                  setNewEmployee({
                                    ...newEmployee, 
                                    credentials: { ...newEmployee.credentials, availableDays: newEmployee.credentials.availableDays.filter(d => d !== day) }
                                  });
                                }
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Languages</label>
                      <input
                        type="text"
                        value={newEmployee.credentials.languages.join(', ')}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee, 
                          credentials: { ...newEmployee.credentials, languages: e.target.value.split(',').map(lang => lang.trim()).filter(lang => lang) }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., English, Hindi, Tamil"
                      />
                      <div className="text-xs text-slate-500 mt-1">Separate languages with commas</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddEmployeeForm(false);
                    setNewEmployee({
                      name: '',
                      email: '',
                      employeeId: '',
                      department: '',
                      role: '',
                      status: 'Active',
                      joinDate: '',
                      credentials: {
                        rating: 0,
                        experience: 0,
                        consultationFee: 0,
                        location: '',
                        availableDays: [],
                        specialization: '',
                        education: '',
                        languages: []
                      }
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
