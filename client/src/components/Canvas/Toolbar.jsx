import useCanvasStore from '../../store/canvasStore';
import { useObjects } from '../../hooks/useObjects';
import brushIcon from "../../assets/brush.svg"
import eraserIcon from "../../assets/eraser(pink).svg";
import RectIcon from "../../assets/rectangle.svg";

const COLORS = [
  '#ffffff', '#f87171', '#fb923c', '#fbbf24',
  '#4ade80', '#60a5fa', '#c084fc', '#f472b6',
];

const BRUSH_SIZES = [2, 5, 8, 15];

export default function Toolbar({ onClear }) {
  const { tool, color, brushSize, setTool, setColor, setBrushSize } =
    useCanvasStore();

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
      <div className="flex items-center gap-2 bg-pink-900 border border-gray-700 rounded-2xl px-3 py-2.5 shadow-2xl flex-wrap justify-center">

        {/* ── DRAWING TOOLS ── */}
        <div className="flex gap-1">
          <ToolButton
            active={tool === 'pen'}
            onClick={() => setTool('pen')}
            title="Pen (draw)"
          >
            <img src={brushIcon} alt="Eraser" className="w-7 h-7" />
          </ToolButton>

          <ToolButton
            active={tool === 'eraser'}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            <img src={eraserIcon} alt="Eraser" className="w-5 h-5" />
          </ToolButton>
        </div>

        <Divider />

        {/* ── OBJECT TOOLS ── */}
        <div className="flex gap-1">
          <ToolButton
            active={tool === 'sticky'}
            onClick={() => setTool('sticky')}
            title="Sticky Note"
          >📝</ToolButton>

          <ToolButton
            active={tool === 'rect'}
            onClick={() => setTool('rect')}
            title="Rectangle"
          >
            <img src={RectIcon} alt="Eraser" className="w-7 h-7" />
          </ToolButton>

          <ToolButton
            active={tool === 'circle'}
            onClick={() => setTool('circle')}
            title="Circle"
          >⭕</ToolButton>

          <ToolButton
            active={tool === 'arrow'}
            onClick={() => setTool('arrow')}
            title="Arrow"
          >↗️</ToolButton>

          <ToolButton
            active={tool === 'select'}
            onClick={() => setTool('select')}
            title="Select / Move"
          >🖱️</ToolButton>
        </div>

        <Divider />

        {/* ── COLORS ── */}
        <div className="flex gap-1.5 items-center">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool('pen'); }}
              className="rounded-full border-2 transition-transform hover:scale-110 flex-shrink-0"
              style={{
                width: 22, height: 22,
                backgroundColor: c,
                borderColor: color === c ? '#60a5fa' : 'transparent',
                transform: color === c ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}

          <label className="w-8 h-8 rounded-full border-2 border-gray-600 cursor-pointer overflow-hidden flex items-center justify-center hover:scale-110 transition-transform">
            <span className="text-m">🎨</span>
            <input
              type="color"
              value={color}
              onChange={(e) => { setColor(e.target.value); setTool('pen'); }}
              className="absolute opacity-0 w-0 h-0"
            />
          </label>
        </div>

        <Divider />

        {/* ── BRUSH SIZES ── */}
        <div className="flex gap-2 items-center">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              title={`${size}px`}
              className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div
                className="rounded-full transition-all"
                style={{
                  width: `${size +7}px`,
                  height: `${size +7}px`,
                  minWidth: '4px', minHeight: '4px',
                  maxWidth: '26px', maxHeight: '26px',
                  backgroundColor: brushSize === size ? color : '#6b7280',
                  outline: brushSize === size
                    ? `2px solid ${color}` : '2px solid transparent',
                  outlineOffset: '2px',
                }}
              />
            </button>
          ))}
        </div>

        <Divider />

        {/* ── CLEAR ── */}
        <ToolButton onClick={onClear} title="Clear canvas">
          🗑️
        </ToolButton>

      </div>
    </div>
  );
}

// Reusable tool button
function ToolButton({ active, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-colors
        ${active
          ? 'bg-blue-600 text-white'
          : 'text-gray-400 hover:bg-gray-800'
        }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-gray-700 flex-shrink-0" />;
}