// CSV Export Utility for Property Investment Calculations

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { SavedCalculation } from '../store/calculationStore';
import { formatCurrency } from './calculations';

// CSV headers for Japanese locale
const CSV_HEADERS = [
  'タイトル',
  '保存日時',
  '物件価格（円）',
  '月額家賃（円）',
  '管理費（月額・円）',
  '修繕積立金（月額・円）',
  '固定資産税（年額・円）',
  '火災保険（年額・円）',
  '空室率（%）',
  '頭金（円）',
  'ローン金額（円）',
  'ローン金利（%）',
  'ローン期間（年）',
  '保有期間（年）',
  '想定売却価格（円）',
  '割引率（%）',
  '表面利回り（%）',
  '実質利回り（%）',
  '年間家賃収入（円）',
  '年間経費（円）',
  '年間純収入（円）',
  '月間CF（円）',
  '年間CF（円）',
  '月間ローン返済（円）',
  '年間ローン返済（円）',
  'CCR（%）',
  '投資回収期間（年）',
  'IRR（%）',
  'NPV（円）',
  '収益性指数',
];

// Convert a single calculation to CSV row
function calculationToCsvRow(calc: SavedCalculation): string[] {
  const { input, result, title, createdAt } = calc;

  return [
    title || '',
    new Date(createdAt).toLocaleString('ja-JP'),
    String(input.price || 0),
    String(input.monthlyRent || 0),
    String(input.managementFee || 0),
    String(input.repairReserve || 0),
    String(input.propertyTax || 0),
    String(input.insuranceFee || 0),
    String(input.vacancyRate || 5),
    String(input.downPayment || 0),
    String(input.loanAmount || 0),
    String(input.loanInterestRate || 0),
    String(input.loanPeriodYears || 0),
    String(input.holdingPeriodYears || 10),
    String(input.expectedSellingPrice || input.price || 0),
    String(input.discountRate || 5),
    String(result.grossYield),
    String(result.netYield),
    String(result.annualRentIncome),
    String(result.annualExpenses),
    String(result.annualNetIncome),
    String(result.monthlyCashFlow),
    String(result.annualCashFlow),
    String(result.monthlyLoanPayment),
    String(result.annualLoanPayment),
    String(result.ccr),
    result.paybackPeriod === Infinity ? '-' : String(result.paybackPeriod),
    result.irr !== null ? String(result.irr) : '-',
    result.npv !== null ? String(result.npv) : '-',
    result.profitabilityIndex !== null ? String(result.profitabilityIndex) : '-',
  ];
}

// Escape CSV field (handle commas, quotes, and newlines)
function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// Convert calculations to CSV string
export function calculationsToCsv(calculations: SavedCalculation[]): string {
  const lines: string[] = [];

  // Add BOM for Excel compatibility with Japanese characters
  const bom = '\uFEFF';

  // Add headers
  lines.push(CSV_HEADERS.map(escapeCsvField).join(','));

  // Add data rows
  calculations.forEach(calc => {
    const row = calculationToCsvRow(calc);
    lines.push(row.map(escapeCsvField).join(','));
  });

  return bom + lines.join('\n');
}

// Generate filename with timestamp
export function generateCsvFilename(): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
  return `不動産投資計算_${timestamp}.csv`;
}

