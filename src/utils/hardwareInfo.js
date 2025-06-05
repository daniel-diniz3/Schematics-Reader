import si from 'systeminformation';
import os from 'node-os-utils';
import windowsCpu from 'windows-cpu';

export async function getHardwareInfo() {
  try {
    // Windows-specific CPU monitoring
    const cpuLoad = os.cpu;
    const [cpu, gpu, memory, temp, disk] = await Promise.all([
      si.cpu(),
      si.graphics(),
      si.mem(),
      new Promise((resolve) => {
        windowsCpu.throttleTemperature((error, data) => {
          if (error) resolve({ main: 'N/A' });
          else resolve({ main: data });
        });
      }),
      si.fsSize()
    ]);

    const cpuUsage = await cpuLoad.usage();

    // Get Windows-specific drive information
    const formattedDisks = disk.map(drive => ({
      device: drive.fs,
      label: drive.mount, // Windows drive letter
      size: Math.round(drive.size / (1024 * 1024 * 1024)),
      used: Math.round(drive.used / (1024 * 1024 * 1024)),
      available: Math.round(drive.available / (1024 * 1024 * 1024)),
      type: drive.type // NTFS, FAT32, etc.
    }));

    return {
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        speed: cpu.speed,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        temperature: typeof temp.main === 'number' ? temp.main : 'N/A',
        usage: Math.round(cpuUsage)
      },
      gpu: gpu.controllers.map(controller => ({
        model: controller.model,
        vram: controller.vram,
        vendor: controller.vendor,
        driverVersion: controller.driverVersion // Windows-specific driver info
      })),
      memory: {
        total: Math.round(memory.total / (1024 * 1024 * 1024)),
        free: Math.round(memory.free / (1024 * 1024 * 1024)),
        used: Math.round(memory.used / (1024 * 1024 * 1024))
      },
      disk: formattedDisks,
      os: {
        platform: process.platform,
        release: os.os.release(),
        uptime: os.os.uptime()
      }
    };
  } catch (error) {
    console.error('Error fetching hardware info:', error);
    return null;
  }
}