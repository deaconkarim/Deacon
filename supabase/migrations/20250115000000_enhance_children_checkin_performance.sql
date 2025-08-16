-- Enhance Children's Check-in System Performance
-- Migration: 20250115000000_enhance_children_checkin_performance.sql

-- Add computed columns for better performance
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS age_computed INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN birth_date IS NOT NULL THEN 
      EXTRACT(YEAR FROM AGE(birth_date))
    ELSE NULL
  END
) STORED;

-- Add computed column for allergies
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS has_allergies_computed BOOLEAN GENERATED ALWAYS AS (
  EXISTS (
    SELECT 1 FROM child_allergies 
    WHERE child_allergies.child_id = members.id
  )
) STORED;

-- Add computed column for emergency contacts
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS emergency_contacts_count INTEGER GENERATED ALWAYS AS (
  (SELECT COUNT(*) FROM child_emergency_contacts WHERE child_emergency_contacts.child_id = members.id)
) STORED;

-- Create composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_members_children_org_type 
ON public.members(organization_id, member_type, firstname, lastname) 
WHERE member_type = 'child';

CREATE INDEX IF NOT EXISTS idx_members_children_org_grade 
ON public.members(organization_id, member_type, grade) 
WHERE member_type = 'child';

CREATE INDEX IF NOT EXISTS idx_members_children_org_age 
ON public.members(organization_id, member_type, age_computed) 
WHERE member_type = 'child';

CREATE INDEX IF NOT EXISTS idx_members_children_org_allergies 
ON public.members(organization_id, member_type, has_allergies_computed) 
WHERE member_type = 'child';

-- Enhance child_checkin_logs indexes
CREATE INDEX IF NOT EXISTS idx_child_checkin_logs_org_event_time 
ON public.child_checkin_logs(organization_id, event_id, check_in_time);

CREATE INDEX IF NOT EXISTS idx_child_checkin_logs_org_child_time 
ON public.child_checkin_logs(organization_id, child_id, check_in_time);

CREATE INDEX IF NOT EXISTS idx_child_checkin_logs_org_guardian_time 
ON public.child_checkin_logs(organization_id, checked_in_by, check_in_time);

-- Create partial index for active check-ins (not checked out)
CREATE INDEX IF NOT EXISTS idx_child_checkin_logs_active 
ON public.child_checkin_logs(organization_id, event_id, child_id) 
WHERE check_out_time IS NULL;

-- Enhance child_guardians indexes
CREATE INDEX IF NOT EXISTS idx_child_guardians_org_child 
ON public.child_guardians(organization_id, child_id);

CREATE INDEX IF NOT EXISTS idx_child_guardians_org_guardian 
ON public.child_guardians(organization_id, guardian_id);

CREATE INDEX IF NOT EXISTS idx_child_guardians_primary 
ON public.child_guardians(organization_id, child_id, is_primary) 
WHERE is_primary = true;

-- Create materialized view for frequently accessed data
CREATE MATERIALIZED VIEW IF NOT EXISTS children_checkin_summary AS
SELECT 
  m.id as child_id,
  m.organization_id,
  m.firstname,
  m.lastname,
  m.grade,
  m.age_computed as age,
  m.has_allergies_computed as has_allergies,
  m.emergency_contacts_count,
  COUNT(ccl.id) as total_checkins,
  COUNT(CASE WHEN ccl.check_out_time IS NULL THEN 1 END) as active_checkins,
  MAX(ccl.check_in_time) as last_checkin,
  MAX(ccl.check_out_time) as last_checkout,
  COUNT(DISTINCT ccl.checked_in_by) as unique_guardians
FROM members m
LEFT JOIN child_checkin_logs ccl ON m.id = ccl.child_id AND m.organization_id = ccl.organization_id
WHERE m.member_type = 'child'
GROUP BY m.id, m.organization_id, m.firstname, m.lastname, m.grade, m.age_computed, m.has_allergies_computed, m.emergency_contacts_count;

-- Create unique index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_children_checkin_summary_child 
ON children_checkin_summary(child_id, organization_id);

-- Create index for organization-based queries
CREATE INDEX IF NOT EXISTS idx_children_checkin_summary_org 
ON children_checkin_summary(organization_id);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_children_checkin_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY children_checkin_summary;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view when relevant data changes
CREATE OR REPLACE FUNCTION trigger_refresh_children_checkin_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Use a delayed refresh to avoid performance issues during bulk operations
  PERFORM pg_notify('refresh_children_checkin_summary', '');
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for the materialized view refresh
CREATE TRIGGER trigger_refresh_children_checkin_summary_checkin_logs
  AFTER INSERT OR UPDATE OR DELETE ON child_checkin_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_children_checkin_summary();

