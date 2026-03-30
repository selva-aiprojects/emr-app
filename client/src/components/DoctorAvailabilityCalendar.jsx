import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../api.js';

export default function DoctorAvailabilityCalendar({ tenantId, doctors, onSlotSelect }) {
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'slots'

  useEffect(() => {
    if (selectedDoctor) {
      loadMonthlyAvailability();
    }
  }, [selectedDoctor, currentDate]);

  const loadMonthlyAvailability = async () => {
    if (!selectedDoctor) return;
    
    setLoading(true);
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const calendar = await api.get(`/doctor-availability/calendar?doctorId=${selectedDoctor}&startDate=${startDate}&endDate=${endDate}`);
      setAvailableSlots(calendar || []);
    } catch (error) {
      console.error('Error loading availability:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDailySlots = async (date) => {
    if (!selectedDoctor || !date) return;
    
    setLoading(true);
    try {
      const slots = await api.get(`/doctor-availability/slots?doctorId=${selectedDoctor}&date=${date}`);
      setAvailableSlots(slots || []);
      setViewMode('slots');
    } catch (error) {
      console.error('Error loading daily slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAvailability = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await api.post('/doctor-availability', {
        doctorId: selectedDoctor,
        date: formData.get('date'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        slotDurationMinutes: parseInt(formData.get('slotDurationMinutes')) || 15,
        maxAppointments: parseInt(formData.get('maxAppointments')) || 1,
        notes: formData.get('notes')
      });
      
      setShowCreateForm(false);
      loadMonthlyAvailability();
      e.target.reset();
    } catch (error) {
      console.error('Error creating availability:', error);
    }
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getDayAvailability = (date) => {
    if (!date) return null;
    const dateStr = date.toISOString().split('T')[0];
    return availableSlots.find(slot => slot.date === dateStr);
  };

  const getDayStatus = (date) => {
    const availability = getDayAvailability(date);
    if (!availability) return 'none';
    if (availability.available_slots === 0) return 'full';
    if (availability.booked_slots > 0) return 'partial';
    return 'available';
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDayColor = (status) => {
    switch (status) {
      case 'available': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'partial': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'full': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-400 border-slate-200';
    }
  };

  const getSlotStatus = (slot) => {
    const available = slot.max_appointments - slot.current_appointments;
    if (available === 0) return 'booked';
    if (available < slot.max_appointments) return 'partial';
    return 'available';
  };

  const getSlotStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200';
      case 'partial': return 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200';
      case 'booked': return 'bg-red-100 text-red-700 border-red-200 cursor-not-allowed';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-900">Doctor Availability Calendar</h3>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Set Availability
        </button>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Doctor</label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a doctor...</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                Dr. {doctor.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          {viewMode === 'slots' && (
            <button
              onClick={() => {
                setViewMode('calendar');
                loadMonthlyAvailability();
              }}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Back to Calendar
            </button>
          )}
        </div>
      </div>

      {/* Create Availability Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-md font-semibold text-blue-900 mb-4">Set Doctor Availability</h4>
          <form onSubmit={handleCreateAvailability} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  name="date"
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slot Duration (minutes)</label>
                <input
                  name="slotDurationMinutes"
                  type="number"
                  min="5"
                  max="60"
                  step="5"
                  defaultValue="15"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                <input
                  name="startTime"
                  type="time"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                <input
                  name="endTime"
                  type="time"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Appointments per Slot</label>
                <input
                  name="maxAppointments"
                  type="number"
                  min="1"
                  max="10"
                  defaultValue="1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
                <input
                  name="notes"
                  type="text"
                  placeholder="e.g., Morning OPD, Evening Clinic"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Availability
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && selectedDoctor && (
        <div>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h4 className="text-xl font-bold text-slate-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h4>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-slate-700 py-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {getDaysInMonth().map((date, index) => {
              const status = date ? getDayStatus(date) : null;
              const availability = date ? getDayAvailability(date) : null;
              
              return (
                <div
                  key={index}
                  className={`aspect-square border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md ${
                    date ? getDayColor(status) : 'border-transparent'
                  }`}
                  onClick={() => date && status !== 'none' && loadDailySlots(date.toISOString().split('T')[0])}
                >
                  {date && (
                    <div>
                      <div className="text-sm font-semibold">{date.getDate()}</div>
                      {availability && (
                        <div className="text-xs mt-1">
                          {availability.available_slots > 0 ? (
                            <span className="font-medium">{availability.available_slots} slots</span>
                          ) : (
                            <span className="font-medium">Full</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Slots View */}
      {viewMode === 'slots' && (
        <div>
          <h4 className="text-lg font-semibold text-slate-900 mb-4">
            Available Slots for {new Date(currentDate).toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h4>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-500 mt-2">Loading available slots...</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg">
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No availability slots found for this date</p>
              <p className="text-sm text-slate-500 mt-1">Set up availability to start booking appointments</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSlots.map((slot) => {
                const status = getSlotStatus(slot);
                const available = slot.max_appointments - slot.current_appointments;
                
                return (
                  <div
                    key={slot.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${getSlotStatusColor(status)}`}
                    onClick={() => available > 0 && onSlotSelect && onSlotSelect(slot)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSlotStatusColor(status)}`}>
                        {available > 0 ? `${available} available` : 'Booked'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      <p>Duration: {slot.slot_duration_minutes} minutes</p>
                      <p>Capacity: {slot.current_appointments}/{slot.max_appointments}</p>
                    </div>
                    {available > 0 && onSlotSelect && (
                      <div className="mt-2 pt-2 border-t border-current/20">
                        <p className="text-xs font-medium">Click to book appointment</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* No Doctor Selected */}
      {!selectedDoctor && (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">Please select a doctor to view availability</p>
        </div>
      )}
    </div>
  );
}
