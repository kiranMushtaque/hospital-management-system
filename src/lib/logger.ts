/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'logs', 'error.log');

// Ensure log directory exists
try {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
} catch (e) {
  // Silent fallback for cloud environments with read-only file systems
}

export function logError(level: 'ERROR' | 'WARN' | 'INFO', route: string, message: string) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] [${route}] ${message}\n`;
  
  console.error(`🚨 [HMS Logger]: ${logLine.trim()}`);

  try {
    fs.appendFileSync(LOG_FILE, logLine);
  } catch (err) {
    // If permission or folder lock prevents appending, let standard console log write it out
  }
}
