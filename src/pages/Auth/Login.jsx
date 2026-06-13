import { useState } from 'react';
import {
    MdOutlineMail,
    MdLockOutline,
    MdVisibility,
    MdVisibilityOff,
    MdArrowForward,
    MdChatBubbleOutline
} from 'react-icons/md';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import './login.css';

function Login({ onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(API_BASE_URL + '/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                onLoginSuccess();
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            alert('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setShowPassword(false);
        setFocusedField(null);
    };

    return (
        <div className="login-container">
            {/* Animated background elements */}
            <div className="login-bg">
                <div className="bg-gradient-1"></div>
                <div className="bg-gradient-2"></div>
                <div className="bg-grid"></div>
                <div className="floating-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                    <div className="shape shape-4"></div>
                    <div className="shape shape-5"></div>
                    <div className="shape shape-6"></div>
                </div>
            </div>

            {/* Main login card */}
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <MdChatBubbleOutline className="message-icon" size={28} />
                            <div className="logo-dot"></div>
                        </div>
                    </div>
                    <h1 className="app-title">Chat.bidwinners</h1>
                    <p className="app-subtitle">
                        {isLogin ? 'Welcome back! Connect & bid in real-time' : 'Join the conversation today'}
                    </p>
                </div>

                {/* Toggle between Login and Sign Up */}
                <div className="mode-toggle">
                    <button
                        className={`toggle-btn ${isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(true)}
                    >
                        Sign In
                    </button>
                    <button
                        className={`toggle-btn ${!isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(false)} style={{
                            opacity: 0.5,
                            cursor: "not-allowed",
                            pointerEvents: "none"
                        }} onMouseDown={(e) => e.preventDefault()}

                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {!isLogin && (
                        <div className={`input-group ${focusedField === 'name' ? 'focused' : ''}`}>
                            <label className="input-label">Full Name</label>
                            <div className="input-wrapper">
                                <MdLockOutline className="input-icon" size={18} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onFocus={() => setFocusedField('name')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="John Doe"
                                    required={!isLogin}
                                    className="login-input"
                                />
                            </div>
                        </div>
                    )}

                    <div className={`input-group ${focusedField === 'email' ? 'focused' : ''}`}>
                        <label className="input-label">Email Address</label>
                        <div className="input-wrapper">
                            <MdOutlineMail className="input-icon" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="you@example.com"
                                required
                                className="login-input"
                            />
                        </div>
                    </div>

                    <div className={`input-group ${focusedField === 'password' ? 'focused' : ''}`}>
                        <label className="input-label">Password</label>
                        <div className="input-wrapper">
                            <MdLockOutline className="input-icon" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="••••••••"
                                required
                                className="login-input"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="password-toggle"
                            >
                                {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                            </button>
                        </div>
                    </div>

                    {isLogin && (
                        <div className="form-options">
                            <label className="remember-me">
                                <input type="checkbox" />
                                <span className="checkmark"></span>
                                Remember me
                            </label>
                            <button type="button" className="forgot-password" style={{
                                opacity: 0.5,
                                cursor: "not-allowed",
                                pointerEvents: "none"
                            }} onMouseDown={(e) => e.preventDefault()}
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}

                    <button type="submit" className={`submit-btn ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                        {isLoading ? (
                            <div className="spinner"></div>
                        ) : (
                            <>
                                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                                <MdArrowForward size={20} className="btn-arrow" />
                            </>
                        )}
                    </button>
                </form>

                {/* <div className="login-footer">
                    <p>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button onClick={toggleMode} className="toggle-link">
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                    <div className="divider">
                        <span>or continue with</span>
                    </div>
                    <div className="social-buttons">
                        <button className="social-btn" style={{
                            opacity: 0.5,
                            cursor: "not-allowed",
                            pointerEvents: "none"
                        }} onMouseDown={(e) => e.preventDefault()}
                        >
                            <FaGoogle className="social-icon google-icon" size={18} />
                            Google
                        </button>
                        <button className="social-btn" style={{
                            opacity: 0.5,
                            cursor: "not-allowed",
                            pointerEvents: "none"
                        }} onMouseDown={(e) => e.preventDefault()}
                        >
                            <FaGithub className="social-icon github-icon" size={18} />
                            GitHub
                        </button>
                    </div>
                </div> */}
            </div>
        </div>
    );
}

export default Login;