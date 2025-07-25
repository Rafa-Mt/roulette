import { useState } from "react";

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  onSwitchToRegister: () => void;
  loading: boolean;
}

const Login = ({ onLogin, onSwitchToRegister, loading }: LoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onLogin(username, password);
    } else {
      alert("Please fill in all fields.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2 className="auth-title">Welcome Back!</h2>
        <p className="auth-subtitle">
          Enter your credentials to start gambling
        </p>

        <form onSubmit={handleSubmit} className="auth-form-content">
          <div className="auth-field">
            <label htmlFor="username" className="auth-label">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="auth-input"
              placeholder="Enter your username"
              required
              onInvalid={(e) => e.currentTarget.setCustomValidity("Username is required")}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Enter your password"
              required
              onInvalid={(e) => e.currentTarget.setCustomValidity("Password is required")}
            />
          </div>

          <button type="submit" className="auth-button primary" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="auth-switch">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="auth-link"
            >
              Register here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
