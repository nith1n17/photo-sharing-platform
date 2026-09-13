import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

function PublicGallery() {
  const { galleryToken } = useParams();

  const [pin, setPin] = useState("");
  const [photos, setPhotos] = useState([]);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);

  useEffect(() => {
    // Animated background particles
    const canvas = document.getElementById("gallery-canvas");
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

  // Keyboard navigation for photo preview
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedPhotoIndex === null) return;

      if (e.key === "Escape") {
        setSelectedPhoto(null);
        setSelectedPhotoIndex(null);
      } else if (e.key === "ArrowRight") {
        const nextIndex = (selectedPhotoIndex + 1) % photos.length;
        setSelectedPhotoIndex(nextIndex);
        setSelectedPhoto(photos[nextIndex]);
      } else if (e.key === "ArrowLeft") {
        const prevIndex = selectedPhotoIndex === 0 ? photos.length - 1 : selectedPhotoIndex - 1;
        setSelectedPhotoIndex(prevIndex);
        setSelectedPhoto(photos[prevIndex]);
      }
    };

    if (selectedPhoto) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedPhotoIndex, selectedPhoto, photos]);

  const verifyPin = async () => {
    if (!pin) {
      setError("Enter PIN to continue.");
      return;
    }

    try {
      setError("");
      setVerifying(true);

      const verifyResponse = await api.post(
        `gallery/${galleryToken}/verify/`,
        { pin }
      );

      const accessToken = verifyResponse.data.access_token;

      const response = await api.get(
        `gallery/${galleryToken}/`,
        {
          headers: {
            "X-Gallery-Access-Token": accessToken,
          },
        }
      );

      setPhotos(response.data.photos);
      setVerified(true);

    } catch (error) {
      console.error("Gallery access error:", error);
      console.error("Response:", error.response?.data);

      setError(
        error.response?.data?.error ||
        "Unable to access gallery."
      );
    } finally {
      setVerifying(false);
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      verifyPin();
    }
  };

  if (!verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 overflow-hidden relative flex items-center justify-center">
        {/* Animated Background Canvas */}
        <canvas
          id="gallery-canvas"
          className="fixed inset-0 opacity-30 pointer-events-none"
        />

        {/* Gradient Orbs */}
        <div className="fixed top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob pointer-events-none" />
        <div className="fixed -bottom-40 -left-40 w-80 h-80 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none" />

        {/* PIN VERIFICATION */}
        <div className="relative z-10 px-6 py-12">
          <div className="w-full max-w-sm">
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-4xl font-black text-slate-900 mb-2">
                Gallery
              </h1>
              <p className="text-slate-500 font-light text-sm">
                Enter PIN to view photos
              </p>
            </div>

            {/* Divider */}
            <div className="flex justify-center mb-8">
              <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-slate-300 to-transparent rounded-full" />
            </div>

            {/* Form */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 p-6 space-y-4">

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-xs font-semibold text-red-900">Access Denied</p>
                    <p className="text-red-700 text-xs font-light mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* PIN Input */}
              <input
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-lg tracking-widest transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Submit Button */}
              <button
                onClick={verifyPin}
                disabled={verifying}
                className={`w-full font-semibold py-3 rounded-lg transition duration-200 ${
                  verifying
                    ? "bg-slate-200 text-slate-600 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                {verifying ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  "View Gallery"
                )}
              </button>
            </div>

            {/* Info */}
            <p className="text-center text-xs text-slate-500 font-light mt-6">
              This gallery is password protected.
            </p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 overflow-hidden relative">
      {/* Animated Background Canvas */}
      <canvas
        id="gallery-canvas"
        className="fixed inset-0 opacity-30 pointer-events-none"
      />

      {/* Gradient Orbs */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-80 h-80 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none" />

      {/* HEADER */}
      <div className="relative z-10 bg-gradient-to-r from-slate-900 to-slate-800 shadow-sm border-b border-slate-700/30 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-3xl font-black text-white">Gallery</h1>
          <p className="text-slate-400 mt-0.5 text-sm font-light">
            {photos.length} {photos.length === 1 ? "photo" : "photos"}
          </p>
        </div>
      </div>

      {/* GALLERY CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">

        {photos.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-12 text-center">
            <p className="text-slate-500 text-sm font-light">No photos in this gallery yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => {
                    setSelectedPhoto(photo);
                    setSelectedPhotoIndex(index);
                  }}
                  className="group bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition border border-slate-200/50 overflow-hidden"
                >
                  <div className="relative bg-slate-100 h-48 overflow-hidden">
                    <img
                      src={photo.image_url}
                      alt={photo.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-slate-900 text-xs truncate">
                      {photo.filename}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* FULLSCREEN PHOTO VIEWER */}
      {selectedPhoto && selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => {
            setSelectedPhoto(null);
            setSelectedPhotoIndex(null);
          }}
        >
          <div
            className="relative max-w-4xl max-h-full w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.image_url}
              alt={selectedPhoto.filename}
              className="max-w-full max-h-full rounded-2xl shadow-2xl"
            />

            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedPhoto(null);
                setSelectedPhotoIndex(null);
              }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition flex items-center justify-center border border-white/20"
              title="Close (Esc)"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Previous Button */}
            {photos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const prevIndex = selectedPhotoIndex === 0 ? photos.length - 1 : selectedPhotoIndex - 1;
                  setSelectedPhotoIndex(prevIndex);
                  setSelectedPhoto(photos[prevIndex]);
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition flex items-center justify-center border border-white/20"
                title="Previous (← Arrow)"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}

            {/* Next Button */}
            {photos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextIndex = (selectedPhotoIndex + 1) % photos.length;
                  setSelectedPhotoIndex(nextIndex);
                  setSelectedPhoto(photos[nextIndex]);
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition flex items-center justify-center border border-white/20"
                title="Next (→ Arrow)"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}

            {/* Photo Info */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 text-white border border-white/20">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate flex-1">{selectedPhoto.filename}</p>
                {photos.length > 1 && (
                  <p className="text-xs font-light text-white/70 ml-4">
                    {selectedPhotoIndex + 1} / {photos.length}
                  </p>
                )}
              </div>
            </div>

            {/* Keyboard Hint */}
            {photos.length > 1 && (
              <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-white border border-white/20">
                <p className="text-xs font-light">
                  Use <span className="font-semibold">← →</span> to navigate • <span className="font-semibold">Esc</span> to close
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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

export default PublicGallery;
