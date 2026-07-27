import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../api/api-client';

// Icons
import { 
  Users, BarChart2, BookOpen, Calendar, 
  Heart, Plus, Edit3, ShieldAlert 
} from 'lucide-react';

// Sub components
import { AlumniOverview } from './AlumniOverview';
import { AlumniDirectory } from './AlumniDirectory';
import { AlumniMentorship } from './AlumniMentorship';
import { AlumniEvents } from './AlumniEvents';
import { AlumniDonations } from './AlumniDonations';

export const AlumniPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = user?.role?.toUpperCase() || 'STUDENT';

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'directory' | 'mentorship' | 'events' | 'donations'>('overview');

  // State
  const [profiles, setProfiles] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState<number | undefined>(undefined);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Modals
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any | null>(null);

  // Profile Form State
  const [gradYear, setGradYear] = useState(new Date().getFullYear().toString());
  const [degree, setDegree] = useState('Bachelor of Science');
  const [deptId, setDeptId] = useState('');
  const [progId, setProgId] = useState('');
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [empStatus, setEmpStatus] = useState('Employed');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [bio, setBio] = useState('');
  const [profileFormSubmitting, setProfileFormSubmitting] = useState(false);

  // Resolve my profile
  const myProfile = profiles.find(p => p.student?.userId === user?.id) || null;

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch departments and programs
      const [deptRes, progRes] = await Promise.all([
        apiClient.get('/departments').catch(() => ({ data: [] })),
        apiClient.get('/programs').catch(() => ({ data: [] })),
      ]);

      const depts = deptRes.data || [];
      const progs = progRes.data || [];
      setDepartments(depts);
      setPrograms(progs);

      if (depts.length > 0 && !deptId) {
        setDeptId(depts[0].id.toString());
      }
      if (progs.length > 0 && !progId) {
        setProgId(progs[0].id.toString());
      }

      // Fetch alumni profiles
      const profRes = await apiClient.get('/alumni').catch(() => ({ data: [] }));
      setProfiles(profRes.data || []);

      // If user is STUDENT, fetch current student record to resolve studentId
      if (userRole === 'STUDENT') {
        const studentRes = await apiClient.get('/students').catch(() => ({ data: [] }));
        const matched = studentRes.data?.find((s: any) => s.userId === user?.id);
        if (matched) {
          setCurrentStudentId(matched.id);
        }
      }

      // Fetch additional tabs data safely
      const [eventRes, mentorRes, donRes, analRes] = await Promise.all([
        apiClient.get('/alumni/events').catch(() => ({ data: [] })),
        apiClient.get('/alumni/mentorship').catch(() => ({ data: [] })),
        apiClient.get('/alumni/donations').catch(() => ({ data: [] })),
        apiClient.get('/alumni/analytics').catch(() => ({ data: null })),
      ]);

      setEvents(eventRes.data || []);
      setMentorships(mentorRes.data || []);
      setDonations(donRes.data || []);
      setAnalytics(analRes.data || null);

    } catch (err: any) {
      setError(err.message || 'Failed to load alumni portal data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Action: Verify/Approve Profile (Admin)
  const handleVerifyProfile = async (id: number, verified: boolean) => {
    try {
      await apiClient.post('/alumni/verify', { id, verified });
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Verification action failed.');
    }
  };

  // Action: Create Event (Admin)
  const handleCreateEvent = async (eventData: any) => {
    try {
      await apiClient.post('/alumni/events', eventData);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create event.');
    }
  };

  // Action: Register Event (Student/Alumni)
  const handleRegisterEvent = async (eventId: number) => {
    try {
      await apiClient.post(`/alumni/events/${eventId}/register`);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to register for this event.');
    }
  };

  // Action: Request Mentorship (Student)
  const handleRequestMentorship = async (mentorId: number, area: string) => {
    try {
      await apiClient.post('/alumni/mentorship', { mentorId, mentorshipArea: area });
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Mentorship request failed.');
    }
  };

  // Action: Update Mentorship Request (Mentor)
  const handleUpdateMentorshipStatus = async (id: number, status: string) => {
    try {
      await apiClient.put(`/alumni/mentorship/${id}/status`, { status });
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update mentorship status.');
    }
  };

  // Action: Submit Donation
  const handleSubmitDonation = async (donationData: any) => {
    try {
      await apiClient.post('/alumni/donations', donationData);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Payment or donation processing failed.');
    }
  };

  // Handle Register/Edit form opening
  const handleOpenRegisterForm = () => {
    setEditingProfile(null);
    setGradYear(new Date().getFullYear().toString());
    setDegree('Bachelor of Science');
    setCompany('');
    setDesignation('');
    setEmpStatus('Employed');
    setCity('');
    setCountry('');
    setLinkedin('');
    setGithub('');
    setPortfolio('');
    setBio('');
    setIsProfileFormOpen(true);
  };

  const handleOpenEditForm = (profile: any) => {
    setEditingProfile(profile);
    setGradYear(profile.graduationYear.toString());
    setDegree(profile.degree);
    setDeptId(profile.departmentId.toString());
    setProgId(profile.programId.toString());
    setCompany(profile.currentCompany || '');
    setDesignation(profile.currentDesignation || '');
    setEmpStatus(profile.employmentStatus);
    setCity(profile.city || '');
    setCountry(profile.country || '');
    setLinkedin(profile.linkedinUrl || '');
    setGithub(profile.githubUrl || '');
    setPortfolio(profile.portfolioUrl || '');
    setBio(profile.biography || '');
    setIsProfileFormOpen(true);
  };

  // Action: Submit Register/Update profile Form
  const handleProfileFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileFormSubmitting(true);
      const payload = {
        graduationYear: Number(gradYear),
        degree,
        departmentId: Number(deptId),
        programId: Number(progId),
        currentCompany: company || undefined,
        currentDesignation: designation || undefined,
        employmentStatus: empStatus,
        city: city || undefined,
        country: country || undefined,
        linkedinUrl: linkedin || undefined,
        githubUrl: github || undefined,
        portfolioUrl: portfolio || undefined,
        biography: bio || undefined,
      };

      if (editingProfile) {
        await apiClient.put(`/alumni/${editingProfile.id}`, payload);
      } else {
        await apiClient.post('/alumni', payload);
      }

      setIsProfileFormOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit profile form.');
    } finally {
      setProfileFormSubmitting(false);
    }
  };

  return (
    <PageContainer title="Degree Audit & Alumni Network">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">University Alumni Portal</h2>
          <p className="text-xs text-slate-500">Track alumni metrics, view the graduate directory, participate in events, and join mentorship matches.</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide mb-6 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart2 className="h-4 w-4" /> Overview & Analytics
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeTab === 'directory'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" /> Alumni Directory
        </button>

        <button
          onClick={() => setActiveTab('mentorship')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeTab === 'mentorship'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="h-4 w-4" /> Mentorship Network
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeTab === 'events'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="h-4 w-4" /> Events Calendar
        </button>

        <button
          onClick={() => setActiveTab('donations')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeTab === 'donations'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="h-4 w-4" /> Contributions Ledger
        </button>
      </div>

      {/* Main Content Render */}
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-100 text-xs font-semibold mb-6">
          {error}
        </div>
      )}

      <div className="min-h-[50vh]">
        {activeTab === 'overview' && (
          <AlumniOverview analytics={analytics} loading={loading} />
        )}

        {activeTab === 'directory' && (
          <AlumniDirectory
            profiles={profiles}
            currentUserRole={userRole}
            onVerify={handleVerifyProfile}
            onOpenRegisterForm={handleOpenRegisterForm}
            onOpenEditForm={handleOpenEditForm}
            myProfile={myProfile}
            departments={departments}
            programs={programs}
          />
        )}

        {activeTab === 'mentorship' && (
          <AlumniMentorship
            profiles={profiles}
            mentorships={mentorships}
            myProfile={myProfile}
            currentUserRole={userRole}
            currentStudentId={currentStudentId}
            onRequestMentorship={handleRequestMentorship}
            onUpdateStatus={handleUpdateMentorshipStatus}
          />
        )}

        {activeTab === 'events' && (
          <AlumniEvents
            events={events}
            currentUserRole={userRole}
            currentStudentId={currentStudentId}
            myProfileId={myProfile?.id}
            onCreateEvent={handleCreateEvent}
            onRegisterEvent={handleRegisterEvent}
          />
        )}

        {activeTab === 'donations' && (
          <AlumniDonations
            donations={donations}
            currentUserRole={userRole}
            onSubmitDonation={handleSubmitDonation}
          />
        )}
      </div>

      {/* Profile Registration / Edit Modal */}
      {isProfileFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">
                {editingProfile ? 'Update Alumni Profile' : 'Register Alumni Profile'}
              </h3>
              <button 
                onClick={() => setIsProfileFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProfileFormSubmit}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Academic Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Graduation Year</label>
                    <input
                      type="number"
                      value={gradYear}
                      onChange={(e) => setGradYear(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Degree Earned</label>
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                      placeholder="e.g. B.Tech Computer Science"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Department</label>
                    <select
                      value={deptId}
                      onChange={(e) => setDeptId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-500"
                      required
                    >
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Academic Program</label>
                    <select
                      value={progId}
                      onChange={(e) => setProgId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-500"
                      required
                    >
                      {programs.map(prog => (
                        <option key={prog.id} value={prog.id}>{prog.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Employment Fields */}
                <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                  <div className="col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1 font-bold">Professional Career Context</label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Employment Status</label>
                    <select
                      value={empStatus}
                      onChange={(e) => setEmpStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="Employed">Employed</option>
                      <option value="Unemployed">Unemployed</option>
                      <option value="Self-Employed">Self-Employed</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Current Company</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                      placeholder="e.g. Google LLC"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Designation</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                </div>

                {/* Location Fields */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Current City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                      placeholder="e.g. San Francisco"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Current Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                      placeholder="e.g. United States"
                    />
                  </div>
                </div>

                {/* Social Urls */}
                <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                      placeholder="https://linkedin.com/..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">GitHub URL</label>
                    <input
                      type="url"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Portfolio Website</label>
                    <input
                      type="url"
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                {/* Biography */}
                <div className="border-t border-slate-100 pt-4">
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Biography & Professional Summary</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                    rows={3}
                    placeholder="Briefly state your academic highlights and professional path..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setIsProfileFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileFormSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                >
                  {profileFormSubmitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
export default AlumniPage;
