import React from 'react';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

export function HardwareInfo({ hardwareInfo }) {
  if (!hardwareInfo) return null;

  const memoryData = {
    labels: ['Used', 'Free'],
    datasets: [
      {
        data: [hardwareInfo.memory.used, hardwareInfo.memory.free],
        backgroundColor: ['#EF4444', '#10B981'],
        borderColor: ['#DC2626', '#059669'],
        borderWidth: 1,
      },
    ],
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 mt-8">
      <h2 className="text-xl font-semibold mb-4">Windows System Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">System</h3>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p><span className="font-medium">OS:</span> Windows {hardwareInfo.os.release}</p>
              <p><span className="font-medium">Uptime:</span> {formatUptime(hardwareInfo.os.uptime)}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">CPU</h3>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p><span className="font-medium">Manufacturer:</span> {hardwareInfo.cpu.manufacturer}</p>
              <p><span className="font-medium">Model:</span> {hardwareInfo.cpu.brand}</p>
              <p><span className="font-medium">Speed:</span> {hardwareInfo.cpu.speed} GHz</p>
              <p><span className="font-medium">Cores:</span> {hardwareInfo.cpu.cores} (Physical: {hardwareInfo.cpu.physicalCores})</p>
              <p><span className="font-medium">Temperature:</span> {hardwareInfo.cpu.temperature}°C</p>
              <div className="mt-2">
                <p className="font-medium mb-1">CPU Usage: {hardwareInfo.cpu.usage}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${hardwareInfo.cpu.usage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">GPU</h3>
            {hardwareInfo.gpu.map((gpu, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm mb-2">
                <p><span className="font-medium">Model:</span> {gpu.model}</p>
                <p><span className="font-medium">Vendor:</span> {gpu.vendor}</p>
                <p><span className="font-medium">VRAM:</span> {gpu.vram} MB</p>
                <p><span className="font-medium">Driver Version:</span> {gpu.driverVersion || 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Memory Usage</h3>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="w-full max-w-xs mx-auto">
                <Pie data={memoryData} options={{ responsive: true }} />
              </div>
              <div className="mt-4 text-center">
                <p><span className="font-medium">Total Memory:</span> {hardwareInfo.memory.total} GB</p>
                <p><span className="font-medium">Used Memory:</span> {hardwareInfo.memory.used} GB</p>
                <p><span className="font-medium">Free Memory:</span> {hardwareInfo.memory.free} GB</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Storage</h3>
            {hardwareInfo.disk.map((drive, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm mb-2">
                <p><span className="font-medium">Drive:</span> {drive.label} ({drive.device})</p>
                <p><span className="font-medium">Type:</span> {drive.type}</p>
                <p><span className="font-medium">Total Size:</span> {drive.size} GB</p>
                <p><span className="font-medium">Used:</span> {drive.used} GB</p>
                <p><span className="font-medium">Available:</span> {drive.available} GB</p>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${(drive.used / drive.size) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}