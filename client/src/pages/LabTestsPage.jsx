import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  TestTube,
  Activity,
  FileText,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import '../styles/critical-care.css';

export default function LabTestsPage({ tenant, activeUser }) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    fullName: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: '',
    medicalHistory: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  const categories = ['All', 'Blood Test', 'Imaging', 'Pathology', 'Microbiology'];
  const bloodGroups = ['Select Blood Group', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other'];

  // Mock lab tests data
  const mockTests = [
    {
      id: 1,
      name: 'Complete Blood Count (CBC)',
      category: 'Blood Test',
      price: 500,
      duration: '30 min',
      description: 'Complete blood count including hemoglobin, hematocrit, and WBC differential',
      preparation: 'No special preparation required',
      fasting: '8-12 hours fasting recommended'
    },
    {
      id: 2,
      name: 'Lipid Profile',
      category: 'Blood Test',
      price: 800,
      duration: '45 min',
      description: 'Cholesterol, triglycerides, and lipoprotein analysis',
      preparation: '10-12 hours fasting required',
      fasting: '10-12 hours fasting required'
    },
    {
      id: 3,
      name: 'Liver Function Test (LFT)',
      category: 'Blood Test',
      price: 600,
      duration: '30 min',
      description: 'ALT, AST, ALP, bilirubin, and albumin analysis',
      preparation: 'No special preparation required',
      fasting: 'No fasting required'
    },
    {
      id: 4,
      name: 'X-Ray Chest',
      category: 'Imaging',
      price: 1200,
      duration: '15 min',
      description: 'Radiographic examination of chest organs and structures',
      preparation: 'Remove jewelry and metal objects',
      fasting: 'No fasting required'
    },
    {
      id: 5,
      name: 'CT Scan - Head',
      category: 'Imaging',
      price: 3500,
      duration: '30 min',
      description: 'Cross-sectional imaging of head and brain structures',
      preparation: 'Contrast may be administered',
      fasting: 'No fasting required'
    },
    {
      id: 6,
      name: 'MRI - Brain',
      category: 'Imaging',
      price: 8000,
      duration: '45 min',
      description: 'Magnetic resonance imaging of brain tissues and structures',
      preparation: 'Remove all metal objects',
      fasting: 'No fasting required'
    },
    {
      id: 7,
      name: 'Urine Culture & Sensitivity',
      category: 'Microbiology',
      price: 400,
      duration: '48-72 hours',
      description: 'Identification of pathogens and antibiotic sensitivity testing',
      preparation: 'Clean-catch midstream urine sample',
      fasting: 'No fasting required'
    },
    {
      id: 8,
      name: 'Blood Culture',
      category: 'Microbiology',
      price: 350,
      duration: '24-48 hours',
      description: 'Detection of bacteria in bloodstream and identification',
      preparation: 'Sterile collection technique',
      fasting: 'No fasting required'
    }
  ];

  const filteredTests = mockTests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || test.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTestSelect = (test) => {
    setSelectedTest(test);
    setShowBookingModal(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.phone || !formData.fullName || !formData.dateOfBirth) {
      showToast({ message: 'Please fill all required fields', type: 'error' });
      return;
    }

    try {
      // Simulate API call
      setLoading(true);
      setTimeout(() => {
        showToast({ message: 'Lab test booked successfully!', type: 'success', title: 'Lab Booking' });
        setShowBookingModal(false);
        setSelectedTest(null);
        setFormData({
          email: '',
          phone: '',
          fullName: '',
          dateOfBirth: '',
          gender: 'Male',
          bloodGroup: '',
          medicalHistory: '',
          reason: ''
        });
        setLoading(false);
      }, 1500);
    } catch (error) {
      showToast({ message: 'Booking failed: ' + error.message, type: 'error' });
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age + ' years';
  };

  return (
    <div className="page-shell-premium animate-fade-in">
      {/* Header */}
      <header className="page-header-premium mb-8">
        <div>
          <h1 className="page-title-rich flex items-center gap-3">
            Service Catalog
            <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black backdrop-blur-md">Lab Tests</span>
          </h1>
          <p className="dim-label">
            Book laboratory tests and diagnostic services with real-time pricing and preparation guides.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-300">
              <TestTube className="w-3.5 h-3.5" /> {mockTests.length} Standardized Tests
            </div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> NABL Accredited • Quality Verified
            </div>
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-2 gap-3 min-w-[320px]">
          <div className="rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-black mb-1">Categories</div>
            <div className="text-xl font-black text-white">{categories.length - 1} Shards</div>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-black mb-1">Pricing</div>
            <div className="text-xl font-black text-white">Institutional</div>
          </div>
        </div>
      </header>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search lab tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lab Tests Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {filteredTests.map((test, index) => (
          <div
            key={test.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all animate-fade-in cursor-pointer group"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => handleTestSelect(test)}
          >
            {/* Test Header */}
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-slate-900 mb-1 truncate">{test.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <TestTube className="w-3 h-3" />
                    <span className="font-medium">{test.category}</span>
                    <span className="mx-1">•</span>
                    <span className="font-medium">{test.duration}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{test.description}</p>
                </div>
                <div className="text-right ml-2">
                  <div className="text-lg font-black text-blue-600">₹{test.price}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Starting from</div>
                </div>
              </div>
            </div>

            {/* Test Details */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock className="w-3 h-3" />
                <span>Duration: {test.duration}</span>
              </div>
              
              {test.preparation && (
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Preparation:</div>
                    <div className="text-xs">{test.preparation}</div>
                  </div>
                </div>
              )}
              
              {test.fasting && (
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <AlertCircle className="w-3 h-3 text-red-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Fasting:</div>
                    <div className="text-xs">{test.fasting}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="p-4 sm:p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Patient Information</h3>
              <p className="text-sm text-slate-600">
                {selectedTest.name} - {selectedTest.category}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* All form fields in one column for compact view */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Returning patient? Enter your email or phone number first, and we'll auto-fill your information.
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="tel"
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="date"
                          placeholder="dd-mm-yyyy"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {formData.dateOfBirth && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-600">
                            Age: {calculateAge(formData.dateOfBirth)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {genders.map(gender => (
                          <option key={gender} value={gender}>{gender}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Blood Group</label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {bloodGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Medical History (Optional)
                    </label>
                    <textarea
                      placeholder="Any pre-existing conditions, allergies, or past surgeries (e.g., Diabetes, Hypertension, Asthma)"
                      value={formData.medicalHistory}
                      onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows="3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reason for Lab Test
                  </label>
                  <textarea
                    placeholder="Describe the reason for this lab test"
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows="3"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedTest(null);
                    setFormData({
                      email: '',
                      phone: '',
                      fullName: '',
                      dateOfBirth: '',
                      gender: 'Male',
                      bloodGroup: '',
                      medicalHistory: '',
                      reason: ''
                    });
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Book Test</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
