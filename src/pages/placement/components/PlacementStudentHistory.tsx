import React from 'react';
import { 
  Award, Briefcase, Calendar, CheckCircle2, ChevronRight, FileText, 
  MapPin, Clock, ShieldAlert, BookOpen, Layers, Milestone, CheckCircle, Check 
} from 'lucide-react';

interface Application {
  id: number;
  studentId: number;
  jobPostingId: number;
  resumeUrl: string;
  coverLetter?: string | null;
  applicationStatus: string;
  interviewDate?: string | null;
  interviewVenue?: string | null;
  interviewLink?: string | null;
  offerLetterUrl?: string | null;
  appliedAt: string;
  jobPosting: {
    id: number;
    title: string;
    jobType: string;
    location: string;
    company: {
      companyName: string;
      companyLogo?: string | null;
    };
  };
}

interface PlacementStudentHistoryProps {
  studentData: {
    student: any;
    degreeAudit?: any;
    applications: Application[];
    placementRates: {
      totalApplications: number;
      shortlisted: number;
      interviews: number;
      offered: number;
    };
  } | null;
  onUpdateStatus?: (id: number, status: string) => Promise<void>;
}

const FUNNEL_STAGES = [
  { name: 'Applied', desc: 'Sent to corporate HR' },
  { name: 'Shortlisted', desc: 'CV screen passed' },
  { name: 'Interview Scheduled', desc: 'Technical / HR evaluation' },
  { name: 'Offered', desc: 'Contract released' },
  { name: 'Accepted', desc: 'Signed appointment' },
];

