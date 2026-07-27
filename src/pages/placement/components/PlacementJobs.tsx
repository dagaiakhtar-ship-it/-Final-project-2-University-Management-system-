import React, { useState } from 'react';
import { 
  Briefcase, Calendar, MapPin, DollarSign, Award, Users, Search, Filter, 
  CheckCircle, AlertTriangle, Plus, X, ArrowRight, Eye, ShieldCheck, FileText, Bookmark 
} from 'lucide-react';
import { apiClient } from '../../../api/api-client';

interface JobPosting {
  id: number;
  companyId: number;
  recruiterId?: number | null;
  title: string;
  description: string;
  jobType: string;
  location: string;
  salaryRange?: string | null;
  requiredCGPA: number;
  requiredSkills?: string | null;
  eligibleDepartments?: string | null;
  eligiblePrograms?: string | null;
  applicationDeadline: string;
  interviewDate?: string | null;
  openings: number;
  status: string;
  company: {
    companyName: string;
    companyLogo?: string | null;
  };
  _count?: {
    applications: number;
  };
}

interface PlacementJobsProps {
  jobs: JobPosting[];
  userRole: string;
  departments: any[];
  programs: any[];
  companies: any[];
  currentStudentId?: number;
  onPostJob: (jobData: any) => Promise<void>;
  onApplyJob: (jobPostingId: number, applicationData: { resumeUrl: string; coverLetter?: string }) => Promise<void>;
  appliedJobIds: number[];
}

