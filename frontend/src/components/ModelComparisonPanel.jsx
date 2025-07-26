import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Zap,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  Settings,
  Play,
  StopCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Model configurations
const MODELS = {
  'gpt-4o': {
    name: 'GPT-4o',
    description: 'Most advanced model, best reasoning and creativity',
    inputCost: 0.0025,  // $2.50 per 1M tokens
    outputCost: 0.01,   // $10.00 per 1M tokens
    color: 'from-blue-500 to-purple-500',
    borderColor: 'border-blue-500',
    icon: Brain
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    description: 'Fast and efficient, good for most tasks',
    inputCost: 0.00015, // $0.15 per 1M tokens
    outputCost: 0.0006, // $0.60 per 1M tokens
    color: 'from-green-500 to-emerald-500',
    borderColor: 'border-green-500',
    icon: Zap
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    description: 'Previous generation, still very capable',
    inputCost: 0.01,    // $10.00 per 1M tokens
    outputCost: 0.03,   // $30.00 per 1M tokens
    color: 'from-orange-500 to-red-500',
    borderColor: 'border-orange-500',
    icon: Settings
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    description: 'Fastest and most cost-effective',
    inputCost: 0.0005,  // $0.50 per 1M tokens
    outputCost: 0.0015, // $1.50 per 1M tokens
    color: 'from-gray-500 to-slate-500',
    borderColor: 'border-gray-500',
    icon: Clock
  }
};

// Test scenarios based on your current AI implementation
const TEST_SCENARIOS = [
  {
    id: 'member_insights',
    name: 'Member Insights Analysis',
    description: 'Analyze member engagement patterns and provide actionable insights',
    prompt: 'Analyze member engagement patterns and provide specific, actionable insights about at-risk members and recommendations for improving member retention and participation. Focus on concrete steps church leaders can implement immediately.',
    category: 'Analytics'
  },
  {
    id: 'attendance_prediction',
    name: 'Attendance Prediction',
    description: 'Predict attendance for upcoming events based on historical data',
    prompt: 'Based on historical attendance data, predict attendance for upcoming events and explain the key factors influencing these predictions. Provide specific recommendations for improving attendance.',
    category: 'Predictions'
  },
  {
    id: 'communication_strategy',
    name: 'Communication Strategy',
    description: 'Generate communication strategies for different member segments',
    prompt: 'Create personalized communication strategies for different member segments based on their engagement levels and preferences. Provide specific messaging approaches and timing recommendations.',
    category: 'Strategy'
  },
  {
    id: 'event_optimization',
    name: 'Event Optimization',
    description: 'Suggest optimizations for event planning and scheduling',
    prompt: 'Analyze event performance data and suggest specific optimizations for timing, content, and engagement strategies. Focus on practical improvements that can be implemented quickly.',
    category: 'Optimization'
  }
];

