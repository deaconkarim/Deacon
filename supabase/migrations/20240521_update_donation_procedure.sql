-- Create a function to update donations
CREATE OR REPLACE FUNCTION update_donation(
  p_id UUID,
  p_amount DECIMAL,
  p_date DATE,
  p_type TEXT,
  p_notes TEXT,
  p_attendance INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE donations
  SET 
    amount = p_amount,
    date = p_date,
    type = p_type,
    notes = p_notes,
    attendance = p_attendance,
    updated_at = NOW()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql; 