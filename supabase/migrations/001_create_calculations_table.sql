-- Create calculations table for storing property investment calculations
CREATE TABLE IF NOT EXISTS calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  property_type TEXT NOT NULL DEFAULT 'CONDOMINIUM',

  -- Property Information
  price DECIMAL NOT NULL,
  monthly_rent DECIMAL NOT NULL,
  management_fee DECIMAL NOT NULL DEFAULT 0,
  repair_reserve DECIMAL NOT NULL DEFAULT 0,
  property_tax DECIMAL NOT NULL DEFAULT 0,
  insurance_fee DECIMAL NOT NULL DEFAULT 0,
  vacancy_rate DECIMAL NOT NULL DEFAULT 5,

  -- Loan Information
  down_payment DECIMAL,
  loan_amount DECIMAL NOT NULL DEFAULT 0,
  loan_interest_rate DECIMAL NOT NULL DEFAULT 0,
  loan_period_years INTEGER NOT NULL DEFAULT 0,

  -- Calculated Results
  gross_yield DECIMAL NOT NULL,
  net_yield DECIMAL NOT NULL,
  annual_cash_flow DECIMAL NOT NULL,
  monthly_cash_flow DECIMAL NOT NULL,
  ccr DECIMAL NOT NULL DEFAULT 0,
  payback_period DECIMAL,
  annual_rent_income DECIMAL NOT NULL,
  annual_expenses DECIMAL NOT NULL,
  annual_net_income DECIMAL NOT NULL,
  annual_loan_payment DECIMAL NOT NULL DEFAULT 0,
  monthly_loan_payment DECIMAL NOT NULL DEFAULT 0,
  total_loan_payment DECIMAL NOT NULL DEFAULT 0,

  -- Metadata
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_calculations_created_at ON calculations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculations_is_favorite ON calculations(is_favorite);

-- Enable Row Level Security
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own calculations
CREATE POLICY "Users can view own calculations"
  ON calculations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own calculations
CREATE POLICY "Users can insert own calculations"
  ON calculations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own calculations
CREATE POLICY "Users can update own calculations"
  ON calculations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own calculations
CREATE POLICY "Users can delete own calculations"
  ON calculations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to call the function on update
DROP TRIGGER IF EXISTS update_calculations_updated_at ON calculations;
CREATE TRIGGER update_calculations_updated_at
  BEFORE UPDATE ON calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
