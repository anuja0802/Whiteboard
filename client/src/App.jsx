// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RoomLobby from './components/Room/RoomLobby';
import Canvas from './components/Canvas/Canvas';
import { useEffect } from 'react';

// Inside App component — ping server every 10 minutes to prevent sleep
useEffect(() => {
  const ping = () => {
    fetch(`${import.meta.env.VITE_SOCKET_URL}/health`)
      .catch(() => {}); // silent fail
  };

  ping(); // ping on load
  const interval = setInterval(ping, 10 * 60 * 1000); // every 10 min
  return () => clearInterval(interval);
}, []);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoomLobby />} />
        {/* Canvas is now the board page */}
        <Route path="/board/:roomId" element={<Canvas />} />
      </Routes>
    </BrowserRouter>
  );
}