export class CircuitAnalyzer {
  constructor() {
    this.connectionThreshold = 50; // pixels
  }

  analyzeCircuit(components, traces) {
    const connections = this.findConnections(components, traces);
    const netlist = this.generateNetlist(components, connections);
    const circuitBehavior = this.analyzeCircuitBehavior(components, connections);
    
    return {
      connections,
      netlist,
      behavior: circuitBehavior,
      powerAnalysis: this.analyzePowerDistribution(components, connections),
      signalFlow: this.analyzeSignalFlow(components, connections)
    };
  }

  findConnections(components, traces) {
    const connections = [];
    const nets = [];
    let netId = 0;

    // Find component-to-trace connections
    components.forEach(comp => {
      const connectedTraces = traces.filter(trace => 
        this.isComponentConnectedToTrace(comp, trace)
      );
      
      connectedTraces.forEach(trace => {
        connections.push({
          type: 'component-trace',
          component: comp.id,
          trace: trace.id,
          connectionPoint: this.findConnectionPoint(comp, trace)
        });
      });
    });

    // Find component-to-component connections via traces
    components.forEach(comp1 => {
      components.forEach(comp2 => {
        if (comp1.id !== comp2.id) {
          const sharedTraces = this.findSharedTraces(comp1, comp2, traces, connections);
          if (sharedTraces.length > 0) {
            connections.push({
              type: 'component-component',
              component1: comp1.id,
              component2: comp2.id,
              via: sharedTraces,
              estimatedResistance: this.estimateTraceResistance(sharedTraces)
            });
          }
        }
      });
    });

    return connections;
  }

  isComponentConnectedToTrace(component, trace) {
    const compCenter = component.position;
    return trace.path.some(point => 
      Math.sqrt(Math.pow(point.x - compCenter.x, 2) + Math.pow(point.y - compCenter.y, 2)) < this.connectionThreshold
    );
  }

  findConnectionPoint(component, trace) {
    const compCenter = component.position;
    let closestPoint = trace.path[0];
    let minDistance = Infinity;

    trace.path.forEach(point => {
      const distance = Math.sqrt(Math.pow(point.x - compCenter.x, 2) + Math.pow(point.y - compCenter.y, 2));
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });

    return closestPoint;
  }

  findSharedTraces(comp1, comp2, traces, connections) {
    const comp1Traces = connections
      .filter(conn => conn.component === comp1.id && conn.type === 'component-trace')
      .map(conn => conn.trace);
    
    const comp2Traces = connections
      .filter(conn => conn.component === comp2.id && conn.type === 'component-trace')
      .map(conn => conn.trace);

    return comp1Traces.filter(traceId => comp2Traces.includes(traceId));
  }

  generateNetlist(components, connections) {
    const netlist = {
      components: components.map(comp => ({
        id: comp.id,
        type: comp.type,
        value: comp.properties.estimatedValue || 'Unknown',
        pins: this.estimateComponentPins(comp, connections)
      })),
      nets: this.extractNets(connections)
    };

    return netlist;
  }

  estimateComponentPins(component, connections) {
    const componentConnections = connections.filter(conn => 
      conn.component === component.id || 
      conn.component1 === component.id || 
      conn.component2 === component.id
    );

    return componentConnections.map((conn, index) => ({
      pin: index + 1,
      net: conn.trace || `net_${conn.component1}_${conn.component2}`
    }));
  }

  extractNets(connections) {
    const nets = new Map();
    let netId = 0;

    connections.forEach(conn => {
      if (conn.type === 'component-trace') {
        if (!nets.has(conn.trace)) {
          nets.set(conn.trace, {
            id: `NET_${netId++}`,
            components: []
          });
        }
        nets.get(conn.trace).components.push(conn.component);
      }
    });

    return Array.from(nets.values());
  }

  analyzeCircuitBehavior(components, connections) {
    const behavior = {
      circuitType: this.identifyCircuitType(components),
      estimatedFunction: this.estimateCircuitFunction(components, connections),
      powerSupply: this.identifyPowerSupply(components, connections),
      signalProcessing: this.identifySignalProcessing(components),
      controlLogic: this.identifyControlLogic(components)
    };

    return behavior;
  }

  identifyCircuitType(components) {
    const componentTypes = components.map(c => c.type.toLowerCase());
    
    if (componentTypes.includes('ic') && componentTypes.includes('capacitor')) {
      return 'Digital/Mixed Signal';
    } else if (componentTypes.includes('transistor') && componentTypes.includes('resistor')) {
      return 'Analog Amplifier';
    } else if (componentTypes.includes('diode') && componentTypes.includes('capacitor')) {
      return 'Power Supply/Rectifier';
    } else if (componentTypes.includes('inductor')) {
      return 'Filter/Oscillator';
    }
    
    return 'General Purpose';
  }

  estimateCircuitFunction(components, connections) {
    const functions = [];
    
    // Power regulation detection
    if (this.hasPowerRegulationPattern(components)) {
      functions.push('Voltage Regulation');
    }
    
    // Amplification detection
    if (this.hasAmplificationPattern(components)) {
      functions.push('Signal Amplification');
    }
    
    // Filtering detection
    if (this.hasFilteringPattern(components)) {
      functions.push('Signal Filtering');
    }
    
    // Digital logic detection
    if (this.hasDigitalLogicPattern(components)) {
      functions.push('Digital Processing');
    }

    return functions.length > 0 ? functions : ['Unknown Function'];
  }

