import React, { useState, useEffect } from 'react';
import { Label } from './label';
import { Input } from './input';
import { Textarea } from './textarea';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { ChevronDown, ChevronUp, Variable } from 'lucide-react';

const TemplateVariables = ({ 
  template, 
  variables, 
  onVariablesChange, 
  className = "" 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localVariables, setLocalVariables] = useState({});

  useEffect(() => {
    if (template && template.variables) {
      const initialVars = {};
      template.variables.forEach(variable => {
        initialVars[variable] = variables[variable] || '';
      });
      setLocalVariables(initialVars);
    }
  }, [template, variables]);

  const handleVariableChange = (variable, value) => {
    const updatedVars = { ...localVariables, [variable]: value };
    setLocalVariables(updatedVars);
    onVariablesChange(updatedVars);
  };

  const getVariableDescription = (variable) => {
    const descriptions = {
      'church_name': 'Your church name (auto-populated)',
      'member_name': 'Recipient\'s first name (auto-populated)',
      'member_full_name': 'Recipient\'s full name (auto-populated)',
      'member_email': 'Recipient\'s email (auto-populated)',
      'current_year': 'Current year (auto-populated)',
      'prayer_for': 'Who the prayer is for',
      'prayer_request': 'The prayer request details',
      'additional_details': 'Additional prayer details',
      'how_to_help': 'How others can help',
      'event_title': 'Event title',
      'event_date': 'Event date',
      'event_time': 'Event time',
      'event_location': 'Event location',
      'event_description': 'Event description',
      'alert_title': 'Alert title',
      'alert_message': 'Alert message',
      'opportunity_title': 'Volunteer opportunity title',
      'opportunity_description': 'Volunteer opportunity description',
      'newsletter_title': 'Newsletter title',
      'newsletter_date': 'Newsletter date',
      'newsletter_content': 'Newsletter content',
      'message_content': 'Main message content',
      'cta_text': 'Call-to-action button text',
      'cta_link': 'Call-to-action button link',
      'highlight_title': 'Highlight box title',
      'highlight_content': 'Highlight box content'
    };
    return descriptions[variable] || `Enter value for ${variable}`;
  };

  const getVariableType = (variable) => {
    const textAreaVars = [
      'prayer_request', 
      'additional_details', 
      'how_to_help', 
      'event_description', 
      'alert_message', 
      'opportunity_description', 
      'newsletter_content', 
      'message_content', 
      'highlight_content'
    ];
    return textAreaVars.includes(variable) ? 'textarea' : 'input';
  };

  if (!template || !template.variables || template.variables.length === 0) {
    return null;
  }

  const autoPopulatedVars = ['church_name', 'member_name', 'member_full_name', 'member_email', 'current_year'];
  const userInputVars = template.variables.filter(v => !autoPopulatedVars.includes(v));

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Variable className="h-4 w-4" />
            Template Variables
            <Badge variant="secondary" className="text-xs">
              {userInputVars.length} to fill
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Auto-populated variables */}
            {autoPopulatedVars.filter(v => template.variables.includes(v)).length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Auto-populated</h4>
                <div className="space-y-2">
                  {autoPopulatedVars
                    .filter(v => template.variables.includes(v))
                    .map(variable => (
                      <div key={variable} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {variable}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {getVariableDescription(variable)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* User input variables */}
            {userInputVars.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Fill in these details</h4>
                <div className="space-y-3">
                  {userInputVars.map(variable => {
                    const isTextArea = getVariableType(variable) === 'textarea';
                    return (
                      <div key={variable} className="space-y-1">
                        <Label htmlFor={variable} className="text-xs font-medium">
                          {variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                        {isTextArea ? (
                          <Textarea
                            id={variable}
                            value={localVariables[variable] || ''}
                            onChange={(e) => handleVariableChange(variable, e.target.value)}
                            placeholder={getVariableDescription(variable)}
                            rows={3}
                            className="text-sm"
                          />
                        ) : (
                          <Input
                            id={variable}
                            value={localVariables[variable] || ''}
                            onChange={(e) => handleVariableChange(variable, e.target.value)}
                            placeholder={getVariableDescription(variable)}
                            className="text-sm"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default TemplateVariables;
