import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { processImage } from './utils/imageProcessing';
import { getHardwareInfo } from './utils/hardwareInfo';
import { HardwareInfo } from './components/HardwareInfo';

function App() {
  const [image, setImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hardwareInfo, setHardwareInfo] = useState(null);

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
          const components = await processImage(imageData);
          
          const componentCounts = components.reduce((acc, comp) => {
            acc[comp.type] = (acc[comp.type] || 0) + 1;
            return acc;
          }, {});

          setAnalysis({
            components: Object.entries(componentCounts).map(([type, count]) => ({
              type,
              count
            }))
          });
        } catch (error) {
          console.error('Error processing image:', error);
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
          Circuit Board Analyzer
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
                Drag and drop a circuit board image, or click to select
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
              <p className="text-lg text-center text-blue-500">
                Processing image...
              </p>
            </div>
          )}

          {analysis && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Detected Components:</h3>
                <ul className="space-y-2">
                  {analysis.components.map((component, index) => (
                    <li key={index} className="flex justify-between items-center p-2 hover:bg-gray-100 rounded">
                      <span className="text-gray-800">{component.type}</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {component.count}
                      </span>
                    </li>
                  ))}
                </ul>
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