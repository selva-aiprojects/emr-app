import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Shield, 
  Settings, 
  Activity, 
  Package, 
  CreditCard, 
  Database,
  ChevronRight,
  Plus,
  Search,
  Filter,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';
import { api } from '../api.js';
import '../styles/critical-care.css';

export default function UnifiedAdminPage({ tenant, userRole = 'admin' }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [metrics, setMetrics] = useState({
    tenants: 0,
    users: 0,
    activeOffers: 0,
    systemHealth: 'healthy'
  });

  // Context-aware tabs based on user role
  const adminTabs = [
    {
      id: 'overview',
      name: 'System Overview',
      description: 'Dashboard and system health',
      icon: Activity,
      color: 'blue',
      roles: ['superadmin', 'admin']
    },
    {
      id: 'tenants',
      name: 'Tenant Management',
      description: 'Manage organizations and facilities',
      icon: Building2,
      color: 'indigo',
      roles: ['superadmin']
    },
    {
      id: 'users',
      name: 'User Provisioning',
      description: 'Add and manage user accounts',
      icon: Users,
      color: 'green',
      roles: ['superadmin', 'admin']
    },
    {
      id: 'offers',
      name: 'Offer Management',
      description: 'Subscription plans and pricing',
      icon: Package,
      color: 'purple',
      roles: ['superadmin']
    },
    {
      id: 'billing',
      name: 'Billing & Payments',
      description: 'Revenue and payment processing',
      icon: CreditCard,
      color: 'emerald',
      roles: ['superadmin', 'admin']
    },
    {
      id: 'system',
      name: 'System Settings',
      description: 'Configuration and maintenance',
      icon: Settings,
      color: 'slate',
      roles: ['superadmin']
    }
  ];

  // Filter tabs based on user role
  const availableTabs = adminTabs.filter(tab => tab.roles.includes(userRole));

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      // Load metrics based on available tabs
      const response = await api.getAdminMetrics();
      setMetrics(response.data || metrics);
    } catch (error) {
      console.error('Failed to load admin metrics:', error);
      showToast({ 
        message: 'Failed to load system metrics', 
        type: 'error', 
        title: 'Admin Dashboard' 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="clinical-card p-6 text-left hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-${tab.color}-50 text-${tab.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <tab.icon size={24} />
                  </div>
                  <ChevronRight className={`text-${tab.color}-400 group-hover:translate-x-1 transition-transform`} size={20} />
                </div>
                <h3 className="font-black text-slate-900 mb-2">{tab.name}</h3>
                <p className="text-sm text-slate-600">{tab.description}</p>
              </button>
            ))}
          </div>
        );

      case 'tenants':
        return (
          <div className="clinical-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">Tenant Management</h2>
              <button className="clinical-btn bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                <Plus size={16} />
                Add Tenant
              </button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search tenants..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="clinical-btn bg-slate-100 text-slate-700 px-4 py-3 rounded-xl flex items-center gap-2">
                <Filter size={16} />
                Filter
              </button>
            </div>
            <div className="text-center py-12 text-slate-500">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="font-medium">Tenant management interface</p>
              <p className="text-sm mt-2">Integrate with existing tenant management components</p>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="clinical-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">User Provisioning</h2>
              <button className="clinical-btn bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                <Plus size={16} />
                Add User
              </button>
            </div>
            <div className="text-center py-12 text-slate-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="font-medium">User provisioning interface</p>
              <p className="text-sm mt-2">Integrate with existing user management components</p>
            </div>
          </div>
        );

      case 'offers':
        return (
          <div className="clinical-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">Offer Management</h2>
              <button className="clinical-btn bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                <Plus size={16} />
                Create Offer
              </button>
            </div>
            <div className="text-center py-12 text-slate-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="font-medium">Offer management interface</p>
              <p className="text-sm mt-2">Integrate with existing OfferManagement component</p>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="clinical-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">Billing & Payments</h2>
              <button className="clinical-btn bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                <TrendingUp size={16} />
                View Reports
              </button>
            </div>
            <div className="text-center py-12 text-slate-500">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="font-medium">Billing management interface</p>
              <p className="text-sm mt-2">Integrate with existing billing components</p>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="clinical-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">System Settings</h2>
              <button className="clinical-btn bg-slate-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                <Settings size={16} />
                Configure
              </button>
            </div>
            <div className="text-center py-12 text-slate-500">
              <Settings className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="font-medium">System configuration interface</p>
              <p className="text-sm mt-2">Integrate with existing system settings</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div>
          <h1 className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-slate-900" />
            Unified Admin Console
            <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black">
              {userRole.toUpperCase()}
            </span>
          </h1>
          <p className="dim-label">
            Context-aware administrative interface for {tenant?.name || 'System Management'}.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${metrics.systemHealth === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
              <span className="font-medium text-slate-700">System {metrics.systemHealth}</span>
            </div>
            <div className="text-sm text-slate-500">
              {metrics.tenants} Tenants • {metrics.users} Users • {metrics.activeOffers} Active Offers
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? `bg-${tab.color}-600 text-white shadow-lg`
                  : `text-slate-600 hover:bg-slate-100`
              }`}
            >
              <div className="flex items-center gap-2">
                <tab.icon size={16} />
                {tab.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
    </div>
  );
}
