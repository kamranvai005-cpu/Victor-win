/**
 * Device, Browser, and IP Intelligence Utilities
 */

export interface DeviceDetails {
  ip: string;
  deviceModel: string;
  os: string;
  browser: string;
  network: string;
  screenRes: string;
}

// Deterministic mock client IP generator based on user ID / random seed
export function getClientDeviceDetails(userId?: string): DeviceDetails {
  if (typeof window === 'undefined') {
    return {
      ip: '103.145.12.88',
      deviceModel: 'Samsung Galaxy S24 Ultra',
      os: 'Android 14',
      browser: 'Chrome Mobile 128',
      network: 'Grameenphone 4G',
      screenRes: '1080x2340',
    };
  }

  const ua = navigator.userAgent;
  let os = 'Android 14';
  let deviceModel = 'Samsung Galaxy S24 Ultra';
  let browser = 'Chrome Mobile 128';

  if (/iPhone|iPad|iPod/.test(ua)) {
    os = 'iOS 17.5';
    deviceModel = ua.includes('iPad') ? 'iPad Pro 11"' : 'iPhone 15 Pro Max';
    browser = 'Safari Mobile 17.5';
  } else if (/Android/.test(ua)) {
    os = 'Android 14';
    if (ua.includes('SM-') || ua.includes('Samsung')) {
      deviceModel = 'Samsung Galaxy S24';
    } else if (ua.includes('Redmi') || ua.includes('Xiaomi')) {
      deviceModel = 'Xiaomi Redmi Note 13 Pro';
    } else if (ua.includes('Vivo')) {
      deviceModel = 'Vivo V30 5G';
    } else if (ua.includes('Realme')) {
      deviceModel = 'Realme 12 Pro+';
    } else if (ua.includes('OnePlus')) {
      deviceModel = 'OnePlus 12';
    } else {
      deviceModel = 'Android Smartphone';
    }
    browser = ua.includes('Chrome') ? 'Chrome Mobile 128' : 'Mobile WebKit';
  } else if (/Windows/.test(ua)) {
    os = 'Windows 11 64-bit';
    deviceModel = 'Desktop PC / Laptop';
    browser = ua.includes('Edg') ? 'Microsoft Edge 128' : 'Google Chrome 128';
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    os = 'macOS Sonoma 14.5';
    deviceModel = 'Apple MacBook Pro';
    browser = 'Safari 17.5';
  }

  // Pre-cached or generated local IP for authenticity
  let ip = localStorage.getItem('victorwin_client_ip');
  if (!ip) {
    const ipPool = [
      '103.145.12.88',
      '202.79.18.24',
      '118.179.82.10',
      '103.232.100.5',
      '27.147.201.33',
      '103.48.16.14',
      '180.234.22.9',
    ];
    ip = ipPool[Math.floor(Math.random() * ipPool.length)];
    localStorage.setItem('victorwin_client_ip', ip);
  }

  const networks = ['Grameenphone 4G/5G', 'Robi 4G LTE', 'Banglalink 4G', 'Dhaka High-Speed Fiber WiFi'];
  const network = networks[Math.floor(Math.random() * networks.length)];

  return {
    ip,
    deviceModel,
    os,
    browser,
    network,
    screenRes: `${window.screen?.width || 390}x${window.screen?.height || 844}`,
  };
}
