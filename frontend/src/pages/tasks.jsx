import React, { useState, useEffect } from 'react';
import { format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
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
  Pause
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

export function Tasks() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [showCompleted, setShowCompleted] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [isBulkActionMode, setIsBulkActionMode] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [taskComments, setTaskComments] = useState({});
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState('');
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
    fetchTasks();
    fetchMembers();
    fetchUsers();
  }, [user]);

  // Fetch tasks with comments
  const fetchTasks = async () => {
    try {
      // Get the current user's organization ID (including impersonation)
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) throw new Error('User not associated with any organization');

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          requestor:requestor_id (id, firstname, lastname),
          assignee:assignee_id (id, firstname, lastname),
          task_comments (
            id,
            comment,
            created_at,
            member:member_id (id, firstname, lastname)
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTasks = data.map(task => ({
        ...task,
        requestor: task.requestor ? {
          ...task.requestor,
          fullName: `${task.requestor.firstname} ${task.requestor.lastname}`
        } : null,
        assignee: task.assignee ? {
          ...task.assignee,
          fullName: `${task.assignee.firstname} ${task.assignee.lastname}`
        } : null,
        comments: task.task_comments || []
      }));

      setTasks(formattedTasks);
      
      // Initialize comments state
      const commentsState = {};
      formattedTasks.forEach(task => {
        commentsState[task.id] = task.comments || [];
      });
      setTaskComments(commentsState);
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    try {
      // Get the current user's organization ID (including impersonation)
      const organizationId = await getCurrentUserOrganizationId();
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

      setUsers(userList);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
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
      // Get the current user's organization ID (including impersonation)
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) throw new Error('User not associated with any organization');

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...newTask,
          organization_id: organizationId,
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
        due_date: null,
        category: '',
        estimated_hours: null,
        tags: []
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

  const openDeleteDialog = (task) => {
    setDeletingTask(task);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', deletingTask.id);

      if (error) throw error;

      setTasks(tasks.filter(task => task.id !== deletingTask.id));
      setIsDeleteDialogOpen(false);
      setDeletingTask(null);

      toast({
        title: "Success",
        description: "Task deleted successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Comment management functions
  const handleAddComment = async (taskId) => {
    if (!newComment.trim()) return;

    try {
      const organizationId = await getCurrentUserOrganizationId();
      const currentMember = members.find(m => m.user_id === user?.id);
      
      if (!currentMember) {
        toast({
          title: "Error",
          description: "Unable to identify current user",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('task_comments')
        .insert([{
          task_id: taskId,
          member_id: currentMember.id,
          comment: newComment.trim(),
          organization_id: organizationId
        }])
        .select(`
          *,
          member:member_id (id, firstname, lastname)
        `)
        .single();

      if (error) throw error;

      // Update comments state
      setTaskComments(prev => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), data]
      }));

      setNewComment('');
      toast({
        title: "Success",
        description: "Comment added successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  const handleDeleteComment = async (commentId, taskId) => {
    try {
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Update comments state
      setTaskComments(prev => ({
        ...prev,
        [taskId]: prev[taskId].filter(comment => comment.id !== commentId)
      }));

      toast({
        title: "Success",
        description: "Comment deleted successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      });
    }
  };

  // Bulk operations
  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedTasks.length === 0) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .in('id', selectedTasks);

      if (error) throw error;

      setTasks(tasks.map(task => 
        selectedTasks.includes(task.id) ? { ...task, status: newStatus } : task
      ));
      setSelectedTasks([]);
      setIsBulkActionMode(false);

      toast({
        title: "Success",
        description: `${selectedTasks.length} tasks updated to ${newStatus}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tasks",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', selectedTasks);

      if (error) throw error;

      setTasks(tasks.filter(task => !selectedTasks.includes(task.id)));
      setSelectedTasks([]);
      setIsBulkActionMode(false);

      toast({
        title: "Success",
        description: `${selectedTasks.length} tasks deleted successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tasks",
        variant: "destructive"
      });
    }
  };

  // Task selection
  const handleTaskSelection = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    const activeTaskIds = filteredTasks
      .filter(task => showCompleted ? true : task.status !== 'completed')
      .map(task => task.id);
    setSelectedTasks(activeTaskIds);
  };

  const handleClearSelection = () => {
    setSelectedTasks([]);
  };

  // Analytics functions
  const getTaskAnalytics = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
    const overdueTasks = tasks.filter(task => 
      task.due_date && isBefore(new Date(task.due_date), new Date()) && task.status !== 'completed'
    ).length;
    const highPriorityTasks = tasks.filter(task => task.priority === 'high' && task.status !== 'completed').length;

    return {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      inProgress: inProgressTasks,
      overdue: overdueTasks,
      highPriority: highPriorityTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  };

  // Export functions
  const exportTasksToCSV = () => {
    const csvContent = [
      ['Title', 'Description', 'Status', 'Priority', 'Assignee', 'Requestor', 'Due Date', 'Created Date'],
      ...filteredTasks.map(task => [
        task.title,
        task.description || '',
        task.status,
        task.priority,
        task.assignee?.fullName || '',
        task.requestor?.fullName || '',
        task.due_date ? format(new Date(task.due_date), 'MM/dd/yyyy') : '',
        format(new Date(task.created_at), 'MM/dd/yyyy')
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Tasks exported to CSV successfully."
    });
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
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    const matchesCompleted = showCompleted ? true : task.status !== 'completed';
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesCategory && matchesCompleted;
  });

  // Utility functions
  const isTaskOverdue = (task) => {
    return task.due_date && isBefore(new Date(task.due_date), new Date()) && task.status !== 'completed';
  };

  const getDaysUntilDue = (task) => {
    if (!task.due_date) return null;
    return differenceInDays(new Date(task.due_date), new Date());
  };

  const getTaskTemplate = (templateId) => {
    return taskTemplates.find(template => template.id === templateId);
  };

  const applyTaskTemplate = (templateId) => {
    const template = getTaskTemplate(templateId);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Modern header with gradient */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Tasks
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage and track church tasks and assignments</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="h-12 px-6 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm hover:bg-white dark:hover:bg-slate-600"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button 
              variant="outline"
              onClick={exportTasksToCSV}
              className="h-12 px-6 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm hover:bg-white dark:hover:bg-slate-600"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>
      </div>

      {/* Content area with enhanced spacing */}
      <div className="px-6 py-6">

      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {(() => {
              const analytics = getTaskAnalytics();
              return (
                <>
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                      <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">Total Tasks</CardTitle>
                      <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{analytics.total}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                      <CardTitle className="text-sm font-semibold text-green-900 dark:text-green-100">Completed</CardTitle>
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold text-green-900 dark:text-green-100">{analytics.completed}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-200 dark:border-yellow-800 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                      <CardTitle className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">Pending</CardTitle>
                      <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{analytics.pending}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                      <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">In Progress</CardTitle>
                      <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{analytics.inProgress}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-red-200 dark:border-red-800 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                      <CardTitle className="text-sm font-semibold text-red-900 dark:text-red-100">Overdue</CardTitle>
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold text-red-900 dark:text-red-100">{analytics.overdue}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200 dark:border-orange-800 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                      <CardTitle className="text-sm font-semibold text-orange-900 dark:text-orange-100">High Priority</CardTitle>
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{analytics.highPriority}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-purple-200 dark:border-purple-800 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                      <CardTitle className="text-sm font-semibold text-purple-900 dark:text-purple-100">Completion Rate</CardTitle>
                      <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{analytics.completionRate}%</div>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Enhanced search and filters */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-6 py-4 border border-slate-200/50 dark:border-slate-700/50 rounded-xl mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search tasks by title or description..."
              className="pl-12 h-12 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-12 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm">
                <SelectValue placeholder="Status" />
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
              <SelectTrigger className="h-12 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
              <SelectTrigger className="h-12 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-12 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {taskCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bulk Actions and View Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBulkActionMode(!isBulkActionMode)}
            className={`h-10 px-4 rounded-lg ${isBulkActionMode ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700" : "bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600"}`}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            Bulk Actions
          </Button>
          {isBulkActionMode && selectedTasks.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                {selectedTasks.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="h-8 px-3 rounded-lg bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
                className="h-8 px-3 rounded-lg bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            className={`h-10 px-4 rounded-lg ${!showCompleted ? "bg-gray-50 dark:bg-gray-800" : "bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600"}`}
          >
            {showCompleted ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
            {showCompleted ? "Hide Completed" : "Show Completed"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="h-10 px-4 rounded-lg bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600"
          >
            {viewMode === 'list' ? <Grid3X3 className="mr-2 h-4 w-4" /> : <List className="mr-2 h-4 w-4" />}
            {viewMode === 'list' ? 'Grid' : 'List'}
          </Button>
        </div>
      </div>

      {/* Bulk Action Buttons */}
      {isBulkActionMode && selectedTasks.length > 0 && (
        <div className="flex flex-wrap gap-3 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl border border-blue-200/50 dark:border-blue-700/50 mb-6">
          <span className="text-sm font-semibold text-blue-900 dark:text-blue-100 w-full mb-3">
            Bulk Actions ({selectedTasks.length} tasks selected)
          </span>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusUpdate('completed')}
              className="h-10 px-4 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-300 dark:border-green-700 rounded-lg"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Complete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusUpdate('in_progress')}
              className="h-10 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 rounded-lg"
            >
              <Play className="mr-2 h-4 w-4" />
              Mark In Progress
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusUpdate('pending')}
              className="h-10 px-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700 rounded-lg"
            >
              <Pause className="mr-2 h-4 w-4" />
              Mark Pending
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusUpdate('cancelled')}
              className="h-10 px-4 bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-300 dark:border-red-700 rounded-lg"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Tasks
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              className="h-10 px-4 bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-300 dark:border-red-700 rounded-lg"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Tasks
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-slate-400 mx-auto" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Loading tasks...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Active Tasks Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Active Tasks</h2>
              </div>
              {filteredTasks.filter(task => task.status !== 'completed').length > 0 ? (
                <div className="grid gap-6">
                  {filteredTasks
                    .filter(task => task.status !== 'completed')
                    .map(task => (
                      <Card key={task.id} className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 shadow-lg hover:shadow-xl transition-all duration-300 ${isTaskOverdue(task) ? 'border-red-200/50 bg-red-50/30 dark:bg-red-900/20' : ''} ${selectedTasks.includes(task.id) ? 'ring-2 ring-blue-500' : ''}`}>
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              {isBulkActionMode && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleTaskSelection(task.id)}
                                  className="p-1 h-auto hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                  {selectedTasks.includes(task.id) ? (
                                    <CheckSquare className="h-4 w-4 text-blue-600" />
                                  ) : (
                                    <Square className="h-4 w-4 text-slate-400" />
                                  )}
                                </Button>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">{task.title}</CardTitle>
                                  {isTaskOverdue(task) && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                                      <AlertTriangle className="h-3 w-3" />
                                      Overdue
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
                                  <CardDescription className="text-slate-600 dark:text-slate-400">
                                    Requested by {task.requestor?.fullName || 'Unknown'}
                                  </CardDescription>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge className={`${getPriorityColor(task.priority)} text-white font-medium`}>
                                      {formatPriority(task.priority)}
                                    </Badge>
                                    <Badge className={`${getStatusColor(task.status)} text-white font-medium`}>
                                      {formatStatus(task.status)}
                                    </Badge>
                                    {task.category && (
                                      <Badge variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                                        {task.category}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            {task.description && (
                              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{task.description}</p>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-6 text-sm">
                              {task.due_date && (
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                  <Clock className="h-4 w-4" />
                                  <span className="font-medium">Due {format(new Date(task.due_date), "MMM d, yyyy")}</span>
                                </div>
                              )}
                              {task.assignee && (
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                  <UserPlus className="h-4 w-4" />
                                  <span className="font-medium">Assigned to {task.assignee.fullName}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {task.status !== 'completed' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                                  className="h-10 px-4 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-300 dark:border-green-700 rounded-lg font-medium"
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Mark Complete
                                </Button>
                              )}
                              {task.status === 'completed' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                                  className="h-10 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 rounded-lg font-medium"
                                >
                                  <Loader2 className="mr-2 h-4 w-4" />
                                  Back to In Progress
                                </Button>
                              )}
                              {task.status !== 'in_progress' && task.status !== 'completed' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                                  className="h-10 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 rounded-lg font-medium"
                                >
                                  <Loader2 className="mr-2 h-4 w-4" />
                                  Start Progress
                                </Button>
                              )}
                              {task.status === 'in_progress' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleUpdateTaskStatus(task.id, 'pending')}
                                  className="h-10 px-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700 rounded-lg font-medium"
                                >
                                  <AlertCircle className="mr-2 h-4 w-4" />
                                  Back to Pending
                                </Button>
                              )}
                              {task.status !== 'cancelled' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleUpdateTaskStatus(task.id, 'cancelled')}
                                  className="h-10 px-4 bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-300 dark:border-red-700 rounded-lg font-medium"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel
                                </Button>
                              )}
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openEditDialog(task)}
                                className="h-10 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-600/50 dark:text-slate-300 dark:border-slate-600 rounded-lg font-medium"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openDeleteDialog(task)}
                                className="h-10 px-4 bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-300 dark:border-red-700 rounded-lg font-medium"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckSquare className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No active tasks</h3>
                  <p className="text-slate-600 dark:text-slate-400">All caught up! No pending tasks at the moment.</p>
                </div>
              )}
            </div>

            {/* Completed Tasks Section */}
            <div className="space-y-6 pt-8 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Completed Tasks</h2>
              </div>
              {filteredTasks.filter(task => task.status === 'completed').length > 0 ? (
                <div className="grid gap-6">
                  {filteredTasks
                    .filter(task => task.status === 'completed')
                    .map(task => (
                      <Card key={task.id} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardHeader className="pb-4">
                          <div className="flex flex-col gap-3">
                            <CardTitle className="text-lg font-bold text-slate-700 dark:text-slate-300">{task.title}</CardTitle>
                            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
                              <CardDescription className="text-slate-600 dark:text-slate-400">
                                Requested by {task.requestor?.fullName || 'Unknown'}
                              </CardDescription>
                              <div className="flex flex-wrap gap-2">
                                <Badge className={`${getPriorityColor(task.priority)} text-white font-medium`}>
                                  {formatPriority(task.priority)}
                                </Badge>
                                <Badge className={`${getStatusColor(task.status)} text-white font-medium`}>
                                  {formatStatus(task.status)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            {task.description && (
                              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{task.description}</p>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-6 text-sm">
                              {task.due_date && (
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                  <Clock className="h-4 w-4" />
                                  <span className="font-medium">Due {format(new Date(task.due_date), "MMM d, yyyy")}</span>
                                </div>
                              )}
                              {task.assignee && (
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                  <UserPlus className="h-4 w-4" />
                                  <span className="font-medium">Assigned to {task.assignee.fullName}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                                className="h-10 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 rounded-lg font-medium"
                              >
                                <Loader2 className="mr-2 h-4 w-4" />
                                Back to In Progress
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openEditDialog(task)}
                                className="h-10 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-600/50 dark:text-slate-300 dark:border-slate-600 rounded-lg font-medium"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openDeleteDialog(task)}
                                className="h-10 px-4 bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-300 dark:border-red-700 rounded-lg font-medium"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No completed tasks</h3>
                  <p className="text-slate-600 dark:text-slate-400">Completed tasks will appear here once you finish some tasks.</p>
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
                value={editingTask?.requestor_id}
                onValueChange={(value) => setEditingTask({ ...editingTask, requestor_id: value })}
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTask}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Task Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingTask?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTask}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
} 