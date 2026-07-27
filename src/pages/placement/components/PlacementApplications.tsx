import React, { useState } from 'react';
import { 
  FileText, ExternalLink, Calendar, Video, MapPin, User, Mail, Award, CheckCircle, 
  X, Clock, ChevronRight, Edit3, ShieldAlert, Check, Plus, Clipboard 
} from 'lucide-react';

interface Application {
  id: number;
  studentId: number;
  jobPostingId: number;
  resumeUrl: string;
  coverLetter?: string | null;
  applicationStatus: string;
  interviewFeedback?: string | null;
  interviewDate?: string | null;
  interviewLink?: string | null;
  interviewVenue?: string | null;
  interviewPanel?: string | null;
  interviewResult?: string | null;
  offerLetterUrl?: string | null;
  appliedAt: string;
  student: {
    fullName: string;
    email: string;
    currentCGPA?: number;
    department?: { name: string };
    program?: { name: string };
  };
  jobPosting: {
    title: string;
    jobType: string;
    company: {
      companyName: string;
    };
  };
}

interface PlacementApplicationsProps {
  applications: Application[];
  userRole: string;
  onUpdateStatus: (id: number, status: string, additionalData?: any) => Promise<void>;
}

const PIPELINE_STATUSES = [
  'Applied',
  'Shortlisted',
  'Interview Scheduled',
  'Selected',
  'Rejected',
  'Offered',
  'Accepted',
  'Declined',
];

