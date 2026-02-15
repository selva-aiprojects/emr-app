export default function LoginPage({ tenants, onLogin, loading, error }) {
  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <img src="/kidz_logo.svg" alt="Kidz Clinic" style={{ width: '80px', height: '80px' }} />
          </div>
          <h2>Kidz Clinic</h2>
          <p>Children's Hospital EMR</p>
        </div>

        <form className="login-form" onSubmit={onLogin}>
          <div className="login-field">
            <select name="tenantId" defaultValue="" required>
              <option value="" disabled>Select Organization</option>
              <option value="superadmin">Platform Superadmin</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="login-field">
            <input name="email" type="email" placeholder="Email address" required autoComplete="email" />
          </div>
          <div className="login-field">
            <input name="password" type="password" placeholder="Password" required autoComplete="current-password" />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {error && <div className="login-error" style={{ marginTop: '0.75rem' }}>{error}</div>}
      </div>
    </div>
  );
}
