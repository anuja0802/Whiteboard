# 🎨 CollabBoard — Real-Time Collaborative Whiteboard

> A full-stack multiplayer whiteboard platform where teams can draw, brainstorm, and collaborate in real-time. Built with React, Node.js, Socket.IO, and MongoDB Atlas.

🔗 **[Live Demo](https://whiteboard-collaboard.vercel.app/)** · 📁 **[GitHub](https://github.com/anuja0802/whiteboard)**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🖊️ Freehand Drawing | Smooth brush strokes with custom colors and sizes |
| 🔄 Real-Time Sync | Sub-100ms drawing sync across all users in a room |
| 🖱️ Live Cursors | See every collaborator's cursor position in real-time |
| 👥 User Presence | Live panel showing who's currently in the room |
| 🔭 Infinite Canvas | Zoom (0.05x–20x) and pan freely across an endless workspace |
| 📝 Sticky Notes | Draggable, editable, color-coded sticky notes |
| ⬜ Shapes | Rectangles and circles with resize handles and labels |
| ↗️ Arrows | Connectable arrows with draggable endpoints |
| ↩️ Undo / Redo | 50-step command-pattern history synced across sessions |
| 💾 Persistence | Board state saved to MongoDB and restored on rejoin |
| 🔗 Shareable Rooms | Create a room and share the link instantly |
| 🧹 Eraser Tool | Erase strokes without affecting others' work |
| 📱 Touch Support | Works on tablets and mobile devices |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework with hooks |
| Vite | Build tool and dev server |
| HTML5 Canvas API | Drawing surface and render loop |
| Socket.IO Client | Real-time WebSocket communication |
| Zustand | Lightweight global state management |
| Tailwind CSS | Utility-first styling |
| Framer Motion | Smooth UI animations |
| React Router DOM | Client-side routing |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express | HTTP server and REST API |
| Socket.IO | WebSocket server with room support |
| MongoDB Atlas | Cloud NoSQL database |
| Mongoose | ODM with schema validation |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser Clients                     │
│                                                          │
│   ┌───────────────┐            ┌───────────────┐        │
│   │   Browser A   │            │   Browser B   │        │
│   │ React + Canvas│            │ React + Canvas│        │
│   └──────┬────────┘            └───────┬───────┘        │
└──────────┼─────────────────────────────┼────────────────┘
           │  Socket.IO (WebSocket)       │
           ▼                             ▼
┌─────────────────────────────────────────────────────────┐
│                   Node.js / Express                      │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ Express API│  │ Socket.IO  │  │   Room Manager   │  │
│  │ REST routes│  │   Server   │  │ Draw/Cursor/Objs │  │
│  └────────────┘  └────────────┘  └──────────────────┘  │
└─────────────────────────────┬───────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────┐
              │       MongoDB Atlas        │
              │  Boards · Strokes · Objects│
              └───────────────────────────┘
```

### Real-Time Drawing Flow

```
User draws stroke
  → Direct Canvas API draw (instant local feedback, no React state)
  → Throttled socket.emit 'draw-stroke' (16ms / 60fps max)
  → Server relays to all users in room
  → Remote users receive segment
  → Direct Canvas API draw on their canvas
  → On mouseup: full stroke saved to MongoDB (debounced 2s)
  → Board state restored to all new joiners via 'board-state' event
```

### Coordinate System

```
World Space (stored in DB + Zustand):
  All strokes and objects use world coordinates
  Zoom = 1.0 always, positions are absolute

Screen Space (rendered via ctx.setTransform):
  screenX = worldX × zoom + panX
  worldX  = (screenX − panX) / zoom

This ensures zoom/pan never corrupts stored data
```

---

## 📁 Project Structure

```
whiteboard/
├── client/                           # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas/
│   │   │   │   ├── Canvas.jsx        # Main board component
│   │   │   │   ├── Toolbar.jsx       # Tool selection UI
│   │   │   │   └── Cursors.jsx       # Remote cursor layer
│   │   │   ├── Room/
│   │   │   │   ├── RoomLobby.jsx     # Create / join room
│   │   │   │   └── UsersPanel.jsx    # Online users list
│   │   │   ├── Tools/
│   │   │   │   ├── ObjectsLayer.jsx  # Renders all objects
│   │   │   │   ├── StickyNote.jsx    # Sticky note component
│   │   │   │   ├── Shape.jsx         # Rect / circle component
│   │   │   │   └── Arrow.jsx         # Arrow component
│   │   │   └── UI/
│   │   │       └── LoadingScreen.jsx # Animated loader
│   │   ├── hooks/
│   │   │   ├── useCanvas.js          # Drawing logic + socket sync
│   │   │   ├── useSocket.js          # Socket.IO connection
│   │   │   ├── useCursor.js          # Cursor tracking
│   │   │   ├── usePanZoom.js         # Zoom and pan handlers
│   │   │   ├── useObjects.js         # Object CRUD + sync
│   │   │   └── useHistory.js         # Undo / redo system
│   │   ├── store/
│   │   │   ├── canvasStore.js        # Drawing state (Zustand)
│   │   │   ├── roomStore.js          # Room and users state
│   │   │   ├── objectsStore.js       # Objects state
│   │   │   └── historyStore.js       # Undo/redo history stack
│   │   ├── socket/
│   │   │   └── socket.js             # Socket.IO singleton
│   │   └── utils/
│   │       └── colorUtils.js         # Deterministic color hash
│   ├── .env
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                           # Node.js backend
│   ├── src/
│   │   ├── socket/
│   │   │   ├── index.js              # Socket.IO initialization
│   │   │   ├── roomHandlers.js       # Join / leave / board load
│   │   │   ├── drawingHandlers.js    # Stroke relay + DB save
│   │   │   ├── cursorHandlers.js     # Cursor position relay
│   │   │   ├── objectHandlers.js     # Object CRUD relay + DB
│   │   │   └── historyHandlers.js    # Undo/redo relay + DB sync
│   │   ├── routes/
│   │   │   └── boards.js             # REST API for boards
│   │   ├── models/
│   │   │   └── Board.js              # Mongoose schema
│   │   ├── db/
│   │   │   └── connect.js            # MongoDB connection
│   │   └── app.js                    # Express setup + CORS
│   ├── server.js                     # Entry point
│   └── .env
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- npm v8 or higher
- MongoDB Atlas account (free tier works)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/anuja0802/whiteboard.git
cd whiteboard
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=3001
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/whiteboard?retryWrites=true&w=majority
```

### 3. Frontend Setup

```bash
cd ../client
npm install
```

Create `client/.env`:

```env
VITE_SOCKET_URL=http://localhost:3001
```

### 4. Run the App

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# ✅ MongoDB connected
# 🚀 Server running on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# VITE ready on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 🎮 How to Use

### Create a Room
1. Open the app and enter your name
2. Click **+ Create New Room**
3. You will be taken to your whiteboard

### Invite Collaborators
1. Click **Copy Link** at the bottom of the board
2. Share the link — collaborators enter their name and join instantly
3. No account required

### Drawing Tools

| Tool | How to use |
|---|---|
| ✏️ Pen | Click and drag to draw freehand strokes |
| 🧹 Eraser | Drag over strokes to erase |
| 📝 Sticky Note | Click canvas to place, double-click to type |
| ⬜ Rectangle | Click canvas to place, drag handles to resize |
| ⭕ Circle | Click canvas to place, drag handles to resize |
| ↗️ Arrow | Click canvas to place, drag endpoints to reshape |
| 🖱️ Select | Click any object to select and drag to move |
| 🎨 Color picker | Click any color dot or the palette icon |
| 🗑️ Clear | Wipes entire canvas and all objects for everyone |

### Canvas Navigation

| Action | How |
|---|---|
| Pan | Scroll wheel or middle-mouse drag |
| Zoom in / out | Ctrl + Scroll |
| Zoom toward cursor | Scroll while hovering a point |
| Reset view | Ctrl + 0 |
| Zoom in | Ctrl + = |
| Zoom out | Ctrl + − |
| Undo | Ctrl + Z |
| Redo | Ctrl + Y or Ctrl + Shift + Z |

---

## 🔌 Socket.IO Event Reference

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join-room` | `{ roomId, username }` | Join a whiteboard room |
| `draw-stroke` | `{ type, x, y, color, brushSize, tool, userId }` | Drawing segment |
| `cursor-move` | `{ x, y }` | Cursor position update |
| `clear-canvas` | — | Clear all strokes |
| `object-add` | `{ id, type, x, y, ... }` | Add a new object |
| `object-update` | `{ id, updates }` | Move / resize / edit object |
| `object-remove` | `{ id }` | Delete an object |
| `clear-objects` | — | Clear all objects |
| `history-undo` | `{ command }` | Undo broadcast to room |
| `history-redo` | `{ command }` | Redo broadcast to room |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `board-state` | `{ strokes, objects }` | Full board on join |
| `room-users` | `[{ userId, username }]` | Existing users on join |
| `user-joined` | `{ userId, username }` | Someone joined |
| `user-left` | `{ userId }` | Someone disconnected |
| `stroke-received` | `{ type, x, y, ... }` | Remote drawing segment |
| `cursor-updated` | `{ userId, username, x, y }` | Remote cursor moved |
| `cursor-removed` | `{ userId }` | Remote cursor gone |
| `canvas-cleared` | — | Canvas cleared by someone |
| `object-added` | `{ ...object }` | Remote object added |
| `object-updated` | `{ id, updates }` | Remote object changed |
| `object-removed` | `{ id }` | Remote object deleted |
| `objects-cleared` | — | All objects cleared |
| `history-undo` | `{ command }` | Remote undo action |
| `history-redo` | `{ command }` | Remote redo action |

---

## ⚡ Performance Architecture

### Hybrid Rendering Strategy
Active strokes are drawn directly to the Canvas API, completely bypassing React's state system. Full canvas redraws only happen when zoom, pan, or committed strokes change — never during active drawing. This keeps the drawing experience lag-free even with multiple users drawing simultaneously.

### Throttling Strategy
```
Drawing segments  → throttled at 16ms (60fps max)
Cursor positions  → throttled at 50ms (20fps)
DB writes         → debounced at 2s (flush after inactivity)
Object updates    → debounced at 100ms per object
```

### World Coordinate System
All strokes, objects, and cursors are stored in world coordinates. Zoom and pan are applied once via `ctx.setTransform()` before rendering everything. This means no position recalculation when the viewport changes — just one matrix multiplication.

### Duplicate Prevention
Every stroke has a unique generated ID. The `addStroke` and `addObject` store functions check for existing IDs before inserting, preventing duplicate renders when the same data arrives via multiple paths (local draw + remote echo).

### Undo / Redo — Command Pattern
History stores action commands, not canvas snapshots. Each command describes what happened and how to reverse it. Memory usage stays constant regardless of canvas size. MongoDB is updated atomically on each undo/redo using aggregation pipeline `$filter` for stroke removal.

---

## 🌐 Deployment

### Frontend — Vercel

1. Push code to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Set root directory to `client`
4. Add environment variable: `VITE_SOCKET_URL=https://whiteboard-rbpi.onrender.com
5. Deploy

### Backend — Render

1. Create new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set root directory to `server`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variables:
   ```
   PORT=3001
   CLIENT_URL=https://whiteboard-collaboard.vercel.app
   MONGO_URI=mongodb+srv://...
   ```
7. Deploy

> **Note:** Free tier Render servers spin down after 15 minutes of inactivity. The app includes a keep-alive health ping to minimize cold-start delays.

---

## 🗺️ Development Roadmap

- [x] Phase 1 — Project setup, Socket.IO room system
- [x] Phase 2 — Canvas MVP, freehand drawing, toolbar
- [x] Phase 3 — Real-time drawing sync with throttling
- [x] Phase 4 — Infinite canvas with zoom and pan
- [x] Phase 5 — Live cursors and user presence panel
- [x] Phase 6 — Sticky notes, shapes, arrows
- [x] Phase 7 — MongoDB persistence and autosave
- [x] Phase 8 — Undo/redo with command pattern
- [x] Phase 9 — UI, Framer Motion animations
- [ ] Voice rooms via WebRTC
- [ ] Export canvas as PNG/PDF
- [ ] User authentication and named boards
- [ ] Board history timeline

---

## 🧠 Engineering Concepts Demonstrated

| Concept | Where used |
|---|---|
| WebSocket upgrade handshake | Socket.IO connection lifecycle |
| Pub/sub with rooms | Socket.IO room-based event routing |
| Affine transformations | `ctx.setTransform` for zoom/pan |
| Coordinate space conversion | World ↔ screen coordinates |
| Command pattern | Undo/redo history stack |
| Debouncing | DB write batching, object update throttle |
| Throttling | Draw emit rate limiting, cursor events |
| Optimistic updates | Local state before server confirmation |
| Stale closure problem | `useRef` for values inside socket listeners |
| Singleton pattern | Socket.IO client instance management |
| Zustand selectors | Prevent unnecessary re-renders |
| MongoDB aggregation pipeline | `$filter` for atomic stroke removal |
| Mongoose Map schema | Key-value object storage with dot-notation updates |
| React imperative escape hatch | `useRef` + Canvas API bypassing React render cycle |

---

## 👩‍💻 Author

**Anuja** — [@anuja0802](https://github.com/anuja0802)

> Built as a full-stack SDE portfolio project, developed phase by phase from a basic Socket.IO connection to a production-deployed collaborative application.

---

## 📄 License

MIT License — free to use for learning or your own portfolio.
