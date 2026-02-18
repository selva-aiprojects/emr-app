import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function SubscriptionCatalogManager() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('catalog');
  const [editingSubscription, setEditingSubscription] = useState(null);

  // Available feature definitions
  const availableFeatures = [
    {
      id: 'permission-core_engine-access',
      name: 'Core EMR Engine',
      description: 'Essential EMR functionality including dashboard, patients, appointments, and medical records',
      category: 'Core',
      icon: '🏥',
      tier: 'Basic'
    },
    {
      id: 'permission-customer_support-access',
      name: 'Customer Support',
      description: 'Customer service and support ticketing system',
      category: 'Support',
      icon: '🎧',
      tier: 'Professional'
    },
    {
      id: 'permission-hr_payroll-access',
      name: 'HR & Payroll',
      description: 'Human resources management and payroll processing',
      category: 'HR',
      icon: '👥',
      tier: 'Enterprise'
    },
    {
      id: 'permission-accounts-access',
      name: 'Accounts & Billing',
      description: 'Financial management, invoicing, and billing operations',
      category: 'Finance',
      icon: '💰',
      tier: 'Enterprise'
    }
  ];

  // Default subscription templates
  const defaultSubscriptions = [
    {
      id: 'basic',
      name: 'Basic',
      displayName: 'Basic Plan',
      description: 'Essential EMR functionality for small practices',
      price: '$99/month',
      features: ['permission-core_engine-access'],
      color: '#6b7280',
      icon: '🩺',
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      displayName: 'Professional Plan',
      description: 'Enhanced EMR with customer support features',
      price: '$299/month',
      features: ['permission-core_engine-access', 'permission-customer_support-access'],
      color: '#3b82f6',
      icon: '⭐',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      displayName: 'Enterprise Plan',
      description: 'Complete EMR solution with all advanced features',
      price: '$599/month',
      features: ['permission-core_engine-access', 'permission-customer_support-access', 'permission-hr_payroll-access', 'permission-accounts-access'],
      color: '#10b981',
      icon: '🏢',
      popular: false
    }
  ];

  useEffect(() => {
    loadSubscriptions();
    loadFeatures();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from API
      // For now, use default templates
      setSubscriptions(defaultSubscriptions);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeatures = async () => {
    try {
      // In a real implementation, this would fetch from API
      setFeatures(availableFeatures);
    } catch (error) {
      console.error('Error loading features:', error);
    }
  };

  const saveSubscription = async (subscription) => {
    try {
      setSaving(true);
      
      // In a real implementation, this would save to backend
      console.log('Saving subscription:', subscription);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubscriptions(prev => 
        prev.map(sub => sub.id === subscription.id ? subscription : sub)
      );
      
      setEditingSubscription(null);
      alert('Subscription saved successfully!');
    } catch (error) {
      console.error('Error saving subscription:', error);
      alert('Failed to save subscription');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatureInSubscription = (subscriptionId, featureId) => {
    setSubscriptions(prev => 
      prev.map(sub => {
        if (sub.id === subscriptionId) {
          const features = [...sub.features];
          const index = features.indexOf(featureId);
          if (index > -1) {
            features.splice(index, 1);
          } else {
            features.push(featureId);
          }
          return { ...sub, features };
        }
        return sub;
      })
    );
  };

  const applySubscriptionToTenants = async (subscriptionId) => {
    try {
      const subscription = subscriptions.find(sub => sub.id === subscriptionId);
      if (!subscription) return;

      const response = await api.post('/admin/apply-subscription-bundle', {
        subscriptionId,
        features: subscription.features
      });

      if (response.data.success) {
        alert(`Subscription bundle applied to ${response.data.tenantsUpdated} tenants`);
      } else {
        alert('Failed to apply subscription bundle');
      }
    } catch (error) {
      console.error('Error applying subscription:', error);
      alert('Error applying subscription bundle');
    }
  };

  const resetToDefaults = () => {
    setSubscriptions(defaultSubscriptions);
    alert('Reset to default templates');
  };

  return (
    <div className="subscription-catalog-manager">
      <div className="catalog-header">
        <h2>📦 Subscription Catalog Manager</h2>
        <p>Manage feature bundles and subscription tiers for your EMR platform</p>
      </div>

      <div className="catalog-tabs">
        <button 
          className={`tab ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          📦 Subscription Plans
        </button>
        <button 
          className={`tab ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => setActiveTab('features')}
        >
          🎯 Feature Library
        </button>
        <button 
          className={`tab ${activeTab === 'apply' ? 'active' : ''}`}
          onClick={() => setActiveTab('apply')}
        >
          🚀 Apply to Tenants
        </button>
      </div>

      {activeTab === 'catalog' && (
        <div className="catalog-content">
          <div className="subscriptions-grid">
            {subscriptions.map(subscription => (
              <div key={subscription.id} className="subscription-card">
                {subscription.popular && <div className="popular-badge">POPULAR</div>}
                
                <div className="subscription-header" style={{ backgroundColor: subscription.color }}>
                  <div className="subscription-icon">{subscription.icon}</div>
                  <div className="subscription-info">
                    <h3>{subscription.displayName}</h3>
                    <div className="subscription-price">{subscription.price}</div>
                  </div>
                </div>

                <div className="subscription-body">
                  <p className="subscription-description">{subscription.description}</p>
                  
                  <div className="features-list">
                    <h4>📋 Included Features:</h4>
                    {features
                      .filter(feature => subscription.features.includes(feature.id))
                      .map(feature => (
                        <div key={feature.id} className="feature-item">
                          <span className="feature-icon">{feature.icon}</span>
                          <div className="feature-details">
                            <div className="feature-name">{feature.name}</div>
                            <div className="feature-description">{feature.description}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="subscription-actions">
                    <button 
                      className="btn-edit"
                      onClick={() => setEditingSubscription(subscription)}
                    >
                      ✏️ Edit Bundle
                    </button>
                    <button 
                      className="btn-apply"
                      onClick={() => applySubscriptionToTenants(subscription.id)}
                    >
                      🚀 Apply to Tenants
                    </button>
                  </div>
              </div>
            ))}
          </div>

          <div className="catalog-actions">
            <button className="btn-secondary" onClick={resetToDefaults}>
              🔄 Reset to Defaults
            </button>
            <button className="btn-primary" onClick={() => alert('Publish to production')}>
              📢 Publish Changes
            </button>
          </div>
        </div>
      )}

      {activeTab === 'features' && (
        <div className="features-catalog">
          <h3>🎯 Feature Library</h3>
          <div className="features-grid">
            {features.map(feature => (
              <div key={feature.id} className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon-large">{feature.icon}</div>
                  <div className="feature-info">
                    <h4>{feature.name}</h4>
                    <span className="feature-category">{feature.category}</span>
                  </div>
                </div>
                <div className="feature-description-full">
                  {feature.description}
                </div>
                <div className="feature-tier">
                  <strong>Default Tier:</strong> {feature.tier}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'apply' && (
        <div className="apply-bulk">
          <h3>🚀 Apply Subscription Bundles to Tenants</h3>
          <div className="bulk-actions">
            {subscriptions.map(subscription => (
              <div key={subscription.id} className="bulk-item">
                <div className="bulk-info">
                  <h4>{subscription.displayName}</h4>
                  <p>{subscription.features.length} features included</p>
                </div>
                <button 
                  className="btn-bulk-apply"
                  onClick={() => applySubscriptionToTenants(subscription.id)}
                >
                  Apply to All Tenants
                </button>
              </div>
            ))}
          </div>
          
          <div className="apply-actions">
            <button className="btn-secondary" onClick={() => alert('Preview changes')}>
              👁️ Preview Changes
            </button>
            <button className="btn-primary" onClick={() => alert('Apply all changes')}>
              🚀 Apply All Changes
            </button>
          </div>
        </div>
      )}

      {editingSubscription && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="modal-header">
              <h3>✏️ Edit Subscription Bundle</h3>
              <button onClick={() => setEditingSubscription(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Display Name</label>
                <input 
                  type="text" 
                  value={editingSubscription.displayName}
                  onChange={(e) => setEditingSubscription({
                    ...editingSubscription,
                    displayName: e.target.value
                  })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={editingSubscription.description}
                  onChange={(e) => setEditingSubscription({
                    ...editingSubscription,
                    description: e.target.value
                  })}
                />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input 
                  type="text" 
                  value={editingSubscription.price}
                  onChange={(e) => setEditingSubscription({
                    ...editingSubscription,
                    price: e.target.value
                  })}
                />
              </div>
              <div className="form-group">
                <label>Features</label>
                <div className="feature-selector">
                  {features.map(feature => (
                    <label key={feature.id}>
                      <input 
                        type="checkbox" 
                        checked={editingSubscription.features.includes(feature.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingSubscription({
                              ...editingSubscription,
                              features: [...editingSubscription.features, feature.id]
                            });
                          } else {
                            setEditingSubscription({
                              ...editingSubscription,
                              features: editingSubscription.features.filter(f => f !== feature.id)
                            });
                          }
                        }}
                      />
                      <span>{feature.icon} {feature.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEditingSubscription(null)}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={() => saveSubscription(editingSubscription)}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .subscription-catalog-manager {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .catalog-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .catalog-header h2 {
          font-size: 2rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .catalog-header p {
          color: #64748b;
          font-size: 1rem;
        }

        .catalog-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 0;
        }

        .tab {
          padding: 1rem 1.5rem;
          border: none;
          background: none;
          font-size: 1rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
        }

        .tab.active {
          color: #1e293b;
          border-bottom-color: #3b82f6;
        }

        .tab:hover {
          color: #1e293b;
          background: #f8fafc;
        }

        .catalog-content {
          margin-bottom: 2rem;
        }

        .subscriptions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .subscription-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s;
        }

        .subscription-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .popular-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: #ef4444;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .subscription-header {
          padding: 2rem;
          color: white;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .subscription-icon {
          font-size: 2.5rem;
        }

        .subscription-info h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
        }

        .subscription-price {
          font-size: 1.25rem;
          font-weight: 700;
          opacity: 0.9;
        }

        .subscription-body {
          padding: 2rem;
        }

        .subscription-description {
          color: #64748b;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .features-list h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1rem;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .feature-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .feature-details {
          flex: 1;
        }

        .feature-name {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }

        .feature-description {
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.4;
        }

        .subscription-actions {
          padding: 2rem;
          display: flex;
          gap: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .btn-edit, .btn-apply {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-edit {
          background: #f1f5f9;
          color: #1e293b;
          border: 1px solid #e2e8f0;
        }

        .btn-edit:hover {
          background: #e2e8f0;
        }

        .btn-apply {
          background: #10b981;
          color: white;
          flex: 1;
        }

        .btn-apply:hover {
          background: #059669;
        }

        .catalog-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          padding: 2rem;
          border-top: 2px solid #e2e8f0;
        }

        .btn-primary, .btn-secondary {
          padding: 1rem 2rem;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #10b981;
          color: white;
        }

        .btn-primary:hover {
          background: #059669;
        }

        .btn-secondary {
          background: #f1f5f9;
          color: #1e293b;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
        }

        .features-catalog {
          margin-bottom: 2rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .feature-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
          background: white;
        }

        .feature-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .feature-icon-large {
          font-size: 2rem;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border-radius: 12px;
        }

        .feature-tier {
          margin-top: 1rem;
          padding: 0.5rem;
          background: #f0fdf4;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .apply-bulk {
          margin-bottom: 2rem;
        }

        .bulk-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .bulk-item {
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
        }

        .bulk-info h4 {
          margin: 0 0 0.5rem 0;
          color: #1e293b;
        }

        .bulk-info p {
          margin: 0;
          color: #64748b;
          font-size: 0.875rem;
        }

        .btn-bulk-apply {
          width: 100%;
          padding: 0.75rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-bulk-apply:hover {
          background: #059669;
        }

        .edit-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .edit-modal {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .modal-header h3 {
          margin: 0;
          color: #1e293b;
        }

        .modal-header button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #64748b;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-family: inherit;
        }

        .form-group textarea {
          min-height: 80px;
          resize: vertical;
        }

        .feature-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.5rem;
        }

        .feature-selector label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .feature-selector label:hover {
          background: #f8fafc;
        }

        .feature-selector input[type="checkbox"] {
          margin: 0;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }
      `}</style>
    </div>
  );
}
