import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Database, 
  HardDrive, 
  Wifi, 
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import '../../styles/superadmin.css';

export default function SystemPerformance() {
  const [performance, setPerformance] = useState({
    cpu: { usage: 0, cores: 8, temperature: 45 },
    memory: { used: 0, total: 16384, percentage: 0 },
    database: { connections: 0, queryTime: 0, size: 0 },
    network: { bandwidth: 0, latency: 0, uptime: 0 },
    storage: { used: 0, total: 1000, percentage: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadPerformance();
    const interval = setInterval(loadPerformance, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPerformance = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API
      const mockData = {
        cpu: { usage: 45, cores: 8, temperature: 45 },
        memory: { used: 10158, total: 16384, percentage: 62 },
        database: { connections: 127, queryTime: 12, size: 2.4 },
        network: { bandwidth: 850, latency: 12, uptime: 99.9 },
        storage: { used: 680, total: 1000, percentage: 68 }
      };
      setPerformance(mockData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (value, thresholds = { good: 70, warning: 85 }) => {
    if (value <= thresholds.good) return 'text-emerald-600 bg-emerald-50';
    if (value <= thresholds.warning) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getProgressBarColor = (value, thresholds = { good: 70, warning: 85 }) => {
    if (value <= thresholds.good) return 'bg-emerald-500';
    if (value <= thresholds.warning) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const PerformanceMetric = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color, 
    progress, 
    status,
    details 
  }) => (
    <div className="performance-metric">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600">{subtitle}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${status}`}>
          {progress}% Used
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Current Usage</span>
          <span className="font-semibold text-slate-900">{value}</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getProgressBarColor(progress)} transition-all duration-300`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        {details && (
          <div className="text-xs text-slate-500 mt-2">
            {details}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="system-performance">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-100 rounded-lg mb-4 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="system-performance">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <Server className="w-6 h-6 text-purple-600" />
            System Performance
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Real-time infrastructure monitoring
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3 h-3" />
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PerformanceMetric
          title="CPU Usage"
          value={`${performance.cpu.usage}%`}
          subtitle={`${performance.cpu.cores} cores • ${performance.cpu.temperature}°C`}
          icon={Cpu}
          color="bg-blue-500"
          progress={performance.cpu.usage}
          status={getStatusColor(performance.cpu.usage)}
          details={`Temperature: ${performance.cpu.temperature}°C • Load across ${performance.cpu.cores} cores`}
        />

        <PerformanceMetric
          title="Memory Usage"
          value={`${(performance.memory.used / 1024).toFixed(1)}GB`}
          subtitle={`of ${(performance.memory.total / 1024).toFixed(1)}GB total`}
          icon={Database}
          color="bg-purple-500"
          progress={performance.memory.percentage}
          status={getStatusColor(performance.memory.percentage)}
          details={`${performance.memory.used}MB used of ${performance.memory.total}MB total`}
        />

        <PerformanceMetric
          title="Database"
          value={`${performance.database.connections} connections`}
          subtitle={`${performance.database.queryTime}ms avg query time`}
          icon={HardDrive}
          color="bg-emerald-500"
          progress={Math.min((performance.database.connections / 200) * 100, 100)}
          status={getStatusColor(performance.database.connections, { good: 100, warning: 150 })}
          details={`${performance.database.size}GB storage • ${performance.database.queryTime}ms avg response`}
        />

        <PerformanceMetric
          title="Network"
          value={`${performance.network.bandwidth} Mbps`}
          subtitle={`${performance.network.latency}ms latency`}
          icon={Wifi}
          color="bg-cyan-500"
          progress={Math.min((performance.network.bandwidth / 1000) * 100, 100)}
          status={getStatusColor(performance.network.latency, { good: 20, warning: 50 })}
          details={`${performance.network.uptime}% uptime • ${performance.network.latency}ms average latency`}
        />

        <PerformanceMetric
          title="Storage"
          value={`${performance.storage.used}GB`}
          subtitle={`of ${performance.storage.total}GB total`}
          icon={HardDrive}
          color="bg-orange-500"
          progress={performance.storage.percentage}
          status={getStatusColor(performance.storage.percentage)}
          details={`${performance.storage.total - performance.storage.used}GB free space available`}
        />

        <div className="system-status-summary">
          <div className="p-6 bg-slate-50 rounded-xl">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              System Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Overall Health</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-emerald-600">Optimal</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Response Time</span>
                <span className="text-sm font-medium text-slate-900">142ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Error Rate</span>
                <span className="text-sm font-medium text-emerald-600">0.02%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Active Services</span>
                <span className="text-sm font-medium text-slate-900">12/12</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
