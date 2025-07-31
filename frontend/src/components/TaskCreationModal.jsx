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
      console.log('TaskCreationModal: Opening modal, fetching users...');
      fetchMembers();
      fetchUsers();
      // Pre-populate with suggestion data if provided
      if (suggestion) {
        console.log('TaskCreationModal: Pre-populating with suggestion:', suggestion);
        
        // Build enhanced description with member information
        let enhancedDescription = suggestion.description || suggestion.content || '';
        
        if (suggestion.relatedMembers && suggestion.relatedMembers.length > 0) {
          const memberNames = suggestion.relatedMembers.map(m => `${m.firstname} ${m.lastname}`).join(', ');
          const memberEmails = suggestion.relatedMembers.map(m => m.email).filter(email => email).join(', ');
          
          enhancedDescription += `\n\nRelated Members:\n- Names: ${memberNames}`;
          if (memberEmails) {
            enhancedDescription += `\n- Emails: ${memberEmails}`;
          }
          
          // Add member details if available
          suggestion.relatedMembers.forEach((member, index) => {
            if (member.phone) {
              enhancedDescription += `\n- ${member.firstname} ${member.lastname} Phone: ${member.phone}`;
            }
          });
        }
        
        if (suggestion.relatedDonors && suggestion.relatedDonors.length > 0) {
          const donorNames = suggestion.relatedDonors.map(d => d.name).join(', ');
          const donorTotals = suggestion.relatedDonors.map(d => `${d.name}: $${d.total?.toLocaleString() || 'N/A'}`).join(', ');
          
          enhancedDescription += `\n\nRelated Donors:\n- Names: ${donorNames}`;
          enhancedDescription += `\n- Donation Totals: ${donorTotals}`;
        }
        
        setNewTask({
          title: suggestion.title || suggestion.content || 'Task from Suggestion',
          description: enhancedDescription,
          priority: suggestion.priority || 'medium',
          status: 'pending',
          assignee_id: null,
          requestor_id: user?.id || null, // Set current user as requestor
          due_date: null,
          category: suggestion.category || '',
          estimated_hours: suggestion.estimatedHours || null,
          tags: suggestion.tags || []
        });
      } else {
        // Reset form when opening without suggestion
        setNewTask({
          title: '',
          description: '',
          priority: 'medium',
          status: 'pending',
          assignee_id: null,
          requestor_id: user?.id || null,
          due_date: null,
          category: '',
          estimated_hours: null,
          tags: []
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
      console.log('TaskCreationModal: Starting fetchUsers...');
      // Get the current user's organization ID (including impersonation)
      const organizationId = await getCurrentUserOrganizationId();
      console.log('TaskCreationModal: Organization ID:', organizationId);
      if (!organizationId) throw new Error('User not associated with any organization');

      // Get organization users with member data
      const [orgUsersResult, membersResult] = await Promise.all([
        supabase
          .from('organization_users')
          .select('user_id, role, approval_status')
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .eq('approval_status', 'approved')
          .order('created_at', { ascending: false }),
        supabase
          .from('members')
          .select('id, firstname, lastname, email, user_id')
          .eq('organization_id', organizationId)
          .order('firstname', { ascending: true })
      ]);

      if (orgUsersResult.error) throw orgUsersResult.error;
      if (membersResult.error) throw membersResult.error;

      console.log('TaskCreationModal: Organization users:', orgUsersResult.data);
      console.log('TaskCreationModal: Members:', membersResult.data);

      // Create a map of user_id to member data
      const membersMap = new Map();
      membersResult.data?.forEach(member => {
        if (member.user_id) {
          membersMap.set(member.user_id, member);
        }
      });

      // Transform to user list for assignment
      const userList = [];
      orgUsersResult.data?.forEach(orgUser => {
        const member = membersMap.get(orgUser.user_id);
        if (member) {
          userList.push({
            id: member.id, // Use member.id for task assignment
            user_id: member.user_id,
            name: `${member.firstname} ${member.lastname}`,
            email: member.email,
            role: orgUser.role
          });
        }
      });

      console.log('TaskCreationModal: Users loaded for tasks:', userList);
      setUsers(userList);
    } catch (error) {
      console.error('TaskCreationModal: Error loading users:', error);
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
      console.log('TaskCreationModal: Starting task creation with data:', newTask);
      
      // Get the current user's organization ID (including impersonation)
      const organizationId = await getCurrentUserOrganizationId();
      console.log('TaskCreationModal: Organization ID:', organizationId);
      if (!organizationId) throw new Error('User not associated with any organization');

      // Filter out undefined values and ensure required fields are present
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: newTask.status,
        assignee_id: newTask.assignee_id,
        requestor_id: newTask.requestor_id,
        due_date: newTask.due_date,
        created_at: new Date().toISOString()
      };
      
      // Add optional fields only if they have values
      if (newTask.category) taskData.category = newTask.category;
      if (newTask.estimated_hours) taskData.estimated_hours = newTask.estimated_hours;
      if (newTask.tags && newTask.tags.length > 0) taskData.tags = newTask.tags;
      
      // Add organization_id if the column exists and is required
      try {
        // Check if organization_id column exists by trying to add it
        taskData.organization_id = organizationId;
      } catch (error) {
        console.log('TaskCreationModal: organization_id column may not exist, continuing without it');
        delete taskData.organization_id;
      }
      
      console.log('TaskCreationModal: Task data to insert:', taskData);

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('TaskCreationModal: Supabase error:', error);
        throw error;
      }

      console.log('TaskCreationModal: Task created successfully:', data);

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
      console.error('TaskCreationModal: Error creating task:', error);
      toast({
        title: "Error",
        description: `Failed to create task: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {suggestion ? 'Create Task from AI Suggestion' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription>
            {suggestion 
              ? 'Create a task based on this AI-generated suggestion. The description includes reasoning and context for why this task was recommended.'
              : 'Add a new task and assign it to a staff member.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
              className="min-h-[120px]"
              placeholder="Enter task description..."
            />
            {suggestion && (
              <p className="text-xs text-muted-foreground">
                This description includes AI reasoning and context for the suggested task.
              </p>
            )}
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