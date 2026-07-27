import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/api-client';
import { Submission } from './types';
import { toast } from 'react-hot-toast';
import { X, Award, AlertTriangle, MessageSquare, Sparkles, Check } from 'lucide-react';

interface GradeSubmissionFormProps {
  submission: Submission;
  onClose: () => void;
  onSuccess: () => void;
}

export const GradeSubmissionForm: React.FC<GradeSubmissionFormProps> = ({
  submission,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [obtainedMarks, setObtainedMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [teacherRemarks, setTeacherRemarks] = useState('');

  const asg = submission.assignment;
  const isLate = submission.submissionStatus === 'Late';
  const penalty = asg.latePenaltyPercentage;

  // Real-time calculations
  const [calculatedAwardedMarks, setCalculatedAwardedMarks] = useState<number | null>(null);
  const [calculatedPercentage, setCalculatedPercentage] = useState<number | null>(null);
  const [calculatedGrade, setCalculatedGrade] = useState<string | null>(null);

  useEffect(() => {
    const marks = parseFloat(obtainedMarks);
    if (isNaN(marks) || marks < 0 || marks > asg.totalMarks) {
      setCalculatedAwardedMarks(null);
      setCalculatedPercentage(null);
      setCalculatedGrade(null);
      return;
    }

    let finalMarks = marks;
    if (isLate && penalty > 0) {
      finalMarks = marks * (1 - penalty / 100);
    }

    const percentage = (finalMarks / asg.totalMarks) * 100;
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 85) grade = 'A';
    else if (percentage >= 80) grade = 'A-';
    else if (percentage >= 75) grade = 'B+';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 65) grade = 'C+';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    setCalculatedAwardedMarks(parseFloat(finalMarks.toFixed(2)));
    setCalculatedPercentage(parseFloat(percentage.toFixed(2)));
    setCalculatedGrade(grade);
  }, [obtainedMarks, isLate, penalty, asg.totalMarks]);

  const handleGradeSubmit = async (returnAssignment = false) => {
    if (!returnAssignment) {
      const marks = parseFloat(obtainedMarks);
      if (isNaN(marks) || marks < 0 || marks > asg.totalMarks) {
        toast.error(`Please enter valid marks between 0 and ${asg.totalMarks}.`);
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        obtainedMarks: returnAssignment ? undefined : obtainedMarks,
        feedback,
        teacherRemarks,
        returnAssignment,
      };

      await apiClient.patch(`/assignments/submissions/${submission.id}/grade`, payload);
      toast.success(returnAssignment ? 'Assignment returned to student.' : 'Grades finalized successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to grade submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden max-w-lg w-full mx-auto">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 text-gray-800">
        <div>
          <h2 className="text-base font-bold tracking-tight">Evaluate Submission</h2>
          <p className="text-xs text-gray-400">Award grades, log feedback & review integrity indicators</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
        {/* Info Box */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase">Student</span>
            <span className="text-sm font-bold text-gray-700">{submission.student?.fullName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase">Reg Number</span>
            <span className="text-sm font-medium text-gray-600">
              {submission.student?.registrationNumber}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase">Attempt No.</span>
            <span className="text-sm font-bold text-gray-600">#{submission.submissionNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase">Plagiarism Score</span>
            <span className={`text-sm font-bold flex items-center gap-1 ${
              (submission.plagiarismScore || 0) > 15 ? 'text-rose-500' : 'text-emerald-500'
            }`}>
              <Sparkles className="h-3.5 w-3.5" />
              {submission.plagiarismScore || 0}% matching
            </span>
          </div>
          {submission.attachments && (
            <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-400 uppercase">Attached Work</span>
              <a
                href={submission.attachments}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                View Attachment URL
              </a>
            </div>
          )}
        </div>

        {/* Late Penalty Banner */}
        {isLate && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Late Submission Notice</p>
              <p className="text-xs mt-0.5">
                This attempt was submitted after the due date. An automatic penalty of{' '}
                <span className="font-bold">{penalty}%</span> will be deducted from any awarded marks.
              </p>
            </div>
          </div>
        )}

        {/* Grading Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Enter Marks (Out of {asg.totalMarks})
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max={asg.totalMarks}
                step="0.5"
                value={obtainedMarks}
                onChange={(e) => setObtainedMarks(e.target.value)}
                placeholder="e.g. 85"
                className="w-full pl-3 pr-16 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium bg-gray-50"
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-semibold">
                / {asg.totalMarks}
              </span>
            </div>
          </div>

          {/* Award Calculations Live */}
          {calculatedAwardedMarks !== null && (
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="block text-[10px] text-gray-400 font-bold uppercase">Awarded Marks</span>
                <span className="text-lg font-bold text-indigo-700">{calculatedAwardedMarks}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 font-bold uppercase">Percentage</span>
                <span className="text-lg font-bold text-indigo-700">{calculatedPercentage}%</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 font-bold uppercase">Letter Grade</span>
                <span className="text-lg font-bold text-indigo-700">{calculatedGrade}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5 text-gray-400" /> Student Feedback
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide constructive assessment and grading details..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Internal Teacher Remarks (Hidden from student)
            </label>
            <input
              type="text"
              value={teacherRemarks}
              onChange={(e) => setTeacherRemarks(e.target.value)}
              placeholder="e.g. Excellent defense, plagiarism checked."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-gray-50"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleGradeSubmit(true)}
            className="py-3 px-4 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-xl font-bold text-sm transition-all"
          >
            Return for Revision
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleGradeSubmit(false)}
            className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all flex items-center justify-center gap-1"
          >
            <Check className="h-4 w-4" />
            Submit Grades
          </button>
        </div>
      </div>
    </div>
  );
};
export default GradeSubmissionForm;
