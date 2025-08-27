// Simple, clean email templates for the church app
export const emailTemplates = [
  {
    id: 'emergency-alert',
    name: 'Emergency Alert',
    description: 'Template for urgent church announcements and emergency communications',
    subject: 'URGENT: {alert_title} - {church_name}',
    template_text: `Dear {church_name} Family,

🚨 EMERGENCY ALERT: {alert_title}

{alert_message}

📋 Action Required:
{action_required}

📞 Contact Information:
{contact_info}

Please share this information with other church members who may not have received this email. We will provide updates as more information becomes available.

Thank you for your attention to this matter.

Blessings,
{church_name} Leadership Team

---
© {current_year} {church_name} • Church Command Center
This email was sent from your church's communication system.
Questions? Contact your church administrator for assistance.`,
    variables: ['church_name', 'alert_title', 'alert_message', 'action_required', 'contact_info', 'current_year']
  },
  
  {
    id: 'event-reminder',
    name: 'Event Reminder',
    description: 'Template for reminding members about upcoming events',
    subject: 'Reminder: {event_name} - {church_name}',
    template_text: `Dear {church_name} Family,

📅 EVENT REMINDER: {event_name}

📅 Date: {event_date}
🕒 Time: {event_time}
📍 Location: {event_location}

{event_description}

We look forward to seeing you there!

Blessings,
{church_name} Team

---
© {current_year} {church_name} • Church Command Center
This email was sent from your church's communication system.
Questions? Contact your church administrator for assistance.`,
    variables: ['church_name', 'event_name', 'event_date', 'event_time', 'event_location', 'event_description', 'current_year']
  },
  
  {
    id: 'prayer-request',
    name: 'Prayer Request',
    description: 'Template for sharing prayer requests with the congregation',
    subject: 'Prayer Request - {church_name}',
    template_text: `Dear {church_name} Family,

🙏 PRAYER REQUEST

For: {prayer_for}
Request: {prayer_request}

{additional_details}

"For where two or three gather in my name, there am I with them." - Matthew 18:20

Thank you for your prayers and support.

Blessings,
{church_name} Team

---
© {current_year} {church_name} • Church Command Center
This email was sent from your church's communication system.
Questions? Contact your church administrator for assistance.`,
    variables: ['church_name', 'prayer_for', 'prayer_request', 'additional_details', 'current_year']
  },
  
  {
    id: 'volunteer-opportunity',
    name: 'Volunteer Opportunity',
    description: 'Template for announcing volunteer opportunities and service needs',
    subject: 'Volunteer Opportunity: {opportunity_title} - {church_name}',
    template_text: `Dear {church_name} Family,

🤝 VOLUNTEER OPPORTUNITY: {opportunity_title}

{opportunity_description}

📋 What We Need:
• Role: {volunteer_role}
• Time Commitment: {time_commitment}
• Contact: {contact_person}

We believe everyone has gifts to share. Please prayerfully consider how you might serve in this ministry.

Blessings,
{church_name} Team

---
© {current_year} {church_name} • Church Command Center
This email was sent from your church's communication system.
Questions? Contact your church administrator for assistance.`,
    variables: ['church_name', 'opportunity_title', 'opportunity_description', 'volunteer_role', 'time_commitment', 'contact_person', 'current_year']
  },
  
  {
    id: 'weekly-newsletter',
    name: 'Weekly Newsletter',
    description: 'Template for weekly church newsletters with updates and announcements',
    subject: 'Weekly Update - {church_name}',
    template_text: `Dear {church_name} Family,

📰 WEEKLY NEWSLETTER: {newsletter_title}
📅 {newsletter_date}

📢 This Week's Highlights:
{newsletter_content}

🎯 Coming Up:
{upcoming_events}

Thank you for being part of our church family!

Blessings,
{church_name} Team

---
© {current_year} {church_name} • Church Command Center
This email was sent from your church's communication system.
Questions? Contact your church administrator for assistance.`,
    variables: ['church_name', 'newsletter_title', 'newsletter_date', 'newsletter_content', 'upcoming_events', 'current_year']
  },
  
  {
    id: 'welcome-new-member',
    name: 'Welcome New Member',
    description: 'Template for welcoming new members to the church family',
    subject: 'Welcome to {church_name}!',
    template_text: `Dear {church_name} Family,

🎉 WELCOME TO {church_name}!

We're so excited that you've joined our church family! We believe God has brought you here for a purpose.

💝 What's Next:
• New Member Class: {new_member_class}
• Connect Group: {connect_group}
• Contact Person: {contact_person}

We can't wait to get to know you better and see how God will use you in our church family!

Blessings,
{church_name} Team

---
© {current_year} {church_name} • Church Command Center
This email was sent from your church's communication system.
Questions? Contact your church administrator for assistance.`,
    variables: ['church_name', 'new_member_class', 'connect_group', 'contact_person', 'current_year']
  }
];

// Template variables for each template type
export const templateVariables = {
  'emergency-alert': ['church_name', 'alert_title', 'alert_message', 'action_required', 'contact_info', 'current_year'],
  'event-reminder': ['church_name', 'event_name', 'event_date', 'event_time', 'event_location', 'event_description', 'current_year'],
  'prayer-request': ['church_name', 'prayer_for', 'prayer_request', 'additional_details', 'how_to_help', 'current_year'],
  'volunteer-opportunity': ['church_name', 'opportunity_title', 'opportunity_description', 'volunteer_role', 'time_commitment', 'contact_person', 'current_year'],
  'weekly-newsletter': ['church_name', 'newsletter_title', 'newsletter_date', 'newsletter_content', 'upcoming_events', 'current_year'],
  'welcome-new-member': ['church_name', 'new_member_class', 'connect_group', 'contact_person', 'current_year']
};

// Helper function to render templates with variables
export const renderEmailTemplate = (templateType, variables = {}) => {
  const template = emailTemplates.find(t => t.id === templateType);
  if (!template) return '';
  
  let renderedTemplate = template.template_text;
  
  // Replace all variables in the template
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{${key}}`, 'g');
    renderedTemplate = renderedTemplate.replace(regex, variables[key] || '');
  });
  
  // Replace any remaining variables with empty strings
  renderedTemplate = renderedTemplate.replace(/\{[^}]+\}/g, '');
  
  // Convert line breaks to HTML
  renderedTemplate = renderedTemplate.replace(/\n/g, '<br>');
  
  // Wrap with HTML template
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.subject || 'Email from Deacon'}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px; text-align: center;">
            <div style="margin-bottom: 16px;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Deacon</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 14px; font-weight: 400;">Church Command Center</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px;">
            <div style="color: #4a5568; font-size: 16px; line-height: 1.7;">
                ${renderedTemplate}
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #2d3748; padding: 30px; text-align: center;">
            <div style="margin-bottom: 16px;">
                <h3 style="color: white; margin: 0 0 6px; font-size: 16px; font-weight: 600;">Deacon</h3>
                <p style="color: #a0aec0; margin: 0; font-size: 12px;">Church Command Center</p>
            </div>
            <div style="border-top: 1px solid #4a5568; padding-top: 16px;">
                <p style="color: #a0aec0; margin: 0 0 6px; font-size: 11px;">
                    This email was sent from your church's communication system.
                </p>
                <p style="color: #a0aec0; margin: 0; font-size: 11px;">
                    Questions? Contact your church administrator for assistance.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};
