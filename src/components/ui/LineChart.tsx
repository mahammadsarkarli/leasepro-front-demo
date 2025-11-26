import React, { useRef, useEffect, useState } from 'react';

interface LineChartProps {
  data: Array<{
    month: string;
    value: number;
    label?: string;
  }>;
  title: string;
  color?: string;
  height?: number;
}

const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  title, 
  color = 'bg-blue-500',
  height = 300 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number, data: any} | null>(null);

  // Convert month format from "2024-12" to "Dek 24"
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyun', 
                       'İyul', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex]} ${year.slice(-2)}`;
  };

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw line chart
    ctx.strokeStyle = '#2563eb'; // blue-600
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw lines
    ctx.beginPath();
    data.forEach((item, index) => {
      const x = (index / (data.length - 1)) * (canvas.width - 40) + 20;
      const y = canvas.height - 40 - (((item.value - minValue) / range) * (canvas.height - 80));
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#2563eb'; // blue-600
    data.forEach((item, index) => {
      const x = (index / (data.length - 1)) * (canvas.width - 40) + 20;
      const y = canvas.height - 40 - (((item.value - minValue) / range) * (canvas.height - 80));
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // White border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Add hover event listeners
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Check if mouse is near any point
      let foundPoint = null;
      data.forEach((item, index) => {
        const x = (index / (data.length - 1)) * (canvas.width - 40) + 20;
        const y = canvas.height - 40 - (((item.value - minValue) / range) * (canvas.height - 80));
        
        const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
        if (distance <= 15) { // 15px hover radius
          foundPoint = { x: mouseX, y: mouseY, data: item };
        }
      });

      setHoveredPoint(foundPoint);
    };

    const handleMouseLeave = () => {
      setHoveredPoint(null);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>Veri bulunamadı</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500">
          <span>{maxValue.toLocaleString()}</span>
          <span>{Math.round((maxValue + minValue) / 2).toLocaleString()}</span>
          <span>{minValue.toLocaleString()}</span>
        </div>

        {/* Chart Area */}
        <div className="absolute left-12 right-0 top-0 bottom-8">
          {/* Grid Lines */}
          <div className="absolute inset-0">
            {[0, 25, 50, 75, 100].map((percent, index) => (
              <div
                key={index}
                className="absolute w-full border-t border-gray-100"
                style={{ top: `${percent}%` }}
              />
            ))}
          </div>

          {/* Canvas for line chart */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 10 }}
          />

          {/* Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none z-20"
              style={{
                left: `${hoveredPoint.x + 10}px`,
                top: `${hoveredPoint.y - 40}px`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="font-semibold">{formatMonth(hoveredPoint.data.month)}</div>
              <div className="text-gray-300">{hoveredPoint.data.value.toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-12 right-0 h-8 flex justify-between items-center">
          {data.map((item, index) => (
            <div key={index} className="text-xs text-gray-500 text-center">
              {formatMonth(item.month)}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Min: {minValue.toLocaleString()}</span>
          <span>Max: {maxValue.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default LineChart;
