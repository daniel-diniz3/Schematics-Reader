import React from 'react';
import { Cpu, Zap, Activity, Settings, Info } from 'lucide-react';

export function CircuitAnalysis({ analysis }) {
  if (!analysis) return null;

  const { behavior, powerAnalysis, signalFlow, netlist } = analysis;

  return (
    <div className="space-y-6">
      {/* Circuit Behavior Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Activity className="w-6 h-6 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold">Circuit Behavior Analysis</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Circuit Type</h4>
            <p className="text-blue-800">{behavior.circuitType}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Primary Functions</h4>
            <ul className="text-green-800 space-y-1">
              {behavior.estimatedFunction.map((func, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  {func}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">Power Supply</h4>
            <p className="text-purple-800 font-medium">{behavior.powerSupply.type}</p>
            <p className="text-purple-600 text-sm">{behavior.powerSupply.estimatedVoltage}</p>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-medium text-orange-900 mb-2">Signal Processing</h4>
            <p className="text-orange-800">{behavior.signalProcessing.type}</p>
          </div>
        </div>
      </div>

      {/* Power Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Zap className="w-6 h-6 text-yellow-500 mr-2" />
          <h3 className="text-lg font-semibold">Power Analysis</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-800">
              {powerAnalysis.estimatedTotalPower}mW
            </div>
            <div className="text-yellow-600 text-sm">Estimated Total Power</div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-800">
              {powerAnalysis.powerRails.length}
            </div>
            <div className="text-red-600 text-sm">Power Rails</div>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-indigo-800">
              {powerAnalysis.criticalPaths.length}
            </div>
            <div className="text-indigo-600 text-sm">Critical Paths</div>
          </div>
        </div>
      </div>

      {/* Signal Flow Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Settings className="w-6 h-6 text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold">Signal Flow Analysis</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Input Stages</h4>
            <div className="space-y-1">
              {signalFlow.inputStages.map((stage, index) => (
                <div key={index} className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                  {stage}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Processing Stages</h4>
            <div className="space-y-1">
              {signalFlow.processingStages.map((stage, index) => (
                <div key={index} className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {stage}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Output Stages</h4>
            <div className="space-y-1">
              {signalFlow.outputStages.map((stage, index) => (
                <div key={index} className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                  {stage}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Netlist Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Cpu className="w-6 h-6 text-green-500 mr-2" />
          <h3 className="text-lg font-semibold">Circuit Netlist</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Components</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {netlist.components.map((comp, index) => (
                <div key={index} className="bg-gray-50 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-gray-900">{comp.id}</span>
                      <span className="text-gray-600 ml-2">({comp.type})</span>
                    </div>
                    <span className="text-sm text-gray-500">{comp.value}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Pins: {comp.pins.length}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Networks</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {netlist.nets.map((net, index) => (
                <div key={index} className="bg-gray-50 rounded p-3">
                  <div className="font-medium text-gray-900">{net.id}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Connected: {net.components.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Notes */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Analysis Notes</h4>
            <p className="text-blue-800 text-sm">
              This analysis is based on computer vision detection and pattern recognition. 
              For precise circuit analysis, please verify component values and connections manually. 
              The estimated values and functions are approximations based on component size, shape, and layout patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}