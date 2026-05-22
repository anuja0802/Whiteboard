# 🎨 CollabBoard — Real-Time Collaborative Whiteboard

> A multiplayer infinite whiteboard platform where teams can draw, brainstorm, and collaborate in real-time — built with React, Node.js, Socket.IO, and HTML5 Canvas.

---

## ✨ Features

- 🖊️ **Freehand Drawing** — Smooth brush strokes with customizable colors and sizes
- 🔄 **Real-Time Sync** — See other users draw live with sub-100ms latency
- 🖱️ **Live Cursors** — See where every collaborator is pointing in real-time
- 👥 **User Presence** — Live panel showing who's currently in the room
- 🔭 **Infinite Canvas** — Zoom and pan freely across an endless workspace
- 🧹 **Eraser Tool** — Clean up mistakes without affecting others' work
- 🔗 **Shareable Rooms** — Create a room and share the link instantly
- 📱 **Touch Support** — Works on tablets and mobile devices
- 🌐 **Cross-Device** — Join from any browser on the same network

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| HTML5 Canvas API | Drawing surface |
| Socket.IO Client | Real-time communication |
| Zustand | Global state management |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| React Router | Client-side routing |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express | HTTP server and REST API |
| Socket.IO | WebSocket server |
| MongoDB + Mongoose | Database persistence |

---

## 🏗️ Architecture
┌─────────────────────────────────────────────────────┐
│                    Browser Clients                   │
│                                                      │
│   ┌──────────────┐          ┌──────────────┐        │
│   │  Browser A   │◄────────►│  Browser B   │        │
│   │ React+Canvas │  WebRTC  │ React+Canvas │        │
│   └──────┬───────┘  (voice) └───────┬──────┘        │
└──────────┼──────────────────────────┼───────────────┘
│ Socket.IO                │ Socket.IO
▼                          ▼
┌─────────────────────────────────────────────────────┐
│                  Node.js Backend                     │
│                                                      │
│   ┌──────────┐  ┌───────────┐  ┌────────────────┐  │
│   │ Express  │  │ Socket.IO │  │ Room Manager   │  │
│   │   API    │  │  Server   │  │ Draw / Cursor  │  │
│   └──────────┘  └───────────┘  └────────────────┘  │
└─────────────────────────┬───────────────────────────┘
│
▼
┌───────────────────────┐
│       MongoDB         │
│  Boards · Strokes     │
│  Rooms  · Users       │
└───────────────────────┘
### Real-Time Drawing Flow
Alice draws → direct canvas draw (instant local feedback)
→ throttled socket.emit (16ms / 60fps max)
→ server relays to room
→ Bob receives segment
→ direct canvas draw (no React re-render)
→ Bob sees Alice stroke in ~50ms

---

## 📁 Project Structure
whiteboard/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas/
│   │   │   │   ├── Canvas.jsx       # Main canvas component
│   │   │   │   ├── Toolbar.jsx      # Drawing tools UI
│   │   │   │   └── Cursors.jsx      # Remote user cursors
│   │   │   ├── Room/
│   │   │   │   ├── RoomLobby.jsx    # Create / join room
│   │   │   │   └── UsersPanel.jsx   # Online users list
│   │   ├── hooks/
│   │   │   ├── useCanvas.js         # All drawing logic
│   │   │   ├── useSocket.js         # Socket.IO connection
│   │   │   ├── useCursor.js         # Cursor tracking
│   │   │   ├── usePanZoom.js        # Zoom and pan
│   │   │   └── useWebRTC.js         # Voice rooms (Phase 8)
│   │   ├── store/
│   │   │   ├── canvasStore.js       # Drawing state (Zustand)
│   │   │   └── roomStore.js         # Room and users state
│   │   ├── socket/
│   │   │   └── socket.js            # Socket.IO singleton
│   │   └── utils/
│   │       └── colorUtils.js        # Color helpers
│   └── package.json
│
├── server/                          # Node.js backend
│   ├── src/
│   │   ├── socket/
│   │   │   ├── index.js             # Socket.IO init
│   │   │   ├── drawingHandlers.js   # Draw event relay
│   │   │   ├── roomHandlers.js      # Room join / leave
│   │   │   ├── cursorHandlers.js    # Cursor position relay
│   │   │   └── rtcHandlers.js       # WebRTC signaling
│   │   ├── routes/
│   │   │   └── boards.js            # Board REST API
│   │   ├── models/
│   │   │   ├── Board.js             # MongoDB schema
│   │   │   └── Room.js
│   │   └── app.js                   # Express setup
│   ├── server.js                    # Entry point
│   └── package.json
│
└── README.md

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- npm v8 or higher
- MongoDB (local or Atlas)
- Git

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/anuja0802/whiteboard.git
cd whiteboard
```

**2. Setup the backend**
```bash
cd server
npm install
```

Create a `.env` file inside the `server` folder:
```env
PORT=3001
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/whiteboard
```

**3. Setup the frontend**
```bash
cd ../client
npm install
```

Create a `.env` file inside the `client` folder:
```env
VITE_SOCKET_URL=http://localhost:3001
```

### Running the App

Open two terminals:

**Terminal 1 — Backend**
```bash
cd server
npm run dev
```
You should see:
🚀 Server running on http://localhost:3001

**Terminal 2 — Frontend**
```bash
cd client
npm run dev
```
You should see:
VITE ready on http://localhost:5173

Open `http://localhost:5173` in your browser.

