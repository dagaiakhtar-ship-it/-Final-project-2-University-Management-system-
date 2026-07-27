import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { ROUTES } from '../../constants/routes.constants';
import { useAuthStore } from '../../store/auth.store';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  FileText,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Info,
  Clock,
  Briefcase,
  HelpCircle,
  Paperclip
} from 'lucide-react';

export const CreateLeavePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRole = user?.role || 'STUDENT';
  const isStudent = userRole === 'STUDENT';
  const isTeacher = userRole === 'TEACHER';

  // Form States
  const [leaveType, setLeaveType] = useState('Casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [supportingDocument, setSupportingDocument] = useState('');
  const [remarks, setRemarks] = useState('');
  const [courseOfferingId, setCourseOfferingId] = useState('');
  const [affectsAttendance, setAffectsAttendance] = useState(isStudent);

  // Lists for dropdown selection
  const [courseOfferings, setCourseOfferings] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic calculations
  const [calculatedDays, setCalculatedDays] = useState(0);

  // Load Course Offerings for students to associate
  useEffect(() => {
    const fetchCourseOfferings = async () => {
      try {
        const res = await apiClient.get('/course-offerings');
        setCourseOfferings(res.data.data?.courseOfferings || res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch course offerings', err);
      }
    };

    const fetchDepartments = async () => {
      try {
        const res = await apiClient.get('/departments');
        setDepartments(res.data.data?.departments || res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch departments', err);
      }
    };

    fetchCourseOfferings();
    fetchDepartments();
  }, []);

  // Recalculate total days dynamically when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setCalculatedDays(diffDays);
      } else {
        setCalculatedDays(0);
      }
    } else {
      setCalculatedDays(0);
    }
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error('Start and End dates are required.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      toast.error('End date cannot be earlier than start date.');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please specify a solid reason for your leave request.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        leaveType,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        reason,
        supportingDocument: supportingDocument.trim() || null,
        remarks: remarks.trim() || null,
        affectsAttendance: Boolean(affectsAttendance),
        courseOfferingId: courseOfferingId ? Number(courseOfferingId) : null,
      };

      // Admin or specific role might have department specified
      if (selectedDepartmentId) {
        payload.departmentId = Number(selectedDepartmentId);
      }

      const res = await apiClient.post('/leaves', payload);
      if (res.data.success) {
        toast.success(`Leave application #${res.data.data.leaveNumber} submitted successfully!`);
        navigate(ROUTES.LEAVES);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit leave application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      {/* Back link */}
      <div className="mb-6">
        <button
          onClick={() => navigate(ROUTES.LEAVES)}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leaves Workspace
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Application Form Container */}
        <div className="lg:col-span-2">
          <Card className="p-8 border border-slate-100 bg-white shadow-sm rounded-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Apply for Leave</h2>
            <p className="text-sm text-slate-500 mb-8">
              Fill in the request details accurately. Attendance exemptions or academic adjustment options will be integrated upon approval.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Leave Type & Optional Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="leaveType" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Leave Type
                  </label>
                  <select
                    id="leaveType"
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  >
                    <option value="Casual">Casual Leave</option>
                    <option value="Medical">Medical Leave</option>
                    <option value="Annual">Annual Leave</option>
                    <option value="Maternity">Maternity/Paternity Leave</option>
                    <option value="Study">Study Leave</option>
                    <option value="Other">Other Leave</option>
                  </select>
                </div>

                {!isStudent && !isTeacher && (
                  <div>
                    <label htmlFor="selectedDepartmentId" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Department Assignment
                    </label>
                    <select
                      id="selectedDepartmentId"
                      value={selectedDepartmentId}
                      onChange={(e) => setSelectedDepartmentId(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    >
                      <option value="">Select Target Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.code} - {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Row 2: Start Date & End Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startDate" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated days indicator */}
              {calculatedDays > 0 && (
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-indigo-600 animate-pulse" />
                    <div>
                      <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Leave Duration Calc</span>
                      <p className="text-sm text-indigo-700 mt-0.5">Your requested leave is logically consistent.</p>
                    </div>
                  </div>
                  <span className="px-4 py-1.5 bg-indigo-600 text-white font-mono font-bold text-sm rounded-lg shadow-xs">
                    {calculatedDays} {calculatedDays === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
              )}

              {/* Optional Student Course Offering Exemption link */}
              {isStudent && (
                <div>
                  <label htmlFor="courseOfferingId" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Affects Course Offering (Optional)
                  </label>
                  <select
                    id="courseOfferingId"
                    value={courseOfferingId}
                    onChange={(e) => setCourseOfferingId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  >
                    <option value="">All courses within schedule (General Leave)</option>
                    {courseOfferings.map((co) => (
                      <option key={co.id} value={co.id}>
                        {co.courseCode} - {co.subject?.name || 'Class Subject'}
                      </option>
                    ))}
                  </select>
                  <span className="block text-xs text-slate-400 mt-1.5">
                    Choose a specific course if this leave only requests exemption from a particular class section.
                  </span>
                </div>
              )}

              {/* Attendance Exemption Toggle */}
              {isStudent && (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div>
                    <label className="text-sm font-bold text-slate-800 block">Attendance Adjustment Integration</label>
                    <span className="text-xs text-slate-500">
                      When approved, automatically mark attendance records within this date range as "EXCUSED/LEAVE".
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={affectsAttendance}
                    onChange={(e) => setAffectsAttendance(e.target.checked)}
                    className="w-5 h-5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Reason */}
              <div>
                <label htmlFor="reason" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Explanatory Reason for Leave
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the solid reason or diagnosis/academic details motivating this request..."
                  required
                  rows={4}
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                ></textarea>
              </div>

              {/* Supporting Document */}
              <div>
                <label htmlFor="supportingDocument" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Supporting Document URL (Optional)
                </label>
                <div className="relative">
                  <Paperclip className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="supportingDocument"
                    type="url"
                    placeholder="https://example.com/medical-certificate.pdf"
                    value={supportingDocument}
                    onChange={(e) => setSupportingDocument(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label htmlFor="remarks" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Additional Remarks
                </label>
                <textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any additional remarks or notes for the approving authority..."
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                ></textarea>
              </div>

              {/* Submitting Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  onClick={() => navigate(ROUTES.LEAVES)}
                  variant="outline"
                  className="px-5 py-2.5 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  {submitting ? 'Submitting Leave Application...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar Info Guidelines */}
        <div className="space-y-6">
          <Card className="p-6 border border-slate-100 bg-white shadow-sm rounded-xl">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600" /> Leave Regulation Guidelines
            </h3>
            <ul className="space-y-3.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Applications should ideally be submitted <strong>at least 48 hours</strong> prior to the start date, except in emergencies.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Medical leaves exceeding <strong>3 days</strong> strictly require uploading a valid medical certificate or prescription proof.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Leave records directly link to timetabled attendance sessions. Upon approval, matching dates will be marked as Excused.
                </span>
              </li>
            </ul>
          </Card>

          <Card className="p-6 border border-slate-100 bg-white shadow-sm rounded-xl">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" /> Approval Workflow
            </h3>
            <div className="relative pl-6 border-l-2 border-slate-100 space-y-5">
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 w-4.5 h-4.5 rounded-full bg-indigo-100 border-4 border-white flex items-center justify-center"></div>
                <h4 className="text-xs font-bold text-slate-800">1. Submission</h4>
                <p className="text-xs text-slate-500 mt-0.5">Request is generated and administrators receive instant live notifications.</p>
              </div>
              {/* Step 2 */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 w-4.5 h-4.5 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center"></div>
                <h4 className="text-xs font-bold text-slate-800">2. Review</h4>
                <p className="text-xs text-slate-500 mt-0.5">Department Head, Coordinator, or Admin evaluates dates and reasons.</p>
              </div>
              {/* Step 3 */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 w-4.5 h-4.5 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center"></div>
                <h4 className="text-xs font-bold text-slate-800">3. Automation</h4>
                <p className="text-xs text-slate-500 mt-0.5">Status becomes Approved or Rejected, and attendance is auto-synchronized.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
