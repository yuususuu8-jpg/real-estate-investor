// Property Investment Calculation Logic

export interface PropertyInput {
  // 基本情報
  price: number; // 物件価格
  monthlyRent: number; // 月額家賃収入

  // 経費（任意）
  managementFee?: number; // 管理費（月額）
  repairReserve?: number; // 修繕積立金（月額）
  propertyTax?: number; // 固定資産税（年額）
  insuranceFee?: number; // 火災保険（年額）
  vacancyRate?: number; // 空室率（%）

  // ローン情報（任意）
  downPayment?: number; // 頭金
  loanAmount?: number; // ローン金額
  loanInterestRate?: number; // 金利（年率%）
  loanPeriodYears?: number; // 返済期間（年）
}

export interface CalculationResult {
  // 利回り
  grossYield: number; // 表面利回り（%）
  netYield: number; // 実質利回り（%）

  // 収支
  annualRentIncome: number; // 年間家賃収入
  annualExpenses: number; // 年間経費
  annualNetIncome: number; // 年間純収入（NOI）
  monthlyCashFlow: number; // 月間キャッシュフロー
  annualCashFlow: number; // 年間キャッシュフロー

  // ローン関連
  monthlyLoanPayment: number; // 月間ローン返済額
  annualLoanPayment: number; // 年間ローン返済額
  totalLoanPayment: number; // ローン返済総額

  // 投資指標
  ccr: number; // 自己資金配当率（%）
  paybackPeriod: number; // 投資回収期間（年）

  // 経費内訳
  expenses: {
    managementFee: number;
    repairReserve: number;
    propertyTax: number;
    insuranceFee: number;
    vacancyLoss: number;
  };
}

// 月間ローン返済額を計算（元利均等返済）
export function calculateMonthlyLoanPayment(
  loanAmount: number,
  annualInterestRate: number,
  loanPeriodYears: number
): number {
  if (loanAmount <= 0 || loanPeriodYears <= 0) return 0;
  if (annualInterestRate <= 0) {
    // 無利子の場合
    return loanAmount / (loanPeriodYears * 12);
  }

  const monthlyRate = annualInterestRate / 100 / 12;
  const totalPayments = loanPeriodYears * 12;

  const payment =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1);

  return Math.round(payment);
}

// 表面利回りを計算
export function calculateGrossYield(price: number, annualRent: number): number {
  if (price <= 0) return 0;
  return (annualRent / price) * 100;
}

// 実質利回りを計算
export function calculateNetYield(
  price: number,
  annualNetIncome: number
): number {
  if (price <= 0) return 0;
  return (annualNetIncome / price) * 100;
}

// CCR（自己資金配当率）を計算
export function calculateCCR(
  annualCashFlow: number,
  downPayment: number
): number {
  if (downPayment <= 0) return 0;
  return (annualCashFlow / downPayment) * 100;
}

// 投資回収期間を計算
export function calculatePaybackPeriod(
  totalInvestment: number,
  annualCashFlow: number
): number {
  if (annualCashFlow <= 0) return Infinity;
  return totalInvestment / annualCashFlow;
}

// メイン計算関数
export function calculatePropertyInvestment(
  input: PropertyInput
): CalculationResult {
  const {
    price,
    monthlyRent,
    managementFee = 0,
    repairReserve = 0,
    propertyTax = 0,
    insuranceFee = 0,
    vacancyRate = 5, // デフォルト5%
    downPayment = price, // デフォルトは全額自己資金
    loanAmount = 0,
    loanInterestRate = 0,
    loanPeriodYears = 0,
  } = input;

  // 年間家賃収入
  const annualRentIncome = monthlyRent * 12;

  // 空室損失
  const vacancyLoss = annualRentIncome * (vacancyRate / 100);

  // 年間経費
  const annualManagementFee = managementFee * 12;
  const annualRepairReserve = repairReserve * 12;
  const annualExpenses =
    annualManagementFee +
    annualRepairReserve +
    propertyTax +
    insuranceFee +
    vacancyLoss;

  // 年間純収入（NOI = Net Operating Income）
  const annualNetIncome = annualRentIncome - annualExpenses;

  // ローン返済額
  const monthlyLoanPayment = calculateMonthlyLoanPayment(
    loanAmount,
    loanInterestRate,
    loanPeriodYears
  );
  const annualLoanPayment = monthlyLoanPayment * 12;
  const totalLoanPayment = monthlyLoanPayment * loanPeriodYears * 12;

  // キャッシュフロー
  const annualCashFlow = annualNetIncome - annualLoanPayment;
  const monthlyCashFlow = annualCashFlow / 12;

  // 利回り計算
  const grossYield = calculateGrossYield(price, annualRentIncome);
  const netYield = calculateNetYield(price, annualNetIncome);

  // 自己資金配当率
  const actualDownPayment = downPayment > 0 ? downPayment : price - loanAmount;
  const ccr = calculateCCR(annualCashFlow, actualDownPayment);

  // 投資回収期間
  const paybackPeriod = calculatePaybackPeriod(actualDownPayment, annualCashFlow);

  return {
    grossYield: Math.round(grossYield * 100) / 100,
    netYield: Math.round(netYield * 100) / 100,
    annualRentIncome: Math.round(annualRentIncome),
    annualExpenses: Math.round(annualExpenses),
    annualNetIncome: Math.round(annualNetIncome),
    monthlyCashFlow: Math.round(monthlyCashFlow),
    annualCashFlow: Math.round(annualCashFlow),
    monthlyLoanPayment: Math.round(monthlyLoanPayment),
    annualLoanPayment: Math.round(annualLoanPayment),
    totalLoanPayment: Math.round(totalLoanPayment),
    ccr: Math.round(ccr * 100) / 100,
    paybackPeriod: Math.round(paybackPeriod * 10) / 10,
    expenses: {
      managementFee: Math.round(annualManagementFee),
      repairReserve: Math.round(annualRepairReserve),
      propertyTax: Math.round(propertyTax),
      insuranceFee: Math.round(insuranceFee),
      vacancyLoss: Math.round(vacancyLoss),
    },
  };
}

// 金額をフォーマット（カンマ区切り）
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP').format(amount);
}

// パーセントをフォーマット
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}
