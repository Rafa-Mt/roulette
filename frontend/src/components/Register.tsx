import { useState } from "react";

interface RegisterProps {
  onRegister: (username: string, password: string, email: string) => void;
  onSwitchToLogin: () => void;
}

const Register = ({ onRegister, onSwitchToLogin }: RegisterProps) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !username.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      alert("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    onRegister(username, password, email);
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2 className="auth-title">Join the Casino!</h2>
        <p className="auth-subtitle">
          Create your account and get $20,000 to start
        </p>

        <form onSubmit={handleSubmit} className="auth-form-content">
          <div className="auth-field">
            <label htmlFor="reg-username" className="auth-label">
              Username
            </label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="auth-input"
              placeholder="Choose a username"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-email" className="auth-label">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-password" className="auth-label">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Create a password"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-confirm-password" className="auth-label">
              Confirm Password
            </label>
            <input
              id="reg-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input"
              placeholder="Confirm your password"
              required
            />
          </div>

          <button type="submit" className="auth-button primary">
            Create Account & Start Playing
          </button>

          <div className="auth-switch">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="auth-link"
            >
              Login here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
