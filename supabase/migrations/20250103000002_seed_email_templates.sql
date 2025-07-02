-- Add unique constraint on email template names
ALTER TABLE email_templates 
ADD CONSTRAINT email_templates_name_unique UNIQUE (name);

-- Seed email templates with common church communication templates
INSERT INTO email_templates (name, description, subject, template_text, variables) VALUES
(
  'Weekly Newsletter',
  'Template for weekly church newsletters with updates and announcements',
  'Weekly Update - {church_name}',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Update - {church_name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <div style="width: 60px; height: 60px; background: rgba(255, 255, 255, 0.15); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                <span style="font-size: 28px; color: white;">⛪</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">{church_name}</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 14px; font-weight: 400;">Weekly Update</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px;">
            <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 20px;">Hello {first_name},</h2>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin-bottom: 20px;">
                Thank you for being part of our church family! Here''s what''s happening this week at {church_name}.
            </p>

            <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 18px;">📅 This Week''s Events</h3>
                {weekly_events}
            </div>

            <div style="background-color: #f0fff4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 18px;">🙏 Prayer Requests</h3>
                {prayer_requests}
            </div>

            <div style="background-color: #fffaf0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 18px;">💝 Opportunities to Serve</h3>
                {volunteer_opportunities}
            </div>

            <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin-top: 30px;">
                We look forward to seeing you this Sunday! If you have any questions or need assistance, please don''t hesitate to reach out.
            </p>

            <p style="color: #4a5568; font-size: 16px; line-height: 1.7;">
                Blessings,<br>
                The {church_name} Team
            </p>
        </div>

        <!-- Footer -->
        <div style="background: #2d3748; padding: 30px; text-align: center;">
            <div style="margin-bottom: 16px;">
                <h3 style="color: white; margin: 0 0 6px; font-size: 16px; font-weight: 600;">{church_name}</h3>
                <p style="color: #a0aec0; margin: 0; font-size: 12px;">Church Command Center</p>
            </div>
            <div style="border-top: 1px solid #4a5568; padding-top: 16px;">
                <p style="color: #a0aec0; margin: 0 0 6px; font-size: 11px;">
                    This email was sent from your church''s communication system.
                </p>
                <p style="color: #a0aec0; margin: 0; font-size: 11px;">
                    Questions? Contact your church administrator for assistance.
                </p>
            </div>
        </div>
    </div>
</body>
</html>',
  ARRAY['first_name', 'church_name', 'weekly_events', 'prayer_requests', 'volunteer_opportunities']
),
(
  'Event Reminder',
  'Template for reminding members about upcoming events',
  'Reminder: {event_name} - {church_name}',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Reminder - {event_name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <div style="width: 60px; height: 60px; background: rgba(255, 255, 255, 0.15); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                <span style="font-size: 28px; color: white;">📅</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Event Reminder</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 14px; font-weight: 400;">{church_name}</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px;">
            <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 20px;">Hello {first_name},</h2>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin-bottom: 20px;">
                This is a friendly reminder about the upcoming event at {church_name}.
            </p>

            <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 18px;">📅 {event_name}</h3>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 10px 0;">
                    <strong>Date:</strong> {event_date}<br>
                    <strong>Time:</strong> {event_time}<br>
                    <strong>Location:</strong> {event_location}
                </p>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 10px 0;">
                    {event_description}
                </p>
            </div>

            <div style="background-color: #f0fff4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 18px;">🎯 What to Bring</h3>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0;">
                    {what_to_bring}
                </p>
            </div>

            <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin-top: 30px;">
                We''re excited to see you there! If you have any questions or need to make changes to your RSVP, please contact us.
            </p>

            <p style="color: #4a5568; font-size: 16px; line-height: 1.7;">
                Blessings,<br>
                The {church_name} Team
            </p>
        </div>

        <!-- Footer -->
        <div style="background: #2d3748; padding: 30px; text-align: center;">
            <div style="margin-bottom: 16px;">
                <h3 style="color: white; margin: 0 0 6px; font-size: 16px; font-weight: 600;">{church_name}</h3>
                <p style="color: #a0aec0; margin: 0; font-size: 12px;">Church Command Center</p>
            </div>
            <div style="border-top: 1px solid #4a5568; padding-top: 16px;">
                <p style="color: #a0aec0; margin: 0 0 6px; font-size: 11px;">
                    This email was sent from your church''s communication system.
                </p>
                <p style="color: #a0aec0; margin: 0; font-size: 11px;">
                    Questions? Contact your church administrator for assistance.
                </p>
            </div>
        </div>
    </div>
</body>
</html>',
  ARRAY['first_name', 'church_name', 'event_name', 'event_date', 'event_time', 'event_location', 'event_description', 'what_to_bring']
),
(
  'Prayer Request',
  'Template for sharing prayer requests with the congregation',
  'Prayer Request - {church_name}',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prayer Request - {church_name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <div style="width: 60px; height: 60px; background: rgba(255, 255, 255, 0.15); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                <span style="font-size: 28px; color: white;">🙏</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Prayer Request</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 14px; font-weight: 400;">{church_name}</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px;">
            <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 20px;">Dear {church_name} Family,</h2>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin-bottom: 20px;">
                We have a prayer request that we''d like to share with our church family. Please join us in lifting this up to the Lord.
            </p>

            <div style="background-color: #fef5e7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ed8936;">
                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 18px;">🙏 Prayer Request</h3>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 10px 0;">
                    <strong>For:</strong> {prayer_for}<br>
                    <strong>Request:</strong> {prayer_request}
                </p>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 10px 0;">
                    {additional_details}
                </p>
            </div>

            <div style="background-color: #f0fff4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 18px;">💝 How You Can Help</h3>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0;">
                    {how_to_help}
                </p>
            </div>

            <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin-top: 30px;">
                "For where two or three gather in my name, there am I with them." - Matthew 18:20
            </p>

            <p style="color: #4a5568; font-size: 16px; line-height: 1.7;">
                Thank you for your prayers and support.<br>
                The {church_name} Team
            </p>
        </div>

        <!-- Footer -->
        <div style="background: #2d3748; padding: 30px; text-align: center;">
            <div style="margin-bottom: 16px;">
                <h3 style="color: white; margin: 0 0 6px; font-size: 16px; font-weight: 600;">{church_name}</h3>
                <p style="color: #a0aec0; margin: 0; font-size: 12px;">Church Command Center</p>
            </div>
            <div style="border-top: 1px solid #4a5568; padding-top: 16px;">
                <p style="color: #a0aec0; margin: 0 0 6px; font-size: 11px;">
                    This email was sent from your church''s communication system.
                </p>
                <p style="color: #a0aec0; margin: 0; font-size: 11px;">
                    Questions? Contact your church administrator for assistance.
                </p>
            </div>
        </div>
    </div>
</body>
</html>',
  ARRAY['church_name', 'prayer_for', 'prayer_request', 'additional_details', 'how_to_help']
),
(
  'Volunteer Opportunity',
  'Template for announcing volunteer opportunities and service needs',
  'Volunteer Opportunity: {opportunity_title} - {church_name}',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Volunteer Opportunity - {opportunity_title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <div style="width: 60px; height: 60px; background: rgba(255, 255, 255, 0.15); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                <span style="font-size: 28px; color: white;">🤝</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Volunteer Opportunity</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 14px; font-weight: 400;">{church_name}</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px;">
            <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 20px;">Hello {first_name},</h2>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin-bottom: 20px;">
                We have an exciting opportunity for you to serve at {church_name}! Your gifts and talents are needed in our ministry.
            </p>

            <div style="background-color: #f0fff4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #48bb78;">
                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 18px;">🤝 {opportunity_title}</h3>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 10px 0;">
                    <strong>Role:</strong> {role_description}<br>
                    <strong>Time Commitment:</strong> {time_commitment}<br>
                    <strong>Location:</strong> {location}<br>
                    <strong>When:</strong> {schedule}
                </p>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 10px 0;">
                    {detailed_description}
                </p>
            </div>

            <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 18px;">💪 What You''ll Need</h3>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0;">
                    {requirements}
                </p>
            </div>

            <div style="background-color: #fef5e7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 18px;">🎯 Impact</h3>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0;">
                    {impact_description}
                </p>
            </div>

            <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin-top: 30px;">
                "Each of you should use whatever gift you have received to serve others, as faithful stewards of God''s grace in its various forms." - 1 Peter 4:10
            </p>

            <p style="color: #4a5568; font-size: 16px; line-height: 1.7;">
                If you''re interested in this opportunity or have questions, please contact us. We''d love to have you join our team!
            </p>

            <p style="color: #4a5568; font-size: 16px; line-height: 1.7;">
                Blessings,<br>
                The {church_name} Team
            </p>
        </div>

        <!-- Footer -->
        <div style="background: #2d3748; padding: 30px; text-align: center;">
            <div style="margin-bottom: 16px;">
                <h3 style="color: white; margin: 0 0 6px; font-size: 16px; font-weight: 600;">{church_name}</h3>
                <p style="color: #a0aec0; margin: 0; font-size: 12px;">Church Command Center</p>
            </div>
            <div style="border-top: 1px solid #4a5568; padding-top: 16px;">
                <p style="color: #a0aec0; margin: 0 0 6px; font-size: 11px;">
                    This email was sent from your church''s communication system.
                </p>
                <p style="color: #a0aec0; margin: 0; font-size: 11px;">
                    Questions? Contact your church administrator for assistance.
                </p>
            </div>
        </div>
    </div>
</body>
</html>',
  ARRAY['first_name', 'church_name', 'opportunity_title', 'role_description', 'time_commitment', 'location', 'schedule', 'detailed_description', 'requirements', 'impact_description']
),
(
  'Welcome New Member',
  'Template for welcoming new members to the church family',
  'Welcome to {church_name}!',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {church_name}!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <div style="width: 60px; height: 60px; background: rgba(255, 255, 255, 0.15); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                <span style="font-size: 28px; color: white;">🎉</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Welcome!</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 14px; font-weight: 400;">{church_name}</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px;">
            <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 20px;">Welcome, {first_name}!</h2>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin-bottom: 20px;">
                We are so excited to welcome you to the {church_name} family! We''re grateful that you''ve chosen to be part of our community.
            </p>

            <div style="background-color: #f0fff4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #48bb78;">
                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 18px;">🎯 What''s Next?</h3>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 10px 0;">
                    {next_steps}
                </p>
            </div>

            <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 18px;">📅 Service Times</h3>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0;">
                    {service_times}
                </p>
            </div>

            <div style="background-color: #fef5e7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 18px;">🤝 Get Connected</h3>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0;">
                    {connection_opportunities}
                </p>
            </div>

            <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin-top: 30px;">
                We look forward to getting to know you better and walking alongside you in your faith journey. If you have any questions or need assistance, please don''t hesitate to reach out.
            </p>

            <p style="color: #4a5568; font-size: 16px; line-height: 1.7;">
                Welcome to the family!<br>
                The {church_name} Team
            </p>
        </div>

        <!-- Footer -->
        <div style="background: #2d3748; padding: 30px; text-align: center;">
            <div style="margin-bottom: 16px;">
                <h3 style="color: white; margin: 0 0 6px; font-size: 16px; font-weight: 600;">{church_name}</h3>
                <p style="color: #a0aec0; margin: 0; font-size: 12px;">Church Command Center</p>
            </div>
            <div style="border-top: 1px solid #4a5568; padding-top: 16px;">
                <p style="color: #a0aec0; margin: 0 0 6px; font-size: 11px;">
                    This email was sent from your church''s communication system.
                </p>
                <p style="color: #a0aec0; margin: 0; font-size: 11px;">
                    Questions? Contact your church administrator for assistance.
                </p>
            </div>
        </div>
    </div>
</body>
</html>',
  ARRAY['first_name', 'church_name', 'next_steps', 'service_times', 'connection_opportunities']
),
(
  'Emergency Alert',
  'Template for urgent church announcements and emergency communications',
  'URGENT: {alert_title} - {church_name}',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>URGENT: {alert_title} - {church_name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); padding: 40px; text-align: center;">
            <div style="width: 60px; height: 60px; background: rgba(255, 255, 255, 0.15); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                <span style="font-size: 28px; color: white;">🚨</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">URGENT ALERT</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 14px; font-weight: 400;">{church_name}</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px;">
            <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 20px;">Dear {church_name} Family,</h2>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin-bottom: 20px;">
                This is an urgent message from {church_name}. Please read this information carefully.
            </p>

            <div style="background-color: #fed7d7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e53e3e;">
                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 18px;">🚨 {alert_title}</h3>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 10px 0;">
                    {alert_message}
                </p>
            </div>

            <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 18px;">📋 Action Required</h3>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0;">
                    {action_required}
                </p>
            </div>

            <div style="background-color: #fef5e7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 18px;">📞 Contact Information</h3>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0;">
                    {contact_info}
                </p>
            </div>

            <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin-top: 30px;">
                Please share this information with other church members who may not have received this email. We will provide updates as more information becomes available.
            </p>

            <p style="color: #4a5568; font-size: 16px; line-height: 1.7;">
                Thank you for your attention to this matter.<br>
                The {church_name} Leadership Team
            </p>
        </div>

        <!-- Footer -->
        <div style="background: #2d3748; padding: 30px; text-align: center;">
            <div style="margin-bottom: 16px;">
                <h3 style="color: white; margin: 0 0 6px; font-size: 16px; font-weight: 600;">{church_name}</h3>
                <p style="color: #a0aec0; margin: 0; font-size: 12px;">Church Command Center</p>
            </div>
            <div style="border-top: 1px solid #4a5568; padding-top: 16px;">
                <p style="color: #a0aec0; margin: 0 0 6px; font-size: 11px;">
                    This email was sent from your church''s communication system.
                </p>
                <p style="color: #a0aec0; margin: 0; font-size: 11px;">
                    Questions? Contact your church administrator for assistance.
                </p>
            </div>
        </div>
    </div>
</body>
</html>',
  ARRAY['church_name', 'alert_title', 'alert_message', 'action_required', 'contact_info']
)
ON CONFLICT (name) DO NOTHING; 