import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { Star, MapPin, Clock, Calendar, Search, Plus, Edit, Trash2, Filter } from 'lucide-react';
import DoctorAvailabilityPage from './DoctorAvailabilityPage.jsx';
import '../styles/critical-care.css';

export default function FindDoctorPage({
  activeUser,
  session,
  providers = [],
  onCreateAppointment,
  onSelfAppointment,
  patients = []
}) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAvailabilityPage, setShowAvailabilityPage] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);

  const isPatient = activeUser.role === 'Patient';

  // Mock doctor data - replace with actual API call
  const mockDoctors = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      specialty: 'Cardiologist',
      experience: 15,
      rating: 4.8,
      consultationFee: 500,
      availableDays: ['Mon', 'Wed', 'Fri'],
      image: null,
      location: 'Main Hospital Building',
      education: 'MD - Harvard Medical School',
      languages: ['English', 'Hindi', 'Tamil']
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      specialty: 'Neurologist',
      experience: 12,
      rating: 4.9,
      consultationFee: 600,
      availableDays: ['Tue', 'Thu', 'Sat'],
      image: null,
      location: 'Neurology Wing',
      education: 'MD - Johns Hopkins',
      languages: ['English', 'Mandarin']
    },
    {
      id: 3,
      name: 'Dr. Emily Rodriguez',
      specialty: 'Pediatrician',
      experience: 8,
      rating: 4.7,
      consultationFee: 400,
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      image: null,
      location: 'Pediatrics Department',
      education: 'MD - Stanford Medical School',
      languages: ['English', 'Spanish']
    },
    {
      id: 4,
      name: 'Dr. James Wilson',
      specialty: 'Orthopedic Surgeon',
      experience: 20,
      rating: 4.9,
      consultationFee: 800,
      availableDays: ['Wed', 'Fri'],
      image: null,
      location: 'Orthopedic Center',
      education: 'MD - Mayo Clinic',
      languages: ['English', 'German']
    }
  ];

  const specialties = ['All', 'Cardiologist', 'Neurologist', 'Pediatrician', 'Orthopedic Surgeon', 'General Physician', 'Dermatologist', 'Gynecologist'];

  useEffect(() => {
    // Simulate loading doctors
    setTimeout(() => {
      setDoctors(mockDoctors);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setShowAvailabilityPage(true);
  };

  const handleBackToDoctorList = () => {
    setShowAvailabilityPage(false);
    setSelectedDoctor(null);
  };

  const handleFinalBooking = async (appointmentData) => {
    try {
      if (isPatient) {
        await onSelfAppointment({ preventDefault: () => {}, target: new FormData() });
      } else {
        await onCreateAppointment({ preventDefault: () => {}, target: new FormData() });
      }

      showToast({ message: 'Appointment booked successfully!', type: 'success', title: 'Appointment Booking' });
      setShowAvailabilityPage(false);
      setSelectedDoctor(null);
    } catch (err) {
      showToast({ message: 'Booking failed: ' + err.message, type: 'error' });
    }
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

  if (loading) {
    return (
      <div className="page-shell-premium animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Show Availability Page if selected
  if (showAvailabilityPage && selectedDoctor) {
    return (
      <DoctorAvailabilityPage
        selectedDoctor={selectedDoctor}
        activeUser={activeUser}
        session={session}
        patients={patients}
        onBookAppointment={handleFinalBooking}
        onBack={handleBackToDoctorList}
      />
    );
  }

  return (
    <div className="page-shell-premium animate-fade-in">
      {/* Add Doctor Modal */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={() => setShowAddDoctorModal(false)}>
          <div className="clinical-card w-full max-w-md p-10 shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Register New Provider</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Credentialing Node</p>
            </div>
            <form className="space-y-6" onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const newDoc = {
                id: Date.now(),
                name: fd.get('name'),
                specialty: fd.get('specialty'),
                experience: fd.get('experience'),
                consultationFee: fd.get('fee'),
                location: fd.get('location'),
                rating: 5.0,
                availableDays: ['Mon', 'Wed', 'Fri'],
                image: null
              };
              setDoctors([newDoc, ...doctors]);
              showToast({ message: 'Doctor registered successfully!', type: 'success', title: 'Provider Registry' });
              setShowAddDoctorModal(false);
            }}>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Nomenclature</label>
                <input name="name" className="input-field py-4 bg-slate-50 border-none rounded-xl font-bold" placeholder="Dr. Jane Smith" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Specialty</label>
                  <select name="specialty" className="input-field h-[56px] bg-slate-50 border-none rounded-xl font-bold">
                    {specialties.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Experience (Yrs)</label>
                  <input name="experience" type="number" className="input-field py-4 bg-slate-50 border-none rounded-xl" placeholder="10" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Consultation Fee (₹)</label>
                  <input name="fee" type="number" className="input-field py-4 bg-slate-50 border-none rounded-xl" placeholder="500" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Location</label>
                  <input name="location" className="input-field py-4 bg-slate-50 border-none rounded-xl" placeholder="Wing A" required />
                </div>
              </div>
              <div className="pt-6 border-t border-slate-50 flex gap-4">
                <button type="button" onClick={() => setShowAddDoctorModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Abort</button>
                <button type="submit" className="flex-2 btn-primary py-4 px-8 text-[10px] uppercase tracking-widest shadow-xl">Confirm Registration</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Find a Doctor</h1>
        <p className="text-slate-600">Book appointments with our expert medical professionals</p>
      </header>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search doctors by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Specialty Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>

          {/* Add Doctor Button */}
          <button 
            onClick={() => setShowAddDoctorModal(true)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Doctor
          </button>
        </div>
      </div>

      {/* Doctors Grid - Enhanced styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor, index) => (
          <div
            key={doctor.id}
            className="clinical-card overflow-hidden hover:shadow-xl transition-all animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Doctor Header */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <span className="text-xl font-black text-white">
                      {doctor.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-900">{doctor.name}</h3>
                    <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">{doctor.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Doctor Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-slate-700 truncate">{doctor.location}</span>
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Location</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-slate-700">{doctor.experience} years</span>
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Experience</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-slate-700">{doctor.availableDays.join(', ')}</span>
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Available</span>
                </div>
              </div>
            </div>

            {/* Rating and Fee */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    {renderStars(doctor.rating)}
                  </div>
                  <span className="text-sm font-black text-slate-700">{doctor.rating}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Consultation Fee</p>
                  <p className="text-xl font-black text-blue-600">₹{doctor.consultationFee}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6">
              <button
                onClick={() => handleBookAppointment(doctor)}
                className="w-full py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-black text-[10px] uppercase tracking-wider shadow-lg hover:shadow-xl"
              >
                Book Appointment
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredDoctors.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No doctors found</h3>
          <p className="text-slate-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
