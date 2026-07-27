export interface Building {
  id: number;
  uuid: string;
  name: string;
  code: string;
  campus: string;
  status: string;
}

export interface Room {
  id: number;
  uuid: string;
  roomNumber: string;
  capacity: number;
  roomType: string;
  status: string;
  buildingId: number;
  building: Building;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Teacher {
  id: number;
  uuid: string;
  userId: number;
  firstName: string;
  lastName: string;
  user: User;
}

export interface Student {
  id: number;
  uuid: string;
  userId: number;
  rollNumber: string;
  registrationNumber: string;
  fullName?: string;
  user: User;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
}

export interface Section {
  id: number;
  name: string;
}

export interface Semester {
  id: number;
  name: string;
  code: string;
}

export interface CourseOffering {
  id: number;
  uuid: string;
  semesterId: number;
  subjectId: number;
  teacherId: number;
  sectionId: number;
  subject: Subject;
  section: Section;
  semester: Semester;
  teacher: Teacher;
  enrollments?: any[];
  _count?: {
    enrollments: number;
  };
}

export interface ExamInvigilator {
  id: number;
  examId: number;
  teacherId: number;
  role: string;
  teacher: Teacher;
}

export interface ExamSeatPlan {
  id: number;
  examId: number;
  studentId: number;
  enrollmentId: number;
  roomId: number;
  seatNumber: string;
  rowNumber: number;
  columnNumber: number;
  student: Student;
  room?: Room;
}

export interface Exam {
  id: number;
  uuid: string;
  examCode: string;
  title: string;
  examType: string;
  courseOfferingId: number;
  subjectId: number;
  teacherId: number;
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  examDate: string;
  startTime: string;
  endTime: string;
  roomId: number | null;
  buildingId: number | null;
  session: string;
  academicYear: string;
  instructions: string;
  status: 'Draft' | 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled';
  courseOffering: CourseOffering;
  subject: Subject;
  teacher: Teacher;
  room: Room | null;
  building: Building | null;
  invigilators: ExamInvigilator[];
  seatPlans: ExamSeatPlan[];
  allocatedSeat?: string;
  myRole?: string;
}

export interface AdmitCard {
  id: number;
  studentName: string;
  registrationNumber: string;
  rollNumber: string;
  program: string;
  subject: string;
  subjectCode: string;
  examDate: string;
  startTime: string;
  endTime: string;
  room: string;
  seatNumber: string;
  qrCodeUrl: string;
}
