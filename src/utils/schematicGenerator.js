export class SchematicGenerator {
  constructor() {
    this.symbolLibrary = {
      resistor: { width: 60, height: 20, pins: 2 },
      capacitor: { width: 30, height: 40, pins: 2 },
      ic: { width: 80, height: 60, pins: 'variable' },
      diode: { width: 40, height: 30, pins: 2 },
      transistor: { width: 50, height: 50, pins: 3 },
      inductor: { width: 50, height: 30, pins: 2 },
      connector: { width: 40, height: 20, pins: 'variable' }
    };
  }

  generateSchematic(components, connections, analysis) {
    const schematic = {
      components: this.layoutComponents(components),
      wires: this.routeWires(connections),
      annotations: this.generateAnnotations(analysis),
      powerRails: this.generatePowerRails(components, connections),
      title: this.generateTitle(analysis.behavior)
    };

    return schematic;
  }

  layoutComponents(components) {
    const layoutComponents = [];
    const gridSize = 100;
    let x = 100, y = 100;
    let maxHeight = 0;

    // Sort components by type for better organization
    const sortedComponents = [...components].sort((a, b) => {
      const order = ['connector', 'ic', 'transistor', 'resistor', 'capacitor', 'diode', 'inductor'];
      return order.indexOf(a.type.toLowerCase()) - order.indexOf(b.type.toLowerCase());
    });

    sortedComponents.forEach((comp, index) => {
      const symbol = this.symbolLibrary[comp.type.toLowerCase()] || this.symbolLibrary.resistor;
      
      // Calculate pins for variable pin components
      let pinCount = symbol.pins;
      if (symbol.pins === 'variable') {
        pinCount = comp.properties.pinCount || 8;
      }

      const layoutComp = {
        id: comp.id,
        type: comp.type,
        symbol: comp.type.toLowerCase(),
        position: { x, y },
        size: { width: symbol.width, height: symbol.height },
        pins: this.generatePins(pinCount, symbol),
        properties: comp.properties,
        label: this.generateComponentLabel(comp),
        value: comp.properties.estimatedValue || ''
      };

      layoutComponents.push(layoutComp);

      // Update position for next component
      x += symbol.width + 50;
      maxHeight = Math.max(maxHeight, symbol.height);

      // Wrap to next row if needed
      if (x > 800) {
        x = 100;
        y += maxHeight + 80;
        maxHeight = 0;
      }
    });

    return layoutComponents;
  }

  generatePins(pinCount, symbol) {
    const pins = [];
    
    if (typeof pinCount === 'number') {
      if (pinCount === 2) {
        // Two-pin component (resistor, capacitor, etc.)
        pins.push(
          { id: 1, position: { x: 0, y: symbol.height / 2 }, side: 'left' },
          { id: 2, position: { x: symbol.width, y: symbol.height / 2 }, side: 'right' }
        );
      } else if (pinCount === 3) {
        // Three-pin component (transistor)
        pins.push(
          { id: 1, position: { x: 0, y: symbol.height / 3 }, side: 'left', label: 'B' },
          { id: 2, position: { x: symbol.width / 2, y: 0 }, side: 'top', label: 'C' },
          { id: 3, position: { x: symbol.width / 2, y: symbol.height }, side: 'bottom', label: 'E' }
        );
      } else {
        // Multi-pin IC
        const pinsPerSide = Math.ceil(pinCount / 2);
        for (let i = 0; i < pinsPerSide && i < pinCount; i++) {
          pins.push({
            id: i + 1,
            position: { x: 0, y: (i + 1) * symbol.height / (pinsPerSide + 1) },
            side: 'left'
          });
        }
        for (let i = 0; i < pinsPerSide && (i + pinsPerSide) < pinCount; i++) {
          pins.push({
            id: i + pinsPerSide + 1,
            position: { x: symbol.width, y: symbol.height - (i + 1) * symbol.height / (pinsPerSide + 1) },
            side: 'right'
          });
        }
      }
    }

    return pins;
  }

  generateComponentLabel(component) {
    const typePrefix = {
      'Resistor': 'R',
      'Capacitor': 'C',
      'IC': 'U',
      'Diode': 'D',
      'Transistor': 'Q',
      'Inductor': 'L',
      'Connector': 'J'
    };

    const prefix = typePrefix[component.type] || 'X';
    const number = component.id.split('_')[1] || '1';
    
    return `${prefix}${number}`;
  }

  routeWires(connections) {
    const wires = [];
    
    connections.forEach((conn, index) => {
      if (conn.type === 'component-component') {
        wires.push({
          id: `wire_${index}`,
          from: { component: conn.component1, pin: 1 },
          to: { component: conn.component2, pin: 1 },
          path: this.calculateWirePath(conn),
          netName: `NET_${index}`
        });
      }
    });

    return wires;
  }

  calculateWirePath(connection) {
    // Simple Manhattan routing
    return [
      { x: 0, y: 0 }, // Will be calculated based on actual component positions
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 200, y: 50 }
    ];
  }

  generatePowerRails(components, connections) {
    const powerRails = [];
    
    // VCC rail
    powerRails.push({
      name: 'VCC',
      voltage: '+5V',
      color: '#FF0000',
      connections: components
        .filter(c => c.type === 'IC' || c.type === 'Transistor')
        .map(c => ({ component: c.id, pin: 'VCC' }))
    });

    // GND rail
    powerRails.push({
      name: 'GND',
      voltage: '0V',
      color: '#000000',
      connections: components
        .filter(c => c.type === 'IC' || c.type === 'Capacitor')
        .map(c => ({ component: c.id, pin: 'GND' }))
    });

    return powerRails;
  }

  generateAnnotations(analysis) {
    const annotations = [];

    // Circuit function annotation
    annotations.push({
      type: 'text',
      position: { x: 50, y: 50 },
      text: `Circuit Function: ${analysis.behavior.estimatedFunction.join(', ')}`,
      style: { fontSize: 14, fontWeight: 'bold' }
    });

    // Power analysis annotation
    annotations.push({
      type: 'text',
      position: { x: 50, y: 80 },
      text: `Estimated Power: ${analysis.powerAnalysis.estimatedTotalPower}mW`,
      style: { fontSize: 12 }
    });

    // Circuit type annotation
    annotations.push({
      type: 'text',
      position: { x: 50, y: 110 },
      text: `Type: ${analysis.behavior.circuitType}`,
      style: { fontSize: 12 }
    });

    return annotations;
  }

  generateTitle(behavior) {
    const functions = behavior.estimatedFunction;
    if (functions.includes('Voltage Regulation')) {
      return 'Power Supply Circuit';
    } else if (functions.includes('Signal Amplification')) {
      return 'Amplifier Circuit';
    } else if (functions.includes('Digital Processing')) {
      return 'Digital Logic Circuit';
    } else if (functions.includes('Signal Filtering')) {
      return 'Filter Circuit';
    }
    
    return 'Electronic Circuit';
  }

  exportToSVG(schematic, width = 1000, height = 800) {
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Background
    svg += `<rect width="${width}" height="${height}" fill="white" stroke="none"/>`;
    
    // Title
    svg += `<text x="20" y="30" font-family="Arial" font-size="18" font-weight="bold">${schematic.title}</text>`;
    
    // Components
    schematic.components.forEach(comp => {
      svg += this.renderComponentSVG(comp);
    });
    
    // Wires
    schematic.wires.forEach(wire => {
      svg += this.renderWireSVG(wire);
    });
    
    // Power rails
    schematic.powerRails.forEach(rail => {
      svg += this.renderPowerRailSVG(rail);
    });
    
    // Annotations
    schematic.annotations.forEach(annotation => {
      svg += this.renderAnnotationSVG(annotation);
    });
    
    svg += '</svg>';
    return svg;
  }

  renderComponentSVG(component) {
    const { x, y } = component.position;
    const { width, height } = component.size;
    
    let svg = `<g transform="translate(${x},${y})">`;
    
    // Component body
    svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="white" stroke="black" stroke-width="2"/>`;
    
    // Component label
    svg += `<text x="${width/2}" y="${height/2 - 5}" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold">${component.label}</text>`;
    
    // Component value
    if (component.value) {
      svg += `<text x="${width/2}" y="${height/2 + 10}" text-anchor="middle" font-family="Arial" font-size="10">${component.value}</text>`;
    }
    
    // Pins
    component.pins.forEach(pin => {
      svg += `<circle cx="${pin.position.x}" cy="${pin.position.y}" r="3" fill="black"/>`;
      if (pin.label) {
        svg += `<text x="${pin.position.x + 8}" y="${pin.position.y + 4}" font-family="Arial" font-size="8">${pin.label}</text>`;
      }
    });
    
    svg += '</g>';
    return svg;
  }

  renderWireSVG(wire) {
    let svg = '';
    const path = wire.path;
    
    if (path.length > 1) {
      svg += `<polyline points="${path.map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="black" stroke-width="2"/>`;
    }
    
    return svg;
  }

  renderPowerRailSVG(rail) {
    let svg = '';
    // Power rails would be rendered as thick lines at top/bottom
    svg += `<line x1="50" y1="150" x2="950" y2="150" stroke="${rail.color}" stroke-width="4"/>`;
    svg += `<text x="20" y="145" font-family="Arial" font-size="12" fill="${rail.color}">${rail.name}</text>`;
    return svg;
  }

  renderAnnotationSVG(annotation) {
    const { x, y } = annotation.position;
    const style = annotation.style || {};
    
    return `<text x="${x}" y="${y}" font-family="Arial" font-size="${style.fontSize || 12}" font-weight="${style.fontWeight || 'normal'}">${annotation.text}</text>`;
  }
}