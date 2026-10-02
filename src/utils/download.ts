import { WidgetConfig } from '../types';
import { generatePowerShellScript, generateAllInOneBat } from './powerShellGenerator';

function triggerFileDownload(content: string | (string | Uint8Array)[], filename: string) {
  const parts = Array.isArray(content) ? content : [content];
  const blob = new Blob(parts, { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadPS1(config: WidgetConfig) {
  // UTF-8 with BOM to ensure Korean text doesn't break in legacy Windows PowerShell 5.1
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  triggerFileDownload([bom, generatePowerShellScript(config)], 'NEWSchoolWidget.ps1');
}

export function downloadAllInOneBat(config: WidgetConfig) {
  // IMPORTANT: DO NOT add BOM to .bat files as cmd.exe cannot parse BOM!
  triggerFileDownload(generateAllInOneBat(config), 'NEWSchoolWidget_원클릭_실행.bat');
}

export async function copyScriptToClipboard(config: WidgetConfig) {
  await navigator.clipboard.writeText(generatePowerShellScript(config));
}
