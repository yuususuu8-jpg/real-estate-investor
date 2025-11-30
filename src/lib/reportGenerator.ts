// 高度なPDFレポート生成モジュール
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { CalculationResult, PropertyInput, formatCurrency, formatPercent } from './calculations';
import { SavedCalculation } from '../store/calculationStore';

interface CashFlowProjection {
  year: number;
  annualCashFlow: number;
  cumulativeCashFlow: number;
  loanBalance: number;
  equity: number;
}

/**
 * Generate cash flow projections for a property
 */
function generateCashFlowProjections(
  input: PropertyInput,
  result: CalculationResult,
  years: number = 30
): CashFlowProjection[] {
  const projections: CashFlowProjection[] = [];

  const loanAmount = input.loanAmount || 0;
  const interestRate = input.loanInterestRate || 0;
  const loanTermYears = input.loanPeriodYears || 0;
  const downPayment = input.downPayment || (input.price - loanAmount);

  const monthlyRate = interestRate / 100 / 12;
  const totalPayments = loanTermYears * 12;
  const monthlyPayment = loanAmount > 0 && monthlyRate > 0
    ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1)
    : loanAmount > 0 ? loanAmount / totalPayments : 0;

  const annualDebtService = monthlyPayment * 12;
  const effectiveAnnualRent = result.annualRentIncome;
  const annualExpenses = result.annualExpenses;

  let cumulativeCashFlow = -downPayment;
  let remainingLoan = loanAmount;

  for (let year = 1; year <= years; year++) {
    const annualCashFlow = effectiveAnnualRent - annualExpenses - (year <= loanTermYears ? annualDebtService : 0);
    cumulativeCashFlow += annualCashFlow;

    if (year <= loanTermYears && monthlyRate > 0) {
      const paymentsRemaining = (loanTermYears - year) * 12;
      remainingLoan = monthlyPayment * (1 - Math.pow(1 + monthlyRate, -paymentsRemaining)) / monthlyRate;
    } else if (year > loanTermYears) {
      remainingLoan = 0;
    }

    const currentPropertyValue = input.price * Math.pow(1.02, year);
    const equity = currentPropertyValue - Math.max(0, remainingLoan);

    projections.push({
      year,
      annualCashFlow,
      cumulativeCashFlow,
      loanBalance: Math.max(0, remainingLoan),
      equity,
    });
  }

  return projections;
}

/**
 * Calculate risk score based on property metrics
 */
function calculateRiskScore(input: PropertyInput, result: CalculationResult): {
  score: number;
  level: string;
  factors: { name: string; impact: string; description: string }[];
} {
  let score = 100;
  const factors: { name: string; impact: string; description: string }[] = [];

  // Yield risk
  if (result.netYield < 3) {
    score -= 25;
    factors.push({
      name: '低利回り',
      impact: '高',
      description: '実質利回りが3%未満で、収益性に懸念があります',
    });
  } else if (result.netYield < 5) {
    score -= 10;
    factors.push({
      name: '利回り',
      impact: '中',
      description: '実質利回りが5%未満です',
    });
  }

  // Cash flow risk
  if (result.annualCashFlow < 0) {
    score -= 30;
    factors.push({
      name: 'キャッシュフロー',
      impact: '高',
      description: '年間キャッシュフローがマイナスです',
    });
  } else if (result.monthlyCashFlow < 50000) {
    score -= 15;
    factors.push({
      name: 'キャッシュフロー',
      impact: '中',
      description: '月間キャッシュフローが5万円未満で、バッファーが少ないです',
    });
  }

  // LTV risk
  if (input.loanAmount && input.price) {
    const ltv = (input.loanAmount / input.price) * 100;
    if (ltv > 90) {
      score -= 20;
      factors.push({
        name: 'LTV（借入比率）',
        impact: '高',
        description: `LTVが${ltv.toFixed(0)}%で、レバレッジリスクが高いです`,
      });
    } else if (ltv > 80) {
      score -= 10;
      factors.push({
        name: 'LTV（借入比率）',
        impact: '中',
        description: `LTVが${ltv.toFixed(0)}%です`,
      });
    }
  }

  // Vacancy risk
  if (input.vacancyRate && input.vacancyRate > 10) {
    score -= 10;
    factors.push({
      name: '空室率',
      impact: '中',
      description: `想定空室率が${input.vacancyRate}%と高めです`,
    });
  }

  // CCR risk
  if (result.ccr && result.ccr < 5) {
    score -= 15;
    factors.push({
      name: 'CCR',
      impact: '中',
      description: '自己資金配当率が5%未満で、投資効率が低いです',
    });
  }

  // Interest rate risk
  if (input.loanInterestRate && input.loanInterestRate > 3) {
    score -= 10;
    factors.push({
      name: '金利',
      impact: '中',
      description: `借入金利が${input.loanInterestRate}%と高めです`,
    });
  }

  const level = score >= 80 ? '低リスク' : score >= 60 ? '中リスク' : score >= 40 ? '要注意' : '高リスク';

  return { score: Math.max(0, score), level, factors };
}

