import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Award, 
  BookOpen, 
  GraduationCap, 
  Clock, 
  Activity 
} from 'lucide-react';

interface AuditSummaryProps {
  auditData: any;
  onRefresh: () => void;
  loading: boolean;
}

export const AuditSummary: React.FC<AuditSummaryProps> = ({ auditData, onRefresh, loading }) => {
  if (!auditData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-slate-100 text-center">
        <GraduationCap className="h-16 w-16 text-slate-300 mb-4 animate-bounce" />
        <h3 className="text-lg font-semibold text-slate-800">No Degree Audit Record Found</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Select a student or click the refresh button to trigger an auto-audit execution.
        </p>
      </div>
    );
  }

  const {
    graduationStatus,
    completedCredits,
    remainingCredits,
    completedCoreCredits,
    completedElectiveCredits,
    completedInternship,
    completedProject,
    completedThesis,
    completedComprehensiveExam,
    failedCourses,
    repeatedCourses,
    currentCGPA,
    remarks,
    requirements,
    student,
    missingReasons = [],
  } = auditData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Eligible':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Graduated':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Pending Review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  const getCheckboxIcon = (completed: boolean, required: boolean) => {
    if (!required) return <span className="text-xs text-slate-400">Not Req.</span>;
    return completed ? (
      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
    ) : (
      <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
    );
  };

  const creditProgress = requirements?.minimumCreditHours 
    ? Math.min(100, (completedCredits / requirements.minimumCreditHours) * 100) 
    : 0;

  const coreProgress = requirements?.minimumCoreCredits 
    ? Math.min(100, (completedCoreCredits / requirements.minimumCoreCredits) * 100) 
    : 0;

  const electiveProgress = requirements?.minimumElectiveCredits 
    ? Math.min(100, (completedElectiveCredits / requirements.minimumElectiveCredits) * 100) 
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top Banner Status */}
      <div className={`p-6 rounded-2xl border ${getStatusColor(graduationStatus)} shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            <h2 className="text-xl font-bold tracking-tight">
              Graduation Status: {graduationStatus}
            </h2>
          </div>
          <p className="text-sm opacity-90 max-w-xl">{remarks}</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 bg-white text-slate-800 hover:bg-slate-50 transition rounded-xl shadow-sm text-sm font-semibold border border-slate-200 disabled:opacity-50 flex items-center gap-2"
        >
          <Activity className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Re-auditing...' : 'Run Diagnostics'}
        </button>
      </div>

      {/* Student Meta Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Student Name</span>
          <span className="text-slate-800 font-semibold mt-1 block">{student?.fullName || 'N/A'}</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Registration Number</span>
          <span className="text-slate-800 font-semibold mt-1 block font-mono">{student?.registrationNumber || 'N/A'}</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Program</span>
          <span className="text-slate-800 font-semibold mt-1 block">{student?.programName || 'N/A'}</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Department</span>
          <span className="text-slate-800 font-semibold mt-1 block">{student?.departmentName || 'N/A'}</span>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CGPA */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Current CGPA</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{currentCGPA.toFixed(2)}</span>
            <span className="text-xs text-slate-400 mt-1 block">Min. Required: {requirements?.minimumCGPA?.toFixed(2) || '2.00'}</span>
          </div>
          <div className={`p-3 rounded-xl ${currentCGPA >= (requirements?.minimumCGPA || 2.0) ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
            <Award className="h-6 w-6" />
          </div>
        </div>

        {/* Completed Credits */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Credits Completed</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{completedCredits}</span>
            <span className="text-xs text-slate-400 mt-1 block">Target: {requirements?.minimumCreditHours || 120}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>

        {/* Remaining Credits */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Remaining Credits</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{remainingCredits}</span>
            <span className="text-xs text-slate-400 mt-1 block">To Complete Degree</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Failed & Repeated Courses */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Failed / Repeated</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">
              <span className={failedCourses > (requirements?.maximumFailedCourses || 0) ? 'text-rose-600' : 'text-slate-800'}>
                {failedCourses}
              </span>
              <span className="text-slate-300 text-lg mx-2">/</span>
              <span className={repeatedCourses > (requirements?.maximumRepeatedCourses || 0) ? 'text-rose-600' : 'text-slate-800'}>
                {repeatedCourses}
              </span>
            </span>
            <span className="text-xs text-slate-400 mt-1 block">Max Allowed: {requirements?.maximumFailedCourses || 3} F / {requirements?.maximumRepeatedCourses || 4} R</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Progress Bars & Experiential Requirements Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Bars */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800">Curriculum Compliance & Milestones</h3>
          
          {/* Total Credit compliance */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-600">Total Credit Hours ({completedCredits} / {requirements?.minimumCreditHours})</span>
              <span className="font-semibold text-slate-800">{creditProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${creditProgress}%` }}
              />
            </div>
          </div>

          {/* Core subjects compliance */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-600">Core Subject Credits ({completedCoreCredits} / {requirements?.minimumCoreCredits})</span>
              <span className="font-semibold text-slate-800">{coreProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${coreProgress}%` }}
              />
            </div>
          </div>

          {/* Electives compliance */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-600">Elective Subject Credits ({completedElectiveCredits} / {requirements?.minimumElectiveCredits})</span>
              <span className="font-semibold text-slate-800">{electiveProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${electiveProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Experiential Criteria */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Non-Course Requirements</h3>
          <ul className="space-y-4">
            <li className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
              <span className="text-sm font-medium text-slate-600">Internship Program</span>
              {getCheckboxIcon(completedInternship, requirements?.internshipRequired)}
            </li>
            <li className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
              <span className="text-sm font-medium text-slate-600">Capstone Project (FYP)</span>
              {getCheckboxIcon(completedProject, requirements?.projectRequired)}
            </li>
            <li className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
              <span className="text-sm font-medium text-slate-600">Thesis Submission</span>
              {getCheckboxIcon(completedThesis, requirements?.thesisRequired)}
            </li>
            <li className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
              <span className="text-sm font-medium text-slate-600">Comprehensive Exam</span>
              {getCheckboxIcon(completedComprehensiveExam, requirements?.comprehensiveExamRequired)}
            </li>
          </ul>
        </div>
      </div>

      {/* Academic Warnings & Missing requirements list */}
      {missingReasons.length > 0 && (
        <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-6">
          <h4 className="font-bold text-rose-800 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-500" />
            Unmet Graduation Milestones
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-rose-700 font-medium">
            {missingReasons.map((reason: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2 bg-white/60 p-3 rounded-xl border border-rose-50">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                {reason}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