export const PlacementApplications: React.FC<PlacementApplicationsProps> = ({
  applications,
  userRole,
  onUpdateStatus,
}) => {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals / forms states
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Status state
  const [nextStatus, setNextStatus] = useState('Applied');

  // Interview state
  const [iDate, setIDate] = useState('');
  const [iLink, setILink] = useState('');
  const [iVenue, setIVenue] = useState('');
  const [iPanel, setIPanel] = useState('');
  const [iFeedback, setIFeedback] = useState('');
  const [iResult, setIResult] = useState('Pending');

  // Offer state
  const [offerUrl, setOfferUrl] = useState('');

  const isHR = ['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'RECRUITER'].includes(userRole);

  const filteredApps = applications.filter((app) => {
    return statusFilter === 'All' || app.applicationStatus === statusFilter;
  });

  const handleOpenStatus = (app: Application) => {
    setSelectedApp(app);
    setNextStatus(app.applicationStatus);
    setIsStatusModalOpen(true);
  };

  const handleOpenInterview = (app: Application) => {
    setSelectedApp(app);
    setIDate(app.interviewDate ? new Date(app.interviewDate).toISOString().split('T')[0] : '');
    setILink(app.interviewLink || '');
    setIVenue(app.interviewVenue || '');
    setIPanel(app.interviewPanel || '');
    setIFeedback(app.interviewFeedback || '');
    setIResult(app.interviewResult || 'Pending');
    setIsInterviewModalOpen(true);
  };

  const handleOpenOffer = (app: Application) => {
    setSelectedApp(app);
    setOfferUrl(app.offerLetterUrl || '');
    setIsOfferModalOpen(true);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      setSubmitting(false);
      await onUpdateStatus(selectedApp.id, nextStatus);
      setIsStatusModalOpen(false);
      alert('Application status updated successfully.');
      const updated = { ...selectedApp, applicationStatus: nextStatus };
      setSelectedApp(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleInterviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      setSubmitting(true);
      await onUpdateStatus(selectedApp.id, 'Interview Scheduled', {
        interviewDate: iDate || undefined,
        interviewLink: iLink || undefined,
        interviewVenue: iVenue || undefined,
        interviewPanel: iPanel || undefined,
        interviewFeedback: iFeedback || undefined,
        interviewResult: iResult || undefined,
      });
      setIsInterviewModalOpen(false);
      alert('Interview scheduling and metadata saved.');
      // Refresh current
      const updated = {
        ...selectedApp,
        applicationStatus: 'Interview Scheduled',
        interviewDate: iDate,
        interviewLink: iLink,
        interviewVenue: iVenue,
        interviewPanel: iPanel,
        interviewFeedback: iFeedback,
        interviewResult: iResult,
      };
      setSelectedApp(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to save interview.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      setSubmitting(true);
      await onUpdateStatus(selectedApp.id, 'Offered', {
        offerLetterUrl: offerUrl,
      });
      setIsOfferModalOpen(false);
      alert('Offer Letter officially issued to student.');
      const updated = {
        ...selectedApp,
        applicationStatus: 'Offered',
        offerLetterUrl: offerUrl,
      };
      setSelectedApp(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to issue offer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="placement-applications-tab">
      {/* List Panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h5 className="font-bold text-gray-950 text-base">Tracking Applications Pool</h5>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-xl focus:outline-none text-xs font-semibold"
              id="app-status-filter"
            >
              <option value="All">All Applications</option>
              {PIPELINE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                selectedApp?.id === app.id
                  ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                  : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <h6 className="font-bold text-gray-950 leading-tight">{app.student.fullName}</h6>
                  <p className="text-xs text-gray-400 mt-1">
                    Applying for: <span className="text-blue-600 font-semibold">{app.jobPosting.title}</span> at {app.jobPosting.company.companyName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-16 sm:ml-0">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                    app.applicationStatus === 'Accepted'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : app.applicationStatus === 'Rejected' || app.applicationStatus === 'Declined'
                      ? 'bg-red-50 text-red-600 border-red-100'
                      : app.applicationStatus === 'Interview Scheduled'
                      ? 'bg-purple-50 text-purple-600 border-purple-100'
                      : app.applicationStatus === 'Offered'
                      ? 'bg-amber-50 text-amber-600 border-amber-100'
                      : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}
                >
                  {app.applicationStatus}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            </div>
          ))}

          {filteredApps.length === 0 && (
            <div className="py-12 text-center bg-white rounded-2xl border border-gray-100">
              <Clipboard className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No student applications logged under this status.</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Application Details Panel */}
      <div className="lg:col-span-1">
        {selectedApp ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 sticky top-6" id="app-detail-panel">
            <div className="border-b border-gray-100 pb-4">
              <h5 className="font-bold text-gray-950 text-lg leading-tight">{selectedApp.student.fullName}</h5>
              <p className="text-sm text-gray-500 mt-1">{selectedApp.student.email}</p>
              <div className="flex items-center gap-2 mt-2.5 text-xs text-gray-400 font-semibold">
                <span>{selectedApp.student.program?.name || 'Undergrad Student'}</span>
                <span>•</span>
                <span>CGPA: {selectedApp.student.currentCGPA?.toFixed(2) || '3.20'}</span>
              </div>
            </div>

            {/* Resume and Cover letter view */}
            <div className="space-y-4">
              <div>
                <h6 className="font-bold text-gray-950 text-xs uppercase tracking-wider mb-2">Resume Document</h6>
                <a
                  href={selectedApp.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200/50 rounded-xl transition text-xs font-semibold text-blue-600"
                >
                  <span className="flex items-center gap-2 text-gray-700">
                    <FileText className="h-4 w-4 text-red-500" />
                    Student Resume PDF
                  </span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>
              </div>

              {selectedApp.coverLetter && (
                <div>
                  <h6 className="font-bold text-gray-950 text-xs uppercase tracking-wider mb-2">Cover Letter Pitch</h6>
                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-100 whitespace-pre-line">
                    {selectedApp.coverLetter}
                  </p>
                </div>
              )}
            </div>

            {/* Current Application Status Detail */}
            <div className="border-t border-gray-100 pt-4 space-y-3 text-xs text-gray-600">
              <div className="flex justify-between items-center">
                <span className="font-medium">Application Pipeline Stage:</span>
                <span className="font-bold text-gray-900">{selectedApp.applicationStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Applied On:</span>
                <span className="font-bold text-gray-900">{new Date(selectedApp.appliedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* INTERVIEW SPECIFIC DISPLAY SECTION */}
            {selectedApp.applicationStatus === 'Interview Scheduled' && (
              <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-xl text-xs space-y-3" id="interview-details-card">
                <p className="font-bold text-purple-800 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Scheduled Interview
                </p>
                <div className="space-y-1.5 text-purple-950 font-medium">
                  {selectedApp.interviewDate && (
                    <div className="flex justify-between">
                      <span className="text-purple-700">Date:</span>
                      <span>{new Date(selectedApp.interviewDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedApp.interviewLink && (
                    <div className="flex justify-between">
                      <span className="text-purple-700">Meeting Link:</span>
                      <a href={selectedApp.interviewLink} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate w-32 text-right">
                        {selectedApp.interviewLink}
                      </a>
                    </div>
                  )}
                  {selectedApp.interviewVenue && (
                    <div className="flex justify-between">
                      <span className="text-purple-700">Venue:</span>
                      <span>{selectedApp.interviewVenue}</span>
                    </div>
                  )}
                  {selectedApp.interviewPanel && (
                    <div className="flex justify-between">
                      <span className="text-purple-700">Panel:</span>
                      <span>{selectedApp.interviewPanel}</span>
                    </div>
                  )}
                  {selectedApp.interviewFeedback && (
                    <div className="pt-2 border-t border-purple-200">
                      <p className="text-purple-700 font-bold mb-1">Interviewer Feedback:</p>
                      <p className="text-purple-900 leading-relaxed font-normal italic">{selectedApp.interviewFeedback}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* OFFER SPECIFIC DISPLAY SECTION */}
            {selectedApp.offerLetterUrl && (
              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-xs space-y-3" id="offer-details-card">
                <p className="font-bold text-emerald-800 flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  Issued Job Offer
                </p>
                <a
                  href={selectedApp.offerLetterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 bg-white border border-emerald-200 rounded-xl text-emerald-700 hover:bg-emerald-50 font-semibold"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Offer Letter Document
                  </span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            {/* HR / Admin Actions Footer Panel */}
            {isHR && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <h6 className="font-bold text-gray-950 text-xs uppercase tracking-wider mb-2">Recruitment Actions</h6>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleOpenStatus(selectedApp)}
                    className="py-2 px-3 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold rounded-xl text-xs transition text-center"
                    id="update-status-btn"
                  >
                    Change Status
                  </button>
                  <button
                    onClick={() => handleOpenInterview(selectedApp)}
                    className="py-2 px-3 bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 font-semibold rounded-xl text-xs transition text-center"
                    id="schedule-interview-btn"
                  >
                    Interview Settings
                  </button>
                  <button
                    onClick={() => handleOpenOffer(selectedApp)}
                    className="col-span-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition text-center shadow-xs"
                    id="issue-offer-btn"
                  >
                    Issue Official Offer Letter
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
            <Clipboard className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Select a student application to review resume PDFs, transition status, coordinate interview settings, and issue offer letters.</p>
          </div>
        )}
      </div>

      {/* PIPELINE STATUS MODAL */}
      {isStatusModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl max-w-sm w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h5 className="font-bold text-gray-900 text-base">Transition Application State</h5>
              <button onClick={() => setIsStatusModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Pipeline Status</label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-sm font-semibold"
                >
                  {PIPELINE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
                >
                  Apply Status Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERVIEW MODAL */}
      {isInterviewModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h5 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Configure Interview Settings
              </h5>
              <button onClick={() => setIsInterviewModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleInterviewSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Interview Date</label>
                  <input
                    type="date"
                    value={iDate}
                    onChange={(e) => setIDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Online Meeting Link (Google Meet / Zoom)</label>
                  <input
                    type="url"
                    value={iLink}
                    onChange={(e) => setILink(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-sm"
                    placeholder="https://meet.google.com/abc-defg-hij"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Physical Venue / Room (If Offline)</label>
                  <input
                    type="text"
                    value={iVenue}
                    onChange={(e) => setIVenue(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-sm"
                    placeholder="Main Seminar Hall, block C"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Interviewer Panel Members</label>
                  <input
                    type="text"
                    value={iPanel}
                    onChange={(e) => setIPanel(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-sm"
                    placeholder="Dr. Smith, HR Manager Jane"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Result Status</label>
                  <select
                    value={iResult}
                    onChange={(e) => setIResult(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-sm"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Interviewer Notes & Feedback</label>
                  <textarea
                    rows={3}
                    value={iFeedback}
                    onChange={(e) => setIFeedback(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-sm"
                    placeholder="Candidate demonstrated excellent system design and core database normalization skills..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold rounded-xl text-xs transition shadow-sm"
                >
                  {submitting ? 'Saving...' : 'Save Interview Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECONSTRUCT OFFER MODAL */}
      {isOfferModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h5 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Issue Official Offer Letter
              </h5>
              <button onClick={() => setIsOfferModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleOfferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Offer Document / Agreement Link *</label>
                <input
                  type="url"
                  required
                  value={offerUrl}
                  onChange={(e) => setOfferUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-sm"
                  placeholder="https://drive.google.com/your-offer-agreement-pdf"
                />
                <p className="text-[10px] text-gray-400 mt-1.5 leading-normal">
                  Provide a public link to the official appointment and contract agreement document. Student status will automatically elevate to "Offered".
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl text-xs transition shadow-sm"
                >
                  {submitting ? 'Issuing...' : 'Officially Issue Offer Letter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
