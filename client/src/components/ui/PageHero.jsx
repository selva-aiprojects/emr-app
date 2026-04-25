import React from 'react';

/**
 * Standardized Hero Section for all EMR Pages
 * Ensures visual consistency in typography, colors, and layout.
 */
export function PageHero({
  title,
  subtitle,
  badge,
  icon: Icon,
  stats = [],
  actions = [],
  tabs = [],
  activeTab,
  onTabChange,
  className = ""
}) {
  return (
    <header className={`page-header-premium stagger-entrance ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }}></div>
      
      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4 mb-6">
            {Icon && (
              <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                <Icon className="w-8 h-8 text-white" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-black text-white flex items-center gap-3">
                {title}
                {badge && (
                  <span className="system-shard-badge">
                    {badge}
                  </span>
                )}
              </h1>
              {subtitle && (
                <p className="premium-subtitle !text-white/80 mt-2">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          {stats.length > 0 && (
            <div className="flex flex-wrap gap-6 mt-8">
              {stats.map((stat, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {stat.icon && <stat.icon className={`w-4 h-4 ${stat.color || 'text-white/40'}`} />}
                  <span className="text-xs font-black uppercase tracking-widest text-white/70">
                    {stat.label}: <span className="text-white ml-1">{stat.value}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-start xl:items-end gap-6">
          {tabs.length > 0 && (
            <div className="flex bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-sm gap-1 w-fit">
              {tabs.map(tab => (
                <button 
                  key={tab.id}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white text-slate-900 shadow-xl' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => onTabChange?.(tab.id)}
                >
                  {tab.icon && <tab.icon className="w-3.5 h-3.5 inline-block mr-2" />}
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {actions.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {actions.map((action, idx) => (
                <button 
                  key={idx}
                  onClick={action.onClick}
                  className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 ${
                    action.variant === 'primary' 
                      ? 'bg-white text-slate-900 hover:bg-slate-50' 
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }`}
                >
                  {action.icon && <action.icon className="w-4 h-4" />}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
