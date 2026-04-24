import React, { useState } from 'react';
import { 
  Plus, 
  Settings, 
  Download, 
  Shield, 
  Users,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Wrench,
  Database,
  Bell
} from 'lucide-react';
import { useToast } from '../../hooks/useToast.jsx';

export default function QuickActions() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState({});

  const quickActions = [
    {
      id: 'tenant-onboarding',
      title: 'Tenant Onboarding',
      description: 'Add new healthcare facility',
      icon: Building2,
      color: 'bg-blue-500',
      action: () => handleTenantOnboarding()
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage platform users',
      icon: Users,
      color: 'bg-emerald-500',
      action: () => handleUserManagement()
    },
    {
      id: 'system-maintenance',
      title: 'System Maintenance',
      description: 'Schedule maintenance tasks',
      icon: Wrench,
      color: 'bg-purple-500',
      action: () => handleSystemMaintenance()
    },
    {
      id: 'backup-restore',
      title: 'Backup & Restore',
      description: 'Data backup operations',
      icon: Database,
      color: 'bg-cyan-500',
      action: () => handleBackupRestore()
    },
    {
      id: 'compliance-report',
      title: 'Compliance Report',
      description: 'Generate compliance reports',
      icon: Shield,
      color: 'bg-amber-500',
      action: () => handleComplianceReport()
    },
    {
      id: 'export-data',
      title: 'Export Data',
      description: 'Export platform analytics',
      icon: Download,
      color: 'bg-slate-500',
      action: () => handleExportData()
    }
  ];

  const handleTenantOnboarding = async () => {
    setLoading(prev => ({ ...prev, 'tenant-onboarding': true }));
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast({
        message: 'Tenant onboarding wizard initiated',
        type: 'success',
        title: 'Quick Action'
      });
    } catch (error) {
      showToast({
        message: 'Failed to initiate tenant onboarding',
        type: 'error',
        title: 'Quick Action'
      });
    } finally {
      setLoading(prev => ({ ...prev, 'tenant-onboarding': false }));
    }
  };

  const handleUserManagement = async () => {
    setLoading(prev => ({ ...prev, 'user-management': true }));
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      showToast({
        message: 'User management panel opened',
        type: 'success',
        title: 'Quick Action'
      });
    } catch (error) {
      showToast({
        message: 'Failed to open user management',
        type: 'error',
        title: 'Quick Action'
      });
    } finally {
      setLoading(prev => ({ ...prev, 'user-management': false }));
    }
  };

  const handleSystemMaintenance = async () => {
    setLoading(prev => ({ ...prev, 'system-maintenance': true }));
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      showToast({
        message: 'System maintenance scheduled',
        type: 'success',
        title: 'Quick Action'
      });
    } catch (error) {
      showToast({
        message: 'Failed to schedule maintenance',
        type: 'error',
        title: 'Quick Action'
      });
    } finally {
      setLoading(prev => ({ ...prev, 'system-maintenance': false }));
    }
  };

  const handleBackupRestore = async () => {
    setLoading(prev => ({ ...prev, 'backup-restore': true }));
    try {
      await new Promise(resolve => setTimeout(resolve, 900));
      showToast({
        message: 'Backup operations initiated',
        type: 'success',
        title: 'Quick Action'
      });
    } catch (error) {
      showToast({
        message: 'Failed to initiate backup',
        type: 'error',
        title: 'Quick Action'
      });
    } finally {
      setLoading(prev => ({ ...prev, 'backup-restore': false }));
    }
  };

  const handleComplianceReport = async () => {
    setLoading(prev => ({ ...prev, 'compliance-report': true }));
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      showToast({
        message: 'Compliance report generation started',
        type: 'success',
        title: 'Quick Action'
      });
    } catch (error) {
      showToast({
        message: 'Failed to generate compliance report',
        type: 'error',
        title: 'Quick Action'
      });
    } finally {
      setLoading(prev => ({ ...prev, 'compliance-report': false }));
    }
  };

  const handleExportData = async () => {
    setLoading(prev => ({ ...prev, 'export-data': true }));
    try {
      await new Promise(resolve => setTimeout(resolve, 700));
      showToast({
        message: 'Data export initiated',
        type: 'success',
        title: 'Quick Action'
      });
    } catch (error) {
      showToast({
        message: 'Failed to export data',
        type: 'error',
        title: 'Quick Action'
      });
    } finally {
      setLoading(prev => ({ ...prev, 'export-data': false }));
    }
  };

  const systemAlerts = [
    {
      type: 'warning',
      message: 'Database backup scheduled in 2 hours',
      icon: AlertTriangle,
      time: '2 hours'
    },
    {
      type: 'success',
      message: 'All systems operational',
      icon: CheckCircle,
      time: 'Live'
    },
    {
      type: 'info',
      message: 'New tenant onboarding completed',
      icon: Bell,
      time: '1 hour ago'
    }
  ];

  return (
    <div className="quick-actions">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <Settings className="w-6 h-6 text-indigo-600" />
            Quick Actions
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Common administrative tasks and operations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            disabled={loading[action.id]}
            className="quick-action-card"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center flex-shrink-0`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-slate-900">{action.title}</h3>
                <p className="text-sm text-slate-600">{action.description}</p>
              </div>
              <div className="flex-shrink-0">
                {loading[action.id] ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-400"></div>
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="system-alerts">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-500" />
          System Notifications
        </h3>
        <div className="space-y-3">
          {systemAlerts.map((alert, index) => (
            <div key={index} className="alert-item">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  alert.type === 'warning' ? 'bg-amber-50' :
                  alert.type === 'success' ? 'bg-emerald-50' :
                  'bg-blue-50'
                }`}>
                  <alert.icon className={`w-4 h-4 ${
                    alert.type === 'warning' ? 'text-amber-600' :
                    alert.type === 'success' ? 'text-emerald-600' :
                    'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-900">{alert.message}</p>
                  <p className="text-xs text-slate-500">{alert.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
