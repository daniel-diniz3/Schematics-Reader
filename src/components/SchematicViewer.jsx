import React, { useRef, useEffect, useState } from 'react';
import { Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export function SchematicViewer({ schematic, onExport }) {
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (schematic && svgRef.current) {
      renderSchematic();
    }
  }, [schematic, zoom, pan]);

  const renderSchematic = () => {
    if (!svgRef.current || !schematic) return;

    const svg = svgRef.current;
    svg.innerHTML = '';

    // Set viewBox with zoom and pan
    const viewBoxWidth = 1000 / zoom;
    const viewBoxHeight = 800 / zoom;
    const viewBoxX = -pan.x / zoom;
    const viewBoxY = -pan.y / zoom;
    
    svg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);

    // Background
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', '#f8f9fa');
    background.setAttribute('stroke', 'none');
    svg.appendChild(background);

    // Grid
    renderGrid(svg);

    // Title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', '20');
    title.setAttribute('y', '40');
    title.setAttribute('font-family', 'Arial, sans-serif');
    title.setAttribute('font-size', '20');
    title.setAttribute('font-weight', 'bold');
    title.setAttribute('fill', '#1f2937');
    title.textContent = schematic.title || 'Electronic Circuit Schematic';
    svg.appendChild(title);

    // Components
    schematic.components.forEach(component => {
      renderComponent(svg, component);
    });

    // Wires
    schematic.wires.forEach(wire => {
      renderWire(svg, wire);
    });

    // Power rails
    schematic.powerRails.forEach(rail => {
      renderPowerRail(svg, rail);
    });

    // Annotations
    schematic.annotations.forEach(annotation => {
      renderAnnotation(svg, annotation);
    });
  };

  const renderGrid = (svg) => {
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('opacity', '0.1');

    for (let x = 0; x <= 1000; x += 50) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', '0');
      line.setAttribute('x2', x);
      line.setAttribute('y2', '800');
      line.setAttribute('stroke', '#6b7280');
      line.setAttribute('stroke-width', '1');
      gridGroup.appendChild(line);
    }

    for (let y = 0; y <= 800; y += 50) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', y);
      line.setAttribute('x2', '1000');
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#6b7280');
      line.setAttribute('stroke-width', '1');
      gridGroup.appendChild(line);
    }

    svg.appendChild(gridGroup);
  };

  const renderComponent = (svg, component) => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('transform', `translate(${component.position.x}, ${component.position.y})`);

    // Component symbol based on type
    switch (component.symbol) {
      case 'resistor':
        renderResistor(group, component);
        break;
      case 'capacitor':
        renderCapacitor(group, component);
        break;
      case 'ic':
        renderIC(group, component);
        break;
      case 'diode':
        renderDiode(group, component);
        break;
      case 'transistor':
        renderTransistor(group, component);
        break;
      case 'inductor':
        renderInductor(group, component);
        break;
      default:
        renderGenericComponent(group, component);
    }

    svg.appendChild(group);
  };

  const renderResistor = (group, component) => {
    const { width, height } = component.size;
    
    // Resistor zigzag pattern
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M 0 ${height/2} L 10 ${height/2} L 15 ${height/2-8} L 25 ${height/2+8} L 35 ${height/2-8} L 45 ${height/2+8} L 50 ${height/2} L ${width} ${height/2}`;
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#1f2937');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    group.appendChild(path);

    // Label and value
    addComponentText(group, component, width, height);
  };

  const renderCapacitor = (group, component) => {
    const { width, height } = component.size;
    
    // Two parallel lines
    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', width/2 - 3);
    line1.setAttribute('y1', height/4);
    line1.setAttribute('x2', width/2 - 3);
    line1.setAttribute('y2', 3*height/4);
    line1.setAttribute('stroke', '#1f2937');
    line1.setAttribute('stroke-width', '3');
    group.appendChild(line1);

    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', width/2 + 3);
    line2.setAttribute('y1', height/4);
    line2.setAttribute('x2', width/2 + 3);
    line2.setAttribute('y2', 3*height/4);
    line2.setAttribute('stroke', '#1f2937');
    line2.setAttribute('stroke-width', '3');
    group.appendChild(line2);

    // Connection lines
    const conn1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    conn1.setAttribute('x1', '0');
    conn1.setAttribute('y1', height/2);
    conn1.setAttribute('x2', width/2 - 3);
    conn1.setAttribute('y2', height/2);
    conn1.setAttribute('stroke', '#1f2937');
    conn1.setAttribute('stroke-width', '2');
    group.appendChild(conn1);

    const conn2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    conn2.setAttribute('x1', width/2 + 3);
    conn2.setAttribute('y1', height/2);
    conn2.setAttribute('x2', width);
    conn2.setAttribute('y2', height/2);
    conn2.setAttribute('stroke', '#1f2937');
    conn2.setAttribute('stroke-width', '2');
    group.appendChild(conn2);

    addComponentText(group, component, width, height);
  };

  const renderIC = (group, component) => {
    const { width, height } = component.size;
    
    // IC body
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '10');
    rect.setAttribute('y', '10');
    rect.setAttribute('width', width - 20);
    rect.setAttribute('height', height - 20);
    rect.setAttribute('fill', '#f3f4f6');
    rect.setAttribute('stroke', '#1f2937');
    rect.setAttribute('stroke-width', '2');
    group.appendChild(rect);

    // Pin 1 indicator
    const pin1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pin1.setAttribute('cx', '15');
    pin1.setAttribute('cy', '15');
    pin1.setAttribute('r', '3');
    pin1.setAttribute('fill', '#1f2937');
    group.appendChild(pin1);

    // Pins
    component.pins.forEach(pin => {
      const pinElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      if (pin.side === 'left') {
        pinElement.setAttribute('x1', '0');
        pinElement.setAttribute('y1', pin.position.y);
        pinElement.setAttribute('x2', '10');
        pinElement.setAttribute('y2', pin.position.y);
      } else if (pin.side === 'right') {
        pinElement.setAttribute('x1', width - 10);
        pinElement.setAttribute('y1', pin.position.y);
        pinElement.setAttribute('x2', width);
        pinElement.setAttribute('y2', pin.position.y);
      }
      pinElement.setAttribute('stroke', '#1f2937');
      pinElement.setAttribute('stroke-width', '2');
      group.appendChild(pinElement);
    });

    addComponentText(group, component, width, height);
  };

  const renderDiode = (group, component) => {
    const { width, height } = component.size;
    
    // Diode triangle and line
    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    triangle.setAttribute('points', `${width/2-8},${height/2} ${width/2+8},${height/2-8} ${width/2+8},${height/2+8}`);
    triangle.setAttribute('fill', '#1f2937');
    group.appendChild(triangle);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', width/2 + 8);
    line.setAttribute('y1', height/2 - 10);
    line.setAttribute('x2', width/2 + 8);
    line.setAttribute('y2', height/2 + 10);
    line.setAttribute('stroke', '#1f2937');
    line.setAttribute('stroke-width', '3');
    group.appendChild(line);

    // Connection lines
    const conn1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    conn1.setAttribute('x1', '0');
    conn1.setAttribute('y1', height/2);
    conn1.setAttribute('x2', width/2 - 8);
    conn1.setAttribute('y2', height/2);
    conn1.setAttribute('stroke', '#1f2937');
    conn1.setAttribute('stroke-width', '2');
    group.appendChild(conn1);

    const conn2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    conn2.setAttribute('x1', width/2 + 8);
    conn2.setAttribute('y1', height/2);
    conn2.setAttribute('x2', width);
    conn2.setAttribute('y2', height/2);
    conn2.setAttribute('stroke', '#1f2937');
    conn2.setAttribute('stroke-width', '2');
    group.appendChild(conn2);

    addComponentText(group, component, width, height);
  };

  const renderTransistor = (group, component) => {
    const { width, height } = component.size;
    
    // Transistor circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', width/2);
    circle.setAttribute('cy', height/2);
    circle.setAttribute('r', Math.min(width, height)/3);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', '#1f2937');
    circle.setAttribute('stroke-width', '2');
    group.appendChild(circle);

    // Base line
    const baseLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    baseLine.setAttribute('x1', width/2 - 8);
    baseLine.setAttribute('y1', height/2 - 8);
    baseLine.setAttribute('x2', width/2 - 8);
    baseLine.setAttribute('y2', height/2 + 8);
    baseLine.setAttribute('stroke', '#1f2937');
    baseLine.setAttribute('stroke-width', '3');
    group.appendChild(baseLine);

    // Collector and Emitter lines
    const collectorLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    collectorLine.setAttribute('x1', width/2 - 8);
    collectorLine.setAttribute('y1', height/2 - 5);
    collectorLine.setAttribute('x2', width/2 + 8);
    collectorLine.setAttribute('y2', height/2 - 12);
    collectorLine.setAttribute('stroke', '#1f2937');
    collectorLine.setAttribute('stroke-width', '2');
    group.appendChild(collectorLine);

    const emitterLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    emitterLine.setAttribute('x1', width/2 - 8);
    emitterLine.setAttribute('y1', height/2 + 5);
    emitterLine.setAttribute('x2', width/2 + 8);
    emitterLine.setAttribute('y2', height/2 + 12);
    emitterLine.setAttribute('stroke', '#1f2937');
    emitterLine.setAttribute('stroke-width', '2');
    group.appendChild(emitterLine);

    addComponentText(group, component, width, height);
  };

  const renderInductor = (group, component) => {
    const { width, height } = component.size;
    
    // Inductor coils
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M 0 ${height/2} L 10 ${height/2} 
               C 15 ${height/2-8} 20 ${height/2-8} 25 ${height/2}
               C 30 ${height/2+8} 35 ${height/2+8} 40 ${height/2}
               L ${width} ${height/2}`;
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#1f2937');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    group.appendChild(path);

    addComponentText(group, component, width, height);
  };

  const renderGenericComponent = (group, component) => {
    const { width, height } = component.size;
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', '#f3f4f6');
    rect.setAttribute('stroke', '#1f2937');
    rect.setAttribute('stroke-width', '2');
    group.appendChild(rect);

    addComponentText(group, component, width, height);
  };

  const addComponentText = (group, component, width, height) => {
    // Component label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', width/2);
    label.setAttribute('y', height + 15);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-family', 'Arial, sans-serif');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('fill', '#1f2937');
    label.textContent = component.label;
    group.appendChild(label);

    // Component value
    if (component.value) {
      const value = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      value.setAttribute('x', width/2);
      value.setAttribute('y', height + 30);
      value.setAttribute('text-anchor', 'middle');
      value.setAttribute('font-family', 'Arial, sans-serif');
      value.setAttribute('font-size', '10');
      value.setAttribute('fill', '#6b7280');
      value.textContent = component.value;
      group.appendChild(value);
    }
  };

  const renderWire = (svg, wire) => {
    if (!wire.path || wire.path.length < 2) return;

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    const points = wire.path.map(p => `${p.x},${p.y}`).join(' ');
    polyline.setAttribute('points', points);
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', '#059669');
    polyline.setAttribute('stroke-width', '2');
    svg.appendChild(polyline);
  };

  const renderPowerRail = (svg, rail) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '50');
    line.setAttribute('y1', rail.name === 'VCC' ? '70' : '750');
    line.setAttribute('x2', '950');
    line.setAttribute('y2', rail.name === 'VCC' ? '70' : '750');
    line.setAttribute('stroke', rail.color);
    line.setAttribute('stroke-width', '4');
    svg.appendChild(line);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '20');
    text.setAttribute('y', rail.name === 'VCC' ? '65' : '745');
    text.setAttribute('font-family', 'Arial, sans-serif');
    text.setAttribute('font-size', '12');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', rail.color);
    text.textContent = `${rail.name} (${rail.voltage})`;
    svg.appendChild(text);
  };

  const renderAnnotation = (svg, annotation) => {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', annotation.position.x);
    text.setAttribute('y', annotation.position.y);
    text.setAttribute('font-family', 'Arial, sans-serif');
    text.setAttribute('font-size', annotation.style?.fontSize || '12');
    text.setAttribute('font-weight', annotation.style?.fontWeight || 'normal');
    text.setAttribute('fill', '#1f2937');
    text.textContent = annotation.text;
    svg.appendChild(text);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleExport = () => {
    if (svgRef.current && onExport) {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'circuit-schematic.svg';
      link.click();
      
      URL.revokeObjectURL(url);
    }
  };

  if (!schematic) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No schematic data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Circuit Schematic</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            title="Reset View"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handleExport}
            className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
            title="Export SVG"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="p-4">
        <div 
          className="border border-gray-300 rounded overflow-hidden cursor-move"
          style={{ height: '600px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ display: 'block' }}
          />
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>Use mouse to pan • Scroll to zoom • Click buttons to control view</p>
        </div>
      </div>
    </div>
  );
}