// Export calculations to CSV file and share
export async function exportCalculationsToCsv(
  calculations: SavedCalculation[]
): Promise<{ success: boolean; message: string }> {
  if (calculations.length === 0) {
    return { success: false, message: 'エクスポートするデータがありません' };
  }

  try {
    const csvContent = calculationsToCsv(calculations);
    const filename = generateCsvFilename();

    // Check if we're on web platform
    if (Platform.OS === 'web') {
      // For web, create a downloadable blob
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, message: 'CSVファイルをダウンロードしました' };
    }

    // For native platforms, use FileSystem and Sharing
    const fileUri = FileSystem.documentDirectory + filename;

    // Write CSV file
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        message: 'このデバイスでは共有機能が利用できません'
      };
    }

    // Share the file
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'CSVファイルを保存',
      UTI: 'public.comma-separated-values-text',
    });

    return { success: true, message: 'CSVファイルをエクスポートしました' };
  } catch (error) {
    console.error('CSV export error:', error);
    return {
      success: false,
      message: `エクスポートに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
    };
  }
}

// Export a single calculation
export async function exportSingleCalculation(
  calculation: SavedCalculation
): Promise<{ success: boolean; message: string }> {
  return exportCalculationsToCsv([calculation]);
}

// Generate detailed report CSV for a single calculation
export function generateDetailedReport(calc: SavedCalculation): string {
  const { input, result, title, createdAt } = calc;
  const bom = '\uFEFF';

  const lines: string[] = [];

  // Title section
  lines.push('【物件投資分析レポート】');
  lines.push(`物件名,${escapeCsvField(title || '無題')}`);
  lines.push(`作成日時,${new Date(createdAt).toLocaleString('ja-JP')}`);
  lines.push('');

  // Basic info
  lines.push('【基本情報】');
  lines.push(`物件価格,¥${formatCurrency(input.price)}`);
  lines.push(`月額家賃,¥${formatCurrency(input.monthlyRent)}`);
  lines.push('');

  // Expenses
  lines.push('【経費内訳（年額）】');
  lines.push(`管理費,¥${formatCurrency(result.expenses.managementFee)}`);
  lines.push(`修繕積立金,¥${formatCurrency(result.expenses.repairReserve)}`);
  lines.push(`固定資産税,¥${formatCurrency(result.expenses.propertyTax)}`);
  lines.push(`火災保険,¥${formatCurrency(result.expenses.insuranceFee)}`);
  lines.push(`空室損失,¥${formatCurrency(result.expenses.vacancyLoss)}`);
  lines.push(`経費合計,¥${formatCurrency(result.annualExpenses)}`);
  lines.push('');

  // Loan info (if applicable)
  if (result.monthlyLoanPayment > 0) {
    lines.push('【ローン情報】');
    lines.push(`ローン金額,¥${formatCurrency(input.loanAmount || 0)}`);
    lines.push(`金利,${input.loanInterestRate || 0}%`);
    lines.push(`返済期間,${input.loanPeriodYears || 0}年`);
    lines.push(`月間返済額,¥${formatCurrency(result.monthlyLoanPayment)}`);
    lines.push(`年間返済額,¥${formatCurrency(result.annualLoanPayment)}`);
    lines.push(`返済総額,¥${formatCurrency(result.totalLoanPayment)}`);
    lines.push('');
  }

  // Results
  lines.push('【収益分析】');
  lines.push(`表面利回り,${result.grossYield}%`);
  lines.push(`実質利回り,${result.netYield}%`);
  lines.push(`年間家賃収入,¥${formatCurrency(result.annualRentIncome)}`);
  lines.push(`年間純収入（NOI）,¥${formatCurrency(result.annualNetIncome)}`);
  lines.push(`年間キャッシュフロー,¥${formatCurrency(result.annualCashFlow)}`);
  lines.push(`月間キャッシュフロー,¥${formatCurrency(result.monthlyCashFlow)}`);
  lines.push('');

  // Investment metrics
  lines.push('【投資指標】');
  if (result.ccr > 0) {
    lines.push(`CCR（自己資金配当率）,${result.ccr}%`);
  }
  lines.push(`投資回収期間,${result.paybackPeriod === Infinity ? '計算不可' : `${result.paybackPeriod}年`}`);
  lines.push('');

  // Advanced metrics
  if (result.irr !== null || result.npv !== null) {
    lines.push('【高度な投資指標】');
    lines.push(`保有期間,${input.holdingPeriodYears || 10}年`);
    lines.push(`想定売却価格,¥${formatCurrency(input.expectedSellingPrice || input.price)}`);
    lines.push(`割引率,${input.discountRate || 5}%`);
    if (result.irr !== null) {
      lines.push(`IRR（内部収益率）,${result.irr}%`);
    }
    if (result.npv !== null) {
      lines.push(`NPV（正味現在価値）,¥${formatCurrency(result.npv)}`);
    }
    if (result.profitabilityIndex !== null) {
      lines.push(`収益性指数（PI）,${result.profitabilityIndex}`);
    }
  }

  return bom + lines.join('\n');
}

// Export detailed report for a single calculation
export async function exportDetailedReport(
  calculation: SavedCalculation
): Promise<{ success: boolean; message: string }> {
  try {
    const csvContent = generateDetailedReport(calculation);
    const title = calculation.title || '物件';
    const filename = `${title}_詳細レポート.csv`;

    // Check if we're on web platform
    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, message: '詳細レポートをダウンロードしました' };
    }

    const fileUri = FileSystem.documentDirectory + filename;

    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        message: 'このデバイスでは共有機能が利用できません'
      };
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: '詳細レポートを保存',
      UTI: 'public.comma-separated-values-text',
    });

    return { success: true, message: '詳細レポートをエクスポートしました' };
  } catch (error) {
    console.error('Detailed report export error:', error);
    return {
      success: false,
      message: `エクスポートに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
    };
  }
}
