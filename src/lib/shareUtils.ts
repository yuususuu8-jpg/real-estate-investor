import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { CalculationResult, PropertyInput, formatCurrency, formatPercent } from './calculations';

export interface ShareData {
  title: string;
  input: PropertyInput;
  result: CalculationResult;
}

/**
 * Generate HTML content for PDF
 */
export const generatePDFHtml = (data: ShareData): string => {
  const { title, input, result } = data;
  const date = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif;
            padding: 40px;
            color: #1F2937;
            background: #fff;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #3B82F6;
          }
          .header h1 {
            font-size: 24px;
            color: #3B82F6;
            margin-bottom: 8px;
          }
          .header .title {
            font-size: 18px;
            color: #374151;
            margin-bottom: 4px;
          }
          .header .date {
            font-size: 12px;
            color: #6B7280;
          }
          .section {
            margin-bottom: 24px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #3B82F6;
            margin-bottom: 12px;
            padding-bottom: 4px;
            border-bottom: 1px solid #E5E7EB;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .metric {
            background: #F9FAFB;
            border-radius: 8px;
            padding: 12px;
          }
          .metric-label {
            font-size: 11px;
            color: #6B7280;
            margin-bottom: 4px;
          }
          .metric-value {
            font-size: 16px;
            font-weight: 600;
            color: #1F2937;
          }
          .highlight-card {
            background: linear-gradient(135deg, #3B82F6, #2563EB);
            border-radius: 12px;
            padding: 20px;
            color: white;
            margin-bottom: 24px;
          }
          .highlight-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            text-align: center;
          }
          .highlight-item .label {
            font-size: 11px;
            opacity: 0.9;
            margin-bottom: 4px;
          }
          .highlight-item .value {
            font-size: 20px;
            font-weight: 700;
          }
          .cashflow-section {
            background: ${result.annualCashFlow >= 0 ? '#D1FAE5' : '#FEE2E2'};
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
          }
          .cashflow-title {
            font-size: 12px;
            color: ${result.annualCashFlow >= 0 ? '#065F46' : '#991B1B'};
            margin-bottom: 8px;
          }
          .cashflow-value {
            font-size: 24px;
            font-weight: 700;
            color: ${result.annualCashFlow >= 0 ? '#10B981' : '#EF4444'};
          }
          .cashflow-monthly {
            font-size: 14px;
            color: ${result.annualCashFlow >= 0 ? '#065F46' : '#991B1B'};
            margin-top: 4px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            text-align: center;
            font-size: 10px;
            color: #9CA3AF;
          }
          .negative {
            color: #EF4444;
          }
          .positive {
            color: #10B981;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>不動産投資 収益計算レポート</h1>
          <div class="title">${title}</div>
          <div class="date">${date}</div>
        </div>

        <div class="highlight-card">
          <div class="highlight-grid">
            <div class="highlight-item">
              <div class="label">表面利回り</div>
              <div class="value">${formatPercent(result.grossYield)}</div>
            </div>
            <div class="highlight-item">
              <div class="label">実質利回り</div>
              <div class="value">${formatPercent(result.netYield)}</div>
            </div>
            <div class="highlight-item">
              <div class="label">CCR</div>
              <div class="value">${result.ccr && result.ccr > 0 ? formatPercent(result.ccr) : '-'}</div>
            </div>
          </div>
        </div>

        <div class="cashflow-section">
          <div class="cashflow-title">年間キャッシュフロー</div>
          <div class="cashflow-value">¥${formatCurrency(result.annualCashFlow)}</div>
          <div class="cashflow-monthly">月額: ¥${formatCurrency(result.monthlyCashFlow)}</div>
        </div>

        <div class="section">
          <div class="section-title">物件情報</div>
          <div class="grid">
            <div class="metric">
              <div class="metric-label">物件価格</div>
              <div class="metric-value">¥${formatCurrency(input.price)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">月額家賃収入</div>
              <div class="metric-value">¥${formatCurrency(input.monthlyRent)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">年間家賃収入</div>
              <div class="metric-value">¥${formatCurrency(result.annualRentIncome)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">空室率</div>
              <div class="metric-value">${input.vacancyRate || 0}%</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">経費内訳</div>
          <div class="grid">
            <div class="metric">
              <div class="metric-label">管理費（年額）</div>
              <div class="metric-value">¥${formatCurrency(result.expenses.managementFee)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">修繕積立金（年額）</div>
              <div class="metric-value">¥${formatCurrency(result.expenses.repairReserve)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">固定資産税</div>
              <div class="metric-value">¥${formatCurrency(result.expenses.propertyTax)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">火災保険</div>
              <div class="metric-value">¥${formatCurrency(result.expenses.insuranceFee)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">年間経費合計</div>
              <div class="metric-value">¥${formatCurrency(result.annualExpenses)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">空室損失</div>
              <div class="metric-value">¥${formatCurrency(result.expenses.vacancyLoss)}</div>
            </div>
          </div>
        </div>

        ${input.loanAmount && input.loanAmount > 0 ? `
        <div class="section">
          <div class="section-title">ローン情報</div>
          <div class="grid">
            <div class="metric">
              <div class="metric-label">借入金額</div>
              <div class="metric-value">¥${formatCurrency(input.loanAmount)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">金利</div>
              <div class="metric-value">${input.loanInterestRate || 0}%</div>
            </div>
            <div class="metric">
              <div class="metric-label">返済期間</div>
              <div class="metric-value">${input.loanPeriodYears || 0}年</div>
            </div>
            <div class="metric">
              <div class="metric-label">月々の返済額</div>
              <div class="metric-value">¥${formatCurrency(result.monthlyLoanPayment)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">年間返済額</div>
              <div class="metric-value">¥${formatCurrency(result.annualLoanPayment)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">自己資金</div>
              <div class="metric-value">¥${formatCurrency(input.downPayment || (input.price - (input.loanAmount || 0)))}</div>
            </div>
          </div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">投資指標</div>
          <div class="grid">
            <div class="metric">
              <div class="metric-label">純営業収益（NOI）</div>
              <div class="metric-value">¥${formatCurrency(result.annualNetIncome)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">投資回収期間</div>
              <div class="metric-value">${result.paybackPeriod > 0 && result.paybackPeriod !== Infinity ? `${result.paybackPeriod.toFixed(1)}年` : '-'}</div>
            </div>
            <div class="metric">
              <div class="metric-label">CCR</div>
              <div class="metric-value">${result.ccr && result.ccr > 0 ? formatPercent(result.ccr) : '-'}</div>
            </div>
            <div class="metric">
              <div class="metric-label">ローン返済総額</div>
              <div class="metric-value">${result.totalLoanPayment > 0 ? `¥${formatCurrency(result.totalLoanPayment)}` : '-'}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>不動産投資家アプリで作成</p>
          <p>※本レポートは参考情報です。投資判断は自己責任でお願いします。</p>
        </div>
      </body>
    </html>
  `;
};

/**
 * Generate and share PDF
 */
export const sharePDF = async (data: ShareData): Promise<boolean> => {
  try {
    const html = generatePDFHtml(data);

    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Check if sharing is available
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: '収益計算レポートを共有',
        UTI: 'com.adobe.pdf',
      });
      return true;
    } else {
      console.log('Sharing is not available on this device');
      return false;
    }
  } catch (error) {
    console.error('Error generating/sharing PDF:', error);
    throw error;
  }
};

/**
 * Print PDF directly
 */
export const printPDF = async (data: ShareData): Promise<void> => {
  try {
    const html = generatePDFHtml(data);
    await Print.printAsync({ html });
  } catch (error) {
    console.error('Error printing PDF:', error);
    throw error;
  }
};

/**
 * Generate simple text summary for sharing
 */
export const generateTextSummary = (data: ShareData): string => {
  const { title, input, result } = data;
  const date = new Date().toLocaleDateString('ja-JP');

  let text = `【${title}】\n`;
  text += `作成日: ${date}\n\n`;
  text += `━━━ 主要指標 ━━━\n`;
  text += `表面利回り: ${formatPercent(result.grossYield)}\n`;
  text += `実質利回り: ${formatPercent(result.netYield)}\n`;
  if (result.ccr > 0) {
    text += `CCR: ${formatPercent(result.ccr)}\n`;
  }
  text += `\n━━━ キャッシュフロー ━━━\n`;
  text += `年間: ¥${formatCurrency(result.annualCashFlow)}\n`;
  text += `月額: ¥${formatCurrency(result.monthlyCashFlow)}\n`;
  text += `\n━━━ 物件情報 ━━━\n`;
  text += `物件価格: ¥${formatCurrency(input.price)}\n`;
  text += `月額家賃: ¥${formatCurrency(input.monthlyRent)}\n`;
  text += `\n※不動産投資家アプリで作成`;

  return text;
};

/**
 * Share text summary
 */
export const shareText = async (data: ShareData): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      // Web: Use navigator.share if available, otherwise copy to clipboard
      const text = generateTextSummary(data);
      if (navigator.share) {
        await navigator.share({
          title: data.title,
          text,
        });
        return true;
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    } else {
      // Native: Create a temporary text file and share
      const text = generateTextSummary(data);
      const { uri } = await Print.printToFileAsync({
        html: `<pre style="font-family: monospace; white-space: pre-wrap;">${text}</pre>`,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: '収益計算結果を共有',
        });
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error('Error sharing text:', error);
    throw error;
  }
};

/**
 * Check if sharing is available
 */
export const isSharingAvailable = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return typeof navigator !== 'undefined' && (!!navigator.share || !!navigator.clipboard);
  }
  return await Sharing.isAvailableAsync();
};
