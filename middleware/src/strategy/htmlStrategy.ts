import { IFormatStrategy } from '../../../shared/interfaces';
import { IProcessedLogData, OutputFormat } from '../../../shared/types';

export class HtmlStrategy implements IFormatStrategy {
  public getFormatType(): OutputFormat {
    return OutputFormat.HTML;
  }

  /**
   * HTML özel karakterlerini güvenli hale getirir (XSS koruması).
   * Log alanları kullanıcı/sistem kaynaklı veri içerebileceğinden
   * doğrudan HTML'e gömülmeden önce bu fonksiyondan geçirilmelidir.
   */
  private escapeHtml(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  public format(logs: IProcessedLogData[]): string {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>System Logs Dashboard</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background-color: #f4f6f9; color: #333; }
    h1 { color: #1e3a8a; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; background-color: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-radius: 6px; overflow: hidden; margin-top: 15px; }
    th, td { padding: 12px 15px; text-align: left; font-size: 13.5px; }
    th { background-color: #007acc; color: white; font-weight: bold; text-transform: uppercase; }
    tr { border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) { background-color: #f9fafb; }
    tr:hover { background-color: #f3f4f6; }
    .badge { display: inline-block; padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 9999px; text-transform: uppercase; }
    .badge-critical { background-color: #ef4444; color: white; }
    .badge-error { background-color: #f59e0b; color: white; }
    .badge-normal { background-color: #10b981; color: white; }
    .critical-row { border-left: 5px solid #ef4444; background-color: #fef2f2 !important; }
  </style>
</head>
<body>
  <h1>System Logs Dashboard - System Admin View</h1>
  <p>Processed Log Count: <strong>${logs.length}</strong></p>
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Level</th>
        <th>Full Name</th>
        <th>TC No</th>
        <th>Credit Card</th>
        <th>Email</th>
        <th>Message</th>
        <th>Sender ID</th>
        <th>Transaction No</th>
        <th>Debug</th>
      </tr>
    </thead>
    <tbody>`;

    for (const log of logs) {
      const badge = log.level === 'CRITICAL' ? 'badge-critical' : 'badge-error';
      const rowClass = log.level === 'CRITICAL' ? 'class="critical-row"' : '';

      html += `
      <tr ${rowClass}>
        <td>${this.escapeHtml(log.timestamp)}</td>
        <td><span class="badge ${badge}">${this.escapeHtml(log.level)}</span></td>
        <td>${this.escapeHtml(log.fullName)}</td>
        <td><code>${this.escapeHtml(log.tcNo)}</code></td>
        <td><code>${this.escapeHtml(log.creditCard)}</code></td>
        <td>${this.escapeHtml(log.email)}</td>
        <td>${this.escapeHtml(log.message)}</td>
        <td>${this.escapeHtml(log.senderId || 'N/A')}</td>
        <td><code>${this.escapeHtml(log.transactionNo || 'N/A')}</code></td>
        <td><code style="font-size: 11px; white-space: pre-wrap; word-break: break-all;">${this.escapeHtml(log.debug)}</code></td>
      </tr>`;
    }

    html += `
    </tbody>
  </table>
</body>
</html>`;
    return html;
  }
}
