import React, { useState } from 'react';
import { 
  Users, MessageSquare, Briefcase, Check, X, 
  HelpCircle, Sparkles, BookOpen, Clock 
} from 'lucide-react';

interface Student {
  id: number;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AlumniProfile {
  id: number;
  studentId: number;
  graduationYear: number;
  degree: string;
  currentCompany?: string;
  currentDesignation?: string;
  verified: boolean;
  student: Student;
  department: {
    name: string;
  };
}

interface MentorshipRequest {
  id: number;
  mentorId: number;
  menteeStudentId: number;
  mentorshipArea: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  mentor: AlumniProfile;
  menteeStudent: Student;
}

interface AlumniMentorshipProps {
  profiles: AlumniProfile[];
  mentorships: MentorshipRequest[];
  myProfile: AlumniProfile | null;
  currentUserRole?: string;
  currentStudentId?: number;
  onRequestMentorship: (mentorId: number, area: string) => Promise<void>;
  onUpdateStatus: (id: number, status: string) => Promise<void>;
}

export const AlumniMentorship: React.FC<AlumniMentorshipProps> = ({
  profiles,
  mentorships,
  myProfile,
  currentUserRole,
  currentStudentId,
  onRequestMentorship,
  onUpdateStatus,
}) => {
  const [selectedMentor, setSelectedMentor] = useState<AlumniProfile | null>(null);
  const [mentorshipArea, setMentorshipArea] = useState('Software Development & Architecture');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verified alumni from profiles (other than ourselves) make up potential mentors
  const potentialMentors = profiles.filter(p => p.verified && (!myProfile || p.id !== myProfile.id));

  // Mentorship requests where I am the mentee
  const myMenteeRequests = mentorships.filter(m => m.menteeStudentId === currentStudentId);

  // Mentorship requests where I am the mentor (if I am an alumnus)
  const myMentorRequests = myProfile ? mentorships.filter(m => m.mentorId === myProfile.id) : [];

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor) return;

    try {
      setIsSubmitting(true);
      await onRequestMentorship(selectedMentor.id, mentorshipArea);
      setSelectedMentor(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-100 flex items-center gap-1">Approved</span>;
      case 'DECLINED':
        return <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-xs font-bold border border-rose-100 flex items-center gap-1">Declined</span>;
      case 'COMPLETED':
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200 flex items-center gap-1">Completed</span>;
      default:
        return <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-100 flex items-center gap-1">Pending</span>;
    }
  };

