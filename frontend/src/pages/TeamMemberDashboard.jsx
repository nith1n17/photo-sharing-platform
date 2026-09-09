// import { useEffect, useState } from "react";
// import api from "../services/api";
// import { clearTokens } from "../utils/auth";
// import { useNavigate } from "react-router-dom";

// function TeamMemberDashboard() {
//   const navigate = useNavigate();

//   const [user, setUser] = useState(null);
//   const [events, setEvents] = useState([]);
//   const [selectedEvent, setSelectedEvent] = useState("");
//   const [photo, setPhoto] = useState(null);
//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");
//   const [uploading, setUploading] = useState(false);

//   useEffect(() => {
//     loadDashboard();
//   }, []);

//   const loadDashboard = async () => {
//     try {
//       const userResponse = await api.get("me/");
//       setUser(userResponse.data);

//       if (userResponse.data.role !== "TEAM_MEMBER") {
//         navigate("/");
//         return;
//       }

//       const eventsResponse = await api.get("my-events/");
//       setEvents(eventsResponse.data);
//     } catch (err) {
//       clearTokens();
//       navigate("/login");
//     }
//   };

//   const handleUpload = async (e) => {
//     e.preventDefault();

//     setMessage("");
//     setError("");

//     if (!selectedEvent) {
//       setError("Please select an event.");
//       return;
//     }

//     if (!photo) {
//       setError("Please select a photo.");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("photo", photo);

//     try {
//       setUploading(true);

