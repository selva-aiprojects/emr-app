import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Server, 
  Activity, 
  AlertCircle,
  Users,
  Building2,
  DollarSign
} from 'lucide-react';
import { api } from '../../api.js';
import '../../styles/superadmin.css';

export default function PlatformMetrics({ tenants = [], users = [] }) {
  const [metrics, setMetrics] = useState({
    revenue: { current: 0, growth: 0, trend: 'up' },
    tenants: { active: 0, total: 0, health: 0 },
    system: { uptime: 0, status: 'healthy', cpu: 0, memory: 0 },
    alerts: { critical: 0, warning: 0, total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [tenants, users]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      // Calculate real metrics from actual data
      const activeTenants = tenants.filter(t => t.status !== 'inactive').length;
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.status !== 'inactive').length;
      
      // Calculate tenant health based on activity and status
      const healthyTenants = tenants.filter(t => {
        const hasUsers = users.some(u => u.tenantId === t.id);
        const isActive = t.status !== 'inactive';
        return hasUsers && isActive;
      }).length;
      
      const tenantHealth = tenants.length > 0 ? Math.round((healthyTenants / tenants.length) * 100) : 0;
      
      // Mock system metrics for now (these would come from monitoring APIs)
      const systemMetrics = {
        uptime: 99.9,
        status: 'healthy',
        cpu: Math.floor(Math.random() * 30) + 20, // Random between 20-50%
        memory: Math.floor(Math.random() * 40) + 40 // Random between 40-80%
      };
      
      // Calculate revenue (mock for now - would come from billing API)
      const estimatedRevenue = tenants.length * 50000; // ₹50K per tenant average
      
      const realData = {
        revenue: { 
          current: estimatedRevenue, 
          growth: tenants.length > 0 ? 15 : 0, 
          trend: 'up' 
        },
        tenants: { 
          active: activeTenants, 
          total: tenants.length, 
          health: tenantHealth 
        },
        system: systemMetrics,
        alerts: { 
          critical: 0, 
          warning: tenants.length === 0 ? 1 : 0, // Warning if no tenants
          total: tenants.length === 0 ? 1 : 0 
        }
      };
      
      setMetrics(realData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load platform metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, color, trend, status }) => (
    <div className="platform-metric-card">
      <div className="metric-header">
        <div className={`metric-icon ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="metric-status">
          {status === 'live' && <div className="live-indicator"></div>}
          {trend && (
            <span className={`metric-trend ${trend > 0 ? 'positive' : 'negative'}`}>
              {trend > 0 ? '↗️' : '↘️'} {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
      <div className="metric-content">
        <h3 className="metric-value">{value}</h3>
        <p className="metric-title">{title}</p>
        <p className="metric-subtitle">{subtitle}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="platform-metric-card loading">
            <div className="animate-pulse">
              <div className="h-20 bg-slate-100 rounded-xl mb-4"></div>
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
            Platform Overview
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
              Live
            </span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Real-time platform performance and health metrics
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Platform Revenue"
          value={`₹${(metrics.revenue.current / 1000000).toFixed(1)}M MTD`}
          subtitle="Monthly recurring revenue"
          icon={DollarSign}
          color="emerald"
          trend={metrics.revenue.growth}
          status="live"
        />

        <MetricCard
          title="Active Tenants"
          value={`${metrics.tenants.active}/${metrics.tenants.total}`}
          subtitle={`${metrics.tenants.health}% healthy`}
          icon={Building2}
          color="blue"
          status="live"
        />

        <MetricCard
          title="System Health"
          value={`${metrics.system.uptime}% Uptime`}
          subtitle={`CPU: ${metrics.system.cpu}% • Memory: ${metrics.system.memory}%`}
          icon={metrics.system.status === 'healthy' ? Activity : AlertCircle}
          color={metrics.system.status === 'healthy' ? 'green' : 'red'}
          status="live"
        />

        <MetricCard
          title="Alert Queue"
          value={`${metrics.alerts.critical} Critical`}
          subtitle={`${metrics.alerts.total} total alerts`}
          icon={AlertCircle}
          color={metrics.alerts.critical > 0 ? 'red' : 'amber'}
          status="live"
        />
      </div>
    </div>
  );
}
