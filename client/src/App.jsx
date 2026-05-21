// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RoomLobby from './components/Room/RoomLobby';
import Canvas from './components/Canvas/Canvas';

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