import { useEffect, useMemo, useState } from "react";
import { useToast } from "../hooks/useToast.jsx";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowLeft,
  Stethoscope,
  IndianRupee,
  Languages,
  GraduationCap,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import "../styles/critical-care.css";

export default function DoctorAvailabilityPage({
  selectedDoctor: initialDoctor,
  activeUser,
  session,
  providers = [],
  patients = [],
  onBookAppointment,
  onBack,
}) {
  const { showToast } = useToast();

  const [internalDoctor, setInternalDoctor] = useState(initialDoctor);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [bookingReason, setBookingReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [doctorInfo, setDoctorInfo] = useState(null);

  const isPatient = activeUser?.role === "Patient";
  const isAdmin = ["Admin", "Nurse", "Superadmin"].includes(activeUser?.role);

  const doctors = useMemo(() => providers.filter(p => p.role === "Doctor"), [providers]);

  const mockDoctorInfo = useMemo(
    () => ({
      id: internalDoctor?.id || 1,
      name: internalDoctor?.name || "Dr. Sarah Johnson",
      specialty: internalDoctor?.specialty || "Cardiologist",
      experience: internalDoctor?.experience || 15,
      rating: internalDoctor?.rating || 4.8,
      consultationFee: internalDoctor?.consultationFee || 500,
      availableDays: internalDoctor?.availableDays || ["Mon", "Wed", "Fri"],
      location: internalDoctor?.location || "Main Hospital Building",
      education: internalDoctor?.education || "MD - Harvard Medical School",
      languages: internalDoctor?.languages || ["English", "Hindi", "Tamil"],
      image: null,
      bio:
        internalDoctor?.bio ||
        "Focused on preventive, diagnostic, and continuity care with a patient-first clinical workflow.",
    }),
    [internalDoctor]
  );

  const generateMockSlots = (date) => {
    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });
    const isAvailableDay = mockDoctorInfo.availableDays.includes(dayOfWeek);

    if (!isAvailableDay) return [];

    return [
      { id: 1, startTime: "09:00", endTime: "10:00", available: true },
      { id: 2, startTime: "10:00", endTime: "11:00", available: true },
      { id: 3, startTime: "11:00", endTime: "12:00", available: false },
      { id: 4, startTime: "14:00", endTime: "15:00", available: true },
      { id: 5, startTime: "15:00", endTime: "16:00", available: true },
      { id: 6, startTime: "16:00", endTime: "17:00", available: false },
    ];
  };

  useEffect(() => {
    setDoctorInfo(mockDoctorInfo);
    if (isPatient && activeUser?.patientId) {
      setSelectedPatientId(activeUser.patientId);
    }
  }, [mockDoctorInfo, isPatient, activeUser]);

  useEffect(() => {
    loadAvailableSlots(selectedDate);
  }, [selectedDate, mockDoctorInfo]);

  const loadAvailableSlots = async (date) => {
    setLoading(true);
    try {
      setTimeout(() => {
        const slots = generateMockSlots(date);
        setAvailableSlots(slots);
        setSelectedSlot(null);
        setLoading(false);
      }, 450);
    } catch (error) {
      showToast({ message: "Failed to load available slots", type: "error" });
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const isDateAvailable = (date) => {
    if (!date) return false;
    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });
    return mockDoctorInfo.availableDays.includes(dayOfWeek);
  };

  const isDateInPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === "prev" ? -1 : 1));
      return newDate;
    });
  };

  const handleDateSelect = (date) => {
    if (isDateInPast(date) || !isDateAvailable(date)) return;
    setSelectedDate(date);
  };

  const handleSlotSelect = (slot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);
  };

  const handleBookingConfirm = async () => {
    if (!selectedSlot || (!isPatient && !selectedPatientId) || !bookingReason.trim()) {
      showToast({ message: "Please fill all required fields", type: "error" });
      return;
    }

    try {
      const appointmentData = {
        providerId: doctorInfo.id,
        providerName: doctorInfo.name,
        patientId: isPatient ? activeUser?.patientId : selectedPatientId,
        date: selectedDate.toISOString().split("T")[0],
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason: bookingReason.trim(),
      };

      await onBookAppointment?.(appointmentData);
      showToast({ message: "Appointment booked successfully!", type: "success" });

      setSelectedSlot(null);
      setBookingReason("");
    } catch (error) {
      showToast({ message: "Booking failed: " + error.message, type: "error" });
    }
  };

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        className={i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}
      />
    ));

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="page-shell-premium animate-fade-in">
      {/* HERO */}
      <header className="page-header-premium mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {onBack && (
            <button
              onClick={onBack}
              className="h-12 w-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="page-title-rich flex items-center gap-3">
              Doctor Availability
              <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black backdrop-blur-md">Specialist Console</span>
            </h1>
            <p className="dim-label">
              Focused on preventive, diagnostic, and continuity care with a patient-first clinical workflow.
            </p>
            {isAdmin && (
              <div className="inline-flex items-center gap-3 mt-4 p-1.5 bg-white/10 border border-white/10 rounded-2xl backdrop-blur-sm">
                <div className="text-[9px] uppercase tracking-widest text-white/60 font-black pl-3">Institutional Picker</div>
                <select 
                  className="bg-slate-900/40 border border-white/10 text-white font-black text-[11px] rounded-xl px-4 py-1.5 outline-none cursor-pointer hover:bg-slate-900/60 transition-all"
                  value={internalDoctor?.id || ""}
                  onChange={(e) => {
                    const doc = doctors.find(d => String(d.id) === e.target.value);
                    if (doc) setInternalDoctor(doc);
                  }}
                >
                  <option value="" className="text-slate-900" disabled>Select Shard...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id} className="text-slate-900">{d.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-2 gap-3 min-w-[320px]">
          <div className="rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-black mb-1">Consultation Fee</div>
            <div className="text-xl font-black text-white">₹{doctorInfo?.consultationFee || 0}</div>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-black mb-1">Schedule Shard</div>
            <div className="text-xl font-black text-white">
              {selectedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-8">
        {/* LEFT PANEL */}
        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-200/70 bg-white/80 backdrop-blur-sm shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-[28px] bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500 text-white flex items-center justify-center shadow-xl">
                <span className="text-2xl font-black">
                  {doctorInfo?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600 mb-2">
                  {doctorInfo?.specialty}
                </div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">{doctorInfo?.name}</h2>
                <p className="text-sm text-slate-500 mt-2">{doctorInfo?.bio}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <MetricCard
                label="Experience"
                value={`${doctorInfo?.experience || 0} yrs`}
                icon={<Clock className="w-4 h-4" />}
              />
              <MetricCard
                label="Rating"
                value={`${doctorInfo?.rating || 0}/5`}
                icon={<Sparkles className="w-4 h-4" />}
              />
            </div>

            <div className="mt-6 space-y-4">
              <InfoRow
                icon={<MapPin className="w-4 h-4 text-slate-400" />}
                label="Location"
                value={doctorInfo?.location}
              />
              <InfoRow
                icon={<GraduationCap className="w-4 h-4 text-slate-400" />}
                label="Education"
                value={doctorInfo?.education}
              />
              <InfoRow
                icon={<Languages className="w-4 h-4 text-slate-400" />}
                label="Languages"
                value={doctorInfo?.languages?.join(", ")}
              />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Available Days</div>
                <div className="flex items-center gap-1">{renderStars(doctorInfo?.rating || 0)}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {doctorInfo?.availableDays?.map((day) => (
                  <div
                    key={day}
                    className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-center text-[11px] font-black uppercase tracking-[0.14em] text-blue-700"
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6">
          {/* CALENDAR + SLOT PANEL */}
          <div className="grid grid-cols-1 2xl:grid-cols-[1.1fr_0.9fr] gap-6">
            <div className="rounded-[32px] border border-slate-200/70 bg-white/80 backdrop-blur-sm shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.18em]">Select Date</h3>
                  <p className="text-sm text-slate-500 mt-1">Only available consultation days are enabled.</p>
                </div>
                <Calendar className="w-5 h-5 text-slate-400" />
              </div>

              <div className="flex items-center justify-between mb-5">
                <button onClick={() => navigateMonth("prev")} className="h-10 w-10 rounded-2xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-black text-slate-800 uppercase tracking-[0.14em]">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button onClick={() => navigateMonth("next")} className="h-10 w-10 rounded-2xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth().map((date, index) => {
                  const isSelected = date && selectedDate.toDateString() === date.toDateString();
                  const isAvailable = date && isDateAvailable(date);
                  const isPast = date && isDateInPast(date);
                  const isToday = date && new Date().toDateString() === date.toDateString();

                  return (
                    <button
                      key={index}
                      disabled={!date || isPast || !isAvailable}
                      onClick={() => date && handleDateSelect(date)}
                      className={`aspect-square rounded-2xl text-sm font-black transition-all border ${
                        !date
                          ? "border-transparent bg-transparent cursor-default"
                          : isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                          : isPast
                          ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                          : isAvailable
                          ? "bg-white border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700"
                          : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                      } ${isToday && !isSelected ? "ring-2 ring-blue-200" : ""}`}
                    >
                      {date?.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200/70 bg-white/80 backdrop-blur-sm shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.18em]">Available Slots</h3>
                  <p className="text-sm text-slate-500 mt-1">Choose a preferred consultation time.</p>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-sm font-bold text-slate-600 uppercase tracking-wider">Loading available slots...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-black text-slate-700 mb-2">No slots available</p>
                  <p className="text-sm text-slate-500">Try another available consultation day.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {availableSlots.map((slot) => {
                    const active = selectedSlot?.id === slot.id;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => handleSlotSelect(slot)}
                        disabled={!slot.available}
                        className={`rounded-[24px] border p-4 transition-all text-left ${
                          !slot.available
                            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                            : active
                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                            : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        <div className="text-sm font-black">{slot.startTime}</div>
                        <div className={`text-xs mt-1 font-semibold ${active ? "text-blue-100" : "text-slate-500"}`}>
                          to {slot.endTime}
                        </div>
                        {!slot.available && (
                          <div className="text-[11px] font-black mt-3 text-red-600 uppercase tracking-[0.14em]">Booked</div>
                        )}
                        {slot.available && active && (
                          <div className="mt-3 inline-flex items-center gap-1 text-xs font-black text-white">
                            <Check className="w-3.5 h-3.5" />
                            Selected
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* BOOKING PANEL */}
          {selectedSlot && (
            <div className="rounded-[32px] border border-slate-200/70 bg-white/80 backdrop-blur-sm shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.18em]">Confirm Appointment</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedDate.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })} • {selectedSlot.startTime} - {selectedSlot.endTime}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-4 py-2 text-xs font-black uppercase tracking-[0.16em]">
                  <IndianRupee className="w-3.5 h-3.5" />
                  Fee ₹{doctorInfo?.consultationFee}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
                <div className="space-y-5">
                  {!isPatient && (
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Select Patient</label>
                      <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="w-full h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select patient...</option>
                        {patients.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.firstName || patient.name || `${patient.first_name || ""} ${patient.last_name || ""}`.trim() || "Unknown Patient"}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Reason for Visit</label>
                    <textarea
                      value={bookingReason}
                      onChange={(e) => setBookingReason(e.target.value)}
                      className="w-full min-h-[140px] rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium resize-none outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add symptoms, consultation reason, or notes..."
                      required
                    />
                  </div>
                </div>

                <div className="rounded-[28px] bg-slate-950 text-white p-6 shadow-2xl">
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300 mb-4">Appointment Summary</div>

                  <div className="space-y-4">
                    <SummaryRow label="Doctor" value={doctorInfo?.name} />
                    <SummaryRow label="Specialty" value={doctorInfo?.specialty} />
                    <SummaryRow
                      label="Visit Date"
                      value={selectedDate.toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    />
                    <SummaryRow label="Time Slot" value={`${selectedSlot.startTime} - ${selectedSlot.endTime}`} />
                    <SummaryRow label="Consultation Fee" value={`₹${doctorInfo?.consultationFee}`} highlight />
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedSlot(null)}
                      className="h-12 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-black uppercase tracking-[0.14em]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBookingConfirm}
                      className="h-12 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-sm font-black uppercase tracking-[0.14em] shadow-lg"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
        <div className="text-blue-600">{icon}</div>
      </div>
      <div className="text-lg font-black text-slate-900">{value}</div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-1">{label}</div>
        <div className="text-sm font-semibold text-slate-800">{value || "-"}</div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, highlight = false }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-cyan-400/20 bg-cyan-400/10" : "border-white/10 bg-white/5"}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-1">{label}</div>
      <div className={`font-black ${highlight ? "text-cyan-300 text-xl" : "text-white text-sm"}`}>{value || "-"}</div>
    </div>
  );
}
