import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import {
  Event,
  Post,
  StudyGroup,
  Candidate,
  User,
  ScoreWeights,
  CalendarEvent,
  BudgetRequest,
  Notification,
} from '../types';
import toast from 'react-hot-toast';

interface TaskCompletionStat {
  id: string;
  name: string;
  assigned: number;
  completed: number;
  timeliness: number;
}

interface LeaderboardMember {
  id: string;
  name: string;
  score: number;
}

interface MemberOfMonth {
  id: string;
  name: string;
  completedTasks: number;
  averageTimeliness: number;
}

interface DataContextType {
  // Data
  events: Event[];
  posts: Post[];
  studyGroups: StudyGroup[];
  candidates: Candidate[];
  users: User[];
  scoreWeights: ScoreWeights;
  budgetRequests: BudgetRequest[];
  notifications: Notification[];

  // Loading states
  isLoading: boolean;

  // Calendar
  getCalendarEvents: () => CalendarEvent[];

  // Statistics
  getTaskCompletionStats: (
    period: 'monthly' | 'yearly'
  ) => TaskCompletionStat[];
  getMemberOfTheMonth: () => MemberOfMonth | null;
  getLeaderboards: (period: 'monthly' | 'yearly') => {
    posts: LeaderboardMember[];
    events: LeaderboardMember[];
    studies: LeaderboardMember[];
  };

