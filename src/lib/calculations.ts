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

  // 投資期間・売却（IRR/NPV計算用）
  holdingPeriodYears?: number; // 保有期間（年）
  expectedSellingPrice?: number; // 想定売却価格
  discountRate?: number; // 割引率（%）- NPV計算用
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

  // 高度な投資指標（IRR/NPV）
  irr: number | null; // 内部収益率（%）
  npv: number | null; // 正味現在価値
  profitabilityIndex: number | null; // 収益性指数（PI）

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

// NPV（正味現在価値）を計算
export function calculateNPV(
  initialInvestment: number,
  cashFlows: number[],
  discountRate: number
): number {
  if (discountRate < 0) return 0;

  const rate = discountRate / 100;
  let npv = -initialInvestment;

  cashFlows.forEach((cf, year) => {
    npv += cf / Math.pow(1 + rate, year + 1);
  });

  return npv;
}

// IRR（内部収益率）を計算（ニュートン法）
export function calculateIRR(
  initialInvestment: number,
  cashFlows: number[],
  maxIterations: number = 1000,
  tolerance: number = 0.00001
): number | null {
  if (cashFlows.length === 0) return null;

  // 総キャッシュフローが初期投資を下回る場合は計算不可
  const totalCashFlow = cashFlows.reduce((sum, cf) => sum + cf, 0);
  if (totalCashFlow <= initialInvestment) return null;

  // Newton-Raphson法でIRRを求める
  let rate = 0.1; // 初期推定値 10%

  for (let i = 0; i < maxIterations; i++) {
    let npv = -initialInvestment;
    let npvDerivative = 0;

    cashFlows.forEach((cf, year) => {
      const t = year + 1;
      npv += cf / Math.pow(1 + rate, t);
      npvDerivative -= (t * cf) / Math.pow(1 + rate, t + 1);
    });

    if (Math.abs(npv) < tolerance) {
      return rate * 100; // パーセントで返す
    }

    if (npvDerivative === 0) {
      return null;
    }

    const newRate = rate - npv / npvDerivative;

    // 極端な値になった場合は計算不可
    if (newRate < -1 || newRate > 10) {
      return null;
    }

    rate = newRate;
  }

  return null; // 収束しなかった
}

// 収益性指数（PI）を計算
export function calculateProfitabilityIndex(
  initialInvestment: number,
  npv: number
): number | null {
  if (initialInvestment <= 0) return null;
  return (npv + initialInvestment) / initialInvestment;
}

// キャッシュフロー配列を生成（IRR/NPV計算用）
export function generateCashFlows(
  annualCashFlow: number,
  holdingPeriod: number,
  sellingPrice: number,
  remainingLoan: number = 0
): number[] {
  const cashFlows: number[] = [];

  for (let year = 1; year <= holdingPeriod; year++) {
    if (year === holdingPeriod) {
      // 最終年は売却益を加算（残債を差し引く）
      cashFlows.push(annualCashFlow + sellingPrice - remainingLoan);
    } else {
      cashFlows.push(annualCashFlow);
    }
  }

  return cashFlows;
}

// ローン残高を計算
export function calculateRemainingLoan(
  loanAmount: number,
  annualInterestRate: number,
  loanPeriodYears: number,
  yearsElapsed: number
): number {
  if (loanAmount <= 0 || yearsElapsed >= loanPeriodYears) return 0;

  const monthlyRate = annualInterestRate / 100 / 12;
  const totalPayments = loanPeriodYears * 12;
  const paymentsMade = yearsElapsed * 12;

  if (monthlyRate === 0) {
    // 無利子の場合
    const monthlyPayment = loanAmount / totalPayments;
    return loanAmount - monthlyPayment * paymentsMade;
  }

  // 元利均等返済の残高計算
  const monthlyPayment =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1);

  const remaining =
    loanAmount * Math.pow(1 + monthlyRate, paymentsMade) -
    monthlyPayment * ((Math.pow(1 + monthlyRate, paymentsMade) - 1) / monthlyRate);

  return Math.max(0, remaining);
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
    downPayment,
    loanAmount = 0,
    loanInterestRate = 0,
    loanPeriodYears = 0,
    // IRR/NPV計算用
    holdingPeriodYears = 10, // デフォルト10年
    expectedSellingPrice, // 未指定の場合は物件価格を使用
    discountRate = 5, // デフォルト5%
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
  // 頭金が明示的に指定されていない場合は、物件価格からローン金額を引いた額を自己資金とする
  // ローンがある場合: 自己資金 = 物件価格 - ローン金額
  // ローンがない場合（全額自己資金）: 自己資金 = 物件価格
  const calculatedDownPayment = price - loanAmount;
  const actualDownPayment = (downPayment !== undefined && downPayment > 0)
    ? downPayment
    : Math.max(0, calculatedDownPayment);
  const ccr = calculateCCR(annualCashFlow, actualDownPayment);

  // 投資回収期間（自己資金に対して）
  const paybackPeriod = calculatePaybackPeriod(actualDownPayment, annualCashFlow);

  // IRR/NPV計算
  // 売却価格（未指定の場合は購入価格と同額と仮定）
  const sellingPrice = expectedSellingPrice ?? price;
  // 保有期間終了時のローン残高
  const remainingLoan = calculateRemainingLoan(
    loanAmount,
    loanInterestRate,
    loanPeriodYears,
    holdingPeriodYears
  );
  // キャッシュフロー配列を生成
  const cashFlows = generateCashFlows(
    annualCashFlow,
    holdingPeriodYears,
    sellingPrice,
    remainingLoan
  );
  // IRR計算（初期投資は自己資金）
  const irr = calculateIRR(actualDownPayment, cashFlows);
  // NPV計算
  const npvValue = calculateNPV(actualDownPayment, cashFlows, discountRate);
  // 収益性指数
  const pi = calculateProfitabilityIndex(actualDownPayment, npvValue);

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
    irr: irr !== null ? Math.round(irr * 100) / 100 : null,
    npv: npvValue !== null ? Math.round(npvValue) : null,
    profitabilityIndex: pi !== null ? Math.round(pi * 100) / 100 : null,
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
