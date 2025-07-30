import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Calendar,
  UserPlus,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Pencil,
  Trash2,
  MessageSquare,
  Tag,
  Link,
  Filter,
  Download,
  BarChart3,
  MoreHorizontal,
  CheckSquare,
  Square,
  Archive,
  RefreshCw,
  Eye,
  EyeOff,
  TrendingUp,
  CalendarDays,
  Users,
  FileText,
  Settings,
  Bell,
  History,
  Copy,
  Share2,
  Star,
  StarOff,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  List,
  FilterX,
  CheckCircle,
  Circle,
  Play,
  Pause,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { getMembers, getCurrentUserOrganizationId } from '@/lib/data';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from '@/lib/authContext';

export function TaskCreationModal({ 
  isOpen, 
  onClose, 
  suggestion = null, 
  onTaskCreated = null 
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [taskTemplates] = useState([
    { id: 'worship', name: 'Worship Service Setup', description: 'Prepare for Sunday worship service', priority: 'high', estimatedHours: 2 },
    { id: 'youth', name: 'Youth Ministry Event', description: 'Organize youth group activity', priority: 'medium', estimatedHours: 4 },
    { id: 'outreach', name: 'Community Outreach', description: 'Plan community service project', priority: 'medium', estimatedHours: 6 },
    { id: 'maintenance', name: 'Facility Maintenance', description: 'Church building maintenance tasks', priority: 'low', estimatedHours: 3 },
    { id: 'admin', name: 'Administrative Task', description: 'General administrative duties', priority: 'medium', estimatedHours: 1 }
  ]);
  const [taskCategories] = useState([
    'Worship', 'Youth Ministry', 'Outreach', 'Maintenance', 'Administration', 'Finance', 'Technology', 'Events', 'Pastoral Care', 'Education'
  ]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    assignee_id: null,
    requestor_id: null,
    due_date: null,
    category: '',
    estimated_hours: null,
    tags: []
  });

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
      fetchUsers();
      // Pre-populate with suggestion data if provided
      if (suggestion) {
        setNewTask({
          title: suggestion.title || suggestion.content || 'Task from Suggestion',
          description: suggestion.description || suggestion.content || '',
          priority: suggestion.priority || 'medium',
          status: 'pending',
          assignee_id: null,
          requestor_id: user?.id || null, // Set current user as requestor
          due_date: null,
          category: suggestion.category || '',
          estimated_hours: suggestion.estimatedHours || null,
          tags: suggestion.tags || []
        });
      }
    }
  }, [isOpen, suggestion, user]);

  // Fetch members and staff members
  const fetchMembers = async () => {
    try {
      const allMembers = await getMembers();
      setMembers(allMembers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      });
    }
  };

  // Fetch users for task assignment
  const fetchUsers = async () => {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) throw new Error('User not associated with any organization');

      const { data, error } = await supabase
        .from('organization_users')
        .select(`
          id,
          user_id,
          role,
          users (
            id,
            firstname,
            lastname,
            email
          )
        `)
        .eq('organization_id', organizationId);

      if (error) throw error;

      const userList = data.map(item => ({
        id: item.user_id, // Use user_id for task assignment
        name: `${item.users.firstname} ${item.users.lastname}`,
        role: item.role,
        email: item.users.email
      }));

      setUsers(userList);
      console.log('Users loaded for tasks:', userList);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users for task assignment",
        variant: "destructive",
      });
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.requestor_id) {
      toast({
        title: "Error",
        description: "Please select a requestor for the task.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) throw new Error('User not associated with any organization');

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...newTask,
          organization_id: organizationId
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task created successfully."
      });

      // Reset form
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        assignee_id: null,
        requestor_id: null,
        due_date: null,
        category: '',
        estimated_hours: null,
        tags: []
      });

      // Call callback if provided
      if (onTaskCreated) {
        onTaskCreated(data);
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyTaskTemplate = (templateId) => {
    const template = taskTemplates.find(t => t.id === templateId);
    if (template) {
      setNewTask({
        ...newTask,
        title: template.name,
        description: template.description,
        priority: template.priority,
        estimated_hours: template.estimatedHours
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {suggestion ? 'Create Task from Suggestion' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription>
            {suggestion 
              ? 'Create a task based on this AI suggestion. You can modify the details as needed.'
              : 'Add a new task and assign it to a staff member.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Task Templates */}
          <div className="space-y-2">
            <Label>Quick Templates</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {taskTemplates.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTaskTemplate(template.id)}
                  className="justify-start text-left h-auto p-3"
                >
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Priority: {template.priority} • Est. {template.estimatedHours}h
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newTask.due_date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {newTask.due_date ? (
                      format(newTask.due_date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={newTask.due_date}
                    onSelect={(date) => setNewTask({...newTask, due_date: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newTask.priority}
                onValueChange={(value) => setNewTask({...newTask, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newTask.category}
                onValueChange={(value) => setNewTask({...newTask, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {taskCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Estimated Hours</Label>
              <Input
                id="estimated_hours"
                type="number"
                min="0"
                step="0.5"
                value={newTask.estimated_hours || ''}
                onChange={(e) => setNewTask({...newTask, estimated_hours: e.target.value ? parseFloat(e.target.value) : null})}
                placeholder="e.g., 2.5"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignee">Assign To</Label>
            <Select
              value={newTask.assignee_id}
              onValueChange={(value) => setNewTask({...newTask, assignee_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Requestor</label>
            <Select
              value={newTask.requestor_id}
              onValueChange={(value) => setNewTask({ ...newTask, requestor_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreateTask} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}