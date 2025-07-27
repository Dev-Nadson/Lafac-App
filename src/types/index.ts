// Core Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePicture?: string;
  contactInfo: string;
  isActive: boolean;
  joinDate: string;
  participationHistory: ParticipationRecord[];
  twoFAEnabled?: boolean;
  birthDate?: string;
  studentId?: string;
  cpf?: string;
  institution?: string;
  period?: string;
}

export type UserRole = 
  | 'Superadmin'
  | 'President' 
  | 'Vice-President' 
  | 'Director of Events' 
  | 'Director of Communications' 
  | 'Scientific Director' 
  | 'Treasurer' 
  | 'Member';

export interface ParticipationRecord {
  type: 'Event' | 'Post' | 'Interview' | 'Study Group';
  id: string;
  title: string;
  date: string;
  role?: string;
}

// Site Settings
export interface SiteSettings {
  id: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  siteName: string;
  showPostsTab: boolean;
  showEventsTab: boolean;
  showStudyGroupsTab: boolean;
  showStatisticsTab: boolean;
  showSelectionProcessTab: boolean;
  selectionProcessOpen: boolean;
  birthdayModeActive: boolean;
  birthdayMemberId?: string;
  updatedBy?: string;
}

// Registration for Selection Process
export interface Registration {
  id: string;
  fullName: string;
  email: string;
  birthDate: string;
  studentId: string;
  cpf: string;
  institution: string;
  period: string;
  motivationLetter?: string;
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected';
  interviewDate?: string;
  interviewer1Id?: string;
  interviewer2Id?: string;
  testScore?: number;
  interview1Score?: number;
  interview2Score?: number;
  finalScore?: number;
  assignedRole?: string;
  notes?: string;
  createdAt: string;
}

// Personal Space
export interface PersonalSpace {
  id: string;
  userId: string;
  backgroundImage?: string;
  backgroundColor: string;
  notes: string;
  stickers: Sticker[];
  spotifyEmbed?: string;
  youtubeEmbed?: string;
  layoutConfig: any;
}

export interface Sticker {
  id: string;
  type: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Budget Requests
export interface BudgetRequest {
  id: string;
  title: string;
  description: string;
  requestedAmount: number;
  category: 'Event' | 'Material' | 'Infrastructure' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Under Review';
  requestedBy: string;
  reviewedBy?: string;
  relatedEventId?: string;
  justification?: string;
  treasurerNotes?: string;
  approvedAmount?: number;
  createdAt: string;
}

// Notifications
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'Task' | 'Event' | 'Deadline' | 'System' | 'Birthday' | 'Budget';
  read: boolean;
  actionUrl?: string;
  relatedId?: string;
  createdAt: string;
}

// Activity Assignments
export interface ActivityAssignment {
  id: string;
  userId: string;
  activityType: 'Post' | 'Event' | 'Study' | 'Research' | 'Design' | 'Video';
  activityId: string;
  taskDescription: string;
  deadline?: string;
  status: 'Assigned' | 'In Progress' | 'Completed' | 'Overdue';
  assignedBy: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
}

// Member Workload
export interface MemberWorkload {
  id: string;
  userId: string;
  semester: string;
  totalAssignments: number;
  completedAssignments: number;
  overdueAssignments: number;
  workloadLevel: 'Light' | 'Regular' | 'Heavy';
  lastCalculated: string;
}

// Calendar & Events
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: EventType;
  location?: string;
  onlineLink?: string;
  assignedMembers: string[];
  confirmations: EventConfirmation[];
  attendance: EventAttendance[];
  createdBy: string;
  status: 'Scheduled' | 'Confirmed' | 'Cancelled' | 'Completed';
  budgetRequestId?: string;
}

export type EventType = 'Simpósio' | 'Palestra' | 'Workshop' | 'Ação' | 'Minicurso' | 'Outro';

export interface EventConfirmation {
  userId: string;
  status: 'Invited' | 'Confirmed' | 'Declined';
  responseDate?: string;
}

export interface EventAttendance {
  userId: string;
  status: 'Present' | 'Absent';
}

// Posts
export interface Post {
  id: string;
  title: string;
  date: string;
  deadline: string;
  status: PostStatus;
  assignedRoles: PostAssignment[];
  mediaUploads: MediaFile[];
  description: string;
  relatedEventId?: string;
  createdBy: string;
  postType: PostType;
  publicationDate?: string;
}

export type PostStatus = 'In Production' | 'Posted' | 'Expired' | 'Done';
export type PostType = 'Reel' | 'Story' | 'Carrossel' | 'Feed Post';

export interface PostAssignment {
  role: 'Instagram Art Designer' | 'Video Editor' | 'Scientific Researcher' | 'Caption Writer';
  assignedTo?: string;
  completed: boolean;
  notes?: string;
  deadline?: string;
}

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'document';
  uploadedBy: string;
  uploadedAt: string;
}

// Study Groups
export interface StudyGroup {
  id: string;
  theme: string;
  presenter: string;
  mode: 'Presencial' | 'Online';
  date: string;
  time: string;
  materialStatus: 'Finished' | 'Unfinished';
  sessionStatus: 'Done' | 'Cancelled' | 'Scheduled';
  attendance: StudyGroupAttendance[];
  materials: StudyMaterial[];
  createdBy: string;
  researchAssignedTo?: string;
  materialAssignedTo?: string;
}

export interface StudyGroupAttendance {
  userId: string;
  present: boolean;
}

export interface StudyMaterial {
  id: string;
  title: string;
  url?: string;
  type: 'presentation' | 'document' | 'link' | 'quiz' | 'evaluation' | 'other';
}

// Selection Process
export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  positionApplied?: string;
  documents: CandidateDocument[];
  testScore?: number;
  interviewScores: InterviewScore[];
  status: CandidateStatus;
  comments: CandidateComment[];
  finalScore?: number;
  createdAt: string;
}

export type CandidateStatus = 'Under Evaluation' | 'Approved' | 'Rejected' | 'Pending Documents';

export interface CandidateDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface InterviewScore {
  interviewerId: string;
  score: number;
  date: string;
  notes?: string;
}

export interface CandidateComment {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;
}

export interface ScoreWeights {
  testWeight: number;
  interviewWeight: number;
}

// Common
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'Event' | 'Study Group' | 'Post Deadline' | 'Other';
  color: string;
  relatedId?: string;
}

// Calendar Settings
export interface CalendarSettings {
  showEvents: boolean;
  showStudyGroups: boolean;
  showPosts: boolean;
}

// Task Completion
export interface TaskCompletion {
  id: string;
  userId: string;
  taskType: 'post' | 'event' | 'study';
  taskId: string;
  completedAt: string;
  timelinessScore: number;
}

// Audit Log
export interface AuditLog {
  id: string;
  userId: string;
  action: 'create' | 'update' | 'delete';
  tableName: string;
  recordId: string;
  oldValues?: any;
  newValues?: any;
  createdAt: string;
}