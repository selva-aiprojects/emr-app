import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { Star, MapPin, Clock, Calendar, Search, Plus, Edit, Trash2, Filter, Stethoscope, ShieldCheck, Users } from 'lucide-react';
import DoctorAvailabilityPage from './DoctorAvailabilityPage.jsx';
import { PageHero, EmptyState } from '../components/ui/index.jsx';
import '../styles/critical-care.css';

export default function FindDoctorPage({
  activeUser,
  session,
  providers = [],
  onCreateAppointment,
  onSelfAppointment,
  patients = [],
  tenant
}) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAvailabilityPage, setShowAvailabilityPage] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const isPatient = activeUser?.role === 'Patient';
  const specialties = ['All', 'Cardiologist', 'Neurologist', 'Pediatrician', 'Orthopedic Surgeon', 'General Physician', 'Dermatologist', 'Gynecologist'];

  useEffect(() => {
    if (Array.isArray(providers) && providers.length > 0) {
      const dbDoctors = providers.filter(p => p.role === 'Doctor').map(p => ({
        id: p.id,
        name: p.name || 'Unknown Doctor',
        specialty: p.department || p.role || 'General Physician',
        experience: 10,
        rating: 4.8,
        consultationFee: 500,
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        location: 'Main Block',
        education: 'MD',
        languages: ['English']
      }));
      setDoctors(dbDoctors);
      setLoading(false);
    } else {
      setDoctors([]);
      setLoading(false);
    }
  }, [providers]);

  const filteredDoctors = doctors.filter(doctor => {
    const nameMatch = (doctor.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const specialtyMatch = (doctor.specialty || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || specialtyMatch;
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-[#F8FAFC] pb-20 animate-fade-in relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10"></div>
      
      <PageHero 
        title="Find a Doctor"
        subtitle={`Book appointments with expert medical professionals at ${tenant?.name || 'our facility'}`}
        badge="Provider Registry"
        icon={Stethoscope}
        stats={[
          { label: 'Total Doctors', value: doctors.length, icon: Users },
          { label: 'Verified', value: '100%', icon: ShieldCheck }
        ]}
      />

      <main className="max-w-7xl mx-auto px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-[32px] border border-slate-100 p-8 mb-12 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors w-5 h-5" />
              <input
                type="text"
                placeholder="Search doctors by name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-slate-50 border-none rounded-[20px] focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-800 placeholder:text-slate-400 transition-all"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-[20px] border border-slate-100">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="bg-transparent border-none font-bold text-[11px] uppercase tracking-widest text-slate-600 focus:ring-0 cursor-pointer"
                >
                  {specialties.map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDoctors.map((doctor, index) => (
              <div
                key={doctor.id}
                className="bg-white rounded-[40px] border border-slate-100 p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
                      <span className="text-xl font-black text-white">
                        {doctor.name.split(' ').filter(n => !n.includes('.')).map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">{doctor.name}</h3>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.15em] mt-1">{doctor.specialty}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-[11px] font-bold text-slate-600">{doctor.location}</span>
                    </div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Location</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-[11px] font-bold text-slate-600">{doctor.experience} Years</span>
                    </div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Experience</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-[11px] font-bold text-slate-600">{doctor.availableDays.join(', ')}</span>
                    </div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Available</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-10 px-2">
                  <div className="flex items-center gap-3">
                    <div className="flex">{renderStars(doctor.rating)}</div>
                    <span className="text-xs font-black text-slate-900">{doctor.rating}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Fee</p>
                    <p className="text-2xl font-black text-slate-900">₹{doctor.consultationFee}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleBookAppointment(doctor)}
                  className="w-full py-5 bg-slate-900 text-white rounded-[24px] hover:bg-blue-600 transition-all duration-300 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:shadow-blue-500/30"
                >
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState 
            title="No providers found" 
            subtitle="No medical professionals currently matched your criteria." 
            icon={Stethoscope} 
          />
        )}
      </main>
    </div>
  );
}
