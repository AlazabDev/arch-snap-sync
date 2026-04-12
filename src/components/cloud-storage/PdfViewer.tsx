import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Pen,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Palette,
  PenLine,
  Trash2,
  Save,
  X,
} from "lucide-react";

interface Annotation {
  id: string;
  type: "draw" | "text" | "signature";
  points?: { x: number; y: number }[];
  text?: string;
  x: number;
  y: number;
  color: string;
  size: number;
  fontSize?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  fileName: string;
}

type Tool = "none" | "draw" | "text" | "signature" | "eraser";

const COLORS = ["#000000", "#e11d48", "#2563eb", "#16a34a", "#d97706", "#7c3aed"];
const SIZES = [2, 4, 6, 8];

export default function PdfViewer({ open, onOpenChange, pdfUrl, fileName }: Props) {
  const [tool, setTool] = useState<Tool>("none");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDraw, setCurrentDraw] = useState<{ x: number; y: number }[]>([]);
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [signatureMode, setSignatureMode] = useState(false);
  const [signaturePoints, setSignaturePoints] = useState<{ x: number; y: number }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const signCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Draw annotations on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotations.forEach((ann) => {
      if (ann.type === "draw" || ann.type === "signature") {
        if (!ann.points || ann.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
      } else if (ann.type === "text") {
        ctx.font = `${ann.fontSize || 16}px 'Segoe UI', Tahoma, sans-serif`;
        ctx.fillStyle = ann.color;
        ctx.fillText(ann.text || "", ann.x, ann.y);
      }
    });

    // Draw current stroke
    if (isDrawing && currentDraw.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(currentDraw[0].x, currentDraw[0].y);
      for (let i = 1; i < currentDraw.length; i++) {
        ctx.lineTo(currentDraw[i].x, currentDraw[i].y);
      }
      ctx.stroke();
    }
  }, [annotations, isDrawing, currentDraw, color, brushSize]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Resize canvas to match container
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      if (!canvas || !overlay) return;
      canvas.width = overlay.clientWidth;
      canvas.height = overlay.clientHeight;
      redrawCanvas();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [open, zoom, isFullscreen, redrawCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const pushUndo = () => {
    setUndoStack((prev) => [...prev, [...annotations]]);
    setRedoStack([]);
  };

  const handlePointerDown = (e: React.MouseEvent) => {
    if (tool === "draw") {
      setIsDrawing(true);
      const pos = getPos(e);
      setCurrentDraw([pos]);
    } else if (tool === "text") {
      const pos = getPos(e);
      setTextPosition(pos);
      setTextInput("");
    } else if (tool === "eraser") {
      // Find and remove annotation near click
      const pos = getPos(e);
      const threshold = 15;
      const idx = annotations.findIndex((ann) => {
        if (ann.type === "text") {
          return Math.abs(ann.x - pos.x) < 60 && Math.abs(ann.y - pos.y) < 20;
        }
        if (ann.points) {
          return ann.points.some(
            (p) => Math.abs(p.x - pos.x) < threshold && Math.abs(p.y - pos.y) < threshold
          );
        }
        return false;
      });
      if (idx >= 0) {
        pushUndo();
        setAnnotations((prev) => prev.filter((_, i) => i !== idx));
      }
    }
  };

  const handlePointerMove = (e: React.MouseEvent) => {
    if (tool === "draw" && isDrawing) {
      const pos = getPos(e);
      setCurrentDraw((prev) => [...prev, pos]);
    }
  };

  const handlePointerUp = () => {
    if (tool === "draw" && isDrawing && currentDraw.length > 1) {
      pushUndo();
      const newAnn: Annotation = {
        id: crypto.randomUUID(),
        type: "draw",
        points: currentDraw,
        x: currentDraw[0].x,
        y: currentDraw[0].y,
        color,
        size: brushSize,
      };
      setAnnotations((prev) => [...prev, newAnn]);
    }
    setIsDrawing(false);
    setCurrentDraw([]);
  };

  const addTextAnnotation = () => {
    if (!textInput.trim() || !textPosition) return;
    pushUndo();
    const newAnn: Annotation = {
      id: crypto.randomUUID(),
      type: "text",
      x: textPosition.x,
      y: textPosition.y,
      text: textInput,
      color,
      size: brushSize,
      fontSize: 16,
    };
    setAnnotations((prev) => [...prev, newAnn]);
    setTextPosition(null);
    setTextInput("");
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, [...annotations]]);
    setAnnotations(prev);
    setUndoStack((u) => u.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, [...annotations]]);
    setAnnotations(next);
    setRedoStack((r) => r.slice(0, -1));
  };

  const clearAll = () => {
    if (annotations.length === 0) return;
    pushUndo();
    setAnnotations([]);
  };

  // Signature pad
  const startSignature = () => {
    setSignatureMode(true);
    setSignaturePoints([]);
  };

  const drawSignatureCanvas = useCallback(() => {
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (signaturePoints.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(signaturePoints[0].x, signaturePoints[0].y);
    for (let i = 1; i < signaturePoints.length; i++) {
      ctx.lineTo(signaturePoints[i].x, signaturePoints[i].y);
    }
    ctx.stroke();
  }, [signaturePoints, color]);

  useEffect(() => {
    drawSignatureCanvas();
  }, [drawSignatureCanvas]);

  const handleSignPointerDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setSignaturePoints([{ x: e.clientX - rect.left, y: e.clientY - rect.top }]);
  };

  const handleSignPointerMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setSignaturePoints((prev) => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top }]);
  };

  const handleSignPointerUp = () => {
    setIsDrawing(false);
  };

  const applySignature = () => {
    if (signaturePoints.length < 2) return;
    pushUndo();
    // Place signature in center of canvas
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.width / 2 : 200;
    const cy = canvas ? canvas.height - 100 : 400;

    // Normalize signature points to fit
    const minX = Math.min(...signaturePoints.map((p) => p.x));
    const minY = Math.min(...signaturePoints.map((p) => p.y));
    const maxX = Math.max(...signaturePoints.map((p) => p.x));
    const maxY = Math.max(...signaturePoints.map((p) => p.y));
    const sw = maxX - minX || 1;
    const sh = maxY - minY || 1;
    const scale = Math.min(200 / sw, 60 / sh);

    const normalized = signaturePoints.map((p) => ({
      x: cx - 100 + (p.x - minX) * scale,
      y: cy - 30 + (p.y - minY) * scale,
    }));

    const newAnn: Annotation = {
      id: crypto.randomUUID(),
      type: "signature",
      points: normalized,
      x: cx,
      y: cy,
      color,
      size: 3,
    };
    setAnnotations((prev) => [...prev, newAnn]);
    setSignatureMode(false);
    setSignaturePoints([]);
  };

  const handleDownloadAnnotated = () => {
    // Open original PDF for download
    window.open(pdfUrl, "_blank");
  };

  const toolBtn = (t: Tool, icon: React.ReactNode, label: string) => (
    <TooltipProvider key={t}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant={tool === t ? "default" : "ghost"}
            className="h-8 w-8"
            onClick={() => setTool(tool === t ? "none" : t)}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <>
      <Dialog open={open && !signatureMode} onOpenChange={onOpenChange}>
        <DialogContent
          dir="rtl"
          className={`${isFullscreen ? "max-w-[100vw] h-[100vh] w-[100vw] m-0 rounded-none" : "max-w-5xl h-[85vh]"} flex flex-col p-0 gap-0`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <PenLine className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm truncate max-w-[200px]">{fileName}</span>
            </div>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsFullscreen(!isFullscreen)}>
                      {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isFullscreen ? "تصغير" : "ملء الشاشة"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b bg-background flex-wrap">
            {toolBtn("draw", <Pen className="w-3.5 h-3.5" />, "رسم حر")}
            {toolBtn("text", <Type className="w-3.5 h-3.5" />, "إضافة نص")}
            {toolBtn("eraser", <Eraser className="w-3.5 h-3.5" />, "ممحاة")}

            <Separator orientation="vertical" className="h-6 mx-1" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={startSignature}>
                    <PenLine className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>إضافة توقيع</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Colors */}
            <div className="flex items-center gap-0.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    color === c ? "border-foreground scale-125" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Brush sizes */}
            <div className="flex items-center gap-0.5">
              {SIZES.map((s) => (
                <button
                  key={s}
                  className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
                    brushSize === s ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setBrushSize(s)}
                >
                  <span
                    className="rounded-full bg-foreground"
                    style={{ width: s + 2, height: s + 2 }}
                  />
                </button>
              ))}
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleUndo} disabled={undoStack.length === 0}>
                    <Undo2 className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>تراجع</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleRedo} disabled={redoStack.length === 0}>
                    <Redo2 className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>إعادة</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={clearAll}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>مسح الكل</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex-1" />

            {/* Zoom */}
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(50, z - 10))}>
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs font-mono w-10 text-center">{zoom}%</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(200, z + 10))}>
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={handleDownloadAnnotated}>
              <Download className="w-3 h-3" />
              تحميل
            </Button>
          </div>

          {/* PDF + Canvas overlay */}
          <div className="flex-1 overflow-auto bg-muted/20 relative" ref={containerRef}>
            <div
              ref={overlayRef}
              className="relative mx-auto"
              style={{
                width: `${zoom}%`,
                minHeight: "100%",
              }}
            >
              <iframe
                src={`${pdfUrl}#toolbar=0`}
                className="w-full h-full absolute inset-0 border-0"
                style={{ minHeight: isFullscreen ? "calc(100vh - 100px)" : "calc(85vh - 100px)" }}
                title="PDF Preview"
              />
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full ${
                  tool !== "none" ? "cursor-crosshair z-10" : "pointer-events-none z-10"
                }`}
                style={{ minHeight: isFullscreen ? "calc(100vh - 100px)" : "calc(85vh - 100px)" }}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
              />
            </div>

            {/* Text input popup */}
            {textPosition && tool === "text" && (
              <div
                className="absolute z-20 bg-background border rounded-lg shadow-lg p-2 flex items-center gap-2"
                style={{ left: textPosition.x + 10, top: textPosition.y + 10 }}
              >
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="اكتب النص هنا..."
                  className="h-8 text-sm w-48"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTextAnnotation();
                    if (e.key === "Escape") setTextPosition(null);
                  }}
                />
                <Button size="sm" className="h-8" onClick={addTextAnnotation}>
                  إضافة
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setTextPosition(null)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-4 py-1.5 border-t bg-muted/20 text-xs text-muted-foreground">
            <span>
              {annotations.length > 0
                ? `${annotations.length} عنصر مضاف`
                : "اختر أداة للبدء في التعديل"}
            </span>
            <span>
              {tool === "draw" && "🖊 وضع الرسم"}
              {tool === "text" && "📝 وضع النص — اضغط على المستند لإضافة نص"}
              {tool === "eraser" && "🧹 وضع الممحاة — اضغط على عنصر لحذفه"}
              {tool === "none" && "👆 وضع المعاينة"}
            </span>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Pad Dialog */}
      <Dialog open={signatureMode} onOpenChange={(o) => !o && setSignatureMode(false)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="w-4 h-4" />
              إضافة توقيع
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">ارسم توقيعك في المربع أدناه</p>
            <div className="border-2 border-dashed rounded-lg overflow-hidden bg-background">
              <canvas
                ref={signCanvasRef}
                width={400}
                height={150}
                className="w-full cursor-crosshair"
                onMouseDown={handleSignPointerDown}
                onMouseMove={handleSignPointerMove}
                onMouseUp={handleSignPointerUp}
                onMouseLeave={handleSignPointerUp}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {COLORS.slice(0, 3).map((c) => (
                  <button
                    key={c}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      color === c ? "border-foreground scale-125" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSignaturePoints([])}
              >
                <Eraser className="w-3 h-3 ml-1" />
                مسح
              </Button>
              <Button size="sm" onClick={applySignature} disabled={signaturePoints.length < 2}>
                <Save className="w-3 h-3 ml-1" />
                تطبيق التوقيع
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
