import { useState, useEffect } from 'react';
import axios from 'axios';

export default function RoleManagementPage({ tenant, activeUser }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/roles');
      setRoles(response.data);
    } catch (err) {
      setError('Failed to load roles');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (roleData) => {
    try {
      if (editingRole) {
        await axios.put(`/api/roles/${editingRole.id}`, roleData);
      } else {
        await axios.post('/api/roles', roleData);
      }
      fetchRoles();
      setShowCreateModal(false);
      setEditingRole(null);
    } catch (err) {
      setError('Failed to save role');
      console.error('Error saving role:', err);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    try {
      await axios.delete(`/api/roles/${roleId}`);
      fetchRoles();
    } catch (err) {
      setError('Failed to delete role');
      console.error('Error deleting role:', err);
    }
  };

  const getPermissionDescription = (permission) => {
    const descriptions = {
      'permission-core_engine-access': 'Core EMR access',
      'permission-hr_payroll-access': 'HR & Payroll management',
      'permission-accounts-access': 'Financial accounting access',
      'permission-customer_support-access': 'Customer support system'
    };
    return descriptions[permission] || 'System permission';
  };

  return (
    <div className="role-management-page">
      <div className="page-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-wrapper">
              <div className="logo-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="4" fill="url(#gradient)" />
                  <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="18" cy="6" r="2" fill="white" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0F4C75" />
                      <stop offset="100%" stopColor="#2E86AB" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <img 
                src="/Medflow-logo.jpg" 
                alt="MedFlow EMR" 
                className="role-logo-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="role-logo-fallback" style={{display: 'none'}}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="4" fill="url(#gradient)" />
                  <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="18" cy="6" r="2" fill="white" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0F4C75" />
                      <stop offset="100%" stopColor="#2E86AB" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <div className="title-text">
              <h1>Role Management</h1>
              <p>Manage user roles and permissions</p>
            </div>
          </div>
          <div className="action-buttons">
            <button 
              className="btn-primary"
              onClick={() => {
                setEditingRole(null);
                setShowCreateModal(true);
              }}
            >
              ➕ Add Role
            </button>
            <button 
              className="btn-secondary"
              onClick={fetchRoles}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingRole ? 'Edit Role' : 'Create New Role'}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const roleData = {
                  name: formData.get('name'),
                  description: formData.get('description'),
                  permissions: formData.getAll('permissions'),
                  is_active: formData.get('is_active') === 'on'
                };
                handleCreateRole(roleData);
              }}>
                <div className="form-group">
                  <label>Role Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    defaultValue={editingRole?.name || ''}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    name="description" 
                    rows="3"
                    defaultValue={editingRole?.description || ''}
                  />
                </div>
                <div className="form-group">
                  <label>Permissions</label>
                  <div className="permissions-grid">
                    <div className="permission-item">
                      <input type="checkbox" name="permissions" value="permission-core_engine-access" defaultChecked={editingRole?.permissions?.includes('permission-core_engine-access')} />
                      <label>Core EMR Access</label>
                    </div>
                    <div className="permission-item">
                      <input type="checkbox" name="permissions" value="permission-hr_payroll-access" defaultChecked={editingRole?.permissions?.includes('permission-hr_payroll-access')} />
                      <label>HR & Payroll</label>
                    </div>
                    <div className="permission-item">
                      <input type="checkbox" name="permissions" value="permission-accounts-access" defaultChecked={editingRole?.permissions?.includes('permission-accounts-access')} />
                      <label>Accounts</label>
                    </div>
                    <div className="permission-item">
                      <input type="checkbox" name="permissions" value="permission-customer_support-access" defaultChecked={editingRole?.permissions?.includes('permission-customer_support-access')} />
                      <label>Customer Support</label>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    <input 
                      type="checkbox" 
                      name="is_active" 
                      defaultChecked={editingRole?.is_active !== false}
                    /> 
                    Active Role
                  </label>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingRole ? 'Update Role' : 'Create Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedRole && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{selectedRole.name}</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedRole(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="role-details">
                <h3>Role Information</h3>
                <p>{selectedRole.description}</p>
                
                <h4>Permissions</h4>
                <div className="permissions-list">
                  {selectedRole.permissions.map(permission => (
                    <div key={permission} className="permission-item">
                      <span className="permission-name">{permission}</span>
                      <span className="permission-desc">{getPermissionDescription(permission)}</span>
                    </div>
                  ))}
                </div>
                
                <h4>Status</h4>
                <div className="status-badge">
                  {selectedRole.is_active ? '🟢 Active' : '⚫ Inactive'}
                </div>
              </div>
              
              <div className="role-actions">
                <button 
                  className="btn-edit"
                  onClick={() => {
                    setEditingRole(selectedRole);
                    setShowCreateModal(true);
                    setSelectedRole(null);
                  }}
                >
                  ✏️ Edit Role
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => {
                    handleDeleteRole(selectedRole.id);
                    setSelectedRole(null);
                  }}
                >
                  🗑️ Delete Role
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setSelectedRole(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading roles and permissions...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <div className="error-icon">!</div>
          <span className="error-text">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="roles-grid">
          {roles.map(role => (
            <div key={role.id} className="role-card" onClick={() => setSelectedRole(role)}>
              <div className="role-header">
                <div className="role-info">
                  <h3>{role.name}</h3>
                  <p>{role.description}</p>
                </div>
                <div className={`role-badge badge-${role.name.toLowerCase().includes('admin') ? 'admin' : role.name.toLowerCase().includes('doctor') ? 'doctor' : role.name.toLowerCase().includes('nurse') ? 'nurse' : 'staff'}`}>
                  {role.name}
                </div>
              </div>
              
              <div className="role-description">
                {role.description}
              </div>
              
              <div className="role-features">
                {role.permissions.map(permission => (
                  <span key={permission} className="feature-tag">
                    {permission.replace('permission-', '').replace('-access', '')}
                  </span>
                ))}
              </div>
              
              <div className="role-stats">
                <div className="stat-item">
                  <div className="stat-value">{role.user_count || 0}</div>
                  <div className="stat-label">Users</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{role.permissions?.length || 0}</div>
                  <div className="stat-label">Permissions</div>
                </div>
              </div>
              
              <div className="role-actions">
                <button 
                  className="btn-edit"
                  onClick={() => {
                    setEditingRole(role);
                    setShowCreateModal(true);
                  }}
                >
                  ✏️ Edit
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDeleteRole(role.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