//       await api.post(
//         `events/${selectedEvent}/photos/upload/`,
//         formData,
//         {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       setMessage("Photo uploaded successfully.");
//       setPhoto(null);
//       e.target.reset();
//     } catch (err) {
//       setError(
//         err.response?.data?.error || "Photo upload failed."
//       );
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleLogout = () => {
//     clearTokens();
//     navigate("/login");
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
//         <h1 className="text-xl font-bold">Photo Sharing Platform</h1>

//         <button
//           onClick={handleLogout}
//           className="bg-black text-white px-4 py-2 rounded-lg"
//         >
//           Logout
//         </button>
//       </nav>

//       <main className="max-w-4xl mx-auto p-6 space-y-8">
//         <div>
//           <h2 className="text-3xl font-bold">
//             Team Member Dashboard
//           </h2>

//           {user && (
//             <p className="text-gray-600 mt-1">
//               Welcome, {user.username}
//             </p>
//           )}
//         </div>

//         <section className="bg-white p-6 rounded-xl shadow-sm">
//           <h3 className="text-xl font-semibold mb-4">
//             Assigned Events
//           </h3>

//           {events.length === 0 ? (
//             <p className="text-gray-500">
//               No events assigned.
//             </p>
//           ) : (
//             <div className="space-y-3">
//               {events.map((event) => (
//                 <div
//                   key={event.id}
//                   className="border rounded-lg p-4"
//                 >
//                   <p className="font-semibold">{event.name}</p>
//                   <p className="text-gray-500 text-sm">
//                     {event.description || "No description"}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>

//         <section className="bg-white p-6 rounded-xl shadow-sm">
//           <h3 className="text-xl font-semibold mb-4">
//             Upload Photo
//           </h3>

//           {message && (
//             <p className="text-green-600 mb-4">
//               {message}
//             </p>
//           )}

//           {error && (
//             <p className="text-red-600 mb-4">
//               {error}
//             </p>
//           )}

//           <form onSubmit={handleUpload} className="space-y-4">
//             <select
//               value={selectedEvent}
//               onChange={(e) => setSelectedEvent(e.target.value)}
//               className="w-full border rounded-lg px-4 py-3"
//               required
//             >
//               <option value="">Select Event</option>

//               {events.map((event) => (
//                 <option key={event.id} value={event.id}>
//                   {event.name}
//                 </option>
//               ))}
//             </select>

//             <input
//               type="file"
//               accept="image/jpeg,image/png,image/webp"
//               onChange={(e) => setPhoto(e.target.files[0])}
//               className="w-full border rounded-lg px-4 py-3"
//               required
//             />

//             <button
//               type="submit"
//               disabled={uploading}
//               className="bg-black text-white px-6 py-3 rounded-lg disabled:opacity-50"
//             >
//               {uploading ? "Uploading..." : "Upload Photo"}
//             </button>
//           </form>
//         </section>
//       </main>
//     </div>
//   );
// }

// export default TeamMemberDashboard;

// *************************************

import { useEffect, useState } from "react";
import api from "../services/api";
import { clearTokens } from "../utils/auth";
import { useNavigate } from "react-router-dom";

function TeamMemberDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [photos, setPhotos] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Animated background particles
    const canvas = document.getElementById("team-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 50;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
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

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const userResponse = await api.get("me/");
      setUser(userResponse.data);

      if (userResponse.data.role !== "TEAM_MEMBER") {
        navigate("/");
        return;
      }

      const eventsResponse = await api.get("my-events/");
      setEvents(eventsResponse.data);
    } catch (err) {
      clearTokens();
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!selectedEvent) {
        setError("Please select an event.");
        return;
    }

    if (photos.length === 0) {
        setError("Please select at least one photo.");
        return;
    }

    const formData = new FormData();

    photos.forEach((photo) => {
        formData.append("photos", photo);
    });

    try {
        setUploading(true);

        await api.post(
        `events/${selectedEvent}/photos/upload/`,
        formData,
        {
            headers: {
            "Content-Type": "multipart/form-data",
            },
        }
        );

        setMessage(
        `${photos.length} photo${photos.length > 1 ? "s" : ""} uploaded successfully!`
        );

        setPhotos([]);
        e.target.reset();

    } catch (err) {
        setError(
        err.response?.data?.error ||
        "Photo upload failed. Please try again."
        );
    } finally {
        setUploading(false);
    }
    };


  const handleLogout = () => {
    clearTokens();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg font-light">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 overflow-hidden relative">
      {/* Animated Background Canvas */}
      <canvas
        id="team-canvas"
        className="fixed inset-0 opacity-30 pointer-events-none"
      />

      {/* Gradient Orbs */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-80 h-80 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none" />

      {/* HEADER */}
      <div className="relative z-10 bg-gradient-to-r from-slate-900 to-slate-800 shadow-sm border-b border-slate-700/30 sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">Team Dashboard</h1>
            <p className="text-slate-400 mt-0.5 text-sm font-light">
              <span className="text-slate-300">{user?.username}</span>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-slate-300 px-4 py-2 text-sm font-medium transition duration-200 border border-slate-600/30 rounded-lg hover:border-slate-600/50"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">

        {/* ASSIGNED EVENTS SECTION */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-5">Your Events</h2>

          {events.length === 0 ? (
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8 text-center">
              <p className="text-slate-500 text-sm font-light">No events assigned to you yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition border border-slate-200/50 p-5"
                >
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm">
                    {event.name}
                  </h3>
                  <p className="text-slate-600 text-xs font-light leading-relaxed">
                    {event.description || "No description provided"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* UPLOAD SECTION */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Upload Photos</h2>

          {/* Success Message */}
          {message && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-300">
              {message}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-red-900">Upload Failed</p>
                <p className="text-red-700 text-xs font-light mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">

            {/* Event Selection */}
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              required
              disabled={uploading}
            >
              <option value="">Select event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>

           {/* File Input */}
            <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => setPhotos(Array.from(e.target.files))}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            required
            disabled={uploading}
            />
            <p className="text-xs text-slate-500 font-light">
              JPEG, PNG, WebP up to 10MB
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              className={`w-full text-sm font-semibold py-2.5 rounded-lg transition duration-200 ${
                uploading
                  ? "bg-slate-200 text-slate-600 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
                  Uploading...
                </div>
              ) : (
                "Upload Photos"
              )}
            </button>

          </form>

          {/* Info Section */}
          <div className="mt-6 pt-6 border-t border-slate-200/50">
            <div className="flex items-start gap-3 text-xs text-slate-600">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0zm3 0a1 1 0 11-2 0 1 1 0 012 0zm3 0a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
              </svg>
              <p className="font-light leading-relaxed">
                Upload your best work. Photos will be reviewed by admins before appearing in galleries.
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

export default TeamMemberDashboard;