  // CRUD operations
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  addPost: (post: Omit<Post, 'id'>) => Promise<void>;
  updatePost: (id: string, post: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;

  addStudyGroup: (studyGroup: Omit<StudyGroup, 'id'>) => Promise<void>;
  updateStudyGroup: (
    id: string,
    studyGroup: Partial<StudyGroup>
  ) => Promise<void>;
  deleteStudyGroup: (id: string) => Promise<void>;

  addCandidate: (candidate: Omit<Candidate, 'id'>) => Promise<void>;
  updateCandidate: (id: string, candidate: Partial<Candidate>) => Promise<void>;
  deleteCandidate: (id: string) => Promise<void>;

  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  addBudgetRequest: (request: Omit<BudgetRequest, 'id'>) => Promise<void>;
  updateBudgetRequest: (
    id: string,
    request: Partial<BudgetRequest>
  ) => Promise<void>;
  deleteBudgetRequest: (id: string) => Promise<void>;

  addNotification: (notification: Omit<Notification, 'id'>) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  updateRegistration: (id: string, updates: any) => Promise<void>;

  updateScoreWeights: (weights: ScoreWeights) => Promise<void>;

  // Refresh data
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [scoreWeights, setScoreWeights] = useState<ScoreWeights>({
    testWeight: 40,
    interviewWeight: 60,
  });
  const [budgetRequests, setBudgetRequests] = useState<BudgetRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Load all data from Supabase with better error handling
  const loadData = async (showToast = false) => {
    try {
      if (showToast) {
        setIsLoading(true);
      }

      console.log('🔄 Loading data from Supabase...');

      // Load users first (needed for other queries)
      console.log('📥 Loading users...');
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('❌ Error loading users:', usersError);
        if (showToast) toast.error('Erro ao carregar usuários');
      } else if (usersData) {
        console.log(`✅ Loaded ${usersData.length} users`);
        const formattedUsers: User[] = usersData.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          contactInfo: user.contact_info || '',
          isActive: user.is_active,
          joinDate: user.join_date,
          participationHistory: [],
          twoFAEnabled: user.two_fa_enabled || false,
          birthDate: user.birth_date,
          studentId: user.student_id,
          cpf: user.cpf,
          institution: user.institution,
          period: user.period,
          profilePicture: user.profile_picture,
        }));
        setUsers(formattedUsers);
      }

      // Load events
      console.log('📥 Loading events...');
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (eventsError) {
        console.error('❌ Error loading events:', eventsError);
        if (showToast) toast.error('Erro ao carregar eventos');
      } else if (eventsData) {
        console.log(`✅ Loaded ${eventsData.length} events`);
        const formattedEvents: Event[] = eventsData.map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description || '',
          date: event.date,
          time: event.time,
          type: event.type,
          location: event.location,
          onlineLink: event.online_link,
          assignedMembers: event.assigned_members || [],
          confirmations: [],
          attendance: [],
          createdBy: event.created_by,
          status: event.status,
        }));
        setEvents(formattedEvents);
      }

      // Load posts
      console.log('📥 Loading posts...');
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('❌ Error loading posts:', postsError);
        if (showToast) toast.error('Erro ao carregar posts');
      } else if (postsData) {
        console.log(`✅ Loaded ${postsData.length} posts`);
        const formattedPosts: Post[] = postsData.map((post) => ({
          id: post.id,
          title: post.title,
          date: post.date,
          deadline: post.deadline,
          status: post.status,
          assignedRoles: post.assigned_roles || [],
          mediaUploads: [],
          description: post.description || '',
          relatedEventId: post.related_event_id,
          createdBy: post.created_by,
          postType: post.post_type || 'Feed Post',
          publicationDate: post.publication_date,
        }));
        setPosts(formattedPosts);
      }

      // Load study groups
      console.log('📥 Loading study groups...');
      const { data: studyGroupsData, error: studyGroupsError } = await supabase
        .from('study_groups')
        .select('*')
        .order('date', { ascending: true });

      if (studyGroupsError) {
        console.error('❌ Error loading study groups:', studyGroupsError);
        if (showToast) toast.error('Erro ao carregar grupos de estudo');
      } else if (studyGroupsData) {
        console.log(`✅ Loaded ${studyGroupsData.length} study groups`);
        const formattedStudyGroups: StudyGroup[] = studyGroupsData.map(
          (group) => ({
            id: group.id,
            theme: group.theme,
            presenter: group.presenter,
            mode: group.mode,
            date: group.date,
            time: group.time,
            materialStatus: group.material_status,
            sessionStatus: group.session_status,
            attendance: [],
            materials: [],
            createdBy: group.created_by,
            researchAssignedTo: group.research_assigned_to,
            materialAssignedTo: group.material_assigned_to,
          })
        );
        setStudyGroups(formattedStudyGroups);
      }

      // Load candidates
      console.log('📥 Loading candidates...');
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (candidatesError) {
        console.error('❌ Error loading candidates:', candidatesError);
        if (showToast) toast.error('Erro ao carregar candidatos');
      } else if (candidatesData) {
        console.log(`✅ Loaded ${candidatesData.length} candidates`);
        const formattedCandidates: Candidate[] = candidatesData.map(
          (candidate) => ({
            id: candidate.id,
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            positionApplied: candidate.position_applied,
            documents: [],
            testScore: candidate.test_score,
            interviewScores: candidate.interview_scores || [],
            status: candidate.status,
            comments: candidate.comments || [],
            finalScore: candidate.final_score,
            createdAt: candidate.created_at,
          })
        );
        setCandidates(formattedCandidates);
      }

      // Load budget requests
      console.log('📥 Loading budget requests...');
      const { data: budgetData, error: budgetError } = await supabase
        .from('budget_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (budgetError) {
        console.error('❌ Error loading budget requests:', budgetError);
        if (showToast)
          toast.error('Erro ao carregar solicitações de orçamento');
      } else if (budgetData) {
        console.log(`✅ Loaded ${budgetData.length} budget requests`);
        const formattedBudgetRequests: BudgetRequest[] = budgetData.map(
          (request) => ({
            id: request.id,
            title: request.title,
            description: request.description,
            requestedAmount: parseFloat(request.requested_amount),
            category: request.category,
            priority: request.priority,
            status: request.status,
            requestedBy: request.requested_by,
            reviewedBy: request.reviewed_by,
            relatedEventId: request.related_event_id,
            justification: request.justification,
            treasurerNotes: request.treasurer_notes,
            approvedAmount: request.approved_amount
              ? parseFloat(request.approved_amount)
              : undefined,
            createdAt: request.created_at,
          })
        );
        setBudgetRequests(formattedBudgetRequests);
      }

      // Load notifications
      console.log('📥 Loading notifications...');
      const { data: notificationsData, error: notificationsError } =
        await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });

      if (notificationsError) {
        console.error('❌ Error loading notifications:', notificationsError);
        if (showToast) toast.error('Erro ao carregar notificações');
      } else if (notificationsData) {
        console.log(`✅ Loaded ${notificationsData.length} notifications`);
        const formattedNotifications: Notification[] = notificationsData.map(
          (notification) => ({
            id: notification.id,
            userId: notification.user_id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            read: notification.read,
            actionUrl: notification.action_url,
            relatedId: notification.related_id,
            createdAt: notification.created_at,
          })
        );
        setNotifications(formattedNotifications);
      }

      // Load score weights
      console.log('📥 Loading score weights...');
      const { data: weightsData, error: weightsError } = await supabase
        .from('score_weights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (weightsError) {
        console.error('❌ Error loading score weights:', weightsError);
      } else if (weightsData) {
        console.log('✅ Loaded score weights');
        setScoreWeights({
          testWeight: weightsData.test_weight,
          interviewWeight: weightsData.interview_weight,
        });
      }

      console.log('✅ All data loaded successfully!');
      setHasInitialLoad(true);
    } catch (error) {
      console.error('💥 Critical error loading data:', error);
      if (showToast) toast.error('Erro crítico ao carregar dados do sistema');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and set up real-time subscriptions
  useEffect(() => {
    console.log('🚀 DataProvider mounted, starting initial data load...');
    loadData(false);

    // Set up real-time subscriptions for data changes
    const setupSubscriptions = () => {
      console.log('🔔 Setting up real-time subscriptions...');

      // Subscribe to users changes
      const usersSubscription = supabase
        .channel('users_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'users' },
          () => {
            console.log('🔄 Users table changed, reloading...');
            loadData(false);
          }
        )
        .subscribe();

      // Subscribe to events changes
      const eventsSubscription = supabase
        .channel('events_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'events' },
          () => {
            console.log('🔄 Events table changed, reloading...');
            loadData(false);
          }
        )
        .subscribe();

      // Subscribe to posts changes
      const postsSubscription = supabase
        .channel('posts_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'posts' },
          () => {
            console.log('🔄 Posts table changed, reloading...');
            loadData(false);
          }
        )
        .subscribe();

      // Subscribe to study_groups changes
      const studyGroupsSubscription = supabase
        .channel('study_groups_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'study_groups' },
          () => {
            console.log('🔄 Study groups table changed, reloading...');
            loadData(false);
          }
        )
        .subscribe();

      return () => {
        console.log('🔌 Cleaning up subscriptions...');
        usersSubscription.unsubscribe();
        eventsSubscription.unsubscribe();
        postsSubscription.unsubscribe();
        studyGroupsSubscription.unsubscribe();
      };
    };

    // Set up subscriptions after initial load
    const cleanup = setupSubscriptions();

    return cleanup;
  }, []);

  // Force refresh every 300 seconds to ensure data is fresh
  useEffect(() => {
    if (!hasInitialLoad) return;

    const interval = setInterval(() => {
      console.log('⏰ Periodic data refresh...');
      loadData(false);
    }, 300000); // 300 seconds

    return () => clearInterval(interval);
  }, [hasInitialLoad]);

  const getCalendarEvents = (): CalendarEvent[] => {
    const calendarEvents: CalendarEvent[] = [];

    // Add events
    events.forEach((event) => {
      calendarEvents.push({
        id: `event-${event.id}`,
        title: event.title,
        date: event.date,
        time: event.time,
        type: 'Event',
        color: '#3B82F6',
        relatedId: event.id,
      });
    });

    // Add study groups
    studyGroups.forEach((group) => {
      calendarEvents.push({
        id: `study-${group.id}`,
        title: `Study Group: ${group.theme}`,
        date: group.date,
        time: group.time,
        type: 'Study Group',
        color: '#10B981',
        relatedId: group.id,
      });
    });

    // Add post deadlines
    posts.forEach((post) => {
      calendarEvents.push({
        id: `post-${post.id}`,
        title: `Deadline: ${post.title}`,
        date: post.deadline,
        type: 'Post Deadline',
        color: '#F97316',
        relatedId: post.id,
      });
    });

    return calendarEvents;
  };

  // Statistics functions using real data
  const getTaskCompletionStats = (
    period: 'monthly' | 'yearly'
  ): TaskCompletionStat[] => {
    const now = new Date();
    const startDate =
      period === 'monthly'
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : new Date(now.getFullYear(), 0, 1);

    return users
      .filter((u) => u.isActive)
      .map((user) => {
        // Count assigned tasks (posts, events, study groups)
        const assignedPosts = posts.filter(
          (p) =>
            p.assignedRoles.some((role) => role.assignedTo === user.id) &&
            new Date(p.date) >= startDate
        ).length;

        const assignedEvents = events.filter(
          (e) =>
            e.assignedMembers.includes(user.id) && new Date(e.date) >= startDate
        ).length;

        const assignedStudyGroups = studyGroups.filter(
          (sg) => sg.createdBy === user.id && new Date(sg.date) >= startDate
        ).length;

        const totalAssigned =
          assignedPosts + assignedEvents + assignedStudyGroups;

        // Count completed tasks
        const completedPosts = posts.filter(
          (p) =>
            p.assignedRoles.some((role) => role.assignedTo === user.id) &&
            p.status === 'Done' &&
            new Date(p.date) >= startDate
        ).length;

        const completedEvents = events.filter(
          (e) =>
            e.assignedMembers.includes(user.id) &&
            e.status === 'Completed' &&
            new Date(e.date) >= startDate
        ).length;

        const completedStudyGroups = studyGroups.filter(
          (sg) =>
            sg.createdBy === user.id &&
            sg.sessionStatus === 'Done' &&
            new Date(sg.date) >= startDate
        ).length;

        const totalCompleted =
          completedPosts + completedEvents + completedStudyGroups;

        // Calculate timeliness (simplified - in production, use actual completion dates)
        const timeliness =
          totalAssigned > 0
            ? Math.round((totalCompleted / totalAssigned) * 100)
            : 100;

        return {
          id: user.id,
          name: user.name,
          assigned: totalAssigned,
          completed: totalCompleted,
          timeliness: Math.min(timeliness, 100),
        };
      });
  };

  const getMemberOfTheMonth = (): MemberOfMonth | null => {
    const stats = getTaskCompletionStats('monthly');
    if (stats.length === 0) return null;

    const topMember = stats.reduce((prev, current) =>
      current.completed > prev.completed ? current : prev
    );

    return {
      id: topMember.id,
      name: topMember.name,
      completedTasks: topMember.completed,
      averageTimeliness: topMember.timeliness,
    };
  };

  const getLeaderboards = (period: 'monthly' | 'yearly') => {
    const now = new Date();
    const startDate =
      period === 'monthly'
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : new Date(now.getFullYear(), 0, 1);

    const userStats = users
      .filter((u) => u.isActive)
      .map((user) => {
        const userPosts = posts.filter(
          (p) =>
            p.assignedRoles.some((role) => role.assignedTo === user.id) &&
            p.status === 'Done' &&
            new Date(p.date) >= startDate
        ).length;

        const userEvents = events.filter(
          (e) =>
            e.assignedMembers.includes(user.id) &&
            e.status === 'Completed' &&
            new Date(e.date) >= startDate
        ).length;

        const userStudies = studyGroups.filter(
          (sg) =>
            sg.createdBy === user.id &&
            sg.sessionStatus === 'Done' &&
            new Date(sg.date) >= startDate
        ).length;

        return {
          id: user.id,
          name: user.name,
          posts: userPosts,
          events: userEvents,
          studies: userStudies,
        };
      });

    return {
      posts: userStats
        .map((s) => ({ id: s.id, name: s.name, score: s.posts }))
        .sort((a, b) => b.score - a.score),
      events: userStats
        .map((s) => ({ id: s.id, name: s.name, score: s.events }))
        .sort((a, b) => b.score - a.score),
      studies: userStats
        .map((s) => ({ id: s.id, name: s.name, score: s.studies }))
        .sort((a, b) => b.score - a.score),
    };
  };

  // CRUD operations with Supabase
  const addEvent = async (event: Omit<Event, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          type: event.type,
          location: event.location,
          online_link: event.onlineLink,
          assigned_members: event.assignedMembers,
          status: event.status,
          created_by: event.createdBy,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding event:', error);
        toast.error('Erro ao criar evento');
        throw error;
      }

      if (data) {
        console.log('✅ Event added successfully');
        // Data will be refreshed via real-time subscription
      }
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  };

  const updateEvent = async (id: string, eventUpdate: Partial<Event>) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: eventUpdate.title,
          description: eventUpdate.description,
          date: eventUpdate.date,
          time: eventUpdate.time,
          type: eventUpdate.type,
          location: eventUpdate.location,
          online_link: eventUpdate.onlineLink,
          assigned_members: eventUpdate.assignedMembers,
          status: eventUpdate.status,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating event:', error);
        toast.error('Erro ao atualizar evento');
        throw error;
      }

      console.log('✅ Event updated successfully');
      // Data will be refreshed via real-time subscription
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);

      if (error) {
        console.error('Error deleting event:', error);
        toast.error('Erro ao deletar evento');
        throw error;
      }

      console.log('✅ Event deleted successfully');
      // Data will be refreshed via real-time subscription
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  const addPost = async (post: Omit<Post, 'id'>) => {
    try {
      const { error } = await supabase.from('posts').insert({
        title: post.title,
        description: post.description,
        date: post.date,
        deadline: post.deadline,
        status: post.status,
        assigned_roles: post.assignedRoles,
        related_event_id: post.relatedEventId,
        created_by: post.createdBy,
        post_type: post.postType,
        publication_date: post.publicationDate,
      });

      if (error) {
        console.error('Error adding post:', error);
        toast.error('Erro ao criar post');
        throw error;
      }

      console.log('✅ Post added successfully');
      // Data will be refreshed via real-time subscription
    } catch (error) {
      console.error('Error adding post:', error);
      throw error;
    }
  };

  const updatePost = async (id: string, postUpdate: Partial<Post>) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title: postUpdate.title,
          description: postUpdate.description,
          deadline: postUpdate.deadline,
          status: postUpdate.status,
          assigned_roles: postUpdate.assignedRoles,
          related_event_id: postUpdate.relatedEventId,
          post_type: postUpdate.postType,
          publication_date: postUpdate.publicationDate,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating post:', error);
        toast.error('Erro ao atualizar post');
        throw error;
      }

      console.log('✅ Post updated successfully');
      // Data will be refreshed via real-time subscription
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  };

  const deletePost = async (id: string) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);

      if (error) {
        console.error('Error deleting post:', error);
        toast.error('Erro ao deletar post');
        throw error;
      }

      console.log('✅ Post deleted successfully');
      // Data will be refreshed via real-time subscription
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  };

  const addStudyGroup = async (studyGroup: Omit<StudyGroup, 'id'>) => {
    try {
      const { error } = await supabase.from('study_groups').insert({
        theme: studyGroup.theme,
        presenter: studyGroup.presenter,
        mode: studyGroup.mode,
        date: studyGroup.date,
        time: studyGroup.time,
        material_status: studyGroup.materialStatus,
        session_status: studyGroup.sessionStatus,
        created_by: studyGroup.createdBy,
        research_assigned_to: studyGroup.researchAssignedTo,
        material_assigned_to: studyGroup.materialAssignedTo,
      });

      if (error) {
        console.error('Error adding study group:', error);
        toast.error('Erro ao criar grupo de estudo');
        throw error;
      }

      console.log('✅ Study group added successfully');
      // Data will be refreshed via real-time subscription
    } catch (error) {
      console.error('Error adding study group:', error);
      throw error;
    }
  };

  const updateStudyGroup = async (
    id: string,
    studyGroupUpdate: Partial<StudyGroup>
  ) => {
    try {
      const { error } = await supabase
        .from('study_groups')
        .update({
          theme: studyGroupUpdate.theme,
          presenter: studyGroupUpdate.presenter,
          mode: studyGroupUpdate.mode,
          date: studyGroupUpdate.date,
          time: studyGroupUpdate.time,
          material_status: studyGroupUpdate.materialStatus,
          session_status: studyGroupUpdate.sessionStatus,
          research_assigned_to: studyGroupUpdate.researchAssignedTo,
          material_assigned_to: studyGroupUpdate.materialAssignedTo,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating study group:', error);
        toast.error('Erro ao atualizar grupo de estudo');
        throw error;
      }

      console.log('✅ Study group updated successfully');
      // Data will be refreshed via real-time subscription
    } catch (error) {
      console.error('Error updating study group:', error);
      throw error;
    }
  };

  const deleteStudyGroup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('study_groups')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting study group:', error);
        toast.error('Erro ao deletar grupo de estudo');
        throw error;
      }

      console.log('✅ Study group deleted successfully');
      // Data will be refreshed via real-time subscription
    } catch (error) {
      console.error('Error deleting study group:', error);
      throw error;
    }
  };

  const addCandidate = async (candidate: Omit<Candidate, 'id'>) => {
    try {
      const { error } = await supabase.from('candidates').insert({
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        position_applied: candidate.positionApplied,
        test_score: candidate.testScore,
        interview_scores: candidate.interviewScores,
        status: candidate.status,
        comments: candidate.comments,
      });

      if (error) {
        console.error('Error adding candidate:', error);
        toast.error('Erro ao adicionar candidato');
        throw error;
      }

      console.log('✅ Candidate added successfully');
      await loadData(false); // Refresh data
    } catch (error) {
      console.error('Error adding candidate:', error);
      throw error;
    }
  };

  const updateCandidate = async (
    id: string,
    candidateUpdate: Partial<Candidate>
  ) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({
          name: candidateUpdate.name,
          email: candidateUpdate.email,
          phone: candidateUpdate.phone,
          position_applied: candidateUpdate.positionApplied,
          test_score: candidateUpdate.testScore,
          interview_scores: candidateUpdate.interviewScores,
          status: candidateUpdate.status,
          comments: candidateUpdate.comments,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating candidate:', error);
        toast.error('Erro ao atualizar candidato');
        throw error;
      }

      console.log('✅ Candidate updated successfully');
      await loadData(false); // Refresh data
    } catch (error) {
      console.error('Error updating candidate:', error);
      throw error;
    }
  };

  const deleteCandidate = async (id: string) => {
    try {
      const { error } = await supabase.from('candidates').delete().eq('id', id);

      if (error) {
        console.error('Error deleting candidate:', error);
        toast.error('Erro ao deletar candidato');
        throw error;
      }

      console.log('✅ Candidate deleted successfully');
      await loadData(false); // Refresh data
    } catch (error) {
      console.error('Error deleting candidate:', error);
      throw error;
    }
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    try {
      const { error } = await supabase.from('users').insert({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        contact_info: userData.contactInfo,
        is_active: userData.isActive,
        join_date: userData.joinDate,
        birth_date: userData.birthDate,
        student_id: userData.studentId,
        cpf: userData.cpf,
        institution: userData.institution,
        period: userData.period,
        profile_picture: userData.profilePicture,
      });

      if (error) {
        console.error('Error adding user:', error);
        toast.error('Erro ao adicionar usuário');
        throw error;
      }

      console.log('✅ User added successfully');
      // Data will be refreshed via real-time subscription
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, userUpdate: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: userUpdate.name,
          email: userUpdate.email,
          role: userUpdate.role,
          contact_info: userUpdate.contactInfo,
          is_active: userUpdate.isActive,
          birth_date: userUpdate.birthDate,
          student_id: userUpdate.studentId,
          cpf: userUpdate.cpf,
          institution: userUpdate.institution,
          period: userUpdate.period,
          profile_picture: userUpdate.profilePicture,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating user:', error);
        toast.error('Erro ao atualizar usuário');
        throw error;
      }

      console.log('✅ User updated successfully');
      // Data will be refreshed via real-time subscription
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);

      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Erro ao deletar usuário');
        throw error;
      }

      console.log('✅ User deleted successfully');
      // Data will be refreshed via real-time subscription
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const addBudgetRequest = async (request: Omit<BudgetRequest, 'id'>) => {
    try {
      const { error } = await supabase.from('budget_requests').insert({
        title: request.title,
        description: request.description,
        requested_amount: request.requestedAmount,
        category: request.category,
        priority: request.priority,
        status: request.status,
        requested_by: request.requestedBy,
        reviewed_by: request.reviewedBy,
        related_event_id: request.relatedEventId,
        justification: request.justification,
        treasurer_notes: request.treasurerNotes,
        approved_amount: request.approvedAmount,
      });

      if (error) {
        console.error('Error adding budget request:', error);
        toast.error('Erro ao criar solicitação de orçamento');
        throw error;
      }

      console.log('✅ Budget request added successfully');
      await loadData(false); // Refresh data
    } catch (error) {
      console.error('Error adding budget request:', error);
      throw error;
    }
  };

  const updateBudgetRequest = async (
    id: string,
    requestUpdate: Partial<BudgetRequest>
  ) => {
    try {
      const { error } = await supabase
        .from('budget_requests')
        .update({
          title: requestUpdate.title,
          description: requestUpdate.description,
          requested_amount: requestUpdate.requestedAmount,
          category: requestUpdate.category,
          priority: requestUpdate.priority,
          status: requestUpdate.status,
          reviewed_by: requestUpdate.reviewedBy,
          related_event_id: requestUpdate.relatedEventId,
          justification: requestUpdate.justification,
          treasurer_notes: requestUpdate.treasurerNotes,
          approved_amount: requestUpdate.approvedAmount,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating budget request:', error);
        toast.error('Erro ao atualizar solicitação de orçamento');
        throw error;
      }

      console.log('✅ Budget request updated successfully');
      await loadData(false); // Refresh data
    } catch (error) {
      console.error('Error updating budget request:', error);
      throw error;
    }
  };

  const deleteBudgetRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budget_requests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting budget request:', error);
        toast.error('Erro ao deletar solicitação de orçamento');
        throw error;
      }

      console.log('✅ Budget request deleted successfully');
      await loadData(false); // Refresh data
    } catch (error) {
      console.error('Error deleting budget request:', error);
      throw error;
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id'>) => {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        action_url: notification.actionUrl,
        related_id: notification.relatedId,
      });

      if (error) {
        console.error('Error adding notification:', error);
        toast.error('Erro ao criar notificação');
        throw error;
      }

      console.log('✅ Notification added successfully');
      await loadData(false); // Refresh data
    } catch (error) {
      console.error('Error adding notification:', error);
      throw error;
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      console.log('✅ Notification marked as read');
      await loadData(false); // Refresh data
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }

      console.log('✅ Notification deleted successfully');
      await loadData(false); // Refresh data
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  };

  const updateRegistration = async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating registration:', error);
        toast.error('Erro ao atualizar inscrição');
        throw error;
      }

      console.log('✅ Registration updated successfully');
    } catch (error) {
      console.error('Error updating registration:', error);
      throw error;
    }
  };

  const updateScoreWeights = async (weights: ScoreWeights) => {
    try {
      const { error } = await supabase.from('score_weights').upsert({
        test_weight: weights.testWeight,
        interview_weight: weights.interviewWeight,
      });

      if (error) {
        console.error('Error updating score weights:', error);
        toast.error('Erro ao atualizar pesos das notas');
        throw error;
      }

      setScoreWeights(weights);
      console.log('✅ Score weights updated successfully');
      await loadData(false); // Refresh data
    } catch (error) {
      console.error('Error updating score weights:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    console.log('🔄 Manual data refresh requested');
    await loadData(true);
  };

  return (
    <DataContext.Provider
      value={{
        events,
        posts,
        studyGroups,
        candidates,
        users,
        scoreWeights,
        budgetRequests,
        notifications,
        isLoading,
        getCalendarEvents,
        getTaskCompletionStats,
        getMemberOfTheMonth,
        getLeaderboards,
        addEvent,
        updateEvent,
        deleteEvent,
        addPost,
        updatePost,
        deletePost,
        addStudyGroup,
        updateStudyGroup,
        deleteStudyGroup,
        addCandidate,
        updateCandidate,
        deleteCandidate,
        addUser,
        updateUser,
        deleteUser,
        addBudgetRequest,
        updateBudgetRequest,
        deleteBudgetRequest,
        addNotification,
        markNotificationAsRead,
        deleteNotification,
        updateRegistration,
        updateScoreWeights,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
