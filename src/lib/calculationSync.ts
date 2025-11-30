import { supabase } from './supabase';
import { PropertyInput, CalculationResult } from './calculations';

export interface CloudCalculation {
  id: string;
  user_id: string;
  title: string;
  property_type: string;
  price: number;
  monthly_rent: number;
  management_fee: number;
  repair_reserve: number;
  property_tax: number;
  insurance_fee: number;
  vacancy_rate: number;
  down_payment: number | null;
  loan_amount: number;
  loan_interest_rate: number;
  loan_period_years: number;
  gross_yield: number;
  net_yield: number;
  annual_cash_flow: number;
  monthly_cash_flow: number;
  ccr: number;
  payback_period: number | null;
  annual_rent_income: number;
  annual_expenses: number;
  annual_net_income: number;
  annual_loan_payment: number;
  monthly_loan_payment: number;
  total_loan_payment: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalCalculation {
  id: string;
  title: string;
  input: PropertyInput;
  result: CalculationResult;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  synced?: boolean;
}

// Convert local calculation to cloud format
function toCloudFormat(
  calc: LocalCalculation,
  userId: string
): Omit<CloudCalculation, 'created_at' | 'updated_at'> {
  return {
    id: calc.id,
    user_id: userId,
    title: calc.title,
    property_type: 'CONDOMINIUM', // Default type
    price: calc.input.price,
    monthly_rent: calc.input.monthlyRent,
    management_fee: calc.input.managementFee || 0,
    repair_reserve: calc.input.repairReserve || 0,
    property_tax: calc.input.propertyTax || 0,
    insurance_fee: calc.input.insuranceFee || 0,
    vacancy_rate: calc.input.vacancyRate || 5,
    down_payment: calc.input.downPayment || null,
    loan_amount: calc.input.loanAmount || 0,
    loan_interest_rate: calc.input.loanInterestRate || 0,
    loan_period_years: calc.input.loanPeriodYears || 0,
    gross_yield: calc.result.grossYield,
    net_yield: calc.result.netYield,
    annual_cash_flow: calc.result.annualCashFlow,
    monthly_cash_flow: calc.result.monthlyCashFlow,
    ccr: calc.result.ccr,
    payback_period: calc.result.paybackPeriod === Infinity ? null : calc.result.paybackPeriod,
    annual_rent_income: calc.result.annualRentIncome,
    annual_expenses: calc.result.annualExpenses,
    annual_net_income: calc.result.annualNetIncome,
    annual_loan_payment: calc.result.annualLoanPayment,
    monthly_loan_payment: calc.result.monthlyLoanPayment,
    total_loan_payment: calc.result.totalLoanPayment,
    is_favorite: calc.isFavorite,
  };
}

// Convert cloud calculation to local format
function toLocalFormat(cloud: CloudCalculation): LocalCalculation {
  return {
    id: cloud.id,
    title: cloud.title,
    input: {
      price: cloud.price,
      monthlyRent: cloud.monthly_rent,
      managementFee: cloud.management_fee,
      repairReserve: cloud.repair_reserve,
      propertyTax: cloud.property_tax,
      insuranceFee: cloud.insurance_fee,
      vacancyRate: cloud.vacancy_rate,
      downPayment: cloud.down_payment || undefined,
      loanAmount: cloud.loan_amount,
      loanInterestRate: cloud.loan_interest_rate,
      loanPeriodYears: cloud.loan_period_years,
    },
    result: {
      grossYield: cloud.gross_yield,
      netYield: cloud.net_yield,
      annualCashFlow: cloud.annual_cash_flow,
      monthlyCashFlow: cloud.monthly_cash_flow,
      ccr: cloud.ccr,
      paybackPeriod: cloud.payback_period ?? Infinity,
      annualRentIncome: cloud.annual_rent_income,
      annualExpenses: cloud.annual_expenses,
      annualNetIncome: cloud.annual_net_income,
      annualLoanPayment: cloud.annual_loan_payment,
      monthlyLoanPayment: cloud.monthly_loan_payment,
      totalLoanPayment: cloud.total_loan_payment,
      expenses: {
        managementFee: cloud.management_fee * 12,
        repairReserve: cloud.repair_reserve * 12,
        propertyTax: cloud.property_tax,
        insuranceFee: cloud.insurance_fee,
        vacancyLoss: cloud.annual_rent_income * (cloud.vacancy_rate / 100),
      },
    },
    createdAt: cloud.created_at,
    updatedAt: cloud.updated_at,
    isFavorite: cloud.is_favorite,
    synced: true,
  };
}

// Fetch all calculations from Supabase
export async function fetchCloudCalculations(): Promise<{
  data: LocalCalculation[] | null;
  error: Error | null;
}> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('calculations')
      .select('*')
      .eq('user_id', session.session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const calculations = (data as CloudCalculation[]).map(toLocalFormat);
    return { data: calculations, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

// Upload a calculation to Supabase
export async function uploadCalculation(calc: LocalCalculation): Promise<{
  data: LocalCalculation | null;
  error: Error | null;
}> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const cloudCalc = toCloudFormat(calc, session.session.user.id);

    const { data, error } = await supabase
      .from('calculations')
      .upsert({
        ...cloudCalc,
        created_at: calc.createdAt,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: toLocalFormat(data as CloudCalculation), error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

// Delete a calculation from Supabase
export async function deleteCloudCalculation(id: string): Promise<{
  error: Error | null;
}> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      return { error: new Error('User not authenticated') };
    }

    const { error } = await supabase
      .from('calculations')
      .delete()
      .eq('id', id)
      .eq('user_id', session.session.user.id);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

// Update favorite status in Supabase
export async function updateFavoriteStatus(
  id: string,
  isFavorite: boolean
): Promise<{ error: Error | null }> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      return { error: new Error('User not authenticated') };
    }

    const { error } = await supabase
      .from('calculations')
      .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', session.session.user.id);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

// Sync local calculations with cloud
export async function syncCalculations(
  localCalculations: LocalCalculation[]
): Promise<{
  synced: LocalCalculation[];
  error: Error | null;
}> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      return { synced: localCalculations, error: new Error('User not authenticated') };
    }

    // Fetch cloud calculations
    const { data: cloudData, error: fetchError } = await fetchCloudCalculations();
    if (fetchError) {
      return { synced: localCalculations, error: fetchError };
    }

    const cloudCalculations = cloudData || [];
    const cloudIds = new Set(cloudCalculations.map((c) => c.id));
    const localIds = new Set(localCalculations.map((c) => c.id));

    // Find calculations to upload (local only)
    const toUpload = localCalculations.filter((c) => !cloudIds.has(c.id));

    // Upload local-only calculations
    for (const calc of toUpload) {
      await uploadCalculation(calc);
    }

    // Merge: prefer cloud data for conflicts, add local-only
    const mergedMap = new Map<string, LocalCalculation>();

    // Add cloud calculations
    cloudCalculations.forEach((c) => mergedMap.set(c.id, c));

    // Add local-only calculations (already uploaded)
    localCalculations.forEach((c) => {
      if (!cloudIds.has(c.id)) {
        mergedMap.set(c.id, { ...c, synced: true });
      }
    });

    const merged = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { synced: merged, error: null };
  } catch (err) {
    return { synced: localCalculations, error: err as Error };
  }
}
