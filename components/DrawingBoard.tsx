
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Check, Undo, Trash2, Eraser, Pen, Minus, Circle, PaintBucket, Type, Square, MousePointer2, Triangle, Slash, Layers, Eye, EyeOff, Plus, ChevronUp, ChevronDown, Gamepad2, Grid3X3, Grid, Hash, Sliders, SprayCan, Highlighter, Pencil, Upload, Image as ImageIcon } from 'lucide-react';

interface DrawingBoardProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

const COLORS = [
  '#FFFFFF', // White
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#000000', // Black
];

type ToolType = 'pen' | 'eraser' | 'fill' | 'text' | 'rect' | 'circle' | 'triangle' | 'line';
type BrushType = 'normal' | 'spray' | 'chalk' | 'watercolor';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
}

export const DrawingBoard: React.FC<DrawingBoardProps> = ({ onSave, onCancel }) => {
  // Layer State
  const [layers, setLayers] = useState<Layer[]>([{ id: 'layer-1', name: 'Layer 1', visible: true }]);
  const [activeLayerId, setActiveLayerId] = useState<string>('layer-1');
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [showToolOptions, setShowToolOptions] = useState(true);

  // Refs
  const layerRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const tempCanvasRef = useRef<HTMLCanvasElement>(null); // Layer for shape previews
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Tool State
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FFFFFF');
  const [lineWidth, setLineWidth] = useState(4);
  const [tool, setTool] = useState<ToolType>('pen');
  const [brushType, setBrushType] = useState<BrushType>('normal');
  const [isFillShape, setIsFillShape] = useState(false); // New state for filled shapes
  
  // History
  const historyRef = useRef<{ [layerId: string]: ImageData[] }>({});

  // Text Tool State
  const [textInput, setTextInput] = useState<{x: number, y: number, text: string, visible: boolean} | null>(null);
  
  // Interaction Refs
  const startPoint = useRef<{x: number, y: number} | null>(null); 
  const lastPoint = useRef<{x: number, y: number} | null>(null); 
  const lastMidPoint = useRef<{x: number, y: number} | null>(null); 

  // Initialize Layer Refs map
  const setLayerRef = (id: string, el: HTMLCanvasElement | null) => {
    layerRefs.current[id] = el;
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [layers]); // Re-run resize if layers change to size new canvases

  const handleResize = () => {
    if (!tempCanvasRef.current || !containerRef.current) return;
    const parent = containerRef.current;
    
    // Resize Temp Canvas
    tempCanvasRef.current.width = parent.clientWidth;
    tempCanvasRef.current.height = parent.clientHeight;

    // Resize All Layer Canvases
    Object.keys(layerRefs.current).forEach(layerId => {
        const canvas = layerRefs.current[layerId];
        if (canvas) {
            // Save content before resize
            const ctx = canvas.getContext('2d');
            let saved: ImageData | null = null;
            if (canvas.width > 0 && ctx) {
                try { saved = ctx.getImageData(0,0, canvas.width, canvas.height); } catch(e) {}
            }
            
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;

            if (ctx && saved) {
                ctx.putImageData(saved, 0, 0);
            }
        }
    });
  };

  const getActiveCtx = () => {
      const canvas = layerRefs.current[activeLayerId];
      return canvas?.getContext('2d', { willReadFrequently: true });
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = tempCanvasRef.current; 
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const saveHistory = () => {
     const ctx = getActiveCtx();
     const canvas = layerRefs.current[activeLayerId];
     if (!canvas || !ctx) return;
     
     if (!historyRef.current[activeLayerId]) {
         historyRef.current[activeLayerId] = [];
     }

     const stack = historyRef.current[activeLayerId];
     if (stack.length >= 10) stack.shift();
     stack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  };

  const handleUndo = () => {
      const ctx = getActiveCtx();
      if (!ctx || !historyRef.current[activeLayerId] || historyRef.current[activeLayerId].length === 0) return;
      
      const stack = historyRef.current[activeLayerId];
      const previousState = stack.pop();
      if (previousState) {
          ctx.putImageData(previousState, 0, 0);
      }
  };

  const handleImageImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const ctx = getActiveCtx();
        const canvas = layerRefs.current[activeLayerId];
        if (ctx && canvas) {
          saveHistory();
          
          // Calculate Aspect Ratio to Fit
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
          // Optional: Limit scale to 1 if image is smaller than canvas to prevent upscaling blur? 
          // Let's allow filling the screen for better usability.
          
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (canvas.width - w) / 2;
          const y = (canvas.height - h) / 2;
          
          ctx.drawImage(img, x, y, w, h);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  // --- Flood Fill Algorithm ---
  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const ctx = getActiveCtx();
    const canvas = layerRefs.current[activeLayerId];
    if (!canvas || !ctx) return;

    const r = parseInt(fillColor.slice(1, 3), 16);
    const g = parseInt(fillColor.slice(3, 5), 16);
    const b = parseInt(fillColor.slice(5, 7), 16);
    const a = 255;
    const tolerance = 32;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { width, height, data } = imageData;
    
    const startPos = (Math.floor(startY) * width + Math.floor(startX)) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    // Safety check: If fill color is within tolerance of start color, abort to avoid infinite loops
    if (
        Math.abs(r - startR) <= tolerance &&
        Math.abs(g - startG) <= tolerance &&
        Math.abs(b - startB) <= tolerance &&
        Math.abs(a - startA) <= tolerance
    ) {
        return;
    }

    const stack = [[Math.floor(startX), Math.floor(startY)]];
    
    while (stack.length) {
        const [x, y] = stack.pop()!;
        let pixelPos = (y * width + x) * 4;
        
        let y1 = y;
        while (y1 >= 0 && matchStartColor(pixelPos, data, startR, startG, startB, startA, tolerance)) {
            y1--;
            pixelPos -= width * 4;
        }
        y1++;
        pixelPos += width * 4;
        
        let spanLeft = false;
        let spanRight = false;
        
        while (y1 < height && matchStartColor(pixelPos, data, startR, startG, startB, startA, tolerance)) {
            colorPixel(pixelPos, data, r, g, b, a);
            
            if (x > 0) {
                if (matchStartColor(pixelPos - 4, data, startR, startG, startB, startA, tolerance)) {
                    if (!spanLeft) {
                        stack.push([x - 1, y1]);
                        spanLeft = true;
                    }
                } else if (spanLeft) {
                    spanLeft = false;
                }
            }
            
            if (x < width - 1) {
                if (matchStartColor(pixelPos + 4, data, startR, startG, startB, startA, tolerance)) {
                    if (!spanRight) {
                        stack.push([x + 1, y1]);
                        spanRight = true;
                    }
                } else if (spanRight) {
                    spanRight = false;
                }
            }
            
            y1++;
            pixelPos += width * 4;
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const matchStartColor = (pos: number, data: Uint8ClampedArray, r: number, g: number, b: number, a: number, tolerance: number) => {
    return (
        Math.abs(data[pos] - r) <= tolerance &&
        Math.abs(data[pos + 1] - g) <= tolerance &&
        Math.abs(data[pos + 2] - b) <= tolerance &&
        Math.abs(data[pos + 3] - a) <= tolerance
    );
  };

  const colorPixel = (pos: number, data: Uint8ClampedArray, r: number, g: number, b: number, a: number) => {
    data[pos] = r;
    data[pos + 1] = g;
    data[pos + 2] = b;
    data[pos + 3] = a;
  };

  // --- Game Templates ---
  const drawGameTemplate = (type: 'tictactoe' | 'chess' | 'sudoku' | 'dots') => {
    saveHistory();
    const ctx = getActiveCtx();
    const canvas = layerRefs.current[activeLayerId];
    if (!canvas || !ctx) return;
    
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    if (type === 'tictactoe') {
        const size = Math.min(w, h) * 0.6;
        const step = size / 3;
        const startX = cx - size / 2;
        const startY = cy - size / 2;
        
        ctx.beginPath();
        // Verticals
        ctx.moveTo(startX + step, startY);
        ctx.lineTo(startX + step, startY + size);
        ctx.moveTo(startX + step * 2, startY);
        ctx.lineTo(startX + step * 2, startY + size);
        // Horizontals
        ctx.moveTo(startX, startY + step);
        ctx.lineTo(startX + size, startY + step);
        ctx.moveTo(startX, startY + step * 2);
        ctx.lineTo(startX + size, startY + step * 2);
        ctx.stroke();
    } else if (type === 'chess') {
        const size = Math.min(w, h) * 0.8;
        const step = size / 8;
        const startX = cx - size / 2;
        const startY = cy - size / 2;
        
        ctx.lineWidth = 2;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // Light squares
                    ctx.fillRect(startX + col * step, startY + row * step, step, step);
                }
                ctx.strokeRect(startX + col * step, startY + row * step, step, step);
            }
        }
    } else if (type === 'sudoku') {
        const size = Math.min(w, h) * 0.8;
        const step = size / 9;
        const startX = cx - size / 2;
        const startY = cy - size / 2;

        ctx.beginPath();
        for (let i = 0; i <= 9; i++) {
            const pos = i * step;
            ctx.lineWidth = i % 3 === 0 ? 4 : 1;
            
            // Verticals
            ctx.moveTo(startX + pos, startY);
            ctx.lineTo(startX + pos, startY + size);
            
            // Horizontals
            ctx.moveTo(startX, startY + pos);
            ctx.lineTo(startX + size, startY + pos);
            ctx.stroke();
            ctx.beginPath(); // Reset path to apply new lineWidth next iter
        }
    } else if (type === 'dots') {
        const size = Math.min(w, h) * 0.8;
        const dots = 10;
        const step = size / (dots - 1);
        const startX = cx - size / 2;
        const startY = cy - size / 2;

        for (let row = 0; row < dots; row++) {
            for (let col = 0; col < dots; col++) {
                ctx.beginPath();
                ctx.arc(startX + col * step, startY + row * step, 2, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            }
        }
    }
    
    setShowGameMenu(false);
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer || !activeLayer.visible) {
        alert("Cannot draw on a hidden layer.");
        return;
    }

    const { x, y } = getCoordinates(e);

    if (tool === 'text') {
        if (textInput && textInput.visible) {
            commitText();
        } else {
            setTextInput({ x, y, text: '', visible: true });
        }
        return;
    }

    saveHistory();

    if (tool === 'fill') {
        floodFill(x, y, color);
        return;
    }

    setIsDrawing(true);
    startPoint.current = { x, y };
    
    if (tool === 'pen' || tool === 'eraser') {
        lastPoint.current = { x, y };
        lastMidPoint.current = { x, y };
        
        const ctx = getActiveCtx();
        if (ctx) {
             ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
             
             // Initial dot for simple click
             if (tool === 'pen' && brushType === 'normal') {
                 ctx.beginPath();
                 ctx.arc(x, y, lineWidth / 2, 0, Math.PI * 2);
                 ctx.fillStyle = color; 
                 ctx.fill();
             } else if (tool === 'eraser') {
                 ctx.beginPath();
                 ctx.arc(x, y, lineWidth / 2, 0, Math.PI * 2);
                 ctx.fillStyle = 'rgba(0,0,0,1)'; 
                 ctx.fill();
             } else if (tool === 'pen' && brushType === 'watercolor') {
                 ctx.globalAlpha = 0.1;
                 ctx.beginPath();
                 ctx.arc(x, y, lineWidth, 0, Math.PI * 2);
                 ctx.fillStyle = color; 
                 ctx.fill();
             }
        }
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    if (!isDrawing) return;

    const { x, y } = getCoordinates(e);

    if (tool === 'pen' || tool === 'eraser') {
        const ctx = getActiveCtx();
        if (!ctx || !lastPoint.current || !lastMidPoint.current) return;

        const midPoint = {
            x: (lastPoint.current.x + x) / 2,
            y: (lastPoint.current.y + y) / 2
        };

        ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Brush Logic
        if (tool === 'pen' && brushType === 'spray') {
             const density = lineWidth * 2;
             const radius = lineWidth * 2;
             ctx.fillStyle = color;
             for (let i = 0; i < density; i++) {
                 const angle = Math.random() * Math.PI * 2;
                 const r = Math.random() * radius;
                 const px = x + Math.cos(angle) * r;
                 const py = y + Math.sin(angle) * r;
                 ctx.fillRect(px, py, 1, 1);
             }
             lastPoint.current = { x, y };
             lastMidPoint.current = midPoint;
             return; // Skip normal drawing
        } 
        else if (tool === 'pen' && brushType === 'chalk') {
             // Draw the curve multiple times with jitter
             ctx.shadowBlur = 0;
             ctx.lineWidth = lineWidth;
             for(let i=0; i<3; i++) {
                const offsetX = (Math.random() - 0.5) * 2;
                const offsetY = (Math.random() - 0.5) * 2;
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.moveTo(lastMidPoint.current.x + offsetX, lastMidPoint.current.y + offsetY);
                ctx.quadraticCurveTo(lastPoint.current.x + offsetX, lastPoint.current.y + offsetY, midPoint.x + offsetX, midPoint.y + offsetY);
                ctx.stroke();
             }
             ctx.globalAlpha = 1.0;
        }
        else if (tool === 'pen' && brushType === 'watercolor') {
            ctx.globalAlpha = 0.05;
            ctx.lineWidth = lineWidth * 2; // Spread out
            ctx.beginPath();
            ctx.moveTo(lastMidPoint.current.x, lastMidPoint.current.y);
            ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, midPoint.x, midPoint.y);
            ctx.stroke();
        }
        else {
            // Normal Pen & Eraser
            ctx.beginPath();
            ctx.moveTo(lastMidPoint.current.x, lastMidPoint.current.y);
            ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, midPoint.x, midPoint.y);
            ctx.stroke();
        }

        lastPoint.current = { x, y };
        lastMidPoint.current = midPoint;
    } 
    else if (['rect', 'circle', 'triangle', 'line'].includes(tool)) {
        const tempCtx = tempCanvasRef.current?.getContext('2d');
        if (!tempCtx || !startPoint.current) return;

        tempCtx.clearRect(0, 0, tempCanvasRef.current!.width, tempCanvasRef.current!.height);
        
        tempCtx.strokeStyle = color;
        tempCtx.fillStyle = color;
        tempCtx.lineWidth = lineWidth;
        tempCtx.lineCap = 'round';
        tempCtx.lineJoin = 'round';
        tempCtx.beginPath();

        const startX = startPoint.current.x;
        const startY = startPoint.current.y;
        const w = x - startX;
        const h = y - startY;

        if (tool === 'rect') {
            if (isFillShape) {
                tempCtx.fillRect(startX, startY, w, h);
            } else {
                tempCtx.strokeRect(startX, startY, w, h);
            }
        } else if (tool === 'circle') {
            const radius = Math.sqrt(w * w + h * h);
            tempCtx.arc(startX, startY, radius, 0, 2 * Math.PI);
            if (isFillShape) tempCtx.fill();
            else tempCtx.stroke();
        } else if (tool === 'triangle') {
            tempCtx.moveTo(startX + w / 2, startY);
            tempCtx.lineTo(startX, startY + h);
            tempCtx.lineTo(startX + w, startY + h);
            tempCtx.closePath();
            if (isFillShape) tempCtx.fill();
            else tempCtx.stroke();
        } else if (tool === 'line') {
            tempCtx.moveTo(startX, startY);
            tempCtx.lineTo(x, y);
            tempCtx.stroke();
        }
    }
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);

    if (['rect', 'circle', 'triangle', 'line'].includes(tool)) {
        const ctx = getActiveCtx();
        const tempCtx = tempCanvasRef.current?.getContext('2d');
        const { x, y } = getCoordinates(e);
        
        if (ctx && tempCtx && startPoint.current) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();

            const startX = startPoint.current.x;
            const startY = startPoint.current.y;
            const w = x - startX;
            const h = y - startY;

            if (tool === 'rect') {
                if (isFillShape) ctx.fillRect(startX, startY, w, h);
                else ctx.strokeRect(startX, startY, w, h);
            } else if (tool === 'circle') {
                const radius = Math.sqrt(w * w + h * h);
                ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
                if (isFillShape) ctx.fill();
                else ctx.stroke();
            } else if (tool === 'triangle') {
                ctx.moveTo(startX + w / 2, startY);
                ctx.lineTo(startX, startY + h);
                ctx.lineTo(startX + w, startY + h);
                ctx.closePath();
                if (isFillShape) ctx.fill();
                else ctx.stroke();
            } else if (tool === 'line') {
                ctx.moveTo(startX, startY);
                ctx.lineTo(x, y);
                ctx.stroke();
            }
            
            tempCtx.clearRect(0, 0, tempCanvasRef.current!.width, tempCanvasRef.current!.height);
        }
    }
    
    // Finalize Pen/Eraser Stroke
    if (tool === 'pen' || tool === 'eraser') {
        const ctx = getActiveCtx();
        if (ctx) {
            if (brushType === 'normal' || tool === 'eraser') {
                 if (lastPoint.current && lastMidPoint.current) {
                    ctx.beginPath();
                    ctx.moveTo(lastMidPoint.current.x, lastMidPoint.current.y);
                    ctx.lineTo(lastPoint.current.x, lastPoint.current.y);
                    ctx.stroke();
                 }
            }
            // Reset context properties to safe defaults
            ctx.globalAlpha = 1.0;
            ctx.globalCompositeOperation = 'source-over'; 
        }
    }

    startPoint.current = null;
    lastPoint.current = null;
    lastMidPoint.current = null;
  };

  const commitText = () => {
      if (!textInput || !textInput.visible) return;
      
      const ctx = getActiveCtx();
      if (ctx && textInput.text.trim()) {
          saveHistory();
          ctx.globalCompositeOperation = 'source-over';
          ctx.font = `${lineWidth * 5 + 10}px 'Outfit', sans-serif`;
          ctx.fillStyle = color;
          ctx.fillText(textInput.text, textInput.x, textInput.y);
      }
      setTextInput(null);
  };

  const handleClear = () => {
    saveHistory();
    const ctx = getActiveCtx();
    const canvas = layerRefs.current[activeLayerId];
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleCompositeSave = () => {
    if (textInput && textInput.visible) commitText();
    
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = width;
    compositeCanvas.height = height;
    const ctx = compositeCanvas.getContext('2d');
    
    if (!ctx) return;
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    layers.forEach(layer => {
        if (layer.visible) {
            const layerCanvas = layerRefs.current[layer.id];
            if (layerCanvas) {
                ctx.drawImage(layerCanvas, 0, 0);
            }
        }
    });

    onSave(compositeCanvas.toDataURL('image/png'));
  };

  // --- Layer Management ---
  const addLayer = () => {
    const newId = `layer-${Date.now()}`;
    const newLayer = { id: newId, name: `Layer ${layers.length + 1}`, visible: true };
    setLayers([...layers, newLayer]);
    setActiveLayerId(newId);
  };

  const deleteLayer = (id: string) => {
    if (layers.length <= 1) return;
    const newLayers = layers.filter(l => l.id !== id);
    setLayers(newLayers);
    delete historyRef.current[id];
    
    if (activeLayerId === id) {
        setActiveLayerId(newLayers[newLayers.length - 1].id);
    }
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const moveLayer = (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index < layers.length - 1) {
          const newLayers = [...layers];
          const temp = newLayers[index];
          newLayers[index] = newLayers[index + 1];
          newLayers[index + 1] = temp;
          setLayers(newLayers);
      } else if (direction === 'down' && index > 0) {
          const newLayers = [...layers];
          const temp = newLayers[index];
          newLayers[index] = newLayers[index - 1];
          newLayers[index - 1] = temp;
          setLayers(newLayers);
      }
  };

  const ToolButton = ({ t, icon: Icon, label }: { t: ToolType, icon: any, label: string }) => (
    <button 
        onClick={() => { 
            if (textInput?.visible) commitText();
            setTool(t); 
        }}
        className={`p-2 rounded-lg transition-all flex flex-col items-center justify-center gap-1 min-w-[3rem] ${tool === t ? 'bg-pink-600 text-white shadow-lg scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        title={label}
    >
        <Icon size={20} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-[70] bg-[#0B1120] flex flex-col animate-in fade-in duration-200">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageImport} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0B1120] z-20 shadow-md">
        <button onClick={onCancel} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
          <X size={24} />
        </button>
        <h3 className="text-white font-medium flex items-center gap-2">
            <MousePointer2 size={18} className="text-pink-500"/>
            <span className="tracking-wide text-sm uppercase font-bold text-gray-300">Canvas Studio</span>
        </h3>
        <button onClick={handleCompositeSave} className="p-2 text-emerald-400 hover:text-emerald-300 rounded-full hover:bg-emerald-500/10 transition-colors font-bold">
          <Check size={24} />
        </button>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 relative overflow-hidden bg-black touch-none cursor-crosshair">
          <div ref={containerRef} className="absolute inset-0 w-full h-full">
            {layers.map((layer, index) => (
                <canvas
                    key={layer.id}
                    ref={(el) => setLayerRef(layer.id, el)}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ 
                        zIndex: index, 
                        opacity: layer.visible ? 1 : 0 
                    }}
                />
            ))}
            
            <canvas
                ref={tempCanvasRef}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
                className="absolute inset-0 w-full h-full touch-none"
                style={{ zIndex: 100 }}
            />
            
            {textInput && textInput.visible && (
                <input
                    autoFocus
                    value={textInput.text}
                    onChange={(e) => setTextInput({...textInput, text: e.target.value})}
                    onKeyDown={(e) => { if(e.key === 'Enter') commitText(); }}
                    onBlur={() => commitText()}
                    style={{ 
                        position: 'absolute', 
                        left: textInput.x, 
                        top: textInput.y - 20,
                        color: color,
                        fontSize: `${lineWidth * 5 + 10}px`,
                        fontFamily: 'Outfit, sans-serif'
                    }}
                    className="bg-transparent border-b border-white outline-none min-w-[100px] z-[101] shadow-none p-0 m-0"
                    placeholder="Type..."
                />
            )}
          </div>

          {/* Collapsible Tool Options Panel */}
          {showToolOptions && (
             <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-[#151925]/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl z-[101] p-4 animate-in slide-in-from-bottom-2">
                 <div className="flex flex-col gap-4">
                     
                     {/* Dynamic Header */}
                     <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Sliders size={14} /> 
                            {tool === 'text' ? 'Text Properties' : tool === 'eraser' ? 'Eraser Settings' : 'Tool Settings'}
                         </span>
                         <button 
                            onClick={() => setShowToolOptions(false)} 
                            className="text-gray-500 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
                            title="Hide Options"
                         >
                             <ChevronDown size={16} />
                         </button>
                     </div>

                     <div className="flex flex-col gap-4">
                        {/* Brush Style Selector (Only for Pen) */}
                        {tool === 'pen' && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 min-w-[60px]">Style</span>
                                <div className="flex bg-gray-900/50 rounded-lg p-1 gap-1 border border-gray-800">
                                    <button 
                                        onClick={() => setBrushType('normal')}
                                        className={`p-2 rounded transition-colors ${brushType === 'normal' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                                        title="Normal Pen"
                                    >
                                        <Pen size={16} />
                                    </button>
                                    <button 
                                        onClick={() => setBrushType('spray')}
                                        className={`p-2 rounded transition-colors ${brushType === 'spray' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                                        title="Spray Paint"
                                    >
                                        <SprayCan size={16} />
                                    </button>
                                    <button 
                                        onClick={() => setBrushType('chalk')}
                                        className={`p-2 rounded transition-colors ${brushType === 'chalk' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                                        title="Chalk / Sketch"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button 
                                        onClick={() => setBrushType('watercolor')}
                                        className={`p-2 rounded transition-colors ${brushType === 'watercolor' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                                        title="Watercolor"
                                    >
                                        <Highlighter size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Size/Width Slider */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 min-w-[60px]">
                                {tool === 'text' ? 'Font Size' : tool === 'eraser' ? 'Eraser Size' : 'Width'}
                            </span>
                            <div className="flex-1 flex items-center gap-2 bg-gray-900/50 rounded-xl border border-gray-800 px-3 py-2">
                                <Minus size={14} className="text-gray-500" />
                                <input 
                                    type="range" 
                                    min="1"
                                    max="50"
                                    value={lineWidth}
                                    onChange={(e) => setLineWidth(Number(e.target.value))}
                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                />
                                <div className="w-8 h-8 flex items-center justify-center">
                                    {tool === 'text' ? (
                                        <span style={{ fontSize: `${Math.min(24, lineWidth/2 + 10)}px`, color: color }}>Aa</span>
                                    ) : (
                                        <div 
                                            className="rounded-full bg-current transition-all" 
                                            style={{ width: Math.min(24, lineWidth), height: Math.min(24, lineWidth), backgroundColor: tool === 'eraser' ? 'white' : color }} 
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Fill Option for Shapes */}
                        {['rect', 'circle', 'triangle'].includes(tool) && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">Fill Shape</span>
                                <button 
                                    onClick={() => setIsFillShape(!isFillShape)}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${isFillShape ? 'bg-pink-600' : 'bg-gray-700'}`}
                                >
                                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isFillShape ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        )}

                        {/* Color Palette (Hidden for Eraser) */}
                        {tool !== 'eraser' && (
                            <div className="space-y-2">
                                <span className="text-xs text-gray-400">Color</span>
                                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setColor(c)}
                                            className={`w-8 h-8 rounded-full border-[3px] flex-shrink-0 transition-transform shadow-sm ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105 opacity-90 hover:opacity-100'}`}
                                            style={{ backgroundColor: c }}
                                            aria-label={`Color ${c}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                     </div>
                 </div>
             </div>
          )}

          {/* Game Templates Menu */}
          {showGameMenu && (
             <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-64 bg-[#151925]/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl z-[102] animate-in slide-in-from-bottom-4">
                  <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase">Game Templates</span>
                      <button onClick={() => setShowGameMenu(false)} className="text-gray-400 hover:text-white"><X size={14} /></button>
                  </div>
                  <div className="p-2 grid grid-cols-2 gap-2">
                      <button onClick={() => drawGameTemplate('tictactoe')} className="p-3 bg-gray-800 hover:bg-pink-600 hover:text-white rounded-lg flex flex-col items-center gap-2 text-gray-300 transition-colors">
                          <Hash size={20} />
                          <span className="text-xs">Tic Tac Toe</span>
                      </button>
                      <button onClick={() => drawGameTemplate('chess')} className="p-3 bg-gray-800 hover:bg-pink-600 hover:text-white rounded-lg flex flex-col items-center gap-2 text-gray-300 transition-colors">
                          <Grid size={20} />
                          <span className="text-xs">Chess Board</span>
                      </button>
                      <button onClick={() => drawGameTemplate('sudoku')} className="p-3 bg-gray-800 hover:bg-pink-600 hover:text-white rounded-lg flex flex-col items-center gap-2 text-gray-300 transition-colors">
                          <Grid3X3 size={20} />
                          <span className="text-xs">Sudoku</span>
                      </button>
                      <button onClick={() => drawGameTemplate('dots')} className="p-3 bg-gray-800 hover:bg-pink-600 hover:text-white rounded-lg flex flex-col items-center gap-2 text-gray-300 transition-colors">
                          <Circle size={20} />
                          <span className="text-xs">Dots Grid</span>
                      </button>
                  </div>
             </div>
          )}

          {/* Layers Panel */}
          {showLayersPanel && (
              <div className="absolute top-4 right-4 w-64 bg-[#151925]/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl z-[102] flex flex-col max-h-[60%] animate-in slide-in-from-right-4">
                  <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase">Layers</span>
                      <button onClick={addLayer} className="p-1 hover:bg-gray-700 rounded text-emerald-400">
                          <Plus size={16} />
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                      {[...layers].reverse().map((layer, reversedIndex) => {
                          const index = layers.length - 1 - reversedIndex;
                          return (
                            <div 
                                key={layer.id}
                                onClick={() => setActiveLayerId(layer.id)}
                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border ${activeLayerId === layer.id ? 'bg-pink-500/20 border-pink-500/50' : 'bg-gray-800/50 border-transparent hover:bg-gray-700'}`}
                            >
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                                    className={`p-1 rounded hover:bg-white/10 ${layer.visible ? 'text-gray-300' : 'text-gray-600'}`}
                                >
                                    {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                                <span className={`flex-1 text-sm font-medium ${activeLayerId === layer.id ? 'text-pink-300' : 'text-gray-300'}`}>
                                    {layer.name}
                                </span>
                                <div className="flex flex-col gap-0.5">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); moveLayer(index, 'up'); }}
                                        disabled={index === layers.length - 1}
                                        className="text-gray-500 hover:text-white disabled:opacity-30"
                                    >
                                        <ChevronUp size={10} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); moveLayer(index, 'down'); }}
                                        disabled={index === 0}
                                        className="text-gray-500 hover:text-white disabled:opacity-30"
                                    >
                                        <ChevronDown size={10} />
                                    </button>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                                    className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded"
                                    disabled={layers.length === 1}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                          );
                      })}
                  </div>
              </div>
          )}
      </div>

      {/* Toolbar */}
      <div className="bg-[#151925] border-t border-gray-800 p-4 pb-safe z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-3xl mx-auto space-y-4">
            
            {/* Main Toolbar Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Tool Group */}
                <div className="flex gap-1 bg-gray-900/50 p-1.5 rounded-xl border border-gray-800 overflow-x-auto no-scrollbar w-full md:w-auto justify-center">
                    <ToolButton t="pen" icon={Pen} label="Pen" />
                    <ToolButton t="eraser" icon={Eraser} label="Eraser" />
                    <div className="w-px bg-gray-700 mx-1 h-8 self-center"></div>
                    <ToolButton t="fill" icon={PaintBucket} label="Fill" />
                    <ToolButton t="text" icon={Type} label="Text" />
                    <div className="w-px bg-gray-700 mx-1 h-8 self-center"></div>
                    <ToolButton t="rect" icon={Square} label="Rectangle" />
                    <ToolButton t="circle" icon={Circle} label="Circle" />
                    <ToolButton t="triangle" icon={Triangle} label="Triangle" />
                    <ToolButton t="line" icon={Slash} label="Line" />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-center">
                   
                   {/* Tool Settings Toggle */}
                   <button 
                      onClick={() => { setShowToolOptions(!showToolOptions); setShowGameMenu(false); setShowLayersPanel(false); }}
                      className={`p-2 transition-colors rounded-lg flex items-center gap-2 ${showToolOptions ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                      title="Tool Settings"
                   >
                      <Sliders size={20} />
                   </button>

                   <div className="w-px bg-gray-700 mx-1 h-8 self-center"></div>

                   {/* Other Menus */}
                   <div className="flex gap-1">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 transition-colors rounded-lg bg-gray-800 text-gray-400 hover:text-white"
                        title="Import Image to Canvas"
                      >
                         <ImageIcon size={20} />
                      </button>

                      <button 
                        onClick={() => { setShowGameMenu(!showGameMenu); setShowLayersPanel(false); setShowToolOptions(false); }}
                        className={`p-2 transition-colors rounded-lg ${showGameMenu ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                        title="Game Templates"
                      >
                         <Gamepad2 size={20} />
                      </button>

                      <button 
                        onClick={() => { setShowLayersPanel(!showLayersPanel); setShowGameMenu(false); setShowToolOptions(false); }}
                        className={`p-2 transition-colors rounded-lg ${showLayersPanel ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                        title="Layers"
                      >
                         <Layers size={20} />
                      </button>
                      
                      <div className="w-px bg-gray-700 mx-1 h-8 self-center"></div>

                      <button 
                        onClick={handleUndo} 
                        className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-800 rounded-lg"
                        title="Undo (Active Layer)"
                      >
                        <Undo size={20} />
                      </button>
                      <button 
                        onClick={handleClear}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors bg-gray-800 rounded-lg"
                        title="Clear Layer"
                      >
                        <Trash2 size={20} />
                      </button>
                   </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
