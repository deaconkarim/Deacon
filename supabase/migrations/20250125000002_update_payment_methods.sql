-- Update payment method constraint to include Deacon payment methods
ALTER TABLE donations 
DROP CONSTRAINT IF EXISTS donations_payment_method_check;

ALTER TABLE donations 
ADD CONSTRAINT donations_payment_method_check 
CHECK (payment_method IN (
  'cash', 
  'check', 
  'credit_card', 
  'debit_card', 
  'ach', 
  'online', 
  'paypal', 
  'venmo', 
  'zelle', 
  'other',
  'Deacon - Credit Card',
  'Deacon - ACH Transfer'
));

-- Add comment explaining the new payment methods
COMMENT ON COLUMN donations.payment_method IS 'Payment method including Deacon platform methods'; 