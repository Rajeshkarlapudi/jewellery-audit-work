import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import * as jsPDFModule from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as autoTableModule from 'jspdf-autotable';
import { AuditResultRow, AuditSummary } from './types';

/**
 * Resolves jsPDF constructor safely across ESM, CJS, and bundled environments
 */
function getJsPDFConstructor(): any {
  if (typeof jsPDF === 'function') return jsPDF;
  if (typeof (jsPDFModule as any).jsPDF === 'function') return (jsPDFModule as any).jsPDF;
  if (typeof (jsPDFModule as any).default === 'function') return (jsPDFModule as any).default;
  if (typeof jsPDFModule === 'function') return jsPDFModule;
  throw new Error('Could not resolve jsPDF constructor');
}

/**
 * Resolves autoTable function safely across ESM, CJS, and bundled environments
 */
function applyAutoTable(doc: any, options: any) {
  const tableFn =
    typeof autoTable === 'function'
      ? autoTable
      : typeof (autoTableModule as any).default === 'function'
      ? (autoTableModule as any).default
      : autoTableModule;

  if (typeof tableFn === 'function') {
    tableFn(doc, options);
  } else if (typeof doc.autoTable === 'function') {
    doc.autoTable(options);
  } else {
    throw new Error('autoTable is not available');
  }
}

/**
 * Normalizes raw or verbose error messages into user-friendly labels
 */
export function getSimplifiedMessage(rawMsg: string): string {
  if (!rawMsg || rawMsg.trim().toLowerCase() === 'valid') return 'Valid';
  // A row can fail several checks ("a; b"): simplify each reason so none is lost
  if (rawMsg.includes(';')) {
    return rawMsg.split(';').map(m => getSimplifiedMessage(m.trim())).join('; ');
  }
  const lower = rawMsg.toLowerCase();
  if (lower.includes('below allowed range') || lower.includes('rate below') || lower.includes('below min') || lower.includes('below allowed min')) {
    return 'Rate below allowed range';
  }
  if (lower.includes('above allowed range') || lower.includes('rate above') || lower.includes('above max') || lower.includes('above allowed max')) {
    return 'Rate above allowed range';
  }
  if (lower.includes('account') || lower.includes('not allowed') || lower.includes('ledger') || lower.includes('mismatch')) {
    return 'Sales ledger mismatch';
  }
  if (lower.includes('uom') || lower.includes('expected uom')) {
    return 'Invalid UOM';
  }
  return rawMsg;
}

/**
 * Generates an Excel (.xlsx) workbook buffer for audit results
 */