/**
 * Generate comprehensive analysis PDF HTML
 */
export function generateAnalysisReportHtml(
  title: string,
  input: PropertyInput,
  result: CalculationResult,
  options: {
    includeCashFlowProjection?: boolean;
    includeRiskAnalysis?: boolean;
    projectionYears?: number;
  } = {}
): string {
  const {
    includeCashFlowProjection = true,
    includeRiskAnalysis = true,
    projectionYears = 10,
  } = options;

  const date = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const projections = includeCashFlowProjection
    ? generateCashFlowProjections(input, result, projectionYears)
    : [];

  const riskAnalysis = includeRiskAnalysis
    ? calculateRiskScore(input, result)
    : null;

  // Find break-even year
  const breakEvenYear = projections.find(p => p.cumulativeCashFlow >= 0)?.year || null;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif;
            padding: 30px;
            color: #1F2937;
            background: #fff;
            font-size: 11px;
            line-height: 1.5;
          }
          .header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #3B82F6;
          }
          .header h1 {
            font-size: 20px;
            color: #3B82F6;
            margin-bottom: 6px;
          }
          .header .subtitle { font-size: 14px; color: #374151; margin-bottom: 4px; }
          .header .date { font-size: 10px; color: #6B7280; }

          .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 13px;
            font-weight: 600;
            color: #3B82F6;
            margin-bottom: 10px;
            padding-bottom: 4px;
            border-bottom: 1px solid #E5E7EB;
          }

          .highlight-card {
            background: linear-gradient(135deg, #3B82F6, #2563EB);
            border-radius: 8px;
            padding: 16px;
            color: white;
            margin-bottom: 20px;
          }
          .highlight-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            text-align: center;
          }
          .highlight-item .label { font-size: 9px; opacity: 0.9; margin-bottom: 2px; }
          .highlight-item .value { font-size: 16px; font-weight: 700; }

          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .metric {
            background: #F9FAFB;
            border-radius: 6px;
            padding: 10px;
          }
          .metric-label { font-size: 9px; color: #6B7280; margin-bottom: 2px; }
          .metric-value { font-size: 13px; font-weight: 600; color: #1F2937; }

          .cashflow-positive {
            background: #D1FAE5;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 20px;
          }
          .cashflow-negative {
            background: #FEE2E2;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 20px;
          }
          .cashflow-title { font-size: 10px; margin-bottom: 4px; }
          .cashflow-positive .cashflow-title { color: #065F46; }
          .cashflow-negative .cashflow-title { color: #991B1B; }
          .cashflow-value { font-size: 20px; font-weight: 700; }
          .cashflow-positive .cashflow-value { color: #10B981; }
          .cashflow-negative .cashflow-value { color: #EF4444; }
          .cashflow-monthly { font-size: 11px; margin-top: 2px; }
          .cashflow-positive .cashflow-monthly { color: #065F46; }
          .cashflow-negative .cashflow-monthly { color: #991B1B; }

          .table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-top: 10px;
          }
          .table th, .table td {
            padding: 6px 8px;
            text-align: right;
            border: 1px solid #E5E7EB;
          }
          .table th {
            background: #F3F4F6;
            font-weight: 600;
            text-align: center;
          }
          .table td:first-child { text-align: center; font-weight: 500; }
          .positive { color: #10B981; }
          .negative { color: #EF4444; }

          .risk-card {
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 12px;
          }
          .risk-low { background: #D1FAE5; border: 1px solid #10B981; }
          .risk-medium { background: #FEF3C7; border: 1px solid #F59E0B; }
          .risk-high { background: #FEE2E2; border: 1px solid #EF4444; }
          .risk-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .risk-score { font-size: 24px; font-weight: 700; }
          .risk-low .risk-score { color: #10B981; }
          .risk-medium .risk-score { color: #F59E0B; }
          .risk-high .risk-score { color: #EF4444; }
          .risk-level { font-size: 12px; font-weight: 600; }
          .risk-factors { margin-top: 8px; }
          .risk-factor {
            display: flex;
            align-items: center;
            padding: 6px 0;
            border-bottom: 1px solid rgba(0,0,0,0.05);
          }
          .risk-factor:last-child { border-bottom: none; }
          .risk-factor-impact {
            font-size: 9px;
            padding: 2px 6px;
            border-radius: 4px;
            margin-right: 8px;
            font-weight: 500;
          }
          .risk-factor-impact.high { background: #FEE2E2; color: #EF4444; }
          .risk-factor-impact.medium { background: #FEF3C7; color: #F59E0B; }
          .risk-factor-name { font-weight: 500; margin-right: 6px; }
          .risk-factor-desc { color: #6B7280; font-size: 9px; }

          .irr-npv-section {
            background: #EFF6FF;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 20px;
          }
          .irr-npv-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center; }
          .irr-npv-item .label { font-size: 9px; color: #3B82F6; margin-bottom: 2px; }
          .irr-npv-item .value { font-size: 16px; font-weight: 700; color: #1E40AF; }
          .irr-npv-item .hint { font-size: 8px; color: #6B7280; margin-top: 2px; }

          .footer {
            margin-top: 30px;
            padding-top: 16px;
            border-top: 1px solid #E5E7EB;
            text-align: center;
            font-size: 9px;
            color: #9CA3AF;
          }

          @media print {
            body { padding: 20px; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>不動産投資 詳細分析レポート</h1>
          <div class="subtitle">${title}</div>
          <div class="date">作成日: ${date}</div>
        </div>

        <!-- Key Metrics -->
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
              <div class="value">${result.ccr > 0 ? formatPercent(result.ccr) : '-'}</div>
            </div>
            <div class="highlight-item">
              <div class="label">回収期間</div>
              <div class="value">${result.paybackPeriod > 0 && result.paybackPeriod !== Infinity ? `${result.paybackPeriod.toFixed(1)}年` : '-'}</div>
            </div>
          </div>
        </div>

        <!-- Cash Flow -->
        <div class="${result.annualCashFlow >= 0 ? 'cashflow-positive' : 'cashflow-negative'}">
          <div class="cashflow-title">年間キャッシュフロー</div>
          <div class="cashflow-value">¥${formatCurrency(result.annualCashFlow)}</div>
          <div class="cashflow-monthly">月額: ¥${formatCurrency(result.monthlyCashFlow)}</div>
        </div>

        <!-- IRR/NPV Section -->
        ${result.irr !== null || result.npv !== null ? `
        <div class="irr-npv-section">
          <div class="section-title" style="color: #1E40AF; border-color: #93C5FD;">高度な投資指標</div>
          <div class="irr-npv-grid">
            <div class="irr-npv-item">
              <div class="label">IRR（内部収益率）</div>
              <div class="value">${result.irr !== null ? formatPercent(result.irr) : '-'}</div>
              <div class="hint">${input.holdingPeriodYears || 10}年保有時</div>
            </div>
            <div class="irr-npv-item">
              <div class="label">NPV（正味現在価値）</div>
              <div class="value">${result.npv !== null ? `¥${formatCurrency(result.npv)}` : '-'}</div>
              <div class="hint">${result.npv !== null && result.npv >= 0 ? '投資価値あり' : '投資価値なし'}</div>
            </div>
            <div class="irr-npv-item">
              <div class="label">収益性指数（PI）</div>
              <div class="value">${result.profitabilityIndex !== null ? result.profitabilityIndex.toFixed(2) : '-'}</div>
              <div class="hint">${result.profitabilityIndex !== null && result.profitabilityIndex >= 1 ? '1以上で投資価値あり' : ''}</div>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Risk Analysis -->
        ${riskAnalysis ? `
        <div class="section">
          <div class="section-title">リスク分析</div>
          <div class="risk-card ${riskAnalysis.score >= 80 ? 'risk-low' : riskAnalysis.score >= 60 ? 'risk-medium' : 'risk-high'}">
            <div class="risk-header">
              <div>
                <div class="risk-level">${riskAnalysis.level}</div>
              </div>
              <div class="risk-score">${riskAnalysis.score}点</div>
            </div>
            ${riskAnalysis.factors.length > 0 ? `
            <div class="risk-factors">
              ${riskAnalysis.factors.map(f => `
                <div class="risk-factor">
                  <span class="risk-factor-impact ${f.impact === '高' ? 'high' : 'medium'}">${f.impact}</span>
                  <span class="risk-factor-name">${f.name}:</span>
                  <span class="risk-factor-desc">${f.description}</span>
                </div>
              `).join('')}
            </div>
            ` : '<div style="color: #065F46; font-size: 10px;">主要なリスク要因は検出されませんでした</div>'}
          </div>
        </div>
        ` : ''}

        <!-- Property Info -->
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

        <!-- Expenses -->
        <div class="section">
          <div class="section-title">経費内訳（年間）</div>
          <div class="grid-3">
            <div class="metric">
              <div class="metric-label">管理費</div>
              <div class="metric-value">¥${formatCurrency(result.expenses.managementFee)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">修繕積立金</div>
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
              <div class="metric-label">空室損失</div>
              <div class="metric-value">¥${formatCurrency(result.expenses.vacancyLoss)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">経費合計</div>
              <div class="metric-value">¥${formatCurrency(result.annualExpenses)}</div>
            </div>
          </div>
        </div>

        <!-- Loan Info -->
        ${input.loanAmount && input.loanAmount > 0 ? `
        <div class="section">
          <div class="section-title">ローン情報</div>
          <div class="grid-3">
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
              <div class="metric-label">月々返済額</div>
              <div class="metric-value">¥${formatCurrency(result.monthlyLoanPayment)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">年間返済額</div>
              <div class="metric-value">¥${formatCurrency(result.annualLoanPayment)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">自己資金</div>
              <div class="metric-value">¥${formatCurrency(input.downPayment || (input.price - input.loanAmount))}</div>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Cash Flow Projection -->
        ${includeCashFlowProjection && projections.length > 0 ? `
        <div class="section">
          <div class="section-title">キャッシュフロー推移（${projectionYears}年）</div>
          ${breakEvenYear ? `<div style="background: #D1FAE5; padding: 8px 12px; border-radius: 6px; margin-bottom: 10px; font-size: 10px; color: #065F46;">
            投資回収: ${breakEvenYear}年目に損益分岐点到達予定
          </div>` : ''}
          <table class="table">
            <thead>
              <tr>
                <th>年</th>
                <th>年間CF</th>
                <th>累計CF</th>
                <th>ローン残高</th>
                <th>エクイティ</th>
              </tr>
            </thead>
            <tbody>
              ${projections.slice(0, projectionYears).map(p => `
                <tr>
                  <td>${p.year}年目</td>
                  <td class="${p.annualCashFlow >= 0 ? 'positive' : 'negative'}">¥${formatCurrency(p.annualCashFlow)}</td>
                  <td class="${p.cumulativeCashFlow >= 0 ? 'positive' : 'negative'}">¥${formatCurrency(p.cumulativeCashFlow)}</td>
                  <td>¥${formatCurrency(p.loanBalance)}</td>
                  <td>¥${formatCurrency(p.equity)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="footer">
          <p>不動産投資家アプリで作成</p>
          <p>※本レポートは参考情報です。投資判断は自己責任でお願いします。実際の投資にあたっては専門家にご相談ください。</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate portfolio summary report HTML
 */
export function generatePortfolioReportHtml(calculations: SavedCalculation[]): string {
  const date = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate portfolio totals
  const totalProperties = calculations.length;
  const totalValue = calculations.reduce((sum, c) => sum + c.input.price, 0);
  const totalMonthlyRent = calculations.reduce((sum, c) => sum + c.input.monthlyRent, 0);
  const totalAnnualCashFlow = calculations.reduce((sum, c) => sum + c.result.annualCashFlow, 0);
  const totalLoanAmount = calculations.reduce((sum, c) => sum + (c.input.loanAmount || 0), 0);
  const totalEquity = totalValue - totalLoanAmount;
  const debtRatio = totalValue > 0 ? (totalLoanAmount / totalValue) * 100 : 0;

  // Weighted average yields
  const weightedGrossYield = calculations.reduce((sum, c) => {
    const weight = c.input.price / totalValue;
    return sum + (c.result.grossYield * weight);
  }, 0);
  const weightedNetYield = calculations.reduce((sum, c) => {
    const weight = c.input.price / totalValue;
    return sum + (c.result.netYield * weight);
  }, 0);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Hiragino Sans', 'Noto Sans JP', sans-serif;
            padding: 30px;
            color: #1F2937;
            background: #fff;
            font-size: 11px;
          }
          .header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #F59E0B;
          }
          .header h1 { font-size: 20px; color: #F59E0B; margin-bottom: 6px; }
          .header .date { font-size: 10px; color: #6B7280; }

          .summary-card {
            background: linear-gradient(135deg, #F59E0B, #D97706);
            border-radius: 8px;
            padding: 20px;
            color: white;
            margin-bottom: 24px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            text-align: center;
          }
          .summary-item .label { font-size: 9px; opacity: 0.9; margin-bottom: 2px; }
          .summary-item .value { font-size: 18px; font-weight: 700; }

          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .metric-card {
            background: #F9FAFB;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
          }
          .metric-card .label { font-size: 9px; color: #6B7280; margin-bottom: 4px; }
          .metric-card .value { font-size: 14px; font-weight: 600; color: #1F2937; }

          .section { margin-bottom: 24px; }
          .section-title {
            font-size: 13px;
            font-weight: 600;
            color: #F59E0B;
            margin-bottom: 12px;
            padding-bottom: 4px;
            border-bottom: 1px solid #E5E7EB;
          }

          .table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          .table th, .table td {
            padding: 8px 10px;
            text-align: right;
            border: 1px solid #E5E7EB;
          }
          .table th {
            background: #F3F4F6;
            font-weight: 600;
            text-align: center;
          }
          .table td:first-child { text-align: left; font-weight: 500; }
          .positive { color: #10B981; }
          .negative { color: #EF4444; }

          .footer {
            margin-top: 30px;
            padding-top: 16px;
            border-top: 1px solid #E5E7EB;
            text-align: center;
            font-size: 9px;
            color: #9CA3AF;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ポートフォリオ サマリーレポート</h1>
          <div class="date">作成日: ${date}</div>
        </div>

        <div class="summary-card">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="label">総物件数</div>
              <div class="value">${totalProperties}件</div>
            </div>
            <div class="summary-item">
              <div class="label">総資産価値</div>
              <div class="value">¥${formatCurrency(totalValue)}</div>
            </div>
            <div class="summary-item">
              <div class="label">年間総CF</div>
              <div class="value">¥${formatCurrency(totalAnnualCashFlow)}</div>
            </div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="label">加重平均表面利回り</div>
            <div class="value">${formatPercent(weightedGrossYield)}</div>
          </div>
          <div class="metric-card">
            <div class="label">加重平均実質利回り</div>
            <div class="value">${formatPercent(weightedNetYield)}</div>
          </div>
          <div class="metric-card">
            <div class="label">月間総家賃</div>
            <div class="value">¥${formatCurrency(totalMonthlyRent)}</div>
          </div>
          <div class="metric-card">
            <div class="label">借入比率</div>
            <div class="value">${debtRatio.toFixed(1)}%</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">物件一覧</div>
          <table class="table">
            <thead>
              <tr>
                <th>物件名</th>
                <th>物件価格</th>
                <th>表面利回り</th>
                <th>実質利回り</th>
                <th>月間CF</th>
                <th>年間CF</th>
              </tr>
            </thead>
            <tbody>
              ${calculations.map(c => `
                <tr>
                  <td>${c.title}</td>
                  <td>¥${formatCurrency(c.input.price)}</td>
                  <td>${formatPercent(c.result.grossYield)}</td>
                  <td>${formatPercent(c.result.netYield)}</td>
                  <td class="${c.result.monthlyCashFlow >= 0 ? 'positive' : 'negative'}">¥${formatCurrency(c.result.monthlyCashFlow)}</td>
                  <td class="${c.result.annualCashFlow >= 0 ? 'positive' : 'negative'}">¥${formatCurrency(c.result.annualCashFlow)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">財務構造</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
            <div class="metric-card">
              <div class="label">総借入額</div>
              <div class="value">¥${formatCurrency(totalLoanAmount)}</div>
            </div>
            <div class="metric-card">
              <div class="label">総自己資本</div>
              <div class="value">¥${formatCurrency(totalEquity)}</div>
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
}

/**
 * Generate and share analysis report PDF
 */
export async function shareAnalysisReport(
  title: string,
  input: PropertyInput,
  result: CalculationResult,
  options?: {
    includeCashFlowProjection?: boolean;
    includeRiskAnalysis?: boolean;
    projectionYears?: number;
  }
): Promise<boolean> {
  try {
    const html = generateAnalysisReportHtml(title, input, result, options);
    const { uri } = await Print.printToFileAsync({ html, base64: false });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: '詳細分析レポートを共有',
        UTI: 'com.adobe.pdf',
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error generating analysis report:', error);
    throw error;
  }
}

/**
 * Generate and share portfolio report PDF
 */
export async function sharePortfolioReport(calculations: SavedCalculation[]): Promise<boolean> {
  try {
    const html = generatePortfolioReportHtml(calculations);
    const { uri } = await Print.printToFileAsync({ html, base64: false });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'ポートフォリオレポートを共有',
        UTI: 'com.adobe.pdf',
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error generating portfolio report:', error);
    throw error;
  }
}

/**
 * Print analysis report
 */
export async function printAnalysisReport(
  title: string,
  input: PropertyInput,
  result: CalculationResult,
  options?: {
    includeCashFlowProjection?: boolean;
    includeRiskAnalysis?: boolean;
    projectionYears?: number;
  }
): Promise<void> {
  const html = generateAnalysisReportHtml(title, input, result, options);
  await Print.printAsync({ html });
}

/**
 * Print portfolio report
 */
export async function printPortfolioReport(calculations: SavedCalculation[]): Promise<void> {
  const html = generatePortfolioReportHtml(calculations);
  await Print.printAsync({ html });
}