---

## 🎮 How to Use

### Create a Room
1. Open the app and enter your name
2. Click **Create New Room**
3. You will be taken to your whiteboard

### Invite Others
1. Click **Copy Link** at the bottom of the board
2. Share the link with your collaborators
3. They enter their name and join the same board instantly

### Drawing Tools

| Tool | Description |
|---|---|
| ✏️ Pen | Click and drag to draw freehand |
| 🧹 Eraser | Drag over strokes to erase |
| 🎨 Color picker | Click any color in the toolbar |
| 🔵 Brush size | Click a size dot to change thickness |
| 🗑️ Clear | Wipes the entire canvas for everyone |

### Canvas Navigation

| Action | How to do it |
|---|---|
| Pan | Scroll wheel or middle-mouse drag |
| Zoom in / out | Ctrl + Scroll |
| Zoom toward cursor | Scroll while hovering a point |
| Reset view | Ctrl + 0 |
| Zoom in keyboard | Ctrl + = |
| Zoom out keyboard | Ctrl + - |

---

## 🔌 Socket.IO Event Reference

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join-room` | `{ roomId, username }` | Join a whiteboard room |
| `draw-stroke` | `{ type, x, y, color, brushSize, tool }` | Send a drawing segment |
| `cursor-move` | `{ x, y }` | Broadcast cursor position |
| `clear-canvas` | — | Clear canvas for all users |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `room-users` | `[{ userId, username }]` | Existing users on join |
| `user-joined` | `{ userId, username }` | Someone joined the room |
| `user-left` | `{ userId, username }` | Someone left the room |
| `stroke-received` | `{ type, x, y, color, ... }` | Incoming drawing segment |
| `cursor-updated` | `{ userId, username, x, y }` | Remote cursor moved |
| `cursor-removed` | `{ userId }` | Remote cursor left |
| `canvas-cleared` | — | Canvas was cleared by someone |

---

## ⚡ Performance Decisions

**Hybrid rendering strategy**
Active strokes are drawn directly to the Canvas API, bypassing React state entirely. Full redraws only happen on zoom/pan changes or when a stroke is committed on mouseup. This eliminates lag during drawing even with multiple users online.

**Throttled socket events**
Cursor positions are throttled to 30fps. Drawing segments are throttled to 60fps. Without this, a single user moving the mouse quickly could send 200+ socket events per second.

**World coordinate system**
All strokes and cursors are stored in world coordinates rather than screen coordinates. Zoom and pan are applied once via `ctx.setTransform()` before drawing. This means no recalculation of positions when the viewport changes.

**Separate cursor layer**
Remote cursors live in a `div` overlay above the canvas. CSS `transform: translate()` moves them using GPU compositing, which never triggers canvas redraws or layout reflows.

**Socket.IO rooms**
Each whiteboard session is a Socket.IO room. Events are only broadcast to users in the same room, not to every connected user on the server.

---

## 🗺️ Roadmap

- [x] Phase 1 — Project setup, Socket.IO, room system
- [x] Phase 2 — Canvas MVP, freehand drawing, toolbar
- [x] Phase 3 — Real-time drawing sync
- [x] Phase 4 — Infinite canvas with zoom and pan
- [x] Phase 5 — Live cursors and users panel
- [ ] Phase 6 — Sticky notes, shapes, arrows
- [ ] Phase 7 — MongoDB persistence and autosave
- [ ] Phase 8 — WebRTC voice rooms
- [ ] Phase 9 — Undo/redo, CRDT basics
- [ ] Phase 10 — Cyberpunk theme, animations, polish

---

## 🧠 Concepts Covered

This project was built to learn and demonstrate the following engineering concepts:

- WebSocket architecture and the HTTP upgrade handshake
- Socket.IO rooms as pub/sub channels
- HTML5 Canvas API and imperative vs declarative rendering
- Coordinate space transformations (world vs screen)
- Zoom toward cursor math using affine transforms
- Throttling and requestAnimationFrame for performance
- Zustand for minimal global state without Redux
- Custom React hooks for separation of concerns
- Stale closure problem and why refs solve it
- CSS transform for GPU-accelerated cursor animations
- Singleton pattern for socket connection management
- P2P WebRTC with Socket.IO signaling

---

## 🤝 Contributing

Pull requests are welcome. For major changes please open an issue first.

1. Fork the repo
2. Create your branch `git checkout -b feature/your-feature`
3. Commit your changes `git commit -m "feat: add your feature"`
4. Push to the branch `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — feel free to use this project for learning or your own portfolio.

---

## 👩‍💻 Author

**Anuja** — [@anuja0802](https://github.com/anuja0802)

> Built as a full-stack SDE portfolio project following a structured phase-by-phase development approach.
