-- Seed members table with member data
-- Clear existing data first
DELETE FROM public.members;

-- Insert member data
INSERT INTO public.members (firstname, lastname, email, phone, address, status, created_at) VALUES
-- From Flocknote data with contact info
('Anthony', 'Grose', 'blbchurchpastor@gmail.com', '925-550-1617', NULL, 'active', NOW()),
('Randy', 'Huey', 'frhuey@gmail.com', '925-518-8439', NULL, 'active', NOW()),
('Karim', 'Maguid', 'kmaguid@gmail.com', '925-813-9893', NULL, 'active', NOW()),
('Maryjane', 'Perez', 'mjperez8869@yahoo.com', '925-550-7279', NULL, 'active', NOW()),
('Carol', 'Baldwin', 'cjbaldwin@comcast.net', '925-516-8949', '{"street": "894 Blossom Dr", "city": "Brentwood", "state": "CA", "zip": "94513-6142"}', 'active', NOW()),
('Millie', 'Blanchard', NULL, '925-234-1805', '{"street": "PO Box 592", "city": "Byron", "state": "CA", "zip": "94514"}', 'active', NOW()),
('Roy', 'Blanchard', NULL, '925-234-1806', '{"street": "PO Box 592", "city": "Byron", "state": "CA", "zip": "94514"}', 'active', NOW()),
('Wendy', 'Burman', NULL, '510-641-8056', '{"street": "146 Redoldo Dr", "city": "Pittsburg", "state": "CA", "zip": "94565"}', 'active', NOW()),
('Leslie', 'Butler', 'butlerleslie91@gmail.com', '925-206-8709', '{"street": "101 Shady Ln", "city": "Antioch", "state": "CA", "zip": "94509"}', 'active', NOW()),
('Anna', 'Fraasch', NULL, '925-238-6849', '{"street": "4021 Woodhill Dr", "city": "Oakley", "state": "CA", "zip": "94561"}', 'active', NOW()),
('Angela', 'Gallegos', 'creationbyangela@gmail.com', '925-437-3245', NULL, 'active', NOW()),
('Cesar', 'Gomez', NULL, '408-646-9232', NULL, 'active', NOW()),
('Doreen', 'Katiba', 'dorkatiba@yahoo.com', '925-727-4086', NULL, 'active', NOW()),
('Kathy', 'Killips', 'kskillips1121@gmail.com', '925-499-5136', NULL, 'active', NOW()),
('Rose', 'Leyvas', NULL, '510-846-2824', NULL, 'active', NOW()),
('Amber', 'Maguid', 'ambermbesser@gmail.com', '925-813-9860', NULL, 'active', NOW()),
('Joseph', 'Mallatt', NULL, '925-510-1620', NULL, 'active', NOW()),
('Erica', 'Miller', NULL, '925-856-7073', NULL, 'active', NOW()),
('Debra', 'Minaker', 'debrad1202@yahoo.com', '925-783-1802', NULL, 'active', NOW()),
('Suzanne', 'Moore', NULL, '208-616-6204', NULL, 'active', NOW()),
('Mike', 'Murray', NULL, '925-783-6404', NULL, 'active', NOW()),
('David', 'Navarrette', 'totaleliteca@gmail.com', '925-813-1319', NULL, 'active', NOW()),
('Lori', 'Powell', NULL, '925-219-7534', NULL, 'active', NOW()),
('Roger', 'Powell', 'rdpowellags@comcast.net', '925-477-0725', NULL, 'active', NOW()),
('Lori', 'Tlatelpa', 'lor.tlatelpa@gmail.com', '925-418-9885', NULL, 'active', NOW()),
('Clive', 'Tsuma', 'cktsuma@gmail.com', '510-650-6462', NULL, 'active', NOW()),
('Carol', 'Viramontez', 'viramontezcarol@gmail.com', '925-813-1350', NULL, 'active', NOW()),

-- Additional members from address data
('Jonathan', 'Baker', NULL, NULL, '{"street": "169 Eveningstar Ct", "city": "Pittsburg", "state": "CA", "zip": "94565-3616"}', 'active', NOW()),
('Laura', 'Baker', NULL, NULL, '{"street": "169 Eveningstar Ct", "city": "Pittsburg", "state": "CA", "zip": "94565-3616"}', 'active', NOW()),
('John', 'Borschdorf', NULL, NULL, '{"street": "260 Spindrift Ct", "city": "Oakley", "state": "CA", "zip": "94561"}', 'active', NOW()),
('Kaitlyn', 'Borschdorf', NULL, NULL, '{"street": "260 Spindrift Ct", "city": "Oakley", "state": "CA", "zip": "94561"}', 'active', NOW()),
('Dan', 'Burch', NULL, NULL, '{"street": "260 Spindrift Ct", "city": "Oakley", "state": "CA", "zip": "94561"}', 'active', NOW()),
('Jane', 'Burch', NULL, NULL, '{"street": "260 Spindrift Ct", "city": "Oakley", "state": "CA", "zip": "94561"}', 'active', NOW()),
('Debra', 'Chew', NULL, NULL, '{"street": "330 Shady Oak Drive", "city": "Oakley", "state": "CA", "zip": "94561"}', 'active', NOW()),
('Coral', 'Eggers', NULL, NULL, '{"street": "1546 Melissa Circle", "city": "Antioch", "state": "CA", "zip": "94509"}', 'active', NOW()),
('Donald', 'Fraasch', NULL, NULL, '{"street": "4021 Woodhill Dr", "city": "Oakley", "state": "CA", "zip": "94561"}', 'active', NOW()); 