import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Plus, 
  Search, 
  Calendar,
  UserPlus,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { getMembers } from '@/lib/data';
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

export function Tasks() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    assignee_id: null,
    requestor_id: null,
    due_date: null
  });

  useEffect(() => {
    fetchTasks();
    fetchMembers();
  }, [user]);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          requestor:requestor_id (id, firstname, lastname),
          assignee:assignee_id (id, firstname, lastname)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTasks(data.map(task => ({
        ...task,
        requestor: task.requestor ? {
          ...task.requestor,
          fullName: `${task.requestor.firstname} ${task.requestor.lastname}`
        } : null,
        assignee: task.assignee ? {
          ...task.assignee,
          fullName: `${task.assignee.firstname} ${task.assignee.lastname}`
        } : null
      })));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch members and staff members
  const fetchMembers = async () => {
    try {
      const allMembers = await getMembers();
      setMembers(allMembers);

      // Get deacons members
      const { data: deaconsGroup, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('name', 'Deacons')
        .single();

      if (groupError) throw groupError;

      const { data: deaconsMembers, error: membersError } = await supabase
        .from('group_members')
        .select('memberid')
        .eq('group_id', deaconsGroup.id);

      if (membersError) throw membersError;

      const deaconIds = deaconsMembers.map(m => m.memberid);
      setStaffMembers(allMembers.filter(m => deaconIds.includes(m.id)));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      });
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.requestor_id) {
      toast({
        title: "Error",
        description: "Please select a requestor for the task.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...newTask,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setTasks([data, ...tasks]);
      setIsCreateDialogOpen(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        assignee_id: null,
        requestor_id: null,
        due_date: null
      });

      toast({
        title: "Success",
        description: "Task created successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Update the task in the local state
      setTasks(tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, status: newStatus };
        }
        return task;
      }));

      toast({
        title: "Success",
        description: "Task status updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    const matchesAssignee = selectedAssignee === 'all' || task.assignee_id === selectedAssignee;
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage and track church tasks and assignments.</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {staffMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.firstname} {member.lastname}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{task.title}</CardTitle>
                    <CardDescription>
                      Requested by {task.requestor?.fullName || 'Unknown'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {task.due_date && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Due {format(new Date(task.due_date), 'MMM d, yyyy')}
                      </div>
                    )}
                    {task.assignee && (
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Assigned to {task.assignee.fullName}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {task.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark Complete
                      </Button>
                    )}
                    {task.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                      >
                        <Loader2 className="mr-2 h-4 w-4" />
                        Back to In Progress
                      </Button>
                    )}
                    {task.status !== 'in_progress' && task.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                      >
                        <Loader2 className="mr-2 h-4 w-4" />
                        Start Progress
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateTaskStatus(task.id, 'pending')}
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Back to Pending
                      </Button>
                    )}
                    {task.status !== 'cancelled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateTaskStatus(task.id, 'cancelled')}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tasks found.</p>
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task and assign it to a staff member.
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
            <div className="space-y-2">
              <Label htmlFor="assignee">Assign To</Label>
              <Select
                value={newTask.assignee_id}
                onValueChange={(value) => setNewTask({...newTask, assignee_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select deacon" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstname} {member.lastname}
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
                  <SelectValue placeholder="Select deacon" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstname} {member.lastname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 