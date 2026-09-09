import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import TeamMemberDashboard from "./pages/TeamMemberDashboard";
import PublicGallery from "./pages/PublicGallery";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/team" element={<TeamMemberDashboard />} />
        <Route path="/gallery/:galleryToken" element={<PublicGallery />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;