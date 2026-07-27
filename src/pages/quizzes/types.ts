export interface QuestionOption {
  id?: number;
  optionText: string;
  isCorrect?: boolean;
}

export interface QuestionBank {
  id: number;
  uuid?: string;
  courseOfferingId: number;
  courseOffering?: {
    id: number;
    courseCode: string;
    subject: {
      name: string;
    };
  };
  teacherId: number;
  title?: string;
  topic?: string;
  difficultyLevel: 'Easy' | 'Medium' | 'Hard';
  questionType: 'MCQ' | 'TrueFalse' | 'MultipleSelect' | 'ShortAnswer';
  questionText: string;
  explanation?: string;
  marks: number;
  negativeMarks: number;
  attachments?: string;
  options: QuestionOption[];
}

export interface Quiz {
  id: number;
  uuid?: string;
  quizCode: string;
  title: string;
  description?: string;
  instructions?: string;
  courseOfferingId: number;
  courseOffering?: {
    id: number;
    courseCode: string;
    subject: {
      name: string;
    };
    section?: {
      name: string;
    };
    semester?: {
      name: string;
    };
  };
  teacherId: number;
  teacher?: {
    fullName?: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  availableFrom: string;
  availableUntil: string;
  maximumAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  negativeMarkingEnabled: boolean;
  negativeMarksPerQuestion: number;
  showResultImmediately: boolean;
  showCorrectAnswers: boolean;
  visibilityStatus: 'Draft' | 'Published' | 'Archived';
  questions?: QuestionBank[];
  submissions?: QuizSubmission[];
  _count?: {
    submissions: number;
    questions: number;
  };
}

export interface QuizSubmission {
  id: number;
  uuid?: string;
  quizId: number;
  quiz?: Quiz;
  studentId: number;
  student?: {
    fullName: string;
    registrationNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  enrollmentId: number;
  startedAt: string;
  submittedAt?: string;
  obtainedMarks?: number;
  percentage?: number;
  grade?: string;
  timeTaken?: number;
  submissionStatus: 'In Progress' | 'Submitted' | 'Auto Submitted' | 'Graded';
  attemptNumber: number;
  answers?: Record<number, any>; // maps questionId to selectedOptionId or optionIds
}

export interface QuizAnalytics {
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passPercentage: number;
  totalSubmissions: number;
  gradeDistribution: { grade: string; count: number }[];
  difficultyAnalysis: { difficulty: string; averageScore: number; count: number }[];
  timeTakenAnalysis: { timeRange: string; count: number }[];
}
