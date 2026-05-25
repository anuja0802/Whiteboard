import useCanvasStore from '../../store/canvasStore';
import brushIcon from "../../assets/brush.svg"
import eraserIcon from "../../assets/eraser(pink).svg";
import RectIcon from "../../assets/rectangle2.svg";
import circleIcon from "../../assets/circle.svg";
import notesIcon from "../../assets/notes.svg";
import selectIcon from "../../assets/select.svg";
import RedoIcon from "../../assets/redo.svg";
import UndoIcon from "../../assets/undo.svg";
import ArrowIcon from "../../assets/arrow2.svg";

const COLORS = [
  '#ffffff', '#f87171', '#fb923c', '#fbbf24',
  '#4ade80', '#60a5fa', '#c084fc', '#f472b6',
];

const BRUSH_SIZES = [2, 5, 8, 15];

export default function Toolbar({ onClear, onUndo, onRedo, canUndo, canRedo }) {
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
            <img src={brushIcon} alt="Brush" className="w-8 h-8" />
          </ToolButton>

          <ToolButton
            active={tool === 'eraser'}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            <img src={eraserIcon} alt="Eraser" className="w-6 h-7" />
          </ToolButton>
        </div>

        <Divider />

        {/* ── OBJECT TOOLS ── */}
        <div className="flex gap-1">
          <ToolButton
            active={tool === 'sticky'}
            onClick={() => setTool('sticky')}
            title="Sticky Note"
          >
            <img src={notesIcon} alt="Sticky note" className="w-7 h-7" />
          </ToolButton>

          <ToolButton
            active={tool === 'rect'}
            onClick={() => setTool('rect')}
            title="Rectangle"
          >
            <img src={RectIcon} alt="Rectangle" className="w-7 h-7" />
          </ToolButton>

          <ToolButton
            active={tool === 'circle'}
            onClick={() => setTool('circle')}
            title="Circle"
          >
            <img src={circleIcon} alt="Circle" className="w-7 h-7" />
          </ToolButton>

          <ToolButton
            active={tool === 'arrow'}
            onClick={() => setTool('arrow')}
            title="Arrow"
          >
            <img src={ArrowIcon} alt="Arrow" className="w-6 h-8" />
          </ToolButton>

          <ToolButton
            active={tool === 'select'}
            onClick={() => setTool('select')}
            title="Select / Move"
          >
            <img src={selectIcon} alt="Select/Drag" className="w-7 h-7" />
          </ToolButton>
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
                borderColor: color === c ? '#1d5daa' : 'transparent',
                transform: color === c ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}

          <label className="w-8 h-8 rounded-full border-2 border-gray-600 cursor-pointer overflow-hidden flex items-center justify-center hover:scale-110 transition-transform">
            <span className="text-m"
            title = "More colors"
            >🎨</span>
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

        {/* Undo/Redo */}
        <div className="flex gap-1">
          <ToolButton
            onClick={onUndo}
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
          >
            <img src={UndoIcon} alt="Undo" className="w-7 h-7" />
          </ToolButton>
          <ToolButton
            onClick={onRedo}
            title="Redo (Ctrl+Y)"
            disabled={!canRedo}
          >
            <img src={RedoIcon} alt="Redo" className="w-7 h-7" />
          </ToolButton>
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
function ToolButton({ active, onClick, title, children, disabled }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-colors
        ${disabled
          ? 'opacity-30 cursor-not-allowed'
          : active
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