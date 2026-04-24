import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { superadminService } from '../services/superadmin.service.js';
import EnhancedSuperadminPage from './EnhancedSuperadminPage.jsx';
import '../styles/superadmin.css';

/**
 * Pure Superadmin Page - No EMR Workflow
 * Only for tenant management, infrastructure, and global operations
 */
export default function SuperadminOnlyPage({ tenant, activeUser }) {
  const { showToast } = useToast();
  const [superadminData, setSuperadminData] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch superadmin data
  useEffect(() => {
    const fetchSuperadminData = async () => {
      setIsLoading(true);
      try {
        const data = await superadminService.getFixedOverview();
        setSuperadminData(data);
        setTenants(data.tenants || []);
        
        console.log('Superadmin data loaded:', {
          totals: data.totals,
          tenantsCount: data.tenants?.length
        });
      } catch (error) {
        console.error('Superadmin data fetch failed:', error);
        showToast({
          title: 'Dashboard Error',
          message: 'Could not load admin dashboard data',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (activeUser?.role === 'Superadmin') {
      fetchSuperadminData();
    }
  }, [activeUser?.role, showToast]);

  // Handle data refresh
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const data = await superadminService.getFixedOverview();
      setSuperadminData(data);
      setTenants(data.tenants || []);
      
      showToast({
        title: 'Data Refreshed',
        message: 'Dashboard data updated successfully',
        type: 'success'
      });
    } catch (error) {
      showToast({
        title: 'Refresh Failed',
        message: 'Could not refresh dashboard data',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tenant management actions
  const handleTenantAction = async (action, tenantData) => {
    try {
      switch (action) {
        case 'sync':
          await superadminService.syncSuperadminMetrics();
          showToast({
            title: 'Sync Complete',
            message: 'Tenant metrics synchronized',
            type: 'success'
          });
          handleRefresh();
          break;
        
        case 'create':
          const result = await superadminService.provisionTenant(tenantData);
          showToast({
            title: 'Tenant Created',
            message: `New tenant ${result.name} created successfully`,
            type: 'success'
          });
          handleRefresh();
          break;
        
        case 'delete':
          await superadminService.deleteTenant(tenantData.id);
          showToast({
            title: 'Tenant Deleted',
            message: `Tenant ${tenantData.name} removed`,
            type: 'success'
          });
          handleRefresh();
          break;
        
        default:
          console.warn('Unknown tenant action:', action);
      }
    } catch (error) {
      showToast({
        title: 'Action Failed',
        message: `Failed to ${action} tenant`,
        type: 'error'
      });
    }
  };

  // Only render for Superadmin role
  if (activeUser?.role !== 'Superadmin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">This page is only accessible to Superadmin users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Superadmin Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-purple-600 font-bold">S</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Nexus Admin Console</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <div className="text-sm text-gray-500">
                {activeUser?.email}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Superadmin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </div>
        ) : (
          <EnhancedSuperadminPage
            view="superadmin"
            tenants={tenants}
            superOverview={superadminData}
            tickets={[]}
            onRefresh={handleRefresh}
            apiClient={superadminService}
          />
        )}
      </div>
    </div>
  );
}
