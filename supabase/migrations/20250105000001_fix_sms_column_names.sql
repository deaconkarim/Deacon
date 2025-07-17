-- Fix SMS column names to match frontend expectations
-- This migration updates column names to use camelCase as expected by the frontend

-- Fix sms_campaigns table column names
DO $$
BEGIN
  -- Rename scheduled_date to scheduledDate if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_campaigns' AND column_name = 'scheduled_date') THEN
    ALTER TABLE sms_campaigns RENAME COLUMN scheduled_date TO "scheduledDate";
  END IF;
  
  -- Rename scheduled_time to scheduledTime if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_campaigns' AND column_name = 'scheduled_time') THEN
    ALTER TABLE sms_campaigns RENAME COLUMN scheduled_time TO "scheduledTime";
  END IF;
END $$;

-- Fix sms_ab_tests table column names
DO $$
BEGIN
  -- Rename variant_a to variantA if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_ab_tests' AND column_name = 'variant_a') THEN
    ALTER TABLE sms_ab_tests RENAME COLUMN variant_a TO "variantA";
  END IF;
  
  -- Rename variant_b to variantB if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_ab_tests' AND column_name = 'variant_b') THEN
    ALTER TABLE sms_ab_tests RENAME COLUMN variant_b TO "variantB";
  END IF;
  
  -- Rename test_size to testSize if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_ab_tests' AND column_name = 'test_size') THEN
    ALTER TABLE sms_ab_tests RENAME COLUMN test_size TO "testSize";
  END IF;
  
  -- Rename variant_a_stats to variantAStats if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_ab_tests' AND column_name = 'variant_a_stats') THEN
    ALTER TABLE sms_ab_tests RENAME COLUMN variant_a_stats TO "variantAStats";
  END IF;
  
  -- Rename variant_b_stats to variantBStats if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_ab_tests' AND column_name = 'variant_b_stats') THEN
    ALTER TABLE sms_ab_tests RENAME COLUMN variant_b_stats TO "variantBStats";
  END IF;
END $$;