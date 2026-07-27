import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/api-client';
import { Assignment } from './types';
import { toast } from 'react-hot-toast';
import { X, Calendar, FileText, Settings, AlertCircle, Save, CheckSquare } from 'lucide-react';

interface CreateAssignmentFormProps {
  assignmentId?: number; // if updating
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateAssignmentForm: React.FC<CreateAssignmentFormProps> = ({
  assignmentId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [courseOfferings, setCourseOfferings] = useState<any[]>([]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [courseOfferingId, setCourseOfferingId] = useState('');
  const [totalMarks, setTotalMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('50');
  const [assignmentType, setAssignmentType] = useState('Individual');
  const [publishDate, setPublishDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [latePenaltyPercentage, setLatePenaltyPercentage] = useState('10');
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [attachments, setAttachments] = useState('');
  const [visibilityStatus, setVisibilityStatus] = useState<'Draft' | 'Published'>('Draft');

  // Load course offerings
  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const res = await apiClient.get('/course-offerings');
        if (res.data?.success) {
          setCourseOfferings(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load course offerings:', err);
      }
    };
    fetchOfferings();
  }, []);

  // Load existing assignment if editing
  useEffect(() => {
    if (!assignmentId) return;

    const loadAssignment = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/assignments/${assignmentId}`);
        if (res.data?.success) {
          const asg = res.data.data as Assignment;
          setTitle(asg.title);
          setDescription(asg.description);
          setInstructions(asg.instructions);
          setCourseOfferingId(String(asg.courseOfferingId));
          setTotalMarks(String(asg.totalMarks));
          setPassingMarks(String(asg.passingMarks));
          setAssignmentType(asg.assignmentType);
          setPublishDate(new Date(asg.publishDate).toISOString().slice(0, 16));
          setDueDate(new Date(asg.dueDate).toISOString().slice(0, 16));
          setAllowLateSubmission(asg.allowLateSubmission);
          setLatePenaltyPercentage(String(asg.latePenaltyPercentage));
          setMaxAttempts(String(asg.maxAttempts));
          setAttachments(asg.attachments || '');
          setVisibilityStatus(asg.visibilityStatus === 'Published' ? 'Published' : 'Draft');
        }
      } catch (err) {
        toast.error('Failed to load assignment details.');
      } finally {
        setLoading(false);
      }
    };
    loadAssignment();
  }, [assignmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !courseOfferingId || !publishDate || !dueDate) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (parseFloat(totalMarks) <= 0) {
      toast.error('Total marks must be greater than zero.');
      return;
    }

    if (parseFloat(passingMarks) < 0 || parseFloat(passingMarks) > parseFloat(totalMarks)) {
      toast.error('Passing marks must be between 0 and total marks.');
      return;
    }

    if (new Date(publishDate) > new Date(dueDate)) {
      toast.error('Publish date cannot be after due date.');
      return;
    }

    const payload = {
      title,
      description,
      instructions,
      courseOfferingId,
      totalMarks,
      passingMarks,
      assignmentType,
      publishDate,
      dueDate,
      allowLateSubmission,
      latePenaltyPercentage: allowLateSubmission ? latePenaltyPercentage : '0',
      maxAttempts,
      attachments,
      visibilityStatus,
    };

    try {
      setLoading(true);
      if (assignmentId) {
        await apiClient.put(`/assignments/${assignmentId}`, payload);
        toast.success('Assignment updated successfully!');
      } else {
        await apiClient.post('/assignments', payload);
        toast.success('Assignment created successfully!');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save assignment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden max-w-2xl w-full mx-auto">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-55 text-gray-800">
        <div>
          <h2 className="text-lg font-bold tracking-tight">
            {assignmentId ? 'Modify Assignment' : 'Create New Assignment'}
          </h2>
          <p className="text-xs text-gray-400">Design your academic task & evaluation bounds</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
        {/* Course & Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Course Offering *
            </label>
            <select
              value={courseOfferingId}
              onChange={(e) => setCourseOfferingId(e.target.value)}
              disabled={!!assignmentId}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            >
              <option value="">-- Choose Course --</option>
              {courseOfferings.map((co) => (
                <option key={co.id} value={co.id}>
                  {co.subject?.name} - {co.section?.name || 'All'} ({co.semester?.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Assignment Type
            </label>
            <select
              value={assignmentType}
              onChange={(e) => setAssignmentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-gray-50"
            >
              <option value="Individual">Individual Task</option>
              <option value="Project">Project / Term Work</option>
              <option value="Group">Group Assignment</option>
              <option value="Laboratory">Laboratory Work</option>
              <option value="Case Study">Case Study Analysis</option>
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            Assignment Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Final Research Thesis on Distributed Databases"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-gray-50"
            required
          />
        </div>

        {/* Description & Instructions */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            Task Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the context, topic, and expected outcomes..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            Submission Instructions
          </label>
          <textarea
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Upload a single PDF file under 10MB. Include team member registration numbers on the first page..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-gray-50"
          />
        </div>

        {/* Marks & Attempts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Total Marks *
            </label>
            <input
              type="number"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-gray-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Passing Marks *
            </label>
            <input
              type="number"
              value={passingMarks}
              onChange={(e) => setPassingMarks(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-gray-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Max Attempts Allowed
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-gray-50"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400" /> Publish Date & Time *
            </label>
            <input
              type="datetime-local"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-gray-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400" /> Submission Due Date *
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-gray-50"
              required
            />
          </div>
        </div>

        {/* Late Submissions */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-sm font-semibold text-gray-700">Allow Late Submissions</span>
              <span className="block text-xs text-gray-400">Accept student submissions after the due date</span>
            </div>
            <input
              type="checkbox"
              checked={allowLateSubmission}
              onChange={(e) => setAllowLateSubmission(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          {allowLateSubmission && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Late Penalty Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={latePenaltyPercentage}
                  onChange={(e) => setLatePenaltyPercentage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-white"
                />
                <span className="text-[10px] text-amber-600 block mt-1">
                  Will deduct from original awarded score automatically
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            Resource Attachments (Link / URL)
          </label>
          <input
            type="text"
            value={attachments}
            onChange={(e) => setAttachments(e.target.value)}
            placeholder="e.g. https://storage.university.edu/syllabus/db-guide.pdf"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-gray-50"
          />
        </div>

        {/* Status */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setVisibilityStatus('Draft')}
            className={`py-2.5 px-4 rounded-xl border font-semibold text-sm transition-all ${
              visibilityStatus === 'Draft'
                ? 'bg-gray-100 border-gray-300 text-gray-700'
                : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'
            }`}
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => setVisibilityStatus('Published')}
            className={`py-2.5 px-4 rounded-xl border font-semibold text-sm transition-all ${
              visibilityStatus === 'Published'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'
            }`}
          >
            Publish Now
          </button>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Processing...' : (assignmentId ? 'Update Assignment' : 'Create Assignment')}
          </button>
        </div>
      </form>
    </div>
  );
};
export default CreateAssignmentForm;
