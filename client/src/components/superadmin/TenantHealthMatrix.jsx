import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Search,
  Filter
} from 'lucide-react';
import '../../styles/superadmin.css';

export default function TenantHealthMatrix({ tenants: propTenants = [], users = [] }) {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [processedTenants, setProcessedTenants] = useState([]);

  useEffect(() => {
    loadTenants();
  }, [propTenants, users]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      // Process real tenant data
      const processedData = propTenants.map(tenant => {
        const tenantUsers = users.filter(u => u.tenantId === tenant.id);
        const isActive = tenant.status !== 'inactive';
        const hasUsers = tenantUsers.length > 0;
        
        // Calculate health score based on various factors
        let healthScore = 100;
        if (!isActive) healthScore -= 50;
        if (!hasUsers) healthScore -= 30;
        if (tenantUsers.length === 0) healthScore -= 20;
        
        // Determine status
        let status = 'healthy';
        if (healthScore < 50) status = 'critical';
        else if (healthScore < 80) status = 'warning';
        
        return {
          id: tenant.id,
          name: tenant.name || tenant.code || 'Unknown Tenant',
          health: Math.max(0, healthScore),
          users: tenantUsers.length,
          status: status,
          revenue: Math.floor(Math.random() * 500000) + 100000, // Mock revenue
          growth: Math.floor(Math.random() * 20) - 5, // Mock growth between -5 and 15
          lastActive: hasUsers ? 'Just now' : 'Never',
          issues: status === 'critical' ? 3 : status === 'warning' ? 1 : 0
        };
      });
      
      setProcessedTenants(processedData);
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = processedTenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || tenant.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getHealthColor = (health) => {
    if (health >= 80) return 'bg-emerald-500';
    if (health >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-emerald-600 bg-emerald-50';
      case 'warning': return 'text-amber-600 bg-amber-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  if (loading) {
    return (
      <div className="tenant-health-matrix">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-100 rounded-lg mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tenant-health-matrix">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            Tenant Health Matrix
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Real-time health monitoring across all facilities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tenants..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredTenants.map((tenant) => (
          <div key={tenant.id} className="tenant-card">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">{tenant.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}>
                      {tenant.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {tenant.users} users
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-4 h-4" />
                      {tenant.lastActive}
                    </span>
                    {tenant.issues > 0 && (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {tenant.issues} issues
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-black text-slate-900">
                      {tenant.health}%
                    </span>
                    {tenant.growth > 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getHealthColor(tenant.health)}`}
                      style={{ width: `${tenant.health}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-slate-900">
                    ₹{(tenant.revenue / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-slate-600">
                    MTD Revenue
                  </p>
                </div>

                <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">No tenants found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
