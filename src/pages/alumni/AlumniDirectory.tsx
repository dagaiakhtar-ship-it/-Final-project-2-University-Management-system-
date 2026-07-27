import React, { useState } from 'react';
import { 
  Search, Filter, CheckCircle, XCircle, 
  MapPin, Globe, ExternalLink, Linkedin, Github, 
  UserPlus, Check, ShieldAlert, Award 
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
  departmentId: number;
  programId: number;
  currentCompany?: string;
  currentDesignation?: string;
  employmentStatus: string;
  city?: string;
  country?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  biography?: string;
  profilePhoto?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  visibility: string;
  createdAt: string;
  student: Student;
  department: {
    id: number;
    name: string;
  };
  program: {
    id: number;
    name: string;
  };
}

interface AlumniDirectoryProps {
  profiles: AlumniProfile[];
  currentUserRole?: string;
  onVerify: (id: number, verified: boolean) => Promise<void>;
  onOpenRegisterForm: () => void;
  onOpenEditForm: (profile: AlumniProfile) => void;
  myProfile: AlumniProfile | null;
  departments: Array<{ id: number; name: string }>;
  programs: Array<{ id: number; name: string }>;
}

export const AlumniDirectory: React.FC<AlumniDirectoryProps> = ({
  profiles,
  currentUserRole,
  onVerify,
  onOpenRegisterForm,
  onOpenEditForm,
  myProfile,
  departments,
  programs,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedProg, setSelectedProg] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const isAdmin = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';

  // Extract unique graduation years from profiles for filters
  const gradYears = Array.from(new Set(profiles.map(p => p.graduationYear))).sort((a, b) => b - a);

  // Filter profiles on the client side for maximum snappiness
  const filteredProfiles = profiles.filter(profile => {
    const fullName = `${profile.student?.user?.firstName || profile.student?.firstName || ''} ${profile.student?.user?.lastName || profile.student?.lastName || ''}`.toLowerCase();
    const searchMatch = !search || 
      fullName.includes(search.toLowerCase()) ||
      profile.currentCompany?.toLowerCase().includes(search.toLowerCase()) ||
      profile.currentDesignation?.toLowerCase().includes(search.toLowerCase()) ||
      profile.degree?.toLowerCase().includes(search.toLowerCase());

    const deptMatch = !selectedDept || profile.departmentId === Number(selectedDept);
    const progMatch = !selectedProg || profile.programId === Number(selectedProg);
    const yearMatch = !selectedYear || profile.graduationYear === Number(selectedYear);
    const statusMatch = !selectedStatus || 
      (selectedStatus === 'verified' && profile.verified) ||
      (selectedStatus === 'pending' && !profile.verified);

    return searchMatch && deptMatch && progMatch && yearMatch && statusMatch;
  });

  return (
    <div className="space-y-6" id="alumni-directory-container">
      {/* Top Controls & My Profile Widget */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Alumni Directory</h4>
          <p className="text-xs text-slate-500">Connect with other graduates and manage your professional presence.</p>
        </div>
        <div className="flex gap-2">
          {myProfile ? (
            <button
              onClick={() => onOpenEditForm(myProfile)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              Update My Profile
            </button>
          ) : (
            <button
              onClick={onOpenRegisterForm}
              className="px-4 py-2 bg-slate-950 text-white rounded-lg hover:bg-slate-900 text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              <UserPlus className="h-4 w-4" />
              Register as Alumni
            </button>
          )}
        </div>
      </div>

      {/* Filter Options */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, company, job..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedProg}
            onChange={(e) => setSelectedProg(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">All Programs</option>
            {programs.map(prog => (
              <option key={prog.id} value={prog.id}>{prog.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">All Grad Years</option>
            {gradYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">All Verifications</option>
            <option value="verified">Verified Only</option>
            <option value="pending">Pending Only</option>
          </select>
        </div>
      </div>

      {/* Directory Grid */}
      {filteredProfiles.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          No alumni profiles match your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => {
            const firstName = profile.student?.user?.firstName || profile.student?.firstName || 'Alumni';
            const lastName = profile.student?.user?.lastName || profile.student?.lastName || 'Graduate';
            const email = profile.student?.user?.email || profile.student?.email || '';

            return (
              <div 
                key={profile.id} 
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col justify-between"
                id={`alumni-card-${profile.id}`}
              >
                <div>
                  {/* Top line with Avatar and verification */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg border border-slate-200">
                        {firstName[0]}{lastName[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {firstName} {lastName}
                          {profile.verified && (
                            <span title="Verified Alumni">
                              <CheckCircle className="h-4 w-4 text-emerald-600 fill-emerald-50 inline" />
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500">{profile.degree} • Class of {profile.graduationYear}</p>
                      </div>
                    </div>
                  </div>

                  {/* Employment details */}
                  <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {profile.currentDesignation && profile.currentCompany ? (
                      <p className="text-xs font-semibold text-slate-800">
                        {profile.currentDesignation} at <span className="text-slate-900">{profile.currentCompany}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No professional position specified</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">
                      Status: {profile.employmentStatus}
                    </p>
                  </div>

                  {/* Academic Context */}
                  <div className="space-y-1 mb-4">
                    <p className="text-[11px] text-slate-600">
                      <span className="font-semibold">Dept:</span> {profile.department?.name || 'N/A'}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      <span className="font-semibold">Program:</span> {profile.program?.name || 'N/A'}
                    </p>
                    {profile.city && profile.country && (
                      <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {profile.city}, {profile.country}
                      </p>
                    )}
                  </div>

                  {/* Biography */}
                  {profile.biography && (
                    <p className="text-xs text-slate-500 line-clamp-3 mb-4 italic">
                      "{profile.biography}"
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4 mt-4">
                  {/* Social and links */}
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2.5">
                      {profile.linkedinUrl && (
                        <a 
                          href={profile.linkedinUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="LinkedIn Profile"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                      {profile.githubUrl && (
                        <a 
                          href={profile.githubUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="GitHub Profile"
                        >
                          <Github className="h-4 w-4" />
                        </a>
                      )}
                      {profile.portfolioUrl && (
                        <a 
                          href={profile.portfolioUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="Portfolio Website"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400">{email}</span>
                  </div>

                  {/* Admin Verification Panel */}
                  {isAdmin && (
                    <div className="mt-4 pt-3 border-t border-dashed border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                        <ShieldAlert className="h-3 w-3 text-slate-400" />
                        Admin Controls:
                      </span>
                      {profile.verified ? (
                        <button
                          onClick={() => onVerify(profile.id, false)}
                          className="text-[10px] text-red-600 hover:bg-red-50 px-2 py-1 rounded font-bold transition-colors"
                        >
                          Revoke Verification
                        </button>
                      ) : (
                        <button
                          onClick={() => onVerify(profile.id, true)}
                          className="text-[10px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-colors"
                        >
                          <Check className="h-3 w-3" /> Approve Verification
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