  return (
    <div className="space-y-6" id="alumni-mentorship-container">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <span className="bg-slate-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">Mentorship Network</span>
          <h3 className="text-xl font-bold mb-2">Accelerate Your Career Paths</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Connect with seasoned alumni who graduated from your departments. Get guidance on mock interviews, resume preparation, grad school selection, and real-world tech stack recommendations.
          </p>
        </div>
        <Sparkles className="absolute right-6 bottom-6 h-20 w-20 text-slate-700/40" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column: Mentor Listings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-600" />
              Available Alumni Mentors
            </h4>
            
            {potentialMentors.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center">No verified alumni mentors are listed yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {potentialMentors.map(mentor => {
                  const mFirstName = mentor.student?.user?.firstName || mentor.student?.firstName || 'Alumni';
                  const mLastName = mentor.student?.user?.lastName || mentor.student?.lastName || 'Mentor';

                  // See if we already have an active/pending request
                  const hasPendingOrApproved = myMenteeRequests.some(r => r.mentorId === mentor.id && (r.status === 'PENDING' || r.status === 'APPROVED'));

                  return (
                    <div key={mentor.id} className="border border-slate-200 p-4 rounded-xl hover:bg-slate-50 transition-colors flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="h-10 w-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {mFirstName[0]}{mLastName[0]}
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-slate-900">{mFirstName} {mLastName}</h5>
                            <p className="text-[10px] text-slate-500">{mentor.department?.name}</p>
                          </div>
                        </div>

                        {mentor.currentDesignation && mentor.currentCompany ? (
                          <p className="text-xs font-semibold text-slate-800 mb-2">
                            {mentor.currentDesignation} at <span className="text-slate-900">{mentor.currentCompany}</span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic mb-2">Verified Graduate</p>
                        )}
                        <p className="text-[11px] text-slate-500 line-clamp-2">Degree: {mentor.degree} • Class of {mentor.graduationYear}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                        {hasPendingOrApproved ? (
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded">
                            Already Connected
                          </span>
                        ) : currentStudentId ? (
                          <button
                            onClick={() => setSelectedMentor(mentor)}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare className="h-3 w-3" /> Request Mentorship
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Students only</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mentee Connections Tracker */}
          {currentStudentId && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-slate-600" />
                My Mentorship Connections
              </h4>

              {myMenteeRequests.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-4 text-center">You have not submitted any mentorship requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {myMenteeRequests.map(req => {
                    const mentorFirst = req.mentor?.student?.user?.firstName || req.mentor?.student?.firstName || 'Alumni';
                    const mentorLast = req.mentor?.student?.user?.lastName || req.mentor?.student?.lastName || 'Mentor';

                    return (
                      <div key={req.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50">
                        <div>
                          <p className="text-xs font-bold text-slate-900">Mentor: {mentorFirst} {mentorLast}</p>
                          <p className="text-[10px] text-slate-500 font-medium">Area: {req.mentorshipArea}</p>
                          <p className="text-[9px] text-slate-400">Requested on: {new Date(req.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          {getStatusBadge(req.status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Column: Actionable forms for Alumni & Mentors */}
        <div className="space-y-6">
          {/* Mentors Panel (Incoming Student Requests) */}
          {myProfile && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-600" />
                Incoming Mentorship Requests
              </h4>
              
              {myMentorRequests.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-4 text-center">No student mentorship requests have been received yet.</p>
              ) : (
                <div className="space-y-4">
                  {myMentorRequests.map(req => {
                    const sFirstName = req.menteeStudent?.user?.firstName || req.menteeStudent?.firstName || 'Student';
                    const sLastName = req.menteeStudent?.user?.lastName || req.menteeStudent?.lastName || 'Mentee';
                    const sEmail = req.menteeStudent?.user?.email || req.menteeStudent?.email || '';

                    return (
                      <div key={req.id} className="border border-slate-150 p-3 rounded-lg space-y-2 bg-slate-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{sFirstName} {sLastName}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{sEmail}</p>
                          </div>
                          <div>
                            {req.status === 'PENDING' ? (
                              <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 font-bold">Pending</span>
                            ) : (
                              getStatusBadge(req.status)
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                          <span className="font-bold">Requested Area:</span> {req.mentorshipArea}
                        </p>

                        {req.status === 'PENDING' && (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => onUpdateStatus(req.id, 'DECLINED')}
                              className="px-2 py-1 bg-white hover:bg-rose-50 border border-slate-200 text-rose-700 text-[10px] font-bold rounded flex items-center gap-1 transition-colors"
                            >
                              <X className="h-3 w-3" /> Decline
                            </button>
                            <button
                              onClick={() => onUpdateStatus(req.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded flex items-center gap-1 transition-colors"
                            >
                              <Check className="h-3 w-3" /> Approve
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* How Mentorship Works Info Widget */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">How does it work?</h4>
            <ol className="list-decimal list-inside space-y-3 text-xs text-slate-600">
              <li>Students browse the list of verified, eligible alumni mentors.</li>
              <li>Students submit a request, indicating their primary field of interest (e.g. Software Dev, Management, Analytics).</li>
              <li>Alumni receive a notification, review the student profile, and approve or decline the link.</li>
              <li>Once approved, you can coordinate career chats, review resumes, and run mockup sessions.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Mentorship Request Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Submit Mentorship Request</h3>
              <button 
                onClick={() => setSelectedMentor(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Mentor</label>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-800">
                      {selectedMentor.student?.user?.firstName} {selectedMentor.student?.user?.lastName}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {selectedMentor.currentDesignation} at {selectedMentor.currentCompany || 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Mentorship Area</label>
                  <select
                    value={mentorshipArea}
                    onChange={(e) => setMentorshipArea(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-500"
                    required
                  >
                    <option value="Software Development & Architecture">Software Development & Architecture</option>
                    <option value="Product Management & Strategy">Product Management & Strategy</option>
                    <option value="Data Science & Artificial Intelligence">Data Science & Artificial Intelligence</option>
                    <option value="Mock Interview & Coding Prep">Mock Interview & Coding Prep</option>
                    <option value="Resume Critiques & LinkedIn Optimization">Resume Critiques & LinkedIn Optimization</option>
                    <option value="Higher Education & Grad School Advice">Higher Education & Grad School Advice</option>
                    <option value="General Professional Mentorship">General Professional Mentorship</option>
                  </select>
                </div>

                <p className="text-[10px] text-slate-400">
                  By submitting, a notification is sent instantly to this mentor for approval.
                </p>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setSelectedMentor(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
