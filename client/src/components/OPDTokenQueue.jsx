import { useState, useEffect } from 'react';
import { Users, Clock, AlertCircle, CheckCircle, XCircle, TrendingUp, Calendar, Phone, User, Activity } from 'lucide-react';
import { api } from '../api.js';

export default function OPDTokenQueue({ tenantId, onTokenSelect, departments, doctors }) {
  const [tokens, setTokens] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadDepartmentStats();
    loadTokens();
  }, []);

  useEffect(() => {
    loadTokens();
  }, [selectedDepartment, selectedStatus]);

  const loadDepartmentStats = async () => {
    try {
      const stats = await api.get('/opd-tokens/department-summary');
      setDepartmentStats(stats || []);
    } catch (error) {
      console.error('Error loading department stats:', error);
    }
  };

  const loadTokens = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDepartment) params.departmentId = selectedDepartment;
      if (selectedStatus) params.status = selectedStatus;
      
      const tokens = await api.get('/opd-tokens', params);
      setTokens(tokens || []);
    } catch (error) {
      console.error('Error loading tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await api.get('/opd-tokens/stats');
      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const callNextToken = async (departmentId, doctorId = null) => {
    try {
      const token = await api.post('/opd-tokens/call-next', {
        departmentId,
        doctorId
      });
      
      // Update the token in the list
      setTokens(prev => prev.map(t => 
        t.id === token.id ? { ...t, ...token } : t
      ));
      
      // Show success message
      alert(`Token ${token.full_token} called successfully!`);
    } catch (error) {
      console.error('Error calling next token:', error);
      alert('Failed to call next token');
    }
  };

  const updateTokenStatus = async (tokenId, status) => {
    try {
      const token = await api.patch(`/opd-tokens/${tokenId}/status`, { status });
      
      // Update the token in the list
      setTokens(prev => prev.map(t => 
        t.id === tokenId ? { ...t, ...token } : t
      ));
    } catch (error) {
      console.error('Error updating token status:', error);
      alert('Failed to update token status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'called': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'in_progress': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'no_show': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting': return <Clock className="w-4 h-4" />;
      case 'called': return <AlertCircle className="w-4 h-4" />;
      case 'in_progress': return <Activity className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'no_show': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'senior_citizen': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'follow_up': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getWaitTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diff = Math.floor((now - created) / 60000); // minutes
    if (diff < 60) return `${diff} min`;
    return `${Math.floor(diff / 60)}h ${diff % 60}min`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">OPD Token Queue</h3>
          </div>
          <button
            onClick={loadStats}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Statistics
          </button>
        </div>

        {/* Department Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {departmentStats.map((dept) => (
            <div key={dept.department_id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">{dept.department_name}</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600">Waiting</span>
                  <span className="text-sm font-bold text-blue-600">{dept.waiting_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600">Called</span>
                  <span className="text-sm font-bold text-amber-600">{dept.called_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600">In Progress</span>
                  <span className="text-sm font-bold text-purple-600">{dept.in_progress_count || 0}</span>
                </div>
                {dept.current_token && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Current Token</span>
                      <span className="text-lg font-bold text-green-600">{dept.current_token}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="waiting">Waiting</option>
            <option value="called">Called</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
      </div>

      {/* Statistics Modal */}
      {stats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Queue Statistics</h3>
              <button
                onClick={() => setStats(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-sm text-slate-600">Total Tokens</div>
                <div className="text-2xl font-bold text-slate-900">{stats.total_tokens || 0}</div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-slate-600">Waiting</div>
                <div className="text-2xl font-bold text-blue-600">{stats.waiting || 0}</div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-slate-600">Called</div>
                <div className="text-2xl font-bold text-amber-600">{stats.called || 0}</div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-slate-600">In Progress</div>
                <div className="text-2xl font-bold text-purple-600">{stats.in_progress || 0}</div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-slate-600">Completed</div>
                <div className="text-2xl font-bold text-green-600">{stats.completed || 0}</div>
              </div>
            </div>
            {stats.avg_consultation_time_minutes && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="text-sm text-slate-600">Avg Consultation Time</div>
                <div className="text-lg font-bold text-slate-900">
                  {Math.round(stats.avg_consultation_time_minutes)} minutes
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Token Queue */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Token Queue</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-500 mt-2">Loading tokens...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">No tokens in queue</p>
            <p className="text-sm text-slate-500 mt-1">Generate tokens to start managing patient flow</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Token</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Patient</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Department</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Doctor</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Priority</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Wait Time</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token, index) => (
                  <tr key={token.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg">{token.full_token}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(token.status)}`}>
                          {token.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium text-slate-900">{token.patient_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                          <Phone className="w-3 h-3" />
                          {token.patient_phone}
                        </div>
                        {token.age && (
                          <div className="text-xs text-slate-500">
                            Age: {token.age} | {token.gender}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-slate-700">{token.department_name}</td>
                    <td className="p-3 text-sm text-slate-700">{token.doctor_name || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(token.priority)}`}>
                        {token.priority.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(token.status)}
                        <span className="text-sm text-slate-700">{token.status.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-slate-600">
                      {getWaitTime(token.created_at)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {token.status === 'waiting' && (
                          <button
                            onClick={() => callNextToken(token.department_id, token.doctor_id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                          >
                            Call Next
                          </button>
                        )}
                        {token.status === 'called' && (
                          <button
                            onClick={() => updateTokenStatus(token.id, 'in_progress')}
                            className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors"
                          >
                            Start
                          </button>
                        )}
                        {token.status === 'in_progress' && (
                          <button
                            onClick={() => updateTokenStatus(token.id, 'completed')}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        {onTokenSelect && (
                          <button
                            onClick={() => onTokenSelect(token)}
                            className="px-3 py-1 bg-slate-600 text-white rounded text-xs hover:bg-slate-700 transition-colors"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
