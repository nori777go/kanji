import React, { useEffect, useState, useImperativeHandle } from 'react';

interface DrawingCanvasProps {
  onClear?: () => void;
  width?: number;
  height?: number;
  className?: string;
  forwardRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

export interface DrawingCanvasHandle {
  clear: () => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onClear, width = 300, height = 300, className, forwardRef }) => {
  const canvasRef = forwardRef;
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = 10;
        context.strokeStyle = '#000000';
        setCtx(context);
        
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [canvasRef, width, height]);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = (event as React.MouseEvent).clientX;
      clientY = (event as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault(); 
    if (!ctx) return;
    const { x, y } = getCoordinates(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (!isDrawing || !ctx) return;
    const { x, y } = getCoordinates(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative border-4 border-brand-blue rounded-3xl overflow-hidden shadow-md bg-white touch-none">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair block"
        />
        
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
            <div className="absolute top-1/2 w-full h-0.5 bg-red-500 border-t border-dashed border-red-500"></div>
            <div className="absolute left-1/2 h-full w-0.5 bg-red-500 border-l border-dashed border-red-500"></div>
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;