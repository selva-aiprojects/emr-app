import { useEffect, useMemo, useState } from "react";
import { useToast } from "../hooks/useToast.jsx";
import {
  Calendar,
  Clock,
  TestTube,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowLeft,
  Phone,
  Zap,
  FlaskConical,
  MapPin,
  IndianRupee,
} from "lucide-react";
import "../styles/critical-care.css";

const MOCK_LABS = [
  {
    id: 1,
    name: "Central Laboratory",
    type: "Pathology",
    tests: [
      { name: "Blood Test", price: 450, category: "Blood Test" },
      { name: "Urine Test", price: 300, category: "Pathology" },
      { name: "X-Ray", price: 700, category: "Imaging" },
      { name: "ECG", price: 500, category: "Pathology" },
    ],
    location: "Ground Floor, Main Building",
    hours: "24/7",
    phone: "+91-1234567890",
    turnaround: "24 hours",
    accent: "from-blue-500 to-cyan-500",
  },
  {
    id: 2,
    name: "Diagnostic Imaging",
    type: "Radiology",
    tests: [
      { name: "CT Scan", price: 3200, category: "Imaging" },
      { name: "MRI", price: 5800, category: "Imaging" },
      { name: "Ultrasound", price: 1200, category: "Imaging" },
      { name: "X-Ray", price: 650, category: "Imaging" },
    ],
    location: "Basement, Block A",
    hours: "8 AM - 8 PM",
    phone: "+91-1234567891",
    turnaround: "48 hours",
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    id: 3,
    name: "Microbiology Lab",
    type: "Microbiology",
    tests: [
      { name: "Culture Test", price: 950, category: "Microbiology" },
      { name: "Sensitivity Test", price: 1200, category: "Microbiology" },
      { name: "Gram Stain", price: 650, category: "Microbiology" },
      { name: "PCR", price: 2800, category: "Microbiology" },
    ],
    location: "3rd Floor, Wing B",
    hours: "9 AM - 6 PM",
    phone: "+91-1234567892",
    turnaround: "72 hours",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    id: 4,
    name: "Clinical Chemistry",
    type: "Biochemistry",
    tests: [
      { name: "Liver Function", price: 900, category: "Biochemistry" },
      { name: "Kidney Function", price: 900, category: "Biochemistry" },
      { name: "Blood Glucose", price: 250, category: "Blood Test" },
      { name: "Lipid Profile", price: 850, category: "Biochemistry" },
    ],
    location: "4th Floor, Wing C",
    hours: "24/7",
    phone: "+91-1234567893",
    turnaround: "12 hours",
    accent: "from-amber-500 to-orange-500",
  },
];

const TEST_CATEGORIES = ["All", "Blood Test", "Imaging", "Pathology", "Microbiology", "Biochemistry"];

export default function LabAvailabilityPage({
  selectedLab: selectedLabProp,
  activeUser,
  session,
  patients = [],
  onBookAppointment,
  onBack,
}) {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLab, setSelectedLab] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [bookingData, setBookingData] = useState({
    reason: "",
    urgent: false,
    fasting: false,
  });

  const isPatient = activeUser?.role === "Patient";

  useEffect(() => {
    if (selectedLabProp) {
      const found =
        typeof selectedLabProp === "object"
          ? selectedLabProp
          : MOCK_LABS.find((l) => l.id === selectedLabProp) || null;
      setSelectedLab(found);
    }
  }, [selectedLabProp]);

  useEffect(() => {
    if (selectedLab && selectedDate) {
      loadAvailableSlots(selectedLab, selectedDate);
    }
  }, [selectedLab, selectedDate]);

  const filteredLabs = useMemo(() => {
    return MOCK_LABS.filter((lab) => {
      const matchesSearch =
        lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lab.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lab.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        lab.type === selectedCategory ||
        lab.tests.some((test) => test.category === selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const availableTests = useMemo(() => {
    if (!selectedLab) return [];
    return selectedLab.tests.filter(
      (test) => selectedCategory === "All" || test.category === selectedCategory
    );
  }, [selectedLab, selectedCategory]);

  const loadAvailableSlots = async (lab, date) => {
    if (!lab || !date) return;

    setLoading(true);
    try {
      setTimeout(() => {
        const slots = generateMockSlots(lab, date);
        setAvailableSlots(slots);
        setLoading(false);
      }, 450);
    } catch (error) {
      showToast({ message: "Failed to load available slots", type: "error" });
      setLoading(false);
    }
  };

  const generateMockSlots = (lab, date) => {
    const slots = [];
    const [startHour, endHour] = lab.hours === "24/7" ? [8, 20] : [9, 18];

    for (let hour = startHour; hour < endHour; hour++) {
      slots.push({
        id: `${date.toISOString().split("T")[0]}-${hour}`,
        date: date.toISOString().split("T")[0],
        startTime: `${hour.toString().padStart(2, "0")}:00`,
        endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
        available: Math.random() > 0.25,
        testType: selectedTest?.name || "General",
        price: selectedTest?.price || 500 + Math.floor(Math.random() * 700),
      });
    }

    return slots;
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === "prev" ? -1 : 1));
      return newDate;
    });
  };

  const handleDateSelect = (date) => {
    if (!isDateAvailable(date)) return;
    setSelectedDate(date);
    setSelectedSlot(null);
    setShowBookingForm(false);
  };

  const handleTestSelect = (test) => {
    setSelectedTest(test);
    setSelectedSlot(null);
    setShowBookingForm(false);
  };

  const handleSlotSelect = (slot) => {
    if (!slot.available || !selectedTest) return;
    setSelectedSlot(slot);
    setShowBookingForm(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLab || !selectedTest || !selectedSlot) {
      showToast({ message: "Please complete test and slot selection", type: "error" });
      return;
    }

    if (!isPatient && !selectedPatientId) {
      showToast({ message: "Please select a patient", type: "error" });
      return;
    }

    try {
      const appointmentData = {
        labId: selectedLab.id,
        labName: selectedLab.name,
        testType: selectedTest.name,
        patientId: isPatient ? activeUser?.patientId : selectedPatientId,
        date: selectedDate.toISOString().split("T")[0],
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason: bookingData.reason,
        urgent: bookingData.urgent,
        fasting: bookingData.fasting,
        price: selectedSlot.price,
      };

      await onBookAppointment?.(appointmentData);

      showToast({
        message: "Lab test booked successfully!",
        type: "success",
        title: "Lab Booking",
      });

      setShowBookingForm(false);
      setSelectedSlot(null);
      setSelectedTest(null);
      setBookingData({ reason: "", urgent: false, fasting: false });
    } catch (error) {
      showToast({ message: "Booking failed: " + error.message, type: "error" });
    }
  };

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
              Lab Availability & Timing
              <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black backdrop-blur-md">Diagnostic Console</span>
            </h1>
            <p className="dim-label">
              Choose the right lab, pick a test, lock a slot, and confirm your diagnostic appointment in a clean guided flow.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-300">
                <Zap className="w-3.5 h-3.5 text-cyan-300" /> {MOCK_LABS.length} Specialized Labs Active
              </div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/60">
                <Calendar className="w-3.5 h-3.5" /> Bookings open for {selectedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-2 gap-3 min-w-[320px]">
          <div className="rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-black mb-2 flex items-center gap-2">
              <Clock className="w-3 h-3" /> Quickest TAT
            </div>
            <div className="text-xl font-black text-white">12 Hours</div>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-black mb-2 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Availability
            </div>
            <div className="text-xl font-black text-white">88% Live</div>
          </div>
        </div>
      </header>

      {/* GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-8">
        {/* LEFT PANEL */}
        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200/70 bg-white/80 backdrop-blur-sm shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.18em]">
                Find Laboratory
              </h3>
              <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-4 mb-5">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search labs or services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  {TEST_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {filteredLabs.map((lab) => {
                const active = selectedLab?.id === lab.id;
                return (
                  <button
                    key={lab.id}
                    onClick={() => {
                      setSelectedLab(lab);
                      setSelectedTest(null);
                      setSelectedSlot(null);
                      setShowBookingForm(false);
                    }}
                    className={`w-full text-left rounded-[24px] border transition-all p-4 ${
                      active
                        ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${lab.accent} text-white flex items-center justify-center shadow-lg`}>
                        <TestTube className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-sm font-black text-slate-900 truncate">{lab.name}</h4>
                          {active && (
                            <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 mt-1">{lab.type}</p>
                        <div className="mt-3 space-y-2 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{lab.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{lab.hours}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6">
          {!selectedLab ? (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/70 p-10 text-center">
              <div className="mx-auto h-20 w-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                <TestTube className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Select a laboratory to begin</h3>
              <p className="text-slate-500 max-w-xl mx-auto">
                Start by choosing a diagnostic center from the left. You’ll then see available tests, appointment dates, and time slots.
              </p>
            </div>
          ) : (
            <>
              {/* LAB SUMMARY */}
              <div className="rounded-[32px] border border-slate-200/70 bg-white/80 backdrop-blur-sm shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className={`h-16 w-16 rounded-[24px] bg-gradient-to-br ${selectedLab.accent} text-white flex items-center justify-center shadow-xl`}>
                      <FlaskConical className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2">{selectedLab.type}</div>
                      <h2 className="text-2xl font-black text-slate-900">{selectedLab.name}</h2>
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-600">
                        <div className="inline-flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          {selectedLab.location}
                        </div>
                        <div className="inline-flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          {selectedLab.phone}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 min-w-[260px]">
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black mb-1">Turnaround</div>
                      <div className="text-lg font-black text-slate-900">{selectedLab.turnaround}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black mb-1">Hours</div>
                      <div className="text-lg font-black text-slate-900">{selectedLab.hours}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TEST + CALENDAR */}
              <div className="grid grid-cols-1 2xl:grid-cols-[1.2fr_1fr] gap-6">
                <div className="rounded-[32px] border border-slate-200/70 bg-white/80 backdrop-blur-sm shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.18em]">Choose Test</h3>
                      <p className="text-sm text-slate-500 mt-1">Select the required diagnostic test.</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 text-emerald-600 p-3">
                      <Zap className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableTests.map((test) => {
                      const active = selectedTest?.name === test.name;
                      return (
                        <button
                          key={test.name}
                          onClick={() => handleTestSelect(test)}
                          className={`text-left rounded-[24px] border p-5 transition-all ${
                            active
                              ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                              : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className={`text-[11px] font-black uppercase tracking-[0.18em] ${active ? "text-blue-100" : "text-slate-500"}`}>
                                {test.category}
                              </div>
                              <h4 className={`text-base font-black mt-2 ${active ? "text-white" : "text-slate-900"}`}>{test.name}</h4>
                            </div>
                            {active && (
                              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                                <Check className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className={`mt-5 inline-flex items-center gap-1.5 text-sm font-black ${active ? "text-white" : "text-slate-700"}`}>
                            <IndianRupee className="w-4 h-4" />
                            {test.price}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[32px] border border-slate-200/70 bg-white/80 backdrop-blur-sm shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.18em]">Pick Date</h3>
                      <p className="text-sm text-slate-500 mt-1">Choose a preferred visit day.</p>
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

                      return (
                        <button
                          key={index}
                          disabled={!date || !isAvailable}
                          onClick={() => date && handleDateSelect(date)}
                          className={`aspect-square rounded-2xl text-sm font-black transition-all border ${
                            !date
                              ? "border-transparent bg-transparent cursor-default"
                              : isSelected
                              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                              : isAvailable
                              ? "bg-white border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700"
                              : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                          }`}
                        >
                          {date?.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SLOTS */}
              <div className="rounded-[32px] border border-slate-200/70 bg-white/80 backdrop-blur-sm shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.18em]">Available Time Slots</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {selectedTest ? `Showing slots for ${selectedTest.name}` : "Select a test to enable slot booking."}
                    </p>
                  </div>
                  {selectedTest && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-4 py-2 text-xs font-black uppercase tracking-[0.16em]">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-sm font-bold text-slate-600 uppercase tracking-wider">Loading available slots...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {availableSlots.map((slot) => {
                      const active = selectedSlot?.id === slot.id;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => handleSlotSelect(slot)}
                          disabled={!slot.available || !selectedTest}
                          className={`rounded-[24px] border p-4 transition-all text-left ${
                            !selectedTest
                              ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
                              : !slot.available
                              ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                              : active
                              ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                              : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                          }`}
                        >
                          <div className="text-sm font-black">{slot.startTime} - {slot.endTime}</div>
                          <div className={`text-xs mt-2 font-semibold ${active ? "text-blue-100" : "text-slate-500"}`}>
                            {slot.available ? "Available" : "Booked"}
                          </div>
                          <div className={`mt-3 inline-flex items-center gap-1 text-xs font-black ${active ? "text-white" : "text-slate-700"}`}>
                            <IndianRupee className="w-3.5 h-3.5" />
                            {slot.price}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* BOOKING FORM */}
              {showBookingForm && selectedSlot && (
                <div className="rounded-[32px] border border-slate-200/70 bg-white/80 backdrop-blur-sm shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.18em]">Confirm Booking</h3>
                      <p className="text-sm text-slate-500 mt-1">Review the test details and submit the appointment.</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 text-emerald-600 p-3">
                      <Check className="w-5 h-5" />
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
                            <option value="">Select a patient...</option>
                            {patients.map((patient) => (
                              <option key={patient.id} value={patient.id}>
                                {patient.firstName || patient.name || `${patient.first_name || ""} ${patient.last_name || ""}`.trim() || "Unknown Patient"}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Reason for Test</label>
                        <textarea
                          value={bookingData.reason}
                          onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                          className="w-full min-h-[140px] rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium resize-none outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Add clinical reason, symptoms, or physician notes..."
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bookingData.urgent}
                            onChange={(e) => setBookingData({ ...bookingData, urgent: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-black text-slate-900 text-sm">Urgent Processing</div>
                            <div className="text-xs text-slate-500">Prioritize this diagnostic request</div>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bookingData.fasting}
                            onChange={(e) => setBookingData({ ...bookingData, fasting: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-black text-slate-900 text-sm">Fasting Required</div>
                            <div className="text-xs text-slate-500">Patient needs fasting before sample collection</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="rounded-[28px] bg-slate-950 text-white p-6 shadow-2xl">
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300 mb-4">Booking Summary</div>

                      <div className="space-y-4">
                        <SummaryRow label="Laboratory" value={selectedLab.name} />
                        <SummaryRow label="Test" value={selectedTest?.name} />
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
                        <SummaryRow label="Estimated Price" value={`₹${selectedSlot.price}`} highlight />
                      </div>

                      <div className="mt-8 grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            setShowBookingForm(false);
                            setSelectedSlot(null);
                            setBookingData({ reason: "", urgent: false, fasting: false });
                          }}
                          className="h-12 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-black uppercase tracking-[0.14em]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleBookingSubmit}
                          className="h-12 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-sm font-black uppercase tracking-[0.14em] shadow-lg"
                        >
                          Book Test
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
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
