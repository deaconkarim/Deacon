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
  Loader2,
  Pencil
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
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

      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));

      toast({
        title: "Task updated",
        description: `Task status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = async () => {
    if (!editingTask.requestor_id) {
      toast({
        title: "Error",
        description: "Please select a requestor for the task.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Extract only the database columns we want to update
      const taskUpdate = {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        status: editingTask.status,
        assignee_id: editingTask.assignee_id,
        requestor_id: editingTask.requestor_id,
        due_date: editingTask.due_date,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tasks')
        .update(taskUpdate)
        .eq('id', editingTask.id)
        .select(`
          *,
          requestor:requestor_id (id, firstname, lastname),
          assignee:assignee_id (id, firstname, lastname)
        `)
        .single();

      if (error) throw error;

      // Format the response data to match our task structure
      const formattedTask = {
        ...data,
        requestor: data.requestor ? {
          ...data.requestor,
          fullName: `${data.requestor.firstname} ${data.requestor.lastname}`
        } : null,
        assignee: data.assignee ? {
          ...data.assignee,
          fullName: `${data.assignee.firstname} ${data.assignee.lastname}`
        } : null
      };

      setTasks(tasks.map(task => 
        task.id === editingTask.id ? formattedTask : task
      ));
      setIsEditDialogOpen(false);
      setEditingTask(null);

      toast({
        title: "Success",
        description: "Task updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (task) => {
    setEditingTask({
      ...task,
      due_date: task.due_date ? new Date(task.due_date) : null
    });
    setIsEditDialogOpen(true);
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

  const formatPriority = (priority) => {
    switch (priority) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return priority;
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

  const formatStatus = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'cancelled':
        return 'Cancelled';
      case 'pending':
        return 'Pending';
      default:
        return status;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage and track church tasks and assignments.</p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">New Task</span>
          <span className="sm:hidden">Add Task</span>
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
        ) : (
          <>
            {/* Active Tasks Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Active Tasks</h2>
              {filteredTasks.filter(task => task.status !== 'completed').length > 0 ? (
                filteredTasks
                  .filter(task => task.status !== 'completed')
                  .map(task => (
                    <Card key={task.id}>
                      <CardHeader>
                        <div className="flex flex-col gap-2">
                          <CardTitle>{task.title}</CardTitle>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <CardDescription>
                              Requested by {task.requestor?.fullName || 'Unknown'}
                            </CardDescription>
                            <div className="flex gap-2">
                              <Badge className={getPriorityColor(task.priority)}>
                                {formatPriority(task.priority)}
                              </Badge>
                              <Badge className={getStatusColor(task.status)}>
                                {formatStatus(task.status)}
                              </Badge>
                            </div>
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
                          <div className="flex flex-wrap gap-1.5">
                            {task.status !== 'completed' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                                className="flex-1 sm:flex-none text-xs px-2 py-1 h-8 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                              >
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Mark Complete</span>
                                <span className="sm:hidden">Complete</span>
                              </Button>
                            )}
                            {task.status === 'completed' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                                className="flex-1 sm:flex-none text-xs px-2 py-1 h-8 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                              >
                                <Loader2 className="mr-1 h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Back to In Progress</span>
                                <span className="sm:hidden">In Progress</span>
                              </Button>
                            )}
                            {task.status !== 'in_progress' && task.status !== 'completed' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                                className="flex-1 sm:flex-none text-xs px-2 py-1 h-8 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                              >
                                <Loader2 className="mr-1 h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Start Progress</span>
                                <span className="sm:hidden">Start</span>
                              </Button>
                            )}
                            {task.status === 'in_progress' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUpdateTaskStatus(task.id, 'pending')}
                                className="flex-1 sm:flex-none text-xs px-2 py-1 h-8 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
                              >
                                <AlertCircle className="mr-1 h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Back to Pending</span>
                                <span className="sm:hidden">Pending</span>
                              </Button>
                            )}
                            {task.status !== 'cancelled' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUpdateTaskStatus(task.id, 'cancelled')}
                                className="flex-1 sm:flex-none text-xs px-2 py-1 h-8 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                              >
                                <XCircle className="mr-1 h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Cancel</span>
                                <span className="sm:hidden">Cancel</span>
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openEditDialog(task)}
                              className="flex-1 sm:flex-none text-xs px-2 py-1 h-8 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                            >
                              <Pencil className="mr-1 h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                              <span className="sm:hidden">Edit</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No active tasks found.</p>
                </div>
              )}
            </div>

            {/* Completed Tasks Section */}
            <div className="space-y-4 pt-8 border-t">
              <h2 className="text-xl font-semibold">Completed Tasks</h2>
              {filteredTasks.filter(task => task.status === 'completed').length > 0 ? (
                filteredTasks
                  .filter(task => task.status === 'completed')
                  .map(task => (
                    <Card key={task.id} className="bg-muted/50">
                      <CardHeader>
                        <div className="flex flex-col gap-2">
                          <CardTitle className="text-muted-foreground">{task.title}</CardTitle>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <CardDescription>
                              Requested by {task.requestor?.fullName || 'Unknown'}
                            </CardDescription>
                            <div className="flex gap-2">
                              <Badge className={getPriorityColor(task.priority)}>
                                {formatPriority(task.priority)}
                              </Badge>
                              <Badge className={getStatusColor(task.status)}>
                                {formatStatus(task.status)}
                              </Badge>
                            </div>
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
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                              className="flex-1 sm:flex-none text-xs px-2 py-1 h-8 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                            >
                              <Loader2 className="mr-1 h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Back to In Progress</span>
                              <span className="sm:hidden">In Progress</span>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openEditDialog(task)}
                              className="flex-1 sm:flex-none text-xs px-2 py-1 h-8 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                            >
                              <Pencil className="mr-1 h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                              <span className="sm:hidden">Edit</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No completed tasks found.</p>
                </div>
              )}
            </div>
          </>
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

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details and assignments.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editingTask?.title || ''}
                onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editingTask?.description || ''}
                onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
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
                        !editingTask?.due_date && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {editingTask?.due_date ? (
                        format(editingTask.due_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={editingTask?.due_date}
                      onSelect={(date) => setEditingTask({...editingTask, due_date: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={editingTask?.priority}
                  onValueChange={(value) => setEditingTask({...editingTask, priority: value})}
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
              <Label htmlFor="edit-assignee">Assign To</Label>
              <Select
                value={editingTask?.assignee_id}
                onValueChange={(value) => setEditingTask({...editingTask, assignee_id: value})}
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
                value={editingTask?.requestor_id}
                onValueChange={(value) => setEditingTask({ ...editingTask, requestor_id: value })}
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTask}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 