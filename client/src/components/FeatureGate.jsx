import React from 'react';
import { useFeatureFlags } from '../services/featureFlag.service.js';

/**
 * FeatureGate component - Conditionally renders children based on feature flag
 * 
 * @param {string} feature - Feature flag to check
 * @param {string} module - Module name to check (alternative to feature)
 * @param {string} tenantId - Tenant ID
 * @param {React.ReactNode} children - Children to render if feature is enabled
 * @param {React.ReactNode} fallback - Optional fallback to render if feature is disabled
 * @param {boolean} hideOnDisabled - If true, renders nothing when disabled (default: true)
 * @param {Function} onDisabled - Optional callback when feature is disabled
 */
export function FeatureGate({ 
  feature, 
  module, 
  tenantId, 
  children, 
  fallback = null, 
  hideOnDisabled = true,
  onDisabled 
}) {
  const { isFeatureEnabled, isModuleAccessible, loading, error } = useFeatureFlags(tenantId);

  if (loading) {
    // Show loading state or render children optimistically
    return hideOnDisabled ? null : children;
  }

  if (error) {
    console.error('Feature flag error:', error);
    // Fail safe: hide feature on error
    return hideOnDisabled ? null : fallback;
  }

  let hasAccess = false;
  
  if (feature) {
    hasAccess = isFeatureEnabled(feature);
  } else if (module) {
    hasAccess = isModuleAccessible(module);
  } else {
    console.warn('FeatureGate: Either feature or module must be specified');
    return children; // Default to allowing access
  }

  if (!hasAccess) {
    if (onDisabled) {
      onDisabled({ feature, module, tenantId });
    }
    return hideOnDisabled ? null : fallback;
  }

  return children;
}

/**
 * ModuleGate component - Specific wrapper for module-based gating
 */
export function ModuleGate({ module, tenantId, children, fallback = null, hideOnDisabled = true }) {
  return (
    <FeatureGate 
      module={module} 
      tenantId={tenantId} 
      children={children} 
      fallback={fallback}
      hideOnDisabled={hideOnDisabled}
    />
  );
}

/**
 * FeatureLink component - Renders a link only if feature is enabled
 */
export function FeatureLink({ 
  feature, 
  module, 
  tenantId, 
  children, 
  href, 
  onClick, 
  className = '',
  disabledClassName = 'disabled-feature-link',
  fallback = null 
}) {
  const { isFeatureEnabled, isModuleAccessible, loading } = useFeatureFlags(tenantId);

  if (loading) {
    return (
      <a href={href} onClick={onClick} className={`${className} loading-feature-link`}>
        {children}
      </a>
    );
  }

  const hasAccess = feature 
    ? isFeatureEnabled(feature) 
    : isModuleAccessible(module);

  if (!hasAccess) {
    if (fallback) return fallback;
    
    return (
      <span className={`${className} ${disabledClassName}`} title="Feature not available in your subscription tier">
        {children}
      </span>
    );
  }

  return (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  );
}

/**
 * FeatureButton component - Renders a button only if feature is enabled
 */
export function FeatureButton({ 
  feature, 
  module, 
  tenantId, 
  children, 
  onClick, 
  disabled = false,
  className = '',
  disabledClassName = 'disabled-feature-button',
  fallback = null,
  showDisabledTooltip = true,
  ...props 
}) {
  const { isFeatureEnabled, isModuleAccessible, loading } = useFeatureFlags(tenantId);

  if (loading) {
    return (
      <button 
        onClick={onClick} 
        className={`${className} loading-feature-button`}
        disabled={true}
        {...props}
      >
        {children}
      </button>
    );
  }

  const hasAccess = feature 
    ? isFeatureEnabled(feature) 
    : isModuleAccessible(module);

  const isDisabled = disabled || !hasAccess;

  if (!hasAccess && fallback) {
    return fallback;
  }

  return (
    <button 
      onClick={hasAccess ? onClick : undefined}
      disabled={isDisabled}
      className={`${className} ${!hasAccess ? disabledClassName : ''}`}
      title={showDisabledTooltip && !hasAccess ? 'Feature not available in your subscription tier' : props.title}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Higher-order component for feature gating
 */
export function withFeatureGate(featureOrModule, options = {}) {
  const { isModule = false, fallback = null, hideOnDisabled = true } = options;
  
  return function WrappedComponent(props) {
    const { tenantId } = props;
    
    return (
      <FeatureGate 
        feature={isModule ? undefined : featureOrModule}
        module={isModule ? featureOrModule : undefined}
        tenantId={tenantId}
        fallback={fallback}
        hideOnDisabled={hideOnDisabled}
      >
        <WrappedComponent {...props} />
      </FeatureGate>
    );
  };
}

/**
 * Hook for checking feature access outside of components
 */
export function useFeatureAccess(tenantId) {
  const { isFeatureEnabled, isModuleAccessible, loading, error, flags } = useFeatureFlags(tenantId);

  const canAccessFeature = React.useCallback((feature) => {
    if (loading) return false;
    return isFeatureEnabled(feature);
  }, [isFeatureEnabled, loading]);

  const canAccessModule = React.useCallback((module) => {
    if (loading) return false;
    return isModuleAccessible(module);
  }, [isModuleAccessible, loading]);

  const getAccessibleModules = React.useCallback((modules) => {
    if (loading) return [];
    return modules.filter(module => canAccessModule(module));
  }, [canAccessModule, loading]);

  return {
    canAccessFeature,
    canAccessModule,
    getAccessibleModules,
    flags,
    loading,
    error
  };
}
