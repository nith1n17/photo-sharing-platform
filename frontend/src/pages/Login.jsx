
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { saveTokens } from "../utils/auth";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Animated background particles
    const canvas = document.getElementById("login-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 40;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.4 + 0.1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        ctx.fillStyle = `rgba(0, 0, 0, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("login/", {
        username,
        password,
      });

      saveTokens(
        response.data.access,
        response.data.refresh
      );

      const userResponse = await api.get("me/");

      if (userResponse.data.role === "ADMIN") {
        navigate("/admin");
      } else if (userResponse.data.role === "TEAM_MEMBER") {
        navigate("/team");
      }
    } catch (err) {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 overflow-hidden relative">
      {/* Animated Background Canvas */}
      <canvas
        id="login-canvas"
        className="absolute inset-0 opacity-25"
      />

      {/* Gradient Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img
                src="photosharelogo.png"
                alt="PhotoShare"
                className="w-14 h-14 object-contain"
              />
            </div>

            <h1 className="text-4xl font-black text-slate-900 mb-2">
              Welcome Back
            </h1>

            <p className="text-slate-500 font-light text-sm tracking-wide">
              Continue to your account
            </p>
          </div>

          {/* Divider */}
          <div className="flex justify-center mb-8">
            <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-slate-300 to-transparent rounded-full" />
          </div>

          {/* Form */}
          <form
            onSubmit={handleLogin}
            className="space-y-4"
          >

            {/* Error Message */}
            {error && (
              <div className="group p-4 rounded-xl bg-red-50 border border-red-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-red-900">
                      Login Failed
                    </p>
                    <p className="text-xs text-red-700 font-light mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300"
                required
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3.98 8.223A10.477 10.477 0 001.934 12c2.292 5.118 7.169 8 11.982 8.018A11.556 11.556 0 008.3 20.873m0 0a11.586 11.586 0 01-7.532-5.857m7.532 5.857A11.545 11.545 0 0121.75 12c0-.141-.008-.282-.025-.423A9.994 9.994 0 0020.70 13m0 0a11.589 11.589 0 01-9.802-9.999m9.802 9.999l.5.865-.5-.865zm0 0a11.589 11.589 0 01-7.532-5.857m7.532 5.857l-.5.865.5-.865z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13.5 6H5.424M13.5 6H18M13.5 6a11.979 11.979 0 016.77 2.23M13.5 6A11.986 11.986 0 0012 21a11.986 11.986 0 01-1.5-15m1.5 0a11.979 11.979 0 00-6.77 2.23M9.75 9.75L4.5 15m15-6l5.25 6" />
                    </svg>
                  )}
                </button>
              </div>
            </div>



            {/* Divider */}
            <div className="py-2">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-slate-200 to-transparent rounded-full" />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full group relative py-3 px-4 rounded-xl font-semibold transition-all duration-300 overflow-hidden ${
                loading
                  ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                  : "bg-slate-900 text-white hover:shadow-lg hover:shadow-slate-900/25 active:scale-95"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-900 rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </span>
            </button>

            
          </form>

          {/* Security Info */}
          <div className="mt-8 pt-6 border-t border-slate-200/50 flex justify-center">
            <div className="flex items-center justify-center gap-3 text-center">
              <svg
                  className="w-6 h-6 text-slate-400 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17 8h-1V6a4 4 0 00-8 0v2H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V10a2 2 0 00-2-2zm-5 9a2 2 0 110-4 2 2 0 010 4zm2-9h-4V6a2 2 0 114 0v2z" />
                </svg>
              
              <p className="text-sm text-slate-600 font-light">
                Your credentials are encrypted in transit.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Background Styles */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}

export default Login;
