import { useState } from 'react';
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
  CheckCheck
} from 'lucide-react';

export default function ChatPage({ activeUser }) {
  const [activeChannel, setActiveChannel] = useState('emergency-response');

  const channels = [
    { id: 'emergency-response', name: 'Emergency Response', type: 'critical', unread: 3 },
    { id: 'clinical-discussions', name: 'Clinical Case Hub', type: 'standard', unread: 0 },
    { id: 'pharmacy-sync', name: 'Pharmacy Sync', type: 'standard', unread: 12 },
    { id: 'lab-results', name: 'Lab Alert Hub', type: 'standard', unread: 0 },
  ];

  const onlineStaff = [
    { name: 'Dr. Sarah Connor', role: 'Chief Surgeon', status: 'online' },
    { name: 'Dr. Michael Chen', role: 'Cardiology', status: 'brb' },
    { name: 'Nurse Joy', role: 'Emergency Dept', status: 'online' },
    { name: 'Alex Rivera', role: 'Pharmacist', status: 'offline' },
  ];

  return (
    <div className="intelligence-hub slide-up h-[calc(100vh-140px)] flex gap-6 overflow-hidden">
      {/* Sidebar - Channels & People */}
      <div className="w-80 flex flex-col gap-6 h-full">
        {/* Workspace Card */}
        <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl shadow-slate-900/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">
              {activeUser?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <h3 className="font-bold text-sm truncate">{activeUser?.name || 'Staff Member'}</h3>
              <div className="flex items-center gap-1.5 ">
                <Circle size={8} className="fill-emerald-500 text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Active In Hub</span>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-slate-300 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search collab hub..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white/10 transition-all outline-none"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-caps-label text-slate-400">Hub Channels</span>
            <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-all">
              <Plus size={16} />
            </button>
          </div>
          
          <div className="space-y-1">
            {channels.map(channel => (
              <button 
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl transition-all group ${
                  activeChannel === channel.id 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Hash size={16} className={activeChannel === channel.id ? 'text-indigo-600' : 'text-slate-400'} />
                  <span className="text-xs font-bold leading-none">{channel.name}</span>
                </div>
                {channel.unread > 0 && (
                  <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md shadow-indigo-600/20">
                    {channel.unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-8 px-2">
            <span className="text-caps-label text-slate-400 mb-4 block">Direct Threads</span>
            <div className="space-y-4">
              {onlineStaff.map(staff => (
                <div key={staff.name} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                        {staff.name.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        staff.status === 'online' ? 'bg-emerald-500' : staff.status === 'brb' ? 'bg-amber-500' : 'bg-slate-300'
                      }`} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-none group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{staff.name}</div>
                      <div className="text-[9px] text-slate-400 mt-1 font-medium">{staff.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <Hash size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">#{channels.find(c => c.id === activeChannel)?.name}</h3>
              <p className="text-meta-sm text-slate-400">Active coordination | 14 staff members joined</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">+11</div>
            </div>
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
              <Shield size={18} />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Messages Space */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="flex justify-center">
            <div className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Today, March 26</div>
          </div>

          {[
            { sender: 'Dr. Sarah Connor', time: '10:42 AM', text: 'All units, prepare for incoming trauma case from Section-D. ETA 5 minutes.', mine: false },
            { sender: 'Me', time: '10:43 AM', text: 'Triage team is on standby at the emergency bay. Blood bank O- units confirmed.', mine: true },
            { sender: 'Nurse Joy', time: '10:45 AM', text: 'Ventilators 4 and 6 are operational. Prep completed.', mine: false },
          ].map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.mine ? 'flex-row-reverse' : ''}`}>
              {!msg.mine && (
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 flex-shrink-0">
                  {msg.sender.charAt(0)}
                </div>
              )}
              <div className={`max-w-[70%] space-y-1 ${msg.mine ? 'items-end flex flex-col' : ''}`}>
                <div className={`flex items-center gap-2 mb-1 ${msg.mine ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{msg.sender}</span>
                  <span className="text-[9px] text-slate-400 font-bold">{msg.time}</span>
                </div>
                <div className={`p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${
                  msg.mine 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-600/20' 
                    : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100/50'
                }`}>
                  {msg.text}
                </div>
                {msg.mine && (
                  <div className="flex items-center gap-1 mt-1 text-indigo-400">
                    <CheckCheck size={14} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Delivered</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-8 bg-slate-50/50 rounded-b-[2.5rem]">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-2 flex items-center gap-2 shadow-xl shadow-slate-200/20 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <button className="p-3 text-slate-400 hover:text-indigo-600 transition-colors">
              <Plus size={20} />
            </button>
            <input 
              type="text" 
              placeholder="Message #emergency-response..." 
              className="flex-1 bg-transparent border-none outline-none text-sm py-2 px-2 text-slate-700 placeholder:text-slate-400 font-medium"
            />
            <div className="flex items-center gap-1 px-2">
              <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                <Smile size={20} />
              </button>
              <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                <Paperclip size={20} />
              </button>
            </div>
            <button className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95">
              <Send size={20} />
            </button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-meta-sm text-slate-400 font-medium">
             <div className="flex items-center gap-1.5">
               <Shield size={12} className="text-emerald-500" />
               End-to-end encrypted hub
             </div>
             <div className="w-1 h-1 rounded-full bg-slate-300" />
             <div className="flex items-center gap-1.5">
               <Clock size={12} />
               Compliance-ready logging
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
