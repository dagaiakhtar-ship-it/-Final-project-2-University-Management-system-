export interface Subject {
  id: number;
  subjectCode: string;
  name: string;
}

export interface Section {
  id: number;
  name: string;
}

export interface Semester {
  id: number;
  name: string;
}

export interface CourseOffering {
  id: number;
  subject: Subject;
  section?: Section;
  semester?: Semester;
}

export interface TeacherUser {
  firstName: string;
  lastName: string;
  email: string;
}

export interface TeacherProfile {
  id: number;
  employeeId: string;
  user?: TeacherUser;
}

export interface Assignment {
  id: number;
  assignmentCode: string;
  title: string;
  description: string;
  instructions: string;
  courseOfferingId: number;
  courseOffering: CourseOffering;
  teacherId: number;
  teacher: TeacherProfile;
  totalMarks: number;
  passingMarks: number;
  publishDate: string;
  dueDate: string;
  allowLateSubmission: boolean;
  latePenaltyPercentage: number;
  maxAttempts: number;
  attachments?: string | null;
  visibilityStatus: 'Draft' | 'Published' | 'Archived';
  assignmentType: string;
  createdAt: string;
  _count?: {
    submissions: number;
  };
}

export interface StudentUser {
  firstName: string;
  lastName: string;
  email: string;
}

export interface StudentProfile {
  id: number;
  fullName: string;
  registrationNumber: string;
  user?: StudentUser;
}

export interface Submission {
  id: number;
  assignmentId: number;
  assignment: Assignment;
  studentId: number;
  student: StudentProfile;
  enrollmentId: number;
  submissionNumber: number;
  submittedAt: string;
  submissionStatus: 'Draft' | 'Submitted' | 'Late' | 'Graded' | 'Returned';
  obtainedMarks?: number | null;
  percentage?: number | null;
  grade?: string | null;
  feedback?: string | null;
  teacherRemarks?: string | null;
  attachments?: string | null;
  plagiarismScore?: number | null;
  gradedBy?: string | null;
  gradedAt?: string | null;
}

export interface AssignmentAnalytics {
  assignmentCode: string;
  title: string;
  totalMarks: number;
  passingMarks: number;
  stats: {
    enrolledStudents: number;
    totalSubmissions: number;
    gradedSubmissions: number;
    lateSubmissions: number;
    averageMarks: number;
    passPercentage: number;
    submissionRate: number;
    completionRate: number;
    lateSubmissionRate: number;
  };
  gradeDistribution: Array<{
    grade: string;
    count: number;
  }>;
}
