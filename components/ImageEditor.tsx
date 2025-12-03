
import React, { useState, useRef, useEffect } from 'react';
import { X, Check, RotateCw, Crop, Wand2, Sun, Sliders, Monitor, Smartphone, Square, Image as ImageIcon, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface ImageEditorProps {
  imageSrc: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

const FILTERS = [
  { name: 'Normal', value: 'none' },
  { name: 'B&W', value: 'grayscale(100%)' },
  { name: 'Sepia', value: 'sepia(100%)' },
  { name: 'Warm', value: 'sepia(50%) saturate(150%)' },
  { name: 'Cool', value: 'hue-rotate(180deg) saturate(80%)' },
  { name: 'Vivid', value: 'saturate(200%) contrast(110%)' },
];

type AspectRatio = 'original' | '1:1' | '16:9' | '4:3';

const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  
  // Edit States
  const [rotation, setRotation] = useState(0);
  const [filter, setFilter] = useState('none');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('original');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [activeTab, setActiveTab] = useState<'adjust' | 'filters'>('filters');

  // Viewport State (Zoom/Pan)
  const [viewState, setViewState] = useState({ zoom: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
  }, [imageSrc]);

  useEffect(() => {
    drawPreview();
  }, [image, rotation, filter, aspectRatio, brightness, contrast, viewState]);

  // Reset zoom when rotation or aspect ratio changes to ensure crop is visible
  useEffect(() => {
    setViewState({ zoom: 1, x: 0, y: 0 });
  }, [rotation, aspectRatio]);

  const getCropDimensions = (srcWidth: number, srcHeight: number) => {
      // Calculates the largest centered crop rectangle for the given aspect ratio
      let targetWidth = srcWidth;
      let targetHeight = srcHeight;

      if (aspectRatio === '1:1') {
         const size = Math.min(srcWidth, srcHeight);
         targetWidth = size;
         targetHeight = size;
      } else if (aspectRatio === '16:9') {
         if (srcWidth / srcHeight > 16/9) {
            targetHeight = srcHeight;
            targetWidth = srcHeight * (16/9);
         } else {
            targetWidth = srcWidth;
            targetHeight = srcWidth * (9/16);
         }
      } else if (aspectRatio === '4:3') {
         if (srcWidth / srcHeight > 4/3) {
            targetHeight = srcHeight;
            targetWidth = srcHeight * (4/3);
         } else {
            targetWidth = srcWidth;
            targetHeight = srcWidth * (3/4);
         }
      }
      return { width: targetWidth, height: targetHeight };
  };

  const drawPreview = () => {
    if (!canvasRef.current || !containerRef.current || !image) return;
    const canvas = canvasRef.current;
    
    // Set canvas size to match container (Viewport)
    canvas.width = containerRef.current.clientWidth;
    canvas.height = containerRef.current.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Calculate Rotated Image Dimensions
    const isRotated90 = rotation % 180 !== 0;
    const rotWidth = isRotated90 ? image.height : image.width;
    const rotHeight = isRotated90 ? image.width : image.height;

    // 2. Calculate Base Scale to fit image in container (with padding)
    const padding = 40;
    const availW = canvas.width - padding;
    const availH = canvas.height - padding;
    const fitScale = Math.min(availW / rotWidth, availH / rotHeight);
    
    // 3. Apply User Zoom
    const currentScale = fitScale * viewState.zoom;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // --- Prepare Context ---
    ctx.save();
    
    // Translate to center of viewport + user pan
    ctx.translate(canvas.width / 2 + viewState.x, canvas.height / 2 + viewState.y);
    
    // Scale context
    ctx.scale(currentScale, currentScale);

    // Helper to draw the rotated image centered at (0,0) in current context
    // Since context is scaled/translated, we just rotate and draw
    const drawCenteredRotatedImage = () => {
        ctx.save();
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(image, -image.width / 2, -image.height / 2);
        ctx.restore();
    };

    // --- Layer 1: Dimmed Background (The cropped-out area) ---
    const cssFilter = `${filter === 'none' ? '' : filter} brightness(${brightness}%) contrast(${contrast}%)`.trim();
    ctx.filter = `${cssFilter} brightness(40%) grayscale(50%)`; 
    drawCenteredRotatedImage();

    // --- Layer 2: Active Crop Area (Fully Visible) ---
    const { width: cropW, height: cropH } = getCropDimensions(rotWidth, rotHeight);
    
    ctx.save();
    // Create Clip Path for Crop Area
    // The context is centered, so crop rect is centered at (0,0)
    ctx.beginPath();
    ctx.rect(-cropW / 2, -cropH / 2, cropW, cropH);
    ctx.clip();
    
    // Draw normal brightness image inside clip
    ctx.filter = cssFilter || 'none';
    drawCenteredRotatedImage();
    ctx.restore();

    // --- Layer 3: Overlay UI (Border & Grid) ---
    ctx.filter = 'none'; 
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2 / currentScale; // Scale line width down so it stays constant on screen
    const borderX = -cropW / 2;
    const borderY = -cropH / 2;
    ctx.strokeRect(borderX, borderY, cropW, cropH);

    // Rule of Thirds Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1 / currentScale;
    ctx.beginPath();
    // Verticals
    ctx.moveTo(borderX + cropW / 3, borderY);
    ctx.lineTo(borderX + cropW / 3, borderY + cropH);
    ctx.moveTo(borderX + (cropW * 2) / 3, borderY);
    ctx.lineTo(borderX + (cropW * 2) / 3, borderY + cropH);
    // Horizontals
    ctx.moveTo(borderX, borderY + cropH / 3);
    ctx.lineTo(borderX + cropW, borderY + cropH / 3);
    ctx.moveTo(borderX, borderY + (cropH * 2) / 3);
    ctx.lineTo(borderX + cropW, borderY + (cropH * 2) / 3);
    ctx.stroke();

    ctx.restore(); // Restore to initial state
  };

  const handleSave = () => {
    if (!image) return;
     
    const outputCanvas = document.createElement('canvas');
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return;

    const isRotated90 = rotation % 180 !== 0;
    const rotWidth = isRotated90 ? image.height : image.width;
    const rotHeight = isRotated90 ? image.width : image.height;

    const { width: cropW, height: cropH } = getCropDimensions(rotWidth, rotHeight);
     
    outputCanvas.width = cropW;
    outputCanvas.height = cropH;

    const cssFilter = `${filter === 'none' ? '' : filter} brightness(${brightness}%) contrast(${contrast}%)`.trim();
    ctx.filter = cssFilter || 'none';

    ctx.save();
    ctx.translate(outputCanvas.width / 2, outputCanvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();

    onSave(outputCanvas.toDataURL('image/png'));
  };

  // --- Zoom & Pan Handlers ---
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const delta = -Math.sign(e.deltaY);
    const newZoom = Math.max(0.5, Math.min(viewState.zoom + delta * zoomSpeed, 5));
    setViewState(prev => ({ ...prev, zoom: newZoom }));
  };

  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    lastMousePos.current = { x: clientX, y: clientY };
  };

  const updateDrag = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - lastMousePos.current.x;
    const dy = clientY - lastMousePos.current.y;
    setViewState(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    lastMousePos.current = { x: clientX, y: clientY };
  };

  const endDrag = () => setIsDragging(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    startDrag(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    updateDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
       updateDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0B1120] z-20">
        <button onClick={onCancel} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
          <X size={24} />
        </button>
        <h3 className="text-white font-medium">Edit Image</h3>
        <button onClick={handleSave} className="p-2 text-emerald-400 hover:text-emerald-300 rounded-full hover:bg-emerald-500/10 transition-colors">
          <Check size={24} />
        </button>
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-hidden relative bg-[#050505] cursor-move touch-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={endDrag}
      >
        {/* Transparency Grid Background */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
        </div>
        
        <canvas 
          ref={canvasRef} 
          className="block w-full h-full relative z-10"
        />

        {/* Floating Zoom Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-gray-900/80 backdrop-blur rounded-lg border border-gray-700 p-1.5 shadow-xl">
           <button 
             onClick={() => setViewState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.25, 5) }))}
             className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
             title="Zoom In"
           >
             <ZoomIn size={18} />
           </button>
           <button 
             onClick={() => setViewState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.25, 0.5) }))}
             className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
             title="Zoom Out"
           >
             <ZoomOut size={18} />
           </button>
           <div className="h-px bg-gray-700 my-0.5"></div>
           <button 
             onClick={() => setViewState({ zoom: 1, x: 0, y: 0 })}
             className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
             title="Reset View"
           >
             <Maximize size={18} />
           </button>
           <div className="text-[10px] text-center font-mono text-gray-500 pt-1">
             {Math.round(viewState.zoom * 100)}%
           </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#0F141F] border-t border-gray-800 pb-safe z-20">
        
        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button 
            onClick={() => setActiveTab('filters')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'filters' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Wand2 size={16} /> Filters
          </button>
          <button 
            onClick={() => setActiveTab('adjust')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'adjust' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Sliders size={16} /> Adjust
          </button>
        </div>

        <div className="p-4 h-40 overflow-y-auto custom-scrollbar">
          {activeTab === 'filters' ? (
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {FILTERS.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setFilter(f.value)}
                  className={`flex flex-col items-center gap-2 min-w-[70px] group`}
                >
                  <div className={`w-16 h-16 rounded-lg border-2 overflow-hidden bg-gray-800 ${filter === f.value ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-700 group-hover:border-gray-500'}`}>
                    <div className="w-full h-full bg-gray-600" style={{ filter: f.value !== 'none' ? f.value : undefined }}>
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600"></div>
                    </div>
                  </div>
                  <span className={`text-xs ${filter === f.value ? 'text-emerald-400' : 'text-gray-400'}`}>{f.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6 max-w-md mx-auto">
              {/* Rotate & Crop Section */}
              <div className="flex flex-col gap-3">
                 <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-500 uppercase font-bold">Orientation</label>
                    <button 
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors"
                    >
                      <RotateCw size={14} /> Rotate 90°
                    </button>
                 </div>
                 
                 <div>
                    <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Crop Ratio</label>
                    <div className="flex gap-2">
                       <button 
                          onClick={() => setAspectRatio('original')}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 ${aspectRatio === 'original' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                          title="Original"
                       >
                         <ImageIcon size={14} /> <span className="hidden sm:inline">Free</span>
                       </button>
                       <button 
                          onClick={() => setAspectRatio('1:1')}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 ${aspectRatio === '1:1' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                          title="Square"
                       >
                         <Square size={14} /> 1:1
                       </button>
                       <button 
                          onClick={() => setAspectRatio('16:9')}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 ${aspectRatio === '16:9' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                          title="Landscape"
                       >
                         <Monitor size={14} /> 16:9
                       </button>
                       <button 
                          onClick={() => setAspectRatio('4:3')}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 ${aspectRatio === '4:3' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                          title="Portrait"
                       >
                         <Smartphone size={14} /> 4:3
                       </button>
                    </div>
                 </div>
              </div>

              {/* Sliders Section */}
              <div className="space-y-3 pt-2 border-t border-gray-800">
                 <div className="flex items-center gap-3">
                   <Sun size={16} className="text-gray-400" />
                   <input 
                     type="range" 
                     min="50" 
                     max="150" 
                     value={brightness} 
                     onChange={(e) => setBrightness(Number(e.target.value))}
                     className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                   />
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="w-4 h-4 rounded-full border border-gray-400 bg-gradient-to-tr from-black to-white"></div>
                   <input 
                     type="range" 
                     min="50" 
                     max="150" 
                     value={contrast} 
                     onChange={(e) => setContrast(Number(e.target.value))}
                     className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                   />
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
