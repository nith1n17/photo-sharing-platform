import { useEffect, useState } from "react";
import {
  getRefreshToken,
  clearTokens
} from "../utils/auth";
import { Navigate } from "react-router-dom";
import api from "../services/api";
import { isAuthenticated } from "../utils/auth";

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");

  const [memberUsername, setMemberUsername] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPassword, setMemberPassword] = useState("");

  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedMember, setSelectedMember] = useState("");

  const [loading, setLoading] = useState(true);

  const [photos, setPhotos] = useState([]);
  const [selectedPhotoEvent, setSelectedPhotoEvent] = useState("");

  const [galleryPin, setGalleryPin] = useState("");
  const [galleryMessage, setGalleryMessage] = useState("");
  const [gallery, setGallery] = useState(null);
  const [copied, setCopied] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  useEffect(() => {
    // Animated background particles
    const canvas = document.getElementById("admin-canvas");
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
    const loadDashboard = async () => {
      try {
        const userResponse = await api.get("me/");
        setUser(userResponse.data);

        const eventsResponse = await api.get("events/");
        setEvents(eventsResponse.data);

        const membersResponse = await api.get("team-members/");
        setTeamMembers(membersResponse.data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const loadPhotos = async (eventId) => {
    if (!eventId) {
      setPhotos([]);
      return;
    }

    try {
      const response = await api.get(`events/${eventId}/photos/`);
      setPhotos(response.data);
    } catch (error) {
      console.error("Failed to load photos", error);
      setPhotos([]);
    }
  };

  const loadGallery = async (eventId) => {
    if (!eventId) {
      setGallery(null);
      return;
    }

    try {
      const response = await api.get(`events/${eventId}/gallery/`);
      setGallery(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setGallery(null);
      } else {
        console.error("Failed to load gallery", error);
      }
    }
  };

  const selectedCount = photos.filter((photo) => photo.is_selected).length;

  const selectAllPhotos = async () => {
    try {
      const updatedPhotos = await Promise.all(
        photos
          .filter((photo) => !photo.is_selected)
          .map((photo) =>
            api.patch(`photos/${photo.id}/select/`, {
              is_selected: true,
            })
          )
      );

      const updatedMap = new Map(
        updatedPhotos.map((response) => [response.data.id, response.data])
      );

      setPhotos((currentPhotos) =>
        currentPhotos.map((photo) => updatedMap.get(photo.id) || photo)
      );
    } catch (error) {
      console.error("Failed to select all photos", error);
    }
  };

  const deselectAllPhotos = async () => {
    try {
      const updatedPhotos = await Promise.all(
        photos
          .filter((photo) => photo.is_selected)
          .map((photo) =>
            api.patch(`photos/${photo.id}/select/`, {
              is_selected: false,
            })
          )
      );

      const updatedMap = new Map(
        updatedPhotos.map((response) => [response.data.id, response.data])
      );

      setPhotos((currentPhotos) =>
        currentPhotos.map((photo) => updatedMap.get(photo.id) || photo)
      );
    } catch (error) {
      console.error("Failed to deselect all photos", error);
    }
  };

  useEffect(() => {
    if (!previewPhoto) return;

    const handleKeyDown = (e) => {
      const currentIndex = photos.findIndex(
        (photo) => photo.id === previewPhoto.id
      );

      if (e.key === "Escape") {
        setPreviewPhoto(null);
      }

      if (e.key === "ArrowLeft") {
        const previousIndex =
          currentIndex === 0
            ? photos.length - 1
            : currentIndex - 1;

        setPreviewPhoto(photos[previousIndex]);
      }

      if (e.key === "ArrowRight") {
        const nextIndex =
          currentIndex === photos.length - 1
            ? 0
            : currentIndex + 1;

        setPreviewPhoto(photos[nextIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewPhoto, photos]);

  const createEvent = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("events/", {
        name: eventName,
        description: description,
      });

      setEvents([response.data, ...events]);
      setEventName("");
      setDescription("");
    } catch (error) {
      alert("Failed to create event");
    }
  };

  const createTeamMember = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("team-members/", {
        username: memberUsername,
        email: memberEmail,
        password: memberPassword,
      });

      setTeamMembers([...teamMembers, response.data]);
      alert("Team member created successfully");

      setMemberUsername("");
      setMemberEmail("");
      setMemberPassword("");
    } catch (error) {
      alert("Failed to create team member");
    }
  };

  const assignMember = async (e) => {
    e.preventDefault();

    try {
      await api.post("event-members/", {
        event: selectedEvent,
        user: selectedMember,
      });

      alert("Team member assigned successfully");

      setSelectedEvent("");
      setSelectedMember("");
    } catch (error) {
      alert("Failed to assign team member");
    }
  };

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

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

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 overflow-hidden relative">
      {/* Animated Background Canvas */}
      <canvas
        id="admin-canvas"
        className="fixed inset-0 opacity-30 pointer-events-none"
      />

      {/* Gradient Orbs */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-80 h-80 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none" />

      {/* HEADER */}
      <div className="relative z-10 bg-gradient-to-r from-slate-900 to-slate-800 shadow-sm border-b border-slate-700/30 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
            <p className="text-slate-400 mt-0.5 text-sm font-light">
              <span className="text-slate-300">{user.username}</span>
            </p>
          </div>

          <button
            onClick={async () => {
              try {
                const refresh = getRefreshToken();
                if (refresh) {
                  await api.post("logout/", { refresh });
                }
              } catch (error) {
                console.error("Logout error:", error);
              } finally {
                clearTokens();
                window.location.href = "/login";
              }
            }}
            className="text-slate-400 hover:text-slate-300 px-4 py-2 text-sm font-medium transition duration-200 border border-slate-600/30 rounded-lg hover:border-slate-600/50"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">

        {/* FORM SECTION - 3 COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">

          {/* CREATE EVENT */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition border border-slate-200/50 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-5">Create Event</h2>

            <form onSubmit={createEvent} className="space-y-3">
              <input
                type="text"
                placeholder="Event name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="2"
              />

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded-lg transition duration-200"
              >
                Create
              </button>
            </form>
          </div>

          {/* CREATE TEAM MEMBER */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition border border-slate-200/50 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-5">Add Team Member</h2>

            <form onSubmit={createTeamMember} className="space-y-3">
              <input
                type="text"
                placeholder="Username"
                value={memberUsername}
                onChange={(e) => setMemberUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={memberPassword}
                onChange={(e) => setMemberPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded-lg transition duration-200"
              >
                Add
              </button>
            </form>
          </div>

          {/* ASSIGN MEMBER */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition border border-slate-200/50 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-5">Assign Member</h2>

            <form onSubmit={assignMember} className="space-y-3">
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                required
              >
                <option value="">Event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                required
              >
                <option value="">Member</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.username}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded-lg transition duration-200"
              >
                Assign
              </button>
            </form>
          </div>

        </div>

        {/* EVENTS SECTION */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-5">Events</h2>

          {events.length === 0 ? (
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8 text-center">
              <p className="text-slate-500 text-sm font-light">No events created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 hover:shadow-sm transition p-5"
                >
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">{event.name}</h3>
                  <p className="text-slate-600 text-xs font-light line-clamp-2">
                    {event.description || "No description"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PHOTOS SECTION */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Photos</h2>

              {selectedPhotoEvent && photos.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {selectedCount} / {photos.length} photos selected
                </p>
              )}
            </div>

            {selectedPhotoEvent && photos.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={selectAllPhotos}
                  disabled={selectedCount === photos.length}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed transition"
                >
                  Select All
                </button>

                <button
                  onClick={deselectAllPhotos}
                  disabled={selectedCount === 0}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition"
                >
                  Deselect All
                </button>
              </div>
            )}
          </div>

          <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-5 mb-5">
            <select
              value={selectedPhotoEvent}
              onChange={(e) => {
                const eventId = e.target.value;
                setSelectedPhotoEvent(eventId);
                loadPhotos(eventId);
                loadGallery(eventId);
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              <option value="">Select event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          {photos.length === 0 && selectedPhotoEvent && (
            <div className="bg-white/30 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-slate-500 text-sm font-light">No photos for this event</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="bg-white/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-200/50 hover:shadow-sm transition group"
              >
                <div
                  className="relative bg-slate-100 h-28 overflow-hidden cursor-pointer"
                  onClick={() => setPreviewPhoto(photo)}>
                  <img
                    src={photo.image_url}
                    alt={photo.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div
                    className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded text-xs font-medium text-white ${
                      photo.is_selected ? "bg-slate-900" : "bg-slate-400"
                    }`}
                  >
                    {photo.is_selected ? "Selected" : "Not Selected"}
                  </div>
                </div>

                <div className="p-2.5">
                  <p className="font-medium text-slate-900 text-xs truncate mb-0.5">
                    {photo.filename}
                  </p>
                  <p className="text-xs text-slate-600 mb-2 font-light">
                    {photo.uploaded_by.username}
                  </p>

                  <button
                    onClick={async () => {
                      try {
                        const response = await api.patch(
                          `photos/${photo.id}/select/`,
                          {
                            is_selected: !photo.is_selected,
                          }
                        );

                        setPhotos((currentPhotos) =>
                          currentPhotos.map((item) =>
                            item.id === photo.id ? response.data : item
                          )
                        );
                      } catch (error) {
                        console.error("Failed to update photo selection", error);
                      }
                    }}
                    className={`w-full text-xs font-medium py-1.5 rounded transition ${
                      photo.is_selected
                        ? "bg-slate-200 hover:bg-slate-300 text-slate-900"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {photo.is_selected ? "Deselect" : "Select"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GALLERY SECTION */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Gallery</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <input
              type="text"
              placeholder="PIN (4-6 digits)"
              value={galleryPin}
              onChange={(e) => setGalleryPin(e.target.value)}
              maxLength={6}
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm tracking-widest"
            />

            <button
              onClick={async () => {
                if (!selectedPhotoEvent) {
                  setGalleryMessage("Select an event.");
                  return;
                }

                try {
                  const response = await api.post(
                    `events/${selectedPhotoEvent}/gallery/`,
                    {
                      pin: galleryPin,
                    }
                  );

                  setGallery(response.data);
                  setGalleryMessage("Gallery created.");
                } catch (error) {
                  setGalleryMessage(
                    error.response?.data?.error || "Failed to create gallery."
                  );
                }
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded-lg transition duration-200"
            >
              Create
            </button>
          </div>

          {galleryMessage && (
            <div
              className={`mb-5 p-3 rounded-lg text-xs font-medium ${
                galleryMessage.includes("created") || galleryMessage.includes("successfully")
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {galleryMessage}
            </div>
          )}

          {gallery && (
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl p-6 border border-blue-200/30">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-600 font-semibold mb-1">Token</p>
                  <p className="font-mono text-xs bg-white p-2.5 rounded border border-slate-200">
                    {gallery.gallery_token}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-600 font-semibold mb-1">PIN</p>
                  <p className="font-mono text-xs bg-white p-2.5 rounded border border-slate-200 tracking-widest">
                    {galleryPin}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <span
                  className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${
                    gallery.published
                      ? "text-slate-700 bg-slate-200"
                      : "text-slate-600 bg-slate-100"
                  }`}
                >
                  {gallery.published ? "Published" : "Draft"}
                </span>
              </div>

              <button
                onClick={async () => {
                  try {
                    const response = await api.post(
                      `galleries/${gallery.id}/publish/`
                    );

                    setGallery(response.data);
                    setGalleryMessage("Gallery published.");
                  } catch (error) {
                    setGalleryMessage(
                      error.response?.data?.detail || "Failed to publish."
                    );
                  }
                }}
                disabled={gallery.published}
                className={`w-full text-sm font-semibold py-2.5 rounded-lg transition duration-200 mb-4 ${
                  gallery.published
                    ? "bg-slate-200 text-slate-600 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                {gallery.published ? "Published" : "Publish"}
              </button>

              {gallery.published && (
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-900 mb-2">Link</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/gallery/${gallery.gallery_token}`}
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-800 font-mono text-xs focus:outline-none"
                    />

                    <button
                      onClick={async () => {
                        const link = `${window.location.origin}/gallery/${gallery.gallery_token}`;

                        try {
                          await navigator.clipboard.writeText(link);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch (error) {
                          console.error("Copy failed:", error);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition duration-200 ${
                        copied
                          ? "bg-slate-900 text-white"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      }`}
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
      
      {/* PHOTO PREVIEW */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setPreviewPhoto(null)}
        >
          {/* CLOSE */}
          <button
            onClick={() => setPreviewPhoto(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl transition z-10"
          >
            ×
          </button>

          {/* PREVIOUS */}
          <button
            onClick={(e) => {
              e.stopPropagation();

              const currentIndex = photos.findIndex(
                (photo) => photo.id === previewPhoto.id
              );

              const previousIndex =
                currentIndex === 0
                  ? photos.length - 1
                  : currentIndex - 1;

              setPreviewPhoto(photos[previousIndex]);
            }}
            className="absolute left-5 md:left-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white text-3xl transition z-10"
          >
            ‹
          </button>

          {/* IMAGE */}
          <div
            className="max-w-5xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewPhoto.image_url}
              alt={previewPhoto.filename}
              className="max-h-[78vh] max-w-full object-contain rounded-xl shadow-2xl"
            />

            <p className="text-white text-sm font-medium mt-4">
              {previewPhoto.filename}
            </p>

            <p className="text-slate-400 text-xs mt-1">
              {photos.findIndex(
                (photo) => photo.id === previewPhoto.id
              ) + 1}{" "}
              / {photos.length}
            </p>
          </div>

          {/* NEXT */}
          <button
            onClick={(e) => {
              e.stopPropagation();

              const currentIndex = photos.findIndex(
                (photo) => photo.id === previewPhoto.id
              );

              const nextIndex =
                currentIndex === photos.length - 1
                  ? 0
                  : currentIndex + 1;

              setPreviewPhoto(photos[nextIndex]);
            }}
            className="absolute right-5 md:right-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white text-3xl transition z-10"
          >
            ›
          </button>
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

export default AdminDashboard;
