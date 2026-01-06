import { PaymentResponseDTO, PaymentType } from '@/lib/api/paymentApi';
import { format, parseISO } from 'date-fns';

const typeLabels: Record<PaymentType, string> = {
  RENT: 'Monthly Rent Payment',
  DEPOSIT: 'Security Deposit',
  DEPOSIT_AND_FIRST_RENT: 'Security Deposit & First Month Rent',
  LATE_FEE: 'Late Fee',
  MAINTENANCE_FEE: 'Maintenance Fee',
  OTHER: 'Other Payment',
};

interface ReceiptData {
  payment: PaymentResponseDTO;
  propertyTitle?: string;
  propertyAddress?: string;
  landlordName?: string;
}

export function generateReceiptHTML(data: ReceiptData): string {
  const { payment, propertyTitle, propertyAddress, landlordName } = data;
  
  const paymentDate = payment.paymentDate ? format(parseISO(payment.paymentDate), 'MMMM d, yyyy') : 'N/A';
  const dueDate = payment.dueDate ? format(parseISO(payment.dueDate), 'MMMM d, yyyy') : 'N/A';
  const receiptNumber = `RCP-${payment.id.toString().padStart(6, '0')}`;
  const currentDate = format(new Date(), 'MMMM d, yyyy');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - ${receiptNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    .receipt-container {
      max-width: 800px;
      margin: 40px auto;
      background: white;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: 1px;
    }
    .header .subtitle {
      font-size: 14px;
      opacity: 0.9;
    }
    .receipt-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 8px 20px;
      border-radius: 20px;
      margin-top: 16px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .content {
      padding: 40px;
    }
    .receipt-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .receipt-info-item {
      text-align: left;
    }
    .receipt-info-item:last-child {
      text-align: right;
    }
    .receipt-info-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .receipt-info-value {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px dashed #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #6b7280;
    }
    .detail-value {
      font-weight: 500;
      color: #1f2937;
    }
    .amount-section {
      background: #f9fafb;
      padding: 24px;
      border-radius: 8px;
      margin: 30px 0;
    }
    .amount-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .amount-row.total {
      border-top: 2px solid #e5e7eb;
      margin-top: 12px;
      padding-top: 16px;
    }
    .amount-row.total .amount-label,
    .amount-row.total .amount-value {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .status-completed {
      background: #d1fae5;
      color: #065f46;
    }
    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }
    .status-failed {
      background: #fee2e2;
      color: #991b1b;
    }
    .footer {
      background: #f9fafb;
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .footer-legal {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 16px;
    }
    .watermark {
      text-align: center;
      padding: 20px;
      color: #d1d5db;
      font-size: 11px;
    }
    @media print {
      body {
        background: white;
      }
      .receipt-container {
        box-shadow: none;
        margin: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <h1>PAYMENT RECEIPT</h1>
      <div class="subtitle">Official Payment Confirmation</div>
      <div class="receipt-badge">
        <span class="status-badge status-${payment.status.toLowerCase()}">${payment.status}</span>
      </div>
    </div>
    
    <div class="content">
      <div class="receipt-info">
        <div class="receipt-info-item">
          <div class="receipt-info-label">Receipt Number</div>
          <div class="receipt-info-value">${receiptNumber}</div>
        </div>
        <div class="receipt-info-item">
          <div class="receipt-info-label">Date Issued</div>
          <div class="receipt-info-value">${currentDate}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Payment Details</div>
        <div class="detail-row">
          <span class="detail-label">Payment ID</span>
          <span class="detail-value">#${payment.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Lease ID</span>
          <span class="detail-value">#${payment.leaseId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Type</span>
          <span class="detail-value">${typeLabels[payment.type] || payment.type}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Date</span>
          <span class="detail-value">${paymentDate}</span>
        </div>
        ${payment.dueDate ? `
        <div class="detail-row">
          <span class="detail-label">Due Date</span>
          <span class="detail-value">${dueDate}</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="detail-label">Payment Method</span>
          <span class="detail-value">${payment.paymentMethod || 'Not specified'}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Payer Information</div>
        <div class="detail-row">
          <span class="detail-label">Payer Name</span>
          <span class="detail-value">${payment.payerName}</span>
        </div>
        ${propertyTitle ? `
        <div class="detail-row">
          <span class="detail-label">Property</span>
          <span class="detail-value">${propertyTitle}</span>
        </div>
        ` : ''}
        ${propertyAddress ? `
        <div class="detail-row">
          <span class="detail-label">Property Address</span>
          <span class="detail-value">${propertyAddress}</span>
        </div>
        ` : ''}
        ${landlordName ? `
        <div class="detail-row">
          <span class="detail-label">Paid To</span>
          <span class="detail-value">${landlordName}</span>
        </div>
        ` : ''}
      </div>

      ${payment.description ? `
      <div class="section">
        <div class="section-title">Description</div>
        <p style="color: #6b7280; font-size: 14px;">${payment.description}</p>
      </div>
      ` : ''}

      <div class="amount-section">
        <div class="amount-row">
          <span class="amount-label">Payment Type</span>
          <span class="amount-value">${typeLabels[payment.type] || payment.type}</span>
        </div>
        <div class="amount-row total">
          <span class="amount-label">Total Amount Paid</span>
          <span class="amount-value">$${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-text">
        Thank you for your payment. This receipt serves as confirmation of your transaction.
      </div>
      <div class="footer-text">
        For questions or concerns, please contact your property manager.
      </div>
      <div class="footer-legal">
        This is an electronically generated receipt and is valid without signature.
        Generated on ${currentDate}.
      </div>
    </div>

    <div class="watermark">
      Property Management System • Secure Payment Receipt
    </div>
  </div>

  <script>
    // Auto-print when opened (optional)
    // window.onload = function() { window.print(); }
  </script>
</body>
</html>
  `.trim();
}

export function downloadReceipt(data: ReceiptData): void {
  const html = generateReceiptHTML(data);
  const receiptNumber = `RCP-${data.payment.id.toString().padStart(6, '0')}`;
  
  // Create a Blob with the HTML content
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = `Receipt-${receiptNumber}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

export function openReceiptInNewTab(data: ReceiptData): void {
  const html = generateReceiptHTML(data);
  
  // Open a new window and write the HTML content
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  }
}