const TestResult = ({ result, model }) => {
  const modelConfig = MODELS[model];
  
  return (
    <motion.div 
      className="group/card relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${modelConfig.color.replace('from-', 'from-').replace('to-', 'to-')} rounded-2xl blur opacity-20 group-hover/card:opacity-40 transition duration-300`}></div>
      <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 bg-gradient-to-br ${modelConfig.color} rounded-lg flex items-center justify-center`}>
              <modelConfig.icon className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">{modelConfig.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={result.success ? "default" : "destructive"} className="text-xs">
              {result.success ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              {result.success ? 'Success' : 'Failed'}
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 text-xs mb-3">
          <div className="text-center">
            <div className="font-semibold text-slate-900 dark:text-white">${result.cost.toFixed(6)}</div>
            <div className="text-slate-500 dark:text-slate-400">Cost</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-slate-900 dark:text-white">{result.duration}ms</div>
            <div className="text-slate-500 dark:text-slate-400">Duration</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-slate-900 dark:text-white">{result.tokens}</div>
            <div className="text-slate-500 dark:text-slate-400">Tokens</div>
          </div>
        </div>
        
        {result.success && (
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
            <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
              {result.response}
            </div>
          </div>
        )}
        
        {!result.success && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <div className="text-sm text-red-600 dark:text-red-400">
              {result.error || 'Request failed'}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ComparisonResults = ({ results, scenario, onClose }) => {
  const [selectedModel, setSelectedModel] = useState(null);
  
  const successfulResults = results.filter(r => r.success);
  const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  const fastestModel = results.reduce((fastest, current) => 
    current.duration < fastest.duration ? current : fastest
  );
  
  const cheapestModel = results.reduce((cheapest, current) => 
    current.cost < cheapest.cost ? current : cheapest
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Model Comparison Results
          </DialogTitle>
          <DialogDescription>
            Results for "{scenario.name}" test across all models
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{successfulResults.length}/{results.length}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Successful Tests</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">${totalCost.toFixed(6)}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Total Cost</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{avgDuration.toFixed(0)}ms</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Avg Duration</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{fastestModel.model}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Fastest Model</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Model Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result, index) => (
                <TestResult key={index} result={result} model={result.model} />
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    Fastest Model
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{fastestModel.model}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {fastestModel.duration}ms response time
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-500" />
                    Most Cost-Effective
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{cheapestModel.model}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    ${cheapestModel.cost.toFixed(6)} cost
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export function ModelComparisonPanel({ organizationId }) {
  const [isTesting, setIsTesting] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const [testProgress, setTestProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(TEST_SCENARIOS[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const { toast } = useToast();

  const runModelTest = async (modelId, prompt) => {
    try {
      const startTime = Date.now();
      
      // Use dedicated model testing endpoint
      const response = await fetch('/api/test-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          prompt: prompt,
          organizationId: organizationId,
          scenario: selectedScenario.id
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        model: modelId,
        success: true,
        response: data.response,
        cost: data.cost,
        duration: duration,
        tokens: data.tokens
      };
    } catch (error) {
      return {
        model: modelId,
        success: false,
        error: error.message,
        cost: 0,
        duration: 0,
        tokens: 0
      };
    }
  };

  const runComparison = async () => {
    if (!organizationId) {
      toast({
        title: "Error",
        description: "Organization ID is required for testing",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    setResults([]);
    setTestProgress(0);
    
    const prompt = useCustomPrompt ? customPrompt : selectedScenario.prompt;
    const models = Object.keys(MODELS);
    const totalTests = models.length;
    
    for (let i = 0; i < models.length; i++) {
      const modelId = models[i];
      setCurrentTest({ model: modelId, scenario: selectedScenario.name });
      
      const result = await runModelTest(modelId, prompt);
      setResults(prev => [...prev, result]);
      
      setTestProgress(((i + 1) / totalTests) * 100);
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsTesting(false);
    setCurrentTest(null);
    setShowResults(true);
    
    toast({
      title: "Test Complete",
      description: `Successfully tested ${results.length} models`,
    });
  };

  const stopTest = () => {
    setIsTesting(false);
    setCurrentTest(null);
    setTestProgress(0);
    
    toast({
      title: "Test Stopped",
      description: "Model comparison test was stopped",
    });
  };

  return (
    <>
      <motion.div className="group relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
        <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">AI Model Testing</h3>
                <p className="text-slate-600 dark:text-slate-400">Compare different OpenAI models for your use cases</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Live Testing</span>
            </div>
          </div>

          <Tabs defaultValue="scenarios" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
              <TabsTrigger value="custom">Custom Test</TabsTrigger>
            </TabsList>
            
            <TabsContent value="scenarios" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TEST_SCENARIOS.map((scenario) => (
                  <Card 
                    key={scenario.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedScenario.id === scenario.id ? 'ring-2 ring-purple-500' : ''
                    }`}
                    onClick={() => setSelectedScenario(scenario)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{scenario.name}</CardTitle>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{scenario.description}</p>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="secondary">{scenario.category}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="custom-prompt">Custom Test Prompt</Label>
                  <Textarea
                    id="custom-prompt"
                    placeholder="Enter your custom test prompt here..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="use-custom"
                    checked={useCustomPrompt}
                    onChange={(e) => setUseCustomPrompt(e.target.checked)}
                  />
                  <Label htmlFor="use-custom">Use custom prompt instead of scenario</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Model Selection */}
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Models to Test</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(MODELS).map(([modelId, config]) => {
                const Icon = config.icon;
                return (
                  <div key={modelId} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className={`w-8 h-8 bg-gradient-to-br ${config.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white">{config.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        ${config.inputCost.toFixed(4)}/1K tokens
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test Controls */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isTesting && (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-purple-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Testing {currentTest?.model} with {currentTest?.scenario}...
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {isTesting ? (
                <Button onClick={stopTest} variant="destructive" size="sm">
                  <StopCircle className="h-4 w-4 mr-2" />
                  Stop Test
                </Button>
              ) : (
                <Button onClick={runComparison} disabled={!organizationId} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Play className="h-4 w-4 mr-2" />
                  Run Comparison
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {isTesting && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                <span>Test Progress</span>
                <span>{testProgress.toFixed(0)}%</span>
              </div>
              <Progress value={testProgress} className="h-2" />
            </div>
          )}

          {/* Quick Results Preview */}
          {results.length > 0 && !isTesting && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Quick Results</h4>
                <Button onClick={() => setShowResults(true)} variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {results.map((result, index) => {
                  const modelConfig = MODELS[result.model];
                  const Icon = modelConfig.icon;
                  return (
                    <div key={index} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 bg-gradient-to-br ${modelConfig.color} rounded flex items-center justify-center`}>
                            <Icon className="h-3 w-3 text-white" />
                          </div>
                          <span className="font-medium text-sm">{modelConfig.name}</span>
                        </div>
                        <Badge variant={result.success ? "default" : "destructive"} className="text-xs">
                          {result.success ? "✓" : "✗"}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        ${result.cost.toFixed(6)} • {result.duration}ms
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Results Dialog */}
      {showResults && (
        <ComparisonResults
          results={results}
          scenario={selectedScenario}
          onClose={() => setShowResults(false)}
        />
      )}
    </>
  );
}

export default ModelComparisonPanel;