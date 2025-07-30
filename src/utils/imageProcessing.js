import { ComponentDetector } from './componentDetection';
import { CircuitAnalyzer } from './circuitAnalyzer';
import { SchematicGenerator } from './schematicGenerator';

export async function processImage(imageData) {
  try {
    // Initialize processors
    const detector = new ComponentDetector();
    const analyzer = new CircuitAnalyzer();
    const schematicGen = new SchematicGenerator();

    // Step 1: Detect components and traces
    console.log('Detecting components and traces...');
    const detection = detector.detectComponents(imageData);
    
    // Step 2: Analyze circuit behavior
    console.log('Analyzing circuit behavior...');
    const analysis = analyzer.analyzeCircuit(detection.components, detection.traces);
    
    // Step 3: Generate schematic
    console.log('Generating schematic...');
    const schematic = schematicGen.generateSchematic(
      detection.components, 
      analysis.connections, 
      analysis
    );
    
    return {
      components: detection.components,
      traces: detection.traces,
      analysis: analysis,
      schematic: schematic,
      summary: {
        totalComponents: detection.components.length,
        componentTypes: [...new Set(detection.components.map(c => c.type))],
        estimatedFunction: analysis.behavior.estimatedFunction,
        circuitType: analysis.behavior.circuitType,
        powerConsumption: analysis.powerAnalysis.estimatedTotalPower
      }
    };
  } catch (error) {
    console.error('Error in image processing:', error);
    throw new Error(`Image processing failed: ${error.message}`);
  }
}