export async function generateExcelReport(results: AuditResultRow[], filterLabel: string = 'All Exception Rows'): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Audit Report');

  // Define headers matching expected Excel structure + Message
  const headers = [
    'SNo', 'Date', 'Voucher No', 'Name of the Party', 'Sales Account',
    'Other Account', 'Product', 'UOM', 'Quantity', 'Free Qty',
    'Unit Rate', 'Gross Amount', 'CGST', 'SGST', 'IGST',
    'GST Amount', 'Net Amount', 'Manual Gross Wt.', 'Auto Gross Wt.',
    'Difference in Gross Wt', 'PAN', 'Address Proof', 'Address', 'Status', 'Message'
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0F766E' } // Teal accent
  };

  results.forEach(r => {
    const t = r.transaction;
    worksheet.addRow([
      t.sNo || '',
      t.date || '',
      t.voucherNo || '',
      t.partyName || '',
      t.salesAccount || '',
      t.otherAccount || '',
      t.product || '',
      t.uom || '',
      t.quantity ?? '',
      t.freeQuantity ?? '',
      t.unitRate ?? '',
      t.grossAmount ?? '',
      t.cgst ?? '',
      t.sgst ?? '',
      t.igst ?? '',
      t.gstAmount ?? '',
      t.netAmount ?? '',
      t.manualGrossWt ?? '',
      t.autoGrossWt ?? '',
      t.diffGrossWt ?? '',
      t.pan || '',
      t.addressProof || '',
      t.address || '',
      r.status,
      getSimplifiedMessage(r.primaryMessage)
    ]);
  });

  // Auto-fit column widths
  worksheet.columns.forEach(col => {
    col.width = 16;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Generates a CSV string for audit results
 */
export function generateCsvReport(results: AuditResultRow[]): string {
  const headers = [
    'SNo', 'Date', 'Voucher No', 'Name of the Party', 'Sales Account',
    'Other Account', 'Product', 'UOM', 'Quantity', 'Free Qty',
    'Unit Rate', 'Gross Amount', 'CGST', 'SGST', 'IGST',
    'GST Amount', 'Net Amount', 'Manual Gross Wt.', 'Auto Gross Wt.',
    'Difference in Gross Wt', 'PAN', 'Address Proof', 'Address', 'Status', 'Message'
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = results.map(r => {
    const t = r.transaction;
    return [
      t.sNo, t.date, t.voucherNo, t.partyName, t.salesAccount,
      t.otherAccount, t.product, t.uom, t.quantity, t.freeQuantity,
      t.unitRate, t.grossAmount, t.cgst, t.sgst, t.igst,
      t.gstAmount, t.netAmount, t.manualGrossWt, t.autoGrossWt,
      t.diffGrossWt, t.pan, t.addressProof, t.address, r.status, getSimplifiedMessage(r.primaryMessage)
    ].map(escapeCsv).join(',');
  });

  return [headers.map(escapeCsv).join(','), ...rows].join('\n');
}

/**
 * Generates a PDF audit report buffer
 */
export function generatePdfReport(results: AuditResultRow[], summary: AuditSummary): Buffer {
  const JSPDF = getJsPDFConstructor();
  const doc = new JSPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header
  doc.setFillColor(15, 118, 110); // Teal
  doc.rect(0, 0, 297, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('HAA ENTERPRISE AUDIT SUITE — JEWELLERY SALES & LEDGER AUDIT', 14, 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 220, 15);

  // Executive Summary Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 28, 269, 28, 2, 2, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Audit Intelligence Summary', 18, 35);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Transactions: ${summary.totalRows.toLocaleString()}`, 18, 43);
  doc.text(`Valid Rows: ${summary.validRows.toLocaleString()}`, 70, 43);
  doc.text(`Error Rows: ${summary.errorRows.toLocaleString()}`, 120, 43);
  doc.text(`Range Deviations: ${summary.rangeDeviationsCount.toLocaleString()}`, 170, 43);
  doc.text(`Invalid UOM: ${summary.invalidUomCount.toLocaleString()}`, 225, 43);

  doc.text(`Sales Ledger Mismatch: ${summary.salesLedgerMismatchCount.toLocaleString()}`, 18, 50);
  doc.text(`Overall Compliance: ${summary.compliancePercentage}%`, 120, 50);

  // Exception Table
  const tableData = results.map(r => {
    const t = r.transaction;
    return [
      t.voucherNo || '',
      t.partyName || '',
      t.salesAccount || '',
      t.product || '',
      t.uom || '',
      t.quantity !== undefined && t.quantity !== null ? String(t.quantity) : '',
      t.unitRate ? `₹${Number(t.unitRate).toLocaleString()}` : '',
      t.netAmount ? `₹${Number(t.netAmount).toLocaleString()}` : '',
      r.status,
      getSimplifiedMessage(r.primaryMessage)
    ];
  });

  applyAutoTable(doc, {
    startY: 60,
    head: [['Voucher No', 'Party Name', 'Sales Account', 'Product', 'UOM', 'Qty', 'Unit Rate', 'Net Amount', 'Status', 'Message']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 30 },
      4: { cellWidth: 15 },
      5: { cellWidth: 12 },
      6: { cellWidth: 20 },
      7: { cellWidth: 22 },
      8: { cellWidth: 18 },
      9: { cellWidth: 55 }
    }
  });

  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}