export const PlacementJobs: React.FC<PlacementJobsProps> = ({
  jobs,
  userRole,
  departments,
  programs,
  companies,
  currentStudentId,
  onPostJob,
  onApplyJob,
  appliedJobIds,
}) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  // Eligibility checking states
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<{
    eligible: boolean;
    reason: string;
    details?: any;
  } | null>(null);

  // Apply modal states
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New posting form states
  const [pTitle, setPTitle] = useState('');
  const [pCompanyId, setPCompanyId] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pType, setPType] = useState('Full-Time');
  const [pLoc, setPLoc] = useState('');
  const [pSalary, setPSalary] = useState('');
  const [pGpa, setPGpa] = useState('0.0');
  const [pSkills, setPSkills] = useState('');
  const [pDepts, setPDepts] = useState<string[]>([]);
  const [pProgs, setPProgs] = useState<string[]>([]);
  const [pDeadline, setPDeadline] = useState('');
  const [pInterview, setPInterview] = useState('');
  const [pOpenings, setPOpenings] = useState('1');
  const [pStatus, setPStatus] = useState('Published');

  const canPost = ['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER', 'RECRUITER'].includes(userRole);

  const filteredJobs = jobs.filter((j) => {
    const s = search.toLowerCase();
    const matchesSearch =
      j.title.toLowerCase().includes(s) ||
      j.company.companyName.toLowerCase().includes(s) ||
      (j.requiredSkills && j.requiredSkills.toLowerCase().includes(s)) ||
      j.location.toLowerCase().includes(s);

    const matchesType = selectedType === 'All' || j.jobType === selectedType;
    const isVisible = canPost || j.status === 'Published';

    return matchesSearch && matchesType && isVisible;
  });

  const handleSelectJob = async (job: JobPosting) => {
    setSelectedJob(job);
    setEligibilityResult(null);

    // If student is logged in, automatically run eligibility pre-check
    if (userRole === 'STUDENT' && currentStudentId) {
      try {
        setCheckingEligibility(true);
        const res = await apiClient.get('/jobs/eligibility', {
          params: { jobPostingId: job.id },
        });
        setEligibilityResult(res.data);
      } catch (err: any) {
        console.error('Failed to run eligibility audit:', err);
      } finally {
        setCheckingEligibility(false);
      }
    }
  };

  const handleOpenApply = () => {
    setResumeUrl('');
    setCoverLetter('');
    setIsApplyOpen(true);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      setSubmitting(true);
      await onApplyJob(selectedJob.id, { resumeUrl, coverLetter });
      setIsApplyOpen(false);
      alert('Your job application has been submitted successfully.');
      handleSelectJob(selectedJob); // Refresh details view
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to apply.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (!pCompanyId && userRole !== 'RECRUITER') {
        alert('Please select a company.');
        return;
      }

      await onPostJob({
        companyId: pCompanyId ? Number(pCompanyId) : undefined, // Handled automatically in controller for recruiter
        title: pTitle,
        description: pDesc,
        jobType: pType,
        location: pLoc,
        salaryRange: pSalary || undefined,
        requiredCGPA: parseFloat(pGpa),
        requiredSkills: pSkills || undefined,
        eligibleDepartments: pDepts.join(', ') || undefined,
        eligiblePrograms: pProgs.join(', ') || undefined,
        applicationDeadline: pDeadline,
        interviewDate: pInterview || undefined,
        openings: parseInt(pOpenings),
        status: pStatus,
      });

      setIsPostOpen(false);
      alert('Job Posting published successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to publish job.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDept = (deptName: string) => {
    if (pDepts.includes(deptName)) {
      setPDepts(pDepts.filter((d) => d !== deptName));
    } else {
      setPDepts([...pDepts, deptName]);
    }
  };

  const toggleProg = (progName: string) => {
    if (pProgs.includes(progName)) {
      setPProgs(pProgs.filter((p) => p !== progName));
    } else {
      setPProgs([...pProgs, progName]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="placement-jobs-tab">
      {/* Search & Listings Panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs by title, skills, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              id="job-search-input"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none text-sm"
              id="job-type-filter"
            >
              <option value="All">All Types</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>

            {canPost && (
              <button
                id="post-job-btn"
                onClick={() => {
                  setPTitle('');
                  setPDesc('');
                  setPLoc('');
                  setPSalary('');
                  setPGpa('0.0');
                  setPSkills('');
                  setPDepts([]);
                  setPProgs([]);
                  setPDeadline('');
                  setPInterview('');
                  setPOpenings('1');
                  setIsPostOpen(true);
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition flex items-center gap-2 shadow-xs"
              >
                <Plus className="h-5 w-5" />
                Post Job
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {filteredJobs.map((j) => {
            const hasApplied = appliedJobIds.includes(j.id);
            return (
              <div
                key={j.id}
                onClick={() => handleSelectJob(j)}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  selectedJob?.id === j.id
                    ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                    {j.company.companyLogo ? (
                      <img src={j.company.companyLogo} alt={j.company.companyName} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Briefcase className="h-7 w-7 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h6 className="font-bold text-gray-950 leading-tight">{j.title}</h6>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-2">
                      <span className="font-semibold text-gray-700">{j.company.companyName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {j.location}
                      </span>
                      <span>•</span>
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                        {j.jobType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-14 md:ml-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-gray-900">{j.salaryRange || 'Unspecified package'}</p>
                    <p className="text-xs text-gray-400 mt-1">Deadline: {new Date(j.applicationDeadline).toLocaleDateString()}</p>
                  </div>
                  {hasApplied ? (
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" />
                      Applied
                    </span>
                  ) : (
                    <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500" />
                  )}
                </div>
              </div>
            );
          })}

          {filteredJobs.length === 0 && (
            <div className="py-12 text-center bg-white rounded-2xl border border-gray-100">
              <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No career postings available.</p>
            </div>
          )}
        </div>
      </div>

      {/* Details & Eligibility Inspector Panel */}
      <div className="lg:col-span-1">
        {selectedJob ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 sticky top-6" id="job-detail-panel">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                {selectedJob.company.companyLogo ? (
                  <img src={selectedJob.company.companyLogo} alt={selectedJob.company.companyName} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <Briefcase className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div>
                <h5 className="font-bold text-gray-950 text-lg leading-tight">{selectedJob.title}</h5>
                <p className="text-sm font-semibold text-blue-600 mt-1">{selectedJob.company.companyName}</p>
              </div>
            </div>

            {/* Quick specifications */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-xs border border-gray-100/50">
              <div>
                <p className="text-gray-400 font-medium">Job Location</p>
                <p className="text-gray-900 font-bold mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-gray-500" />
                  {selectedJob.location}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">CTC Offered</p>
                <p className="text-gray-900 font-bold mt-1 flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-gray-500" />
                  {selectedJob.salaryRange || 'Not disclosed'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Vacancies</p>
                <p className="text-gray-900 font-bold mt-1 flex items-center gap-1">
                  <Users className="h-3 w-3 text-gray-500" />
                  {selectedJob.openings} open slots
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Required CGPA</p>
                <p className="text-gray-900 font-bold mt-1 flex items-center gap-1">
                  <Award className="h-3 w-3 text-gray-500" />
                  {selectedJob.requiredCGPA.toFixed(2)} Min.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h6 className="font-bold text-gray-900 text-sm">Role Description</h6>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{selectedJob.description}</p>
            </div>

            {/* Skills & Majors eligibility lists */}
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <h6 className="font-bold text-gray-900 text-sm">Qualifications & Filters</h6>
              {selectedJob.requiredSkills && (
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.requiredSkills.split(',').map((skill, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-800 text-[11px] px-2.5 py-1 rounded-md font-semibold">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.eligibleDepartments && (
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Target Majors / Departments</p>
                  <p className="text-xs text-gray-700 leading-normal">{selectedJob.eligibleDepartments}</p>
                </div>
              )}
            </div>

            {/* AUTOMATED ELIGIBILITY AUDIT ENGINE */}
            {userRole === 'STUDENT' && (
              <div className="border-t border-gray-100 pt-4 space-y-4" id="eligibility-audit-container">
                <h6 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  Academic Eligibility Audit
                </h6>

                {checkingEligibility ? (
                  <div className="animate-pulse bg-gray-100 p-4 rounded-xl h-20" />
                ) : eligibilityResult ? (
                  <div
                    className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2.5 ${
                      eligibilityResult.eligible
                        ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
                        : 'bg-rose-50/50 border-rose-100 text-rose-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {eligibilityResult.eligible ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-sm">
                          {eligibilityResult.eligible ? 'Approved for Applications' : 'Ineligible to Apply'}
                        </p>
                        <p className="mt-1">{eligibilityResult.reason}</p>
                      </div>
                    </div>

                    {eligibilityResult.details && (
                      <div className="bg-white/80 p-3 rounded-lg border border-gray-100 text-[11px] space-y-1 font-semibold text-gray-600">
                        <div className="flex justify-between">
                          <span>Your CGPA:</span>
                          <span className={eligibilityResult.details.studentCGPA >= selectedJob.requiredCGPA ? 'text-emerald-600' : 'text-rose-600'}>
                            {eligibilityResult.details.studentCGPA?.toFixed(2) || '3.20'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Department:</span>
                          <span className="text-gray-900">{eligibilityResult.details.studentDepartment || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Graduation Eligibility:</span>
                          <span className="text-blue-600">{eligibilityResult.details.graduationStatus || 'Eligible'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Loading audit data...</p>
                )}
              </div>
            )}

            {/* ACTION FOOTER */}
            <div className="pt-4 border-t border-gray-100">
              {appliedJobIds.includes(selectedJob.id) ? (
                <div className="w-full text-center py-2.5 bg-emerald-100 text-emerald-800 font-bold rounded-xl text-sm border border-emerald-200">
                  Application Logged
                </div>
              ) : userRole === 'STUDENT' ? (
                <button
                  id="apply-job-action-btn"
                  disabled={!eligibilityResult?.eligible}
                  onClick={handleOpenApply}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Apply for Position
                </button>
              ) : (
                <div className="text-xs text-center text-gray-400 italic">
                  Only logged-in students meeting criteria can apply for listings.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
            <Briefcase className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Select a job listing to audit your GPA eligibility, check department filters, and apply online.</p>
          </div>
        )}
      </div>

      {/* STUDENT JOB APPLICATION SLIDE OVER / MODAL */}
      {isApplyOpen && selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h5 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Submit Application: {selectedJob.title}
              </h5>
              <button onClick={() => setIsApplyOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Resume / Portfolio URL *</label>
                <input
                  type="url"
                  required
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  placeholder="https://drive.google.com/your-resume-pdf"
                  id="resume-url-input"
                />
                <p className="text-[10px] text-gray-400 mt-1">Provide a public link to your cloud-stored resume document.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cover Letter</label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  placeholder="Introduce yourself to the recruiter and explain why you're a great fit for this career posting..."
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl text-sm transition shadow-sm ml-auto"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECRUITER / OFFICER POST JOB MODAL */}
      {isPostOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h5 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                Publish Career Opening
              </h5>
              <button onClick={() => setIsPostOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handlePostSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                {userRole !== 'RECRUITER' && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Corporate Company *</label>
                    <select
                      required
                      value={pCompanyId}
                      onChange={(e) => setPCompanyId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-sm"
                    >
                      <option value="">Select Corporate Partner</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Job / Internship Title *</label>
                  <input
                    type="text"
                    required
                    value={pTitle}
                    onChange={(e) => setPTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="Associate Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Employment Type *</label>
                  <select
                    value={pType}
                    onChange={(e) => setPType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-sm"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Job Location *</label>
                  <input
                    type="text"
                    required
                    value={pLoc}
                    onChange={(e) => setPLoc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="San Francisco, CA or Remote"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Annual Salary Range</label>
                  <input
                    type="text"
                    value={pSalary}
                    onChange={(e) => setPSalary(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="$80,000 - $110,000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Required CGPA Threshold *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.0"
                    max="4.0"
                    required
                    value={pGpa}
                    onChange={(e) => setPGpa(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Total Openings</label>
                  <input
                    type="number"
                    min="1"
                    value={pOpenings}
                    onChange={(e) => setPOpenings(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={pStatus}
                    onChange={(e) => setPStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-sm"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Application Deadline *</label>
                  <input
                    type="date"
                    required
                    value={pDeadline}
                    onChange={(e) => setPDeadline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Interview Date (Optional)</label>
                  <input
                    type="date"
                    value={pInterview}
                    onChange={(e) => setPInterview(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Required Skills (Comma-separated)</label>
                  <input
                    type="text"
                    value={pSkills}
                    onChange={(e) => setPSkills(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="React, Node.js, TypeScript, PostgreSQL"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Eligible Departments</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {departments.map((d) => (
                      <label key={d.id} className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={pDepts.includes(d.name)}
                          onChange={() => toggleDept(d.name)}
                          className="rounded-sm text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        {d.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Eligible Academic Programs</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {programs.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={pProgs.includes(p.name)}
                          onChange={() => toggleProg(p.name)}
                          className="rounded-sm text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={pDesc}
                    onChange={(e) => setPDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="Provide responsibilities, requirements, and key information..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl text-sm transition shadow-sm ml-auto"
                >
                  {submitting ? 'Publishing...' : 'Publish Job Posting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