CREATE TRIGGER trigger_refresh_children_checkin_summary_members
  AFTER INSERT OR UPDATE OR DELETE ON members
  FOR EACH ROW
  WHEN (NEW.member_type = 'child' OR OLD.member_type = 'child')
  EXECUTE FUNCTION trigger_refresh_children_checkin_summary();

CREATE TRIGGER trigger_refresh_children_checkin_summary_allergies
  AFTER INSERT OR UPDATE OR DELETE ON child_allergies
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_children_checkin_summary();

CREATE TRIGGER trigger_refresh_children_checkin_summary_emergency_contacts
  AFTER INSERT OR UPDATE OR DELETE ON child_emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_children_checkin_summary();

-- Create function for efficient pagination
CREATE OR REPLACE FUNCTION get_children_paginated(
  p_organization_id UUID,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 50,
  p_search TEXT DEFAULT NULL,
  p_age_group TEXT DEFAULT NULL,
  p_grade TEXT DEFAULT NULL,
  p_has_allergies BOOLEAN DEFAULT NULL,
  p_checked_in_status TEXT DEFAULT 'all'
)
RETURNS TABLE(
  child_id UUID,
  firstname TEXT,
  lastname TEXT,
  grade TEXT,
  age INTEGER,
  has_allergies BOOLEAN,
  emergency_contacts_count INTEGER,
  is_checked_in BOOLEAN,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered_children AS (
    SELECT 
      ccs.child_id,
      ccs.firstname,
      ccs.lastname,
      ccs.grade,
      ccs.age,
      ccs.has_allergies,
      ccs.emergency_contacts_count,
      ccs.active_checkins > 0 as is_checked_in
    FROM children_checkin_summary ccs
    WHERE ccs.organization_id = p_organization_id
      AND (p_search IS NULL OR 
           ccs.firstname ILIKE '%' || p_search || '%' OR 
           ccs.lastname ILIKE '%' || p_search || '%')
      AND (p_age_group IS NULL OR 
           CASE 
             WHEN p_age_group = 'infant' THEN ccs.age <= 2
             WHEN p_age_group = 'toddler' THEN ccs.age BETWEEN 2 AND 4
             WHEN p_age_group = 'preschool' THEN ccs.age BETWEEN 4 AND 5
             WHEN p_age_group = 'elementary' THEN ccs.age BETWEEN 5 AND 11
             WHEN p_age_group = 'middle' THEN ccs.age BETWEEN 11 AND 14
             WHEN p_age_group = 'high' THEN ccs.age >= 14
             ELSE true
           END)
      AND (p_grade IS NULL OR ccs.grade = p_grade)
      AND (p_has_allergies IS NULL OR ccs.has_allergies = p_has_allergies)
      AND (p_checked_in_status = 'all' OR 
           (p_checked_in_status = 'checked-in' AND ccs.active_checkins > 0) OR
           (p_checked_in_status = 'not-checked-in' AND ccs.active_checkins = 0))
  ),
  counted_children AS (
    SELECT *, COUNT(*) OVER() as total_count
    FROM filtered_children
    ORDER BY firstname, lastname
    LIMIT p_page_size
    OFFSET (p_page - 1) * p_page_size
  )
  SELECT 
    cc.child_id,
    cc.firstname,
    cc.lastname,
    cc.grade,
    cc.age,
    cc.has_allergies,
    cc.emergency_contacts_count,
    cc.is_checked_in,
    cc.total_count
  FROM counted_children cc;
END;
$$ LANGUAGE plpgsql;

-- Create function for analytics data
CREATE OR REPLACE FUNCTION get_checkin_analytics(
  p_organization_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH analytics AS (
    SELECT
      -- Daily attendance trends
      (SELECT json_agg(
        json_build_object(
          'date', to_char(date_series.date, 'MMM dd'),
          'checkedIn', COALESCE(daily_stats.checkins, 0),
          'checkedOut', COALESCE(daily_stats.checkouts, 0),
          'total', (SELECT COUNT(*) FROM members WHERE member_type = 'child' AND organization_id = p_organization_id)
        )
      ) FROM (
        SELECT generate_series(p_start_date::date, p_end_date::date, '1 day'::interval)::date as date
      ) date_series
      LEFT JOIN (
        SELECT 
          DATE(check_in_time) as date,
          COUNT(*) as checkins,
          COUNT(check_out_time) as checkouts
        FROM child_checkin_logs
        WHERE organization_id = p_organization_id
          AND check_in_time >= p_start_date
          AND check_in_time <= p_end_date
        GROUP BY DATE(check_in_time)
      ) daily_stats ON date_series.date = daily_stats.date
      ORDER BY date_series.date) as attendance_trends,
      
      -- Hourly distribution
      (SELECT json_agg(
        json_build_object(
          'hour', hour || ':00',
          'count', COALESCE(hourly_stats.count, 0)
        )
      ) FROM (
        SELECT generate_series(0, 23) as hour
      ) hours
      LEFT JOIN (
        SELECT 
          EXTRACT(HOUR FROM check_in_time)::integer as hour,
          COUNT(*) as count
        FROM child_checkin_logs
        WHERE organization_id = p_organization_id
          AND check_in_time >= p_start_date
          AND check_in_time <= p_end_date
        GROUP BY EXTRACT(HOUR FROM check_in_time)
      ) hourly_stats ON hours.hour = hourly_stats.hour
      ORDER BY hours.hour) as hourly_distribution,
      
      -- Age group statistics
      (SELECT json_agg(
        json_build_object(
          'label', age_group.label,
          'count', age_group.total,
          'checkedIn', age_group.checked_in
        )
      ) FROM (
        SELECT 
          CASE 
            WHEN age <= 2 THEN 'Infant (0-2)'
            WHEN age <= 5 THEN 'Preschool (3-5)'
            WHEN age <= 11 THEN 'Elementary (6-11)'
            WHEN age <= 14 THEN 'Middle School (12-14)'
            ELSE 'High School (15+)'
          END as label,
          COUNT(*) as total,
          COUNT(CASE WHEN is_checked_in THEN 1 END) as checked_in
        FROM children_checkin_summary
        WHERE organization_id = p_organization_id
          AND age IS NOT NULL
        GROUP BY 
          CASE 
            WHEN age <= 2 THEN 'Infant (0-2)'
            WHEN age <= 5 THEN 'Preschool (3-5)'
            WHEN age <= 11 THEN 'Elementary (6-11)'
            WHEN age <= 14 THEN 'Middle School (12-14)'
            ELSE 'High School (15+)'
          END
        ORDER BY label
      ) age_group) as age_group_stats,
      
      -- Grade statistics
      (SELECT json_agg(
        json_build_object(
          'grade', grade_stats.grade,
          'count', grade_stats.total,
          'checkedIn', grade_stats.checked_in
        )
      ) FROM (
        SELECT 
          grade,
          COUNT(*) as total,
          COUNT(CASE WHEN is_checked_in THEN 1 END) as checked_in
        FROM children_checkin_summary
        WHERE organization_id = p_organization_id
          AND grade IS NOT NULL
        GROUP BY grade
        ORDER BY grade
      ) grade_stats) as grade_stats,
      
      -- Top guardians
      (SELECT json_agg(
        json_build_object(
          'name', guardian_stats.name,
          'checkins', guardian_stats.checkins,
          'uniqueChildren', guardian_stats.unique_children
        )
      ) FROM (
        SELECT 
          m.firstname || ' ' || m.lastname as name,
          COUNT(*) as checkins,
          COUNT(DISTINCT ccl.child_id) as unique_children
        FROM child_checkin_logs ccl
        JOIN members m ON ccl.checked_in_by = m.id
        WHERE ccl.organization_id = p_organization_id
          AND ccl.check_in_time >= p_start_date
          AND ccl.check_in_time <= p_end_date
        GROUP BY m.id, m.firstname, m.lastname
        ORDER BY checkins DESC
        LIMIT 10
      ) guardian_stats) as guardian_stats
  )
  SELECT json_build_object(
    'attendanceTrends', attendance_trends,
    'hourlyDistribution', hourly_distribution,
    'ageGroupStats', age_group_stats,
    'gradeStats', grade_stats,
    'guardianStats', guardian_stats
  ) INTO result
  FROM analytics;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_children_paginated(UUID, INTEGER, INTEGER, TEXT, TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_checkin_analytics(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT SELECT ON children_checkin_summary TO authenticated;

-- Create a scheduled job to refresh the materialized view (optional)
-- This would require pg_cron extension to be enabled
-- SELECT cron.schedule('refresh-children-checkin-summary', '*/15 * * * *', 'SELECT refresh_children_checkin_summary();');

-- Add comments for documentation
COMMENT ON MATERIALIZED VIEW children_checkin_summary IS 'Materialized view for efficient children check-in queries';
COMMENT ON FUNCTION get_children_paginated IS 'Efficient pagination function for children with filtering and search';
COMMENT ON FUNCTION get_checkin_analytics IS 'Comprehensive analytics function for check-in data';
COMMENT ON FUNCTION refresh_children_checkin_summary IS 'Function to refresh the children check-in summary materialized view';