export const PlacementStudentHistory: React.FC<PlacementStudentHistoryProps> = ({
  studentData,
  onUpdateStatus,
}) => {
  if (!studentData) {
    return (
      <div className="py-12 text-center bg-white rounded-2xl border border-gray-100" id="placement-history-tab">
        <Milestone className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No placement logs found or student profile not loaded.</p>
      </div>
    );
  }

  const { student, degreeAudit, applications, placementRates } = studentData;

  const handleUpdateStatus = async (id: number, status: string) => {
    if (onUpdateStatus) {
      try {
        await onUpdateStatus(id, status);
        alert(`You have successfully ${status.toLowerCase()} this job offer.`);
      } catch (err: any) {
        alert(err.message || 'Action failed.');
      }
    }
  };

  return (
    <div className="space-y-8" id="placement-history-tab">
      {/* Upper Profile Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Academic Standings Card */}
        <div className="md:col-span-1 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h6 className="font-bold text-gray-950 text-sm flex items-center gap-1.5 border-b border-gray-100 pb-3">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Verified Academic Standings
          </h6>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400 font-semibold">Student Name</span>
              <span className="font-bold text-gray-900">{student.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-semibold">Major Department</span>
              <span className="font-bold text-gray-900">{student.department?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-semibold">Academic Program</span>
              <span className="font-bold text-gray-900">{student.program?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-semibold">Verified CGPA</span>
              <span className="font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-sm">
                {degreeAudit?.currentCGPA?.toFixed(2) || '3.20'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-semibold">Internship Status</span>
              <span
                className={`font-bold ${
                  degreeAudit?.completedInternship ? 'text-emerald-600' : 'text-gray-400'
                }`}
              >
                {degreeAudit?.completedInternship ? 'Completed' : 'Pending / Not Completed'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-semibold">Graduation Status</span>
              <span
                className={`font-bold ${
                  degreeAudit?.graduationStatus === 'Graduated' || degreeAudit?.graduationStatus === 'Eligible'
                    ? 'text-emerald-600 font-extrabold'
                    : 'text-amber-600'
                }`}
              >
                {degreeAudit?.graduationStatus || 'Not Eligible'}
              </span>
            </div>
          </div>
        </div>

        {/* Funnel conversion stats */}
        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h6 className="font-bold text-gray-950 text-sm flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <Layers className="h-5 w-5 text-emerald-600" />
              Your Career Pipeline Funnel
            </h6>
            <p className="text-xs text-gray-400 mt-2">
              Visual pipeline metrics representing your current career tracking and corporate conversion rates.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center mt-6">
            <div className="p-4 bg-gray-50 border border-gray-100/50 rounded-xl">
              <p className="text-2xl font-extrabold text-gray-900">{placementRates.totalApplications}</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-1">Applications</p>
            </div>
            <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-xl">
              <p className="text-2xl font-extrabold text-blue-700">{placementRates.shortlisted}</p>
              <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mt-1">Shortlisted</p>
            </div>
            <div className="p-4 bg-purple-50/50 border border-purple-100/50 rounded-xl">
              <p className="text-2xl font-extrabold text-purple-700">{placementRates.interviews}</p>
              <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider mt-1">Interviews</p>
            </div>
            <div className="p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-xl">
              <p className="text-2xl font-extrabold text-emerald-700">{placementRates.offered}</p>
              <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mt-1">Offers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Applied Positions Pipeline Flow List */}
      <div className="space-y-4">
        <h6 className="font-bold text-gray-950 text-sm">Your Pipeline Submissions</h6>

        <div className="space-y-5">
          {applications.map((app) => (
            <div key={app.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              {/* Job Info Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                    {app.jobPosting.company.companyLogo ? (
                      <img src={app.jobPosting.company.companyLogo} alt={app.jobPosting.company.companyName} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Briefcase className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h6 className="font-bold text-gray-950 leading-tight">{app.jobPosting.title}</h6>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-semibold text-gray-700">{app.jobPosting.company.companyName}</span>
                      {' • '}{app.jobPosting.location}
                    </p>
                  </div>
                </div>

                {/* Offer decision trigger if status is Offered */}
                {app.applicationStatus === 'Offered' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'Accepted')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                    >
                      Accept Offer
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'Declined')}
                      className="px-3.5 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold rounded-xl text-xs transition"
                    >
                      Decline Offer
                    </button>
                  </div>
                )}
              </div>

              {/* Graphical Funnel Progress Line */}
              <div className="relative pt-4">
                <div className="absolute left-0 right-0 top-6 h-0.5 bg-gray-100 -z-10" />

                <div className="grid grid-cols-5 gap-2 text-center relative z-10">
                  {FUNNEL_STAGES.map((stage, idx) => {
                    const currentIdx = FUNNEL_STAGES.findIndex((s) => s.name === app.applicationStatus);
                    // Match and color accordingly
                    const isPassed = idx <= currentIdx;
                    const isActive = idx === currentIdx;

                    let bgCircle = 'bg-gray-200 border-gray-300';
                    let textClass = 'text-gray-400';

                    if (isActive) {
                      bgCircle = app.applicationStatus === 'Rejected' || app.applicationStatus === 'Declined'
                        ? 'bg-red-600 border-red-700 text-white ring-4 ring-red-100'
                        : 'bg-blue-600 border-blue-700 text-white ring-4 ring-blue-100';
                      textClass = app.applicationStatus === 'Rejected' || app.applicationStatus === 'Declined'
                        ? 'text-red-600 font-bold'
                        : 'text-blue-600 font-bold';
                    } else if (isPassed) {
                      bgCircle = 'bg-emerald-600 border-emerald-700 text-white';
                      textClass = 'text-emerald-700 font-medium';
                    }

                    return (
                      <div key={stage.name} className="flex flex-col items-center">
                        <div className={`h-6 w-6 rounded-full border flex items-center justify-center text-[10px] font-bold ${bgCircle}`}>
                          {isPassed && !isActive ? (
                            <Check className="h-3 w-3 text-white" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <p className={`text-[11px] mt-2.5 leading-tight ${textClass}`}>{stage.name}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5 hidden sm:block">{stage.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Interview info drawer / panel inside card */}
              {app.applicationStatus === 'Interview Scheduled' && (app.interviewDate || app.interviewLink) && (
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-xs space-y-3">
                  <p className="font-bold text-purple-800 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Coordinate Upcoming Interview
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-purple-950 font-medium">
                    {app.interviewDate && (
                      <div>
                        <span className="text-purple-500 block">Date & Time</span>
                        <span className="font-bold">{new Date(app.interviewDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {app.interviewLink && (
                      <div>
                        <span className="text-purple-500 block">Join Meeting Link</span>
                        <a href={app.interviewLink} target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold block truncate">
                          {app.interviewLink}
                        </a>
                      </div>
                    )}
                    {app.interviewVenue && (
                      <div>
                        <span className="text-purple-500 block">Venue / Room Location</span>
                        <span className="font-bold">{app.interviewVenue}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Offer letter detail card */}
              {app.offerLetterUrl && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-bold text-emerald-800">Your Appointment Offer Letter is Ready</p>
                      <p className="text-emerald-600 mt-0.5">Please review the contract and submit your response.</p>
                    </div>
                  </div>
                  <a
                    href={app.offerLetterUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl text-xs transition flex items-center gap-1 self-start sm:self-center shadow-xs"
                  >
                    View Offer Letter
                    <ChevronRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          ))}

          {applications.length === 0 && (
            <div className="py-12 text-center bg-white rounded-2xl border border-gray-100">
              <Milestone className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">You haven't submitted any placement applications yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
