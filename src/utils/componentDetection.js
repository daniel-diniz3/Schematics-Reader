import cv from 'opencv.js';

export class ComponentDetector {
  constructor() {
    this.componentTemplates = {
      resistor: { minArea: 200, maxArea: 2000, aspectRatio: [2, 6], circularity: [0.3, 0.7] },
      capacitor: { minArea: 150, maxArea: 1500, aspectRatio: [0.8, 2.5], circularity: [0.6, 1.0] },
      ic: { minArea: 500, maxArea: 5000, aspectRatio: [0.5, 3.0], circularity: [0.4, 0.8] },
      diode: { minArea: 100, maxArea: 800, aspectRatio: [1.5, 4.0], circularity: [0.4, 0.7] },
      transistor: { minArea: 150, maxArea: 1200, aspectRatio: [0.8, 2.0], circularity: [0.5, 0.9] },
      inductor: { minArea: 300, maxArea: 2500, aspectRatio: [0.9, 1.8], circularity: [0.7, 1.0] },
      connector: { minArea: 400, maxArea: 3000, aspectRatio: [0.3, 8.0], circularity: [0.2, 0.6] }
    };
  }

  detectComponents(imageData) {
    let src = cv.matFromImageData(imageData);
    let gray = new cv.Mat();
    let binary = new cv.Mat();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    // Preprocessing
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
    cv.adaptiveThreshold(gray, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

    // Find contours
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    const components = [];
    const traces = [];

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      const perimeter = cv.arcLength(contour, true);
      
      if (area < 50) continue; // Filter noise

      const rect = cv.boundingRect(contour);
      const aspectRatio = rect.width / rect.height;
      const circularity = 4 * Math.PI * area / (perimeter * perimeter);

      // Classify component
      const component = this.classifyComponent(area, aspectRatio, circularity, rect);
      
      if (component) {
        component.position = { x: rect.x + rect.width/2, y: rect.y + rect.height/2 };
        component.bounds = rect;
        component.id = `comp_${i}`;
        components.push(component);
      } else if (this.isTrace(area, aspectRatio, rect)) {
        traces.push({
          id: `trace_${i}`,
          path: this.extractTracePath(contour),
          width: Math.min(rect.width, rect.height)
        });
      }

      contour.delete();
    }

    // Cleanup
    src.delete();
    gray.delete();
    binary.delete();
    contours.delete();
    hierarchy.delete();

    return { components, traces };
  }

  classifyComponent(area, aspectRatio, circularity, rect) {
    for (const [type, template] of Object.entries(this.componentTemplates)) {
      if (area >= template.minArea && area <= template.maxArea &&
          aspectRatio >= template.aspectRatio[0] && aspectRatio <= template.aspectRatio[1] &&
          circularity >= template.circularity[0] && circularity <= template.circularity[1]) {
        
        return {
          type: type.charAt(0).toUpperCase() + type.slice(1),
          confidence: this.calculateConfidence(area, aspectRatio, circularity, template),
          properties: this.estimateProperties(type, rect, area)
        };
      }
    }
    return null;
  }

  calculateConfidence(area, aspectRatio, circularity, template) {
    const areaScore = 1 - Math.abs(area - (template.minArea + template.maxArea) / 2) / ((template.maxArea - template.minArea) / 2);
    const ratioScore = 1 - Math.abs(aspectRatio - (template.aspectRatio[0] + template.aspectRatio[1]) / 2) / ((template.aspectRatio[1] - template.aspectRatio[0]) / 2);
    const circScore = 1 - Math.abs(circularity - (template.circularity[0] + template.circularity[1]) / 2) / ((template.circularity[1] - template.circularity[0]) / 2);
    
    return Math.max(0, Math.min(1, (areaScore + ratioScore + circScore) / 3));
  }

  estimateProperties(type, rect, area) {
    const properties = {};
    
    switch (type) {
      case 'resistor':
        properties.estimatedValue = this.estimateResistorValue(rect, area);
        properties.powerRating = this.estimatePowerRating(area);
        break;
      case 'capacitor':
        properties.estimatedCapacitance = this.estimateCapacitance(rect, area);
        properties.voltage = this.estimateVoltageRating(area);
        break;
      case 'ic':
        properties.pinCount = this.estimatePinCount(rect);
        properties.package = this.estimatePackageType(rect);
        break;
      case 'diode':
        properties.type = 'Standard';
        properties.estimatedVoltage = '0.7V';
        break;
      case 'transistor':
        properties.type = this.estimateTransistorType(rect);
        properties.package = rect.width > rect.height ? 'TO-220' : 'TO-92';
        break;
    }
    
    return properties;
  }

  estimateResistorValue(rect, area) {
    const size = Math.sqrt(area);
    if (size < 20) return '1/8W (100Ω - 1kΩ)';
    if (size < 40) return '1/4W (1kΩ - 10kΩ)';
    return '1/2W (10kΩ - 100kΩ)';
  }

  estimateCapacitance(rect, area) {
    const size = Math.sqrt(area);
    if (size < 25) return '1pF - 100pF';
    if (size < 50) return '100pF - 1µF';
    return '1µF - 1000µF';
  }

  estimatePinCount(rect) {
    const perimeter = 2 * (rect.width + rect.height);
    return Math.round(perimeter / 10); // Rough estimate
  }

  estimatePackageType(rect) {
    const aspectRatio = rect.width / rect.height;
    if (aspectRatio > 2) return 'SOP';
    if (aspectRatio < 0.5) return 'SOP';
    return rect.width > 50 ? 'DIP' : 'SMD';
  }

  estimatePowerRating(area) {
    if (area < 300) return '1/8W';
    if (area < 600) return '1/4W';
    if (area < 1200) return '1/2W';
    return '1W+';
  }

  estimateVoltageRating(area) {
    if (area < 200) return '16V';
    if (area < 500) return '25V';
    if (area < 1000) return '50V';
    return '100V+';
  }

  estimateTransistorType(rect) {
    return rect.width > rect.height ? 'Power' : 'Signal';
  }

  isTrace(area, aspectRatio, rect) {
    return (aspectRatio > 5 || aspectRatio < 0.2) && area > 100 && 
           (rect.width > 100 || rect.height > 100);
  }

  extractTracePath(contour) {
    const points = [];
    for (let i = 0; i < contour.rows; i++) {
      const point = contour.data32S.slice(i * 2, i * 2 + 2);
      points.push({ x: point[0], y: point[1] });
    }
    return points;
  }
}