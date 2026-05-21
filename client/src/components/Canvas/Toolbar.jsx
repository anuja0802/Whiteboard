// Toolbar.jsx
// A floating toolbar for picking tools, colors, and brush size.
// Reads/writes to canvasStore directly — no prop drilling needed.

import useCanvasStore from '../../store/canvasStore';

// Preset colors for quick access
const COLORS = [
  '#ffffff', // white
  '#f87171', // red
  '#fb923c', // orange
  '#fbbf24', // yellow
  '#4ade80', // green
  '#60a5fa', // blue
  '#c084fc', // purple
  '#f472b6', // pink
];

// Preset brush sizes
const BRUSH_SIZES = [2, 5, 10, 18];

export default function Toolbar({ onClear }) {
  const { tool, color, brushSize, setTool, setColor, setBrushSize } =
    useCanvasStore();

  return (
    // Fixed toolbar — floats at the top of the screen
    // z-10 ensures it stays above the canvas
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 shadow-2xl">
        
        {/* ── TOOLS ── */}
        <div className="flex gap-1">
          {/* Pen tool */}
          <button
            onClick={() => setTool('pen')}
            title="Pen"
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-colors
              ${tool === 'pen'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800'
              }`}
          >
            ✏️
          </button>

          {/* Eraser tool */}
          <button
            onClick={() => setTool('eraser')}
            title="Eraser"
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-colors
              ${tool === 'eraser'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800'
              }`}
          >
            🧹
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-700" />

        {/* ── COLORS ── */}
        <div className="flex gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setTool('pen'); // Switch to pen when picking color
              }}
              title={c}
              className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                // Highlight the active color
                borderColor: color === c ? '#60a5fa' : 'transparent',
                transform: color === c ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}

          {/* Custom color picker */}
          <label
            title="Custom color"
            className="w-6 h-6 rounded-full border-2 border-gray-600 cursor-pointer overflow-hidden flex items-center justify-center hover:scale-110 transition-transform"
          >
            <span className="text-xs">🎨</span>
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setTool('pen');
              }}
              className="absolute opacity-0 w-0 h-0"
            />
          </label>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-700" />

        {/* ── BRUSH SIZES ── */}
        <div className="flex gap-2 items-center">
        {BRUSH_SIZES.map((size) => (
            <button
            key={size}
            onClick={() => setBrushSize(size)}
            title={`${size}px`}
            className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-800 transition-colors"
            >
            {/* Always show a fixed-size circle, but filled vs outlined shows active */}
            <div
                className="rounded-full transition-all"
                style={{
                width: `${size * 2.5}px`,
                height: `${size * 2.5}px`,
                minWidth: '4px',
                minHeight: '4px',
                maxWidth: '26px',
                maxHeight: '26px',
                backgroundColor: brushSize === size ? color : '#6b7280',
                // Active = filled with current color, inactive = gray
                outline: brushSize === size ? `2px solid ${color}` : '2px solid transparent',
                outlineOffset: '2px',
                }}
            />
            </button>
        ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-700" />

        {/* ── CLEAR BUTTON ── */}
        <button
          onClick={onClear}
          title="Clear canvas"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-900 hover:text-red-400 transition-colors"
        >
          🗑️
        </button>

      </div>
    </div>
  );
}