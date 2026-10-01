import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import Chat from "./pages/Chat";
import ChatLayout, { NoChatSelected } from "./pages/ChatLayout";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Requests from "./pages/Requests";
import Search from "./pages/Search";
import Settings from "./pages/Settings";
import Signup from "./pages/Signup";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route element={<ProtectedRoute guestOnly />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route element={<ChatLayout />}>
                <Route path="/" element={<NoChatSelected />} />
                <Route path="/chat/:username" element={<Chat />} />
              </Route>
              <Route path="/search" element={<Search />} />
              <Route path="/users/:username" element={<Profile />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