  hasPowerRegulationPattern(components) {
    const hasRegulatorIC = components.some(c => 
      c.type === 'IC' && c.properties.pinCount <= 8
    );
    const hasCapacitors = components.filter(c => c.type === 'Capacitor').length >= 2;
    const hasInductor = components.some(c => c.type === 'Inductor');
    
    return hasRegulatorIC && hasCapacitors && hasInductor;
  }

  hasAmplificationPattern(components) {
    const hasTransistor = components.some(c => c.type === 'Transistor');
    const hasResistors = components.filter(c => c.type === 'Resistor').length >= 2;
    const hasCapacitors = components.some(c => c.type === 'Capacitor');
    
    return hasTransistor && hasResistors && hasCapacitors;
  }

  hasFilteringPattern(components) {
    const hasInductor = components.some(c => c.type === 'Inductor');
    const hasCapacitor = components.some(c => c.type === 'Capacitor');
    const hasResistor = components.some(c => c.type === 'Resistor');
    
    return (hasInductor && hasCapacitor) || (hasCapacitor && hasResistor);
  }

  hasDigitalLogicPattern(components) {
    const hasICs = components.filter(c => c.type === 'IC').length >= 1;
    const hasDecouplingCaps = components.filter(c => 
      c.type === 'Capacitor' && c.properties.estimatedCapacitance?.includes('pF')
    ).length >= 2;
    
    return hasICs && hasDecouplingCaps;
  }

  identifyPowerSupply(components, connections) {
    const powerComponents = components.filter(c => 
      c.type === 'Diode' || 
      (c.type === 'Capacitor' && c.properties.voltage) ||
      (c.type === 'IC' && c.properties.pinCount <= 8)
    );

    if (powerComponents.length >= 3) {
      return {
        type: 'Switching Power Supply',
        estimatedVoltage: '3.3V - 12V',
        components: powerComponents.map(c => c.id)
      };
    } else if (powerComponents.length >= 1) {
      return {
        type: 'Linear Regulator',
        estimatedVoltage: '5V',
        components: powerComponents.map(c => c.id)
      };
    }

    return { type: 'External Power', estimatedVoltage: 'Unknown' };
  }

  identifySignalProcessing(components) {
    const signalComponents = components.filter(c => 
      c.type === 'Capacitor' || c.type === 'Resistor' || c.type === 'Inductor'
    );

    if (signalComponents.length >= 3) {
      return {
        type: 'Active Filtering',
        bandwidth: 'Unknown',
        components: signalComponents.map(c => c.id)
      };
    }

    return { type: 'None detected' };
  }

  identifyControlLogic(components) {
    const logicComponents = components.filter(c => 
      c.type === 'IC' && c.properties.pinCount > 8
    );

    if (logicComponents.length >= 1) {
      return {
        type: 'Microcontroller/Processor',
        components: logicComponents.map(c => c.id)
      };
    }

    return { type: 'None detected' };
  }

  analyzePowerDistribution(components, connections) {
    // Estimate power consumption and distribution
    const powerAnalysis = {
      estimatedTotalPower: 0,
      powerRails: [],
      criticalPaths: []
    };

    components.forEach(comp => {
      let estimatedPower = 0;
      
      switch (comp.type) {
        case 'IC':
          estimatedPower = comp.properties.pinCount > 20 ? 500 : 100; // mW
          break;
        case 'Resistor':
          estimatedPower = comp.properties.powerRating === '1W+' ? 1000 : 250; // mW
          break;
        case 'Transistor':
          estimatedPower = comp.properties.type === 'Power' ? 2000 : 100; // mW
          break;
        default:
          estimatedPower = 10; // mW
      }
      
      powerAnalysis.estimatedTotalPower += estimatedPower;
    });

    return powerAnalysis;
  }

  analyzeSignalFlow(components, connections) {
    // Analyze signal flow through the circuit
    const signalFlow = {
      inputStages: [],
      processingStages: [],
      outputStages: [],
      feedbackPaths: []
    };

    // Identify input/output components based on position and connections
    components.forEach(comp => {
      const connectionCount = connections.filter(conn => 
        conn.component === comp.id || 
        conn.component1 === comp.id || 
        conn.component2 === comp.id
      ).length;

      if (connectionCount === 1) {
        if (comp.position.x < 200) {
          signalFlow.inputStages.push(comp.id);
        } else {
          signalFlow.outputStages.push(comp.id);
        }
      } else {
        signalFlow.processingStages.push(comp.id);
      }
    });

    return signalFlow;
  }

  estimateTraceResistance(traces) {
    // Rough estimation based on trace length and width
    let totalLength = 0;
    let avgWidth = 0;
    
    traces.forEach(traceId => {
      // This would need actual trace data
      totalLength += 100; // mm (estimated)
      avgWidth += 0.2; // mm (estimated)
    });
    
    avgWidth /= traces.length;
    
    // Copper resistance calculation (very rough)
    const resistivity = 1.7e-8; // ohm-meter for copper
    const thickness = 0.035e-3; // 35µm standard PCB thickness
    
    return (resistivity * (totalLength * 1e-3)) / (avgWidth * 1e-3 * thickness);
  }
}