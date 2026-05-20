// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RoomLobby from './components/Room/RoomLobby';

// BoardPage is a placeholder — we build it in Phase 2
function BoardPage() {
  return (
    <div className="w-screen h-screen bg-gray-950 flex items-center justify-center text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Board loaded ✅</h2>
        <p className="text-gray-400">Canvas coming in Phase 2</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoomLobby />} />
        <Route path="/board/:roomId" element={<BoardPage />} />
      </Routes>
    </BrowserRouter>
  );
}