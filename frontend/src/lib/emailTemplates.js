// Beautiful, branded email templates for the church app
export const emailTemplates = {
  // Default email template with modern, professional design
  default: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        /* Reset and base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f8fafc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.025em;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 24px;
        }
        
        .message {
            font-size: 16px;
            line-height: 1.7;
            color: #374151;
            margin-bottom: 32px;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            transition: transform 0.2s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-1px);
        }
        
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer p {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
        }
        
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
            margin: 24px 0;
        }
        
        .highlight-box {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
        }
        
        .highlight-box h3 {
            color: #0369a1;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .highlight-box p {
            color: #0c4a6e;
            font-size: 15px;
            line-height: 1.6;
        }
        
        /* Responsive design */
        @media (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 24px 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div style="margin-bottom: 16px;">
                <img src="https://getdeacon.com/logo-white.png" alt="Deacon" style="height: 40px; width: auto;">
            </div>
            <h1>{{church_name}}</h1>
            <p>Connecting hearts, building community</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear {{member_name}},
            </div>
            
            <div class="message">
                {{message_content}}
            </div>
            
            {{#if cta_text}}
            <a href="{{cta_link}}" class="cta-button">
                {{cta_text}}
            </a>
            {{/if}}
            
            {{#if highlight_content}}
            <div class="highlight-box">
                <h3>{{highlight_title}}</h3>
                <p>{{highlight_content}}</p>
            </div>
            {{/if}}
        </div>
        
        <div class="footer">
            <p>Thank you for being part of our church family.</p>
            <p>© {{current_year}} {{church_name}}. All rights reserved.</p>
            <p>
                <a href="{{unsubscribe_link}}">Unsubscribe</a> | 
                <a href="{{contact_link}}">Contact Us</a>
            </p>
        </div>
    </div>
</body>
</html>
  `,

  // Event reminder template
  eventReminder: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Reminder: {{event_title}}</title>
    <style>
        /* Reset and base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f8fafc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.025em;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 24px;
        }
        
        .event-details {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 1px solid #93c5fd;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
        }
        
        .event-title {
            font-size: 22px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 16px;
        }
        
        .event-info {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .event-info-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 16px;
            color: #374151;
        }
        
        .event-info-icon {
            width: 20px;
            height: 20px;
            background-color: #3b82f6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            transition: transform 0.2s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-1px);
        }
        
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer p {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
        }
        
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        /* Responsive design */
        @media (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 24px 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div style="margin-bottom: 16px;">
                <img src="https://getdeacon.com/logo-white.png" alt="Deacon" style="height: 40px; width: auto;">
            </div>
            <h1>{{church_name}}</h1>
            <p>Event Reminder</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hi {{member_name}},
            </div>
            
            <p style="font-size: 16px; line-height: 1.7; color: #374151; margin-bottom: 24px;">
                This is a friendly reminder about an upcoming event we'd love for you to join us for!
            </p>
            
            <div class="event-details">
                <div class="event-title">{{event_title}}</div>
                <div class="event-info">
                    <div class="event-info-item">
                        <div class="event-info-icon">📅</div>
                        <span><strong>Date:</strong> {{event_date}}</span>
                    </div>
                    <div class="event-info-item">
                        <div class="event-info-icon">🕒</div>
                        <span><strong>Time:</strong> {{event_time}}</span>
                    </div>
                    {{#if event_location}}
                    <div class="event-info-item">
                        <div class="event-info-icon">📍</div>
                        <span><strong>Location:</strong> {{event_location}}</span>
                    </div>
                    {{/if}}
                </div>
            </div>
            
            {{#if event_description}}
            <p style="font-size: 16px; line-height: 1.7; color: #374151; margin: 24px 0;">
                {{event_description}}
            </p>
            {{/if}}
            
            <a href="{{event_link}}" class="cta-button">
                Add to Calendar
            </a>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
                We look forward to seeing you there! If you have any questions, please don't hesitate to reach out.
            </p>
        </div>
        
        <div class="footer">
            <p>Thank you for being part of our church family.</p>
            <p>© {{current_year}} {{church_name}}. All rights reserved.</p>
            <p>
                <a href="{{unsubscribe_link}}">Unsubscribe</a> | 
                <a href="{{contact_link}}">Contact Us</a>
            </p>
        </div>
    </div>
</body>
</html>
  `,

  // Prayer request template
  prayerRequest: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prayer Request: {{prayer_title}}</title>
    <style>
        /* Reset and base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f8fafc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.025em;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 24px;
        }
        
        .prayer-box {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 1px solid #93c5fd;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            position: relative;
        }
        
        .prayer-box::before {
            content: "🙏";
            position: absolute;
            top: -10px;
            left: 20px;
            background: white;
            padding: 8px;
            border-radius: 50%;
            font-size: 20px;
        }
        
        .prayer-title {
            font-size: 20px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 16px;
            margin-top: 8px;
        }
        
        .prayer-content {
            font-size: 16px;
            line-height: 1.7;
            color: #374151;
            margin-bottom: 16px;
        }
        
        .prayer-meta {
            font-size: 14px;
            color: #6b7280;
            border-top: 1px solid #93c5fd;
            padding-top: 16px;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            transition: transform 0.2s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-1px);
        }
        
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer p {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
        }
        
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        /* Responsive design */
        @media (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 24px 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div style="margin-bottom: 16px;">
                <img src="https://getdeacon.com/logo-white.png" alt="Deacon" style="height: 40px; width: auto;">
            </div>
            <h1>{{church_name}}</h1>
            <p>Prayer Ministry</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear {{member_name}},
            </div>
            
            <p style="font-size: 16px; line-height: 1.7; color: #374151; margin-bottom: 24px;">
                We've received a prayer request that we'd like to share with our prayer team. Please join us in lifting this up to the Lord.
            </p>
            
            <div class="prayer-box">
                <div class="prayer-title">{{prayer_title}}</div>
                <div class="prayer-content">
                    {{prayer_content}}
                </div>
                <div class="prayer-meta">
                    <strong>Requested by:</strong> {{requested_by}}<br>
                    <strong>Date:</strong> {{request_date}}
                </div>
            </div>
            
            <p style="font-size: 16px; line-height: 1.7; color: #374151; margin: 24px 0;">
                "For where two or three gather in my name, there am I with them." - Matthew 18:20
            </p>
            
            <a href="{{prayer_link}}" class="cta-button">
                View Prayer Request
            </a>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
                Thank you for being part of our prayer ministry. Your prayers make a difference!
            </p>
        </div>
        
        <div class="footer">
            <p>Thank you for being part of our church family.</p>
            <p>© {{current_year}} {{church_name}}. All rights reserved.</p>
            <p>
                <a href="{{unsubscribe_link}}">Unsubscribe</a> | 
                <a href="{{contact_link}}">Contact Us</a>
            </p>
        </div>
    </div>
</body>
</html>
  `,

  // Newsletter template
  newsletter: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{newsletter_title}}</title>
    <style>
        /* Reset and base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f8fafc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.025em;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .newsletter-title {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .newsletter-date {
            font-size: 14px;
            color: #6b7280;
            text-align: center;
            margin-bottom: 32px;
        }
        
        .newsletter-content {
            font-size: 16px;
            line-height: 1.7;
            color: #374151;
            margin-bottom: 32px;
        }
        
        .newsletter-section {
            margin-bottom: 32px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 16px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 8px;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            transition: transform 0.2s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-1px);
        }
        
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer p {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
        }
        
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        /* Responsive design */
        @media (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 24px 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div style="margin-bottom: 16px;">
                <img src="https://getdeacon.com/logo-white.png" alt="Deacon" style="height: 40px; width: auto;">
            </div>
            <h1>{{church_name}}</h1>
            <p>Weekly Newsletter</p>
        </div>
        
        <div class="content">
            <div class="newsletter-title">{{newsletter_title}}</div>
            <div class="newsletter-date">{{newsletter_date}}</div>
            
            <div class="newsletter-content">
                {{newsletter_content}}
            </div>
            
            {{#if cta_text}}
            <div style="text-align: center;">
                <a href="{{cta_link}}" class="cta-button">
                    {{cta_text}}
                </a>
            </div>
            {{/if}}
        </div>
        
        <div class="footer">
            <p>Thank you for being part of our church family.</p>
            <p>© {{current_year}} {{church_name}}. All rights reserved.</p>
            <p>
                <a href="{{unsubscribe_link}}">Unsubscribe</a> | 
                <a href="{{contact_link}}">Contact Us</a>
            </p>
        </div>
    </div>
</body>
</html>
  `
};

// Template variables for each template type
export const templateVariables = {
  default: [
    'church_name',
    'member_name', 
    'message_content',
    'cta_text',
    'cta_link',
    'highlight_title',
    'highlight_content',
    'current_year',
    'unsubscribe_link',
    'contact_link'
  ],
  
  eventReminder: [
    'church_name',
    'member_name',
    'event_title',
    'event_date',
    'event_time',
    'event_location',
    'event_description',
    'event_link',
    'current_year',
    'unsubscribe_link',
    'contact_link'
  ],
  
  prayerRequest: [
    'church_name',
    'member_name',
    'prayer_title',
    'prayer_content',
    'requested_by',
    'request_date',
    'prayer_link',
    'current_year',
    'unsubscribe_link',
    'contact_link'
  ],
  
  newsletter: [
    'church_name',
    'newsletter_title',
    'newsletter_date',
    'newsletter_content',
    'cta_text',
    'cta_link',
    'current_year',
    'unsubscribe_link',
    'contact_link'
  ]
};

// Helper function to render templates with variables
export const renderEmailTemplate = (templateType, variables = {}) => {
  const template = emailTemplates[templateType] || emailTemplates.default;
  
  let renderedTemplate = template;
  
  // Replace all variables in the template
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    renderedTemplate = renderedTemplate.replace(regex, variables[key] || '');
  });
  
  // Replace any remaining variables with empty strings
  renderedTemplate = renderedTemplate.replace(/\{\{[^}]+\}\}/g, '');
  
  return renderedTemplate;
};
