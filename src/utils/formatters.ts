// src/utils/formatters.ts
// Shared formatting utilities for currencies, numbers, and dates

export function formatCurrency(amount: number, currencyCode: string): string {
  const code = (currencyCode || 'IDR').toUpperCase();
  try {
    if (code === 'IDR') {
      return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
    }
    if (code === 'USD') {
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (code === 'EUR') {
      return `€${amount.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (code === 'GBP') {
      return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (code === 'JPY') {
      return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
    }
    if (code === 'KRW') {
      return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
    }
    if (code === 'THB') {
      return `฿${Math.round(amount).toLocaleString('th-TH')}`;
    }
    if (code === 'SGD') {
      return `S$${amount.toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (code === 'AUD') {
      return `A$${amount.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (code === 'CAD') {
      return `C$${amount.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (code === 'MYR') {
      return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (code === 'PHP') {
      return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (code === 'VND') {
      return `${Math.round(amount).toLocaleString('vi-VN')} ₫`;
    }
    if (code === 'AED') {
      return `${Math.round(amount).toLocaleString('en-AE')} AED`;
    }
    if (code === 'SAR') {
      return `${Math.round(amount).toLocaleString('ar-SA')} SAR`;
    }
    if (code === 'MXN') {
      return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MXN`;
    }
    if (code === 'BRL') {
      return `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `${Math.round(amount).toLocaleString()} ${code}`;
  } catch {
    return `${Math.round(amount)} ${code}`;
  }
}
