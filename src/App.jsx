import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { processImage } from './utils/imageProcessing';
import { getHardwareInfo } from './utils/hardwareInfo';
import { HardwareInfo } from './components/HardwareInfo';
import { CircuitAnalysis } from './components/CircuitAnalysis';
import { SchematicViewer } from './components/SchematicViewer';

function App() {
  const [image, setImage] = useState(null);
  const [results, setResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hardwareInfo, setHardwareInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('components');

  useEffect(() => {
    const fetchHardwareInfo = async () => {
      const info = await getHardwareInfo();
      setHardwareInfo(info);
    };

    fetchHardwareInfo();
    const interval = setInterval(fetchHardwareInfo, 2000);

    return () => clearInterval(interval);
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = async () => {
      setImage(reader.result);
      setIsProcessing(true);

      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        try {
          const processingResults = await processImage(imageData);
          setResults(processingResults);
        } catch (error) {
          console.error('Error processing image:', error);
          alert('Error processing image: ' + error.message);
        } finally {
          setIsProcessing(false);
        }
      };
      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    }
  });

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Advanced Circuit Board Analyzer
        </h1>

        <div className="bg-white shadow rounded-lg p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-lg text-blue-500">Drop the image here...</p>
            ) : (
              <p className="text-lg text-gray-500">
                Drag and drop a circuit board image for advanced analysis
              </p>
            )}
          </div>

          {image && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Uploaded Image</h2>
              <img
                src={image}
                alt="Circuit Board"
                className="max-w-full rounded-lg shadow"
              />
            </div>
          )}

          {isProcessing && (
            <div className="mt-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-lg text-blue-500 mt-2">
                  Analyzing circuit board... This may take a moment.
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Detecting components, analyzing behavior, and generating schematic...
                </p>
              </div>
            </div>
          )}

          {results && (
            <div className="mt-8">
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
                <h2 className="text-2xl font-bold mb-4">Analysis Complete!</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.summary.totalComponents}</div>
                    <div className="text-sm opacity-90">Components</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.summary.componentTypes.length}</div>
                    <div className="text-sm opacity-90">Types</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.summary.powerConsumption}mW</div>
                    <div className="text-sm opacity-90">Est. Power</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{results.summary.circuitType}</div>
                    <div className="text-sm opacity-90">Circuit Type</div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'components', label: 'Components', count: results.components.length },
                    { id: 'analysis', label: 'Circuit Analysis' },
                    { id: 'schematic', label: 'Schematic' },
                    { id: 'netlist', label: 'Netlist' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                      {tab.count && (
                        <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'components' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.components.map((component, index) => (
                      <div key={index} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{component.id}</h4>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            {component.type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Confidence:</span> {(component.confidence * 100).toFixed(1)}%</p>
                          {component.properties.estimatedValue && (
                            <p><span className="font-medium">Value:</span> {component.properties.estimatedValue}</p>
                          )}
                          {component.properties.powerRating && (
                            <p><span className="font-medium">Power:</span> {component.properties.powerRating}</p>
                          )}
                          {component.properties.package && (
                            <p><span className="font-medium">Package:</span> {component.properties.package}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'analysis' && (
                  <CircuitAnalysis analysis={results.analysis} />
                )}

                {activeTab === 'schematic' && (
                  <SchematicViewer schematic={results.schematic} />
                )}

                {activeTab === 'netlist' && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Circuit Netlist</h3>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <pre>
{`* Generated Circuit Netlist
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <HardwareInfo hardwareInfo={hardwareInfo} />
        </div>
      </div>
    </div>
  );
}

export default App;