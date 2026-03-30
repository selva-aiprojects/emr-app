import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Users, 
  Hash, 
  Search, 
  Plus, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Smile,
  Shield,
  Circle,
  Clock,
  CheckCheck,
  Zap,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function ChatPage({ activeUser }) {
  const [activeChannel, setActiveChannel] = useState('emergency-response');
  const [inputText, setInputText] = useState('');
  const [typingStatus, setTypingStatus] = useState(null);
  const scrollRef = useRef(null);

  const [messagesByChannel, setMessagesByChannel] = useState({
    'emergency-response': [
      { sender: 'Dr. Sarah Connor', time: '10:42 AM', text: 'All units, prepare for incoming trauma case from Section-D. ETA 5 minutes.', mine: false, role: 'Chief Surgeon' },
      { sender: 'Me', time: '10:43 AM', text: 'Triage team is on standby at the emergency bay. Blood bank O- units confirmed.', mine: true, role: 'Admin' },
      { sender: 'Nurse Joy', time: '10:45 AM', text: 'Ventilators 4 and 6 are operational. Prep completed.', mine: false, role: 'Emergency Dept' },
    ],
    'clinical-discussions': [
      { sender: 'Dr. Michael Chen', time: '09:12 AM', text: 'Reviewing the MRIs for Bed 402. The neuro-vascular overlap is concerning.', mine: false, role: 'Cardiology' },
      { sender: 'Me', time: '09:15 AM', text: 'Should we schedule a multi-disciplinary review at noon?', mine: true, role: 'Admin' }
    ],
    'pharmacy-sync': [
      { sender: 'Alex Rivera', time: 'Yesterday', text: 'Critical shortage of generic Heparin. Routing request to central stores.', mine: false, role: 'Pharmacist' }
    ],
    'lab-results': [
      { sender: 'System: Lab Hub', time: '11:00 AM', text: 'CRITICAL ALERT: Troponin-T results for Patient #8892 exceed protocol levels.', mine: false, isAlert: true }
    ]
  });

  const channels = [
    { id: 'emergency-response', name: 'Emergency Response', type: 'critical', unread: 0, desc: 'Real-time trauma coordination' },
    { id: 'clinical-discussions', name: 'Clinical Case Hub', type: 'standard', unread: 0, desc: 'Cross-specialization reviews' },
    { id: 'pharmacy-sync', name: 'Pharmacy Sync', type: 'standard', unread: 0, desc: 'Logistics and drug availability' },
    { id: 'lab-results', name: 'Lab Alert Hub', type: 'standard', unread: 0, desc: 'Automated diagnostic triggers' },
  ];

  const onlineStaff = [
    { name: 'Dr. Sarah Connor', role: 'Chief Surgeon', status: 'online' },
    { name: 'Dr. Michael Chen', role: 'Cardiology', status: 'brb' },
    { name: 'Nurse Joy', role: 'Emergency Dept', status: 'online' },
    { name: 'Alex Rivera', role: 'Pharmacist', status: 'offline' },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesByChannel, activeChannel]);

  useEffect(() => {
    // Simulated "rigidity-breaking" behavior: Someone typing
    const id = setTimeout(() => {
      setTypingStatus(activeChannel === 'emergency-response' ? 'Dr. Sarah Connor' : 'Alex Rivera');
    }, 3000);
    return () => clearTimeout(id);
  }, [activeChannel]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const newMsg = {
      sender: 'Me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: inputText,
      mine: true,
      role: activeUser?.role || 'Staff'
    };

    setMessagesByChannel(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), newMsg]
    }));
    setInputText('');
    setTypingStatus(null);
  };

  return (
    <div className="intelligence-hub slide-up h-[calc(100vh-140px)] flex gap-6 overflow-hidden">
      {/* Sidebar - Channels & People */}
      <div className="w-80 flex flex-col gap-6 h-full">
        {/* Workspace Card */}
        <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl shadow-slate-900/20 border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-black text-xl shadow-lg border border-white/10">
              {activeUser?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <h3 className="font-bold text-sm truncate">{activeUser?.name || 'Staff Member'}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Clinical Node Active</span>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-slate-300 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search collab hub..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-9 text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white/10 transition-all outline-none"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Institutional Hubs</span>
            <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-all">
              <Plus size={14} />
            </button>
          </div>
          
          <div className="space-y-1">
            {channels.map(channel => (
              <button 
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${
                  activeChannel === channel.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Hash size={16} className={activeChannel === channel.id ? 'opacity-100' : 'opacity-40'} />
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-xs font-bold">{channel.name}</span>
                    <span className={`text-[9px] mt-1 ${activeChannel === channel.id ? 'text-white/60' : 'text-slate-400'}`}>
                      {channel.desc}
                    </span>
                  </div>
                </div>
                {channel.unread > 0 && (
                  <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md">
                    {channel.unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-8 px-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 block">Direct Synchronicity</span>
            <div className="space-y-4">
              {onlineStaff.map(staff => (
                <div key={staff.name} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100">
                        {staff.name.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        staff.status === 'online' ? 'bg-emerald-500' : staff.status === 'brb' ? 'bg-amber-500' : 'bg-slate-300'
                      }`} />
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-slate-900 leading-none uppercase tracking-tight">{staff.name}</div>
                      <div className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-wider">{staff.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col overflow-hidden relative">
        {/* Floating AI Coordinator Insight */}
        <div className="absolute top-20 right-8 z-20 w-64 animate-in fade-in slide-in-from-right-4">
           <div className="bg-slate-900/95 backdrop-blur-md rounded-3xl p-4 border border-indigo-500/30 shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-1 px-2 rounded-lg bg-indigo-500/20 flex items-center gap-1.5 border border-indigo-500/20">
                    <Sparkles size={10} className="text-indigo-400" />
                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest leading-none">AI Coordinator</span>
                 </div>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                 {activeChannel === 'emergency-response' 
                   ? "Detected 3 emergency personnel active. Protocol shift initiated at 10:42 AM."
                   : "Current clinical thread focus: Bed 402 Diagnostic Overlap."}
              </p>
           </div>
        </div>

        {/* Chat Header */}
        <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20 backdrop-blur-sm">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 ring-4 ring-indigo-50">
              <Hash size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                 <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">#{channels.find(c => c.id === activeChannel)?.name}</h3>
                 <ChevronDown size={14} className="text-slate-300" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{channels.find(c => c.id === activeChannel)?.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3 pr-4 border-r border-slate-100">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-9 h-9 rounded-2xl border-4 border-white bg-slate-200 shadow-sm" />
              ))}
              <div className="w-9 h-9 rounded-2xl border-4 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">+11</div>
            </div>
            <button className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all">
              <Shield size={20} />
            </button>
            <button className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Messages Space */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-slate-50/10">
          <div className="flex justify-center mb-10">
            <div className="px-5 py-2 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">Operational Log · {new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })}</div>
          </div>

          {(messagesByChannel[activeChannel] || []).map((msg, i) => (
            <div key={i} className={`flex gap-5 ${msg.mine ? 'flex-row-reverse animate-in slide-in-from-right-2' : 'animate-in slide-in-from-left-2'}`}>
              {!msg.mine && (
                <div className="w-11 h-11 rounded-3xl bg-slate-100 flex items-center justify-center font-black text-slate-400 flex-shrink-0 border border-slate-100 shadow-sm">
                  {msg.sender.charAt(0)}
                </div>
              )}
              <div className={`max-w-[70%] space-y-1 ${msg.mine ? 'items-end flex flex-col' : ''}`}>
                <div className={`flex items-center gap-2 mb-1.5 ${msg.mine ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{msg.sender}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{msg.time}</span>
                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                  <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">{msg.role}</span>
                </div>
                <div className={`p-4 px-6 rounded-[2rem] text-sm leading-relaxed shadow-lg ${
                  msg.mine 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-600/20' 
                    : msg.isAlert 
                      ? 'bg-rose-50 text-rose-700 border-2 border-rose-200 rounded-tl-none font-bold'
                      : 'bg-white text-slate-700 rounded-tl-none border border-slate-100/50'
                }`}>
                  {msg.text}
                </div>
                {msg.mine && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-indigo-400">
                    <CheckCheck size={14} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Validated Node Arrival</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {typingStatus && (
             <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-8 h-8 rounded-2xl bg-slate-100 flex items-center justify-center leading-none">
                   <div className="flex gap-1">
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                   </div>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{typingStatus} is clarifying response...</span>
             </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-10 bg-white border-t border-slate-50">
          <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-3 flex items-center gap-3 shadow-sm focus-within:ring-4 focus-within:ring-indigo-100/50 focus-within:bg-white focus-within:border-indigo-200 transition-all">
            <button className="p-3 text-slate-400 hover:text-indigo-600 transition-colors bg-white rounded-2xl shadow-sm border border-slate-100">
              <Plus size={20} />
            </button>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Coordinate in #${channels.find(c => c.id === activeChannel)?.name}...`} 
              className="flex-1 bg-transparent border-none outline-none text-sm py-2 px-3 text-slate-700 placeholder:text-slate-400 font-bold"
            />
            <div className="flex items-center gap-2 px-2">
              <button className="p-2.5 text-slate-400 hover:text-indigo-600 transition-all hover:bg-white rounded-xl">
                <Smile size={20} />
              </button>
              <button className="p-2.5 text-slate-400 hover:text-indigo-600 transition-all hover:bg-white rounded-xl">
                <Paperclip size={20} />
              </button>
            </div>
            <button 
              onClick={handleSend}
              className="bg-indigo-600 text-white p-4 rounded-3xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
              disabled={!inputText.trim()}
            >
              <Send size={20} />
            </button>
          </div>
          <div className="mt-5 flex items-center justify-between px-6">
              <div className="flex items-center gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                 <div className="flex items-center gap-2">
                   <Shield size={14} className="text-emerald-500" />
                   End-to-End Encrypted Shard
                 </div>
                 <div className="flex items-center gap-2">
                   <Clock size={14} />
                   Institutional Logging Active
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{inputText.length} bits</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
