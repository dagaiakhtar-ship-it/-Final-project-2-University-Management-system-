import React, { useState } from 'react';
import { 
  Building2, Plus, Globe, Mail, Phone, MapPin, 
  Search, ShieldAlert, CheckCircle, ExternalLink, X, Trash2, Edit3, UserCheck, AlertCircle 
} from 'lucide-react';

interface Company {
  id: number;
  companyName: string;
  companyLogo?: string | null;
  industry?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  companySize?: string | null;
  description?: string | null;
  verified: boolean;
  recruiters?: any[];
  _count?: {
    jobPostings: number;
  };
}

interface PlacementCompaniesProps {
  companies: Company[];
  recruiters: any[];
  userRole: string;
  onCreateCompany: (companyData: any) => Promise<void>;
  onUpdateCompany: (id: number, companyData: any) => Promise<void>;
  onDeleteCompany: (id: number) => Promise<void>;
  onVerifyRecruiter: (id: number, verified: boolean) => Promise<void>;
  onCreateRecruiter: (recruiterData: any) => Promise<void>;
}

export const PlacementCompanies: React.FC<PlacementCompaniesProps> = ({
  companies,
  recruiters,
  userRole,
  onCreateCompany,
  onUpdateCompany,
  onDeleteCompany,
  onVerifyRecruiter,
  onCreateRecruiter,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddRecruiterOpen, setIsAddRecruiterOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [size, setSize] = useState('Medium');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Recruiter form states
  const [recName, setRecName] = useState('');
  const [recEmail, setRecEmail] = useState('');
  const [recPhone, setRecPhone] = useState('');
  const [recDesignation, setRecDesignation] = useState('');

  const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'PLACEMENT_OFFICER'].includes(userRole);

  const filteredCompanies = companies.filter((c) => {
    const s = search.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(s) ||
      (c.industry && c.industry.toLowerCase().includes(s)) ||
      (c.city && c.city.toLowerCase().includes(s))
    );
  });

  const handleOpenEdit = (company: Company) => {
    setSelectedCompany(company);
    setName(company.companyName);
    setLogo(company.companyLogo || '');
    setIndustry(company.industry || '');
    setWebsite(company.website || '');
    setEmail(company.email || '');
    setPhone(company.phone || '');
    setAddress(company.address || '');
    setCity(company.city || '');
    setCountry(company.country || '');
    setSize(company.companySize || 'Medium');
    setDesc(company.description || '');
    setIsEditOpen(true);
  };

  const handleOpenCreate = () => {
    setName('');
    setLogo('');
    setIndustry('');
    setWebsite('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCity('');
    setCountry('');
    setSize('Medium');
    setDesc('');
    setIsCreateOpen(true);
  };

  const handleOpenAddRecruiter = (company: Company) => {
    setSelectedCompany(company);
    setRecName('');
    setRecEmail('');
    setRecPhone('');
    setRecDesignation('');
    setIsAddRecruiterOpen(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await onCreateCompany({
        companyName: name,
        companyLogo: logo || undefined,
        industry: industry || undefined,
        website: website || undefined,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
        city: city || undefined,
        country: country || undefined,
        companySize: size,
        description: desc || undefined,
      });
      setIsCreateOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to register company.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    try {
      setSubmitting(true);
      await onUpdateCompany(selectedCompany.id, {
        companyName: name,
        companyLogo: logo || undefined,
        industry: industry || undefined,
        website: website || undefined,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
        city: city || undefined,
        country: country || undefined,
        companySize: size,
        description: desc || undefined,
      });
      setIsEditOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update company.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRecruiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    try {
      setSubmitting(true);
      await onCreateRecruiter({
        companyId: selectedCompany.id,
        fullName: recName,
        email: recEmail,
        phone: recPhone || undefined,
        designation: recDesignation || undefined,
      });
      setIsAddRecruiterOpen(false);
      // Refresh current selected company to reflect recruiter
      alert('Recruiter profile created successfully. Awaiting Placement Officer verification.');
    } catch (err: any) {
      alert(err.message || 'Failed to create recruiter.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you absolutely sure you want to delete this company? All associated postings and applications will be deleted.')) {
      try {
        await onDeleteCompany(id);
        if (selectedCompany?.id === id) setSelectedCompany(null);
      } catch (err: any) {
        alert(err.message || 'Failed to delete company.');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="placement-companies-tab">
      {/* Search & Companies List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies by name, industry, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              id="company-search-input"
            />
          </div>
          {isPrivileged && (
            <button
              id="register-company-btn"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Plus className="h-5 w-5" />
              Add Company
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredCompanies.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedCompany(c)}
              className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                selectedCompany?.id === c.id
                  ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                  : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                      {c.companyLogo ? (
                        <img src={c.companyLogo} alt={c.companyName} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <Building2 className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h6 className="font-semibold text-gray-900 leading-tight flex items-center gap-1.5">
                        {c.companyName}
                        {c.verified && <CheckCircle className="h-4 w-4 text-emerald-500 fill-emerald-50" />}
                      </h6>
                      <p className="text-xs text-gray-500 mt-1">{c.industry || 'General Industry'}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mt-4 line-clamp-2">{c.description || 'No description provided.'}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {c.city || 'Anywhere'}, {c.country || 'Global'}
                </span>
                <span className="font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  {c._count?.jobPostings || 0} active jobs
                </span>
              </div>
            </div>
          ))}

          {filteredCompanies.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-gray-100">
              <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No partner companies found matching your query.</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Company Profile Details Panel */}
      <div className="lg:col-span-1">
        {selectedCompany ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 sticky top-6" id="company-detail-panel">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                  {selectedCompany.companyLogo ? (
                    <img src={selectedCompany.companyLogo} alt={selectedCompany.companyName} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <Building2 className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h5 className="font-bold text-gray-900 flex items-center gap-1.5 text-lg leading-tight">
                    {selectedCompany.companyName}
                    {selectedCompany.verified && <CheckCircle className="h-5 w-5 text-emerald-500 fill-emerald-50" />}
                  </h5>
                  <p className="text-sm text-gray-500 mt-1">{selectedCompany.industry || 'Industry not defined'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {isPrivileged && (
                  <>
                    <button
                      onClick={() => handleOpenEdit(selectedCompany)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Company Details"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedCompany.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition"
                      title="Delete Corporate Profile"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">{selectedCompany.description || 'No description available.'}</p>

            {/* Quick stats and contact */}
            <div className="space-y-3.5 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100/50">
              {selectedCompany.website && (
                <a
                  href={selectedCompany.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-blue-600 hover:underline"
                >
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="truncate flex-1">{selectedCompany.website}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {selectedCompany.email && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{selectedCompany.email}</span>
                </div>
              )}
              {selectedCompany.phone && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{selectedCompany.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="truncate">
                  {selectedCompany.address ? `${selectedCompany.address}, ` : ''}
                  {selectedCompany.city || 'Anywhere'}, {selectedCompany.country || 'Global'}
                </span>
              </div>
            </div>

            {/* Associated Recruiters Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <h6 className="font-semibold text-gray-900 text-sm">Designated HR Recruiters</h6>
                {isPrivileged && (
                  <button
                    onClick={() => handleOpenAddRecruiter(selectedCompany)}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Recruiter
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {recruiters
                  .filter((r) => r.companyId === selectedCompany.id)
                  .map((r) => (
                    <div key={r.id} className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-gray-800">{r.fullName}</p>
                        <p className="text-gray-400 mt-0.5">{r.designation || 'Corporate Recruiter'}</p>
                        <p className="text-gray-400">{r.email}</p>
                      </div>
                      <div>
                        {r.verified ? (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full font-semibold">
                            Verified
                          </span>
                        ) : isPrivileged ? (
                          <button
                            onClick={() => onVerifyRecruiter(r.id, true)}
                            className="bg-amber-50 text-amber-600 hover:bg-emerald-50 hover:text-emerald-600 border border-amber-100 hover:border-emerald-100 px-2.5 py-1 rounded-full font-semibold transition flex items-center gap-1"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            Verify Recruiter
                          </button>
                        ) : (
                          <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-full font-semibold">
                            Awaiting Verify
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                {recruiters.filter((r) => r.companyId === selectedCompany.id).length === 0 && (
                  <p className="text-gray-400 text-xs italic text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No verified recruiters registered for this firm.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
            <Building2 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Select a company profile to view active recruiters, maps location, and contact coordinates.</p>
          </div>
        )}
      </div>

      {/* CREATE COMPANY MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h5 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Add Corporate Partner
              </h5>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="Tech Solutions Ltd."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Industry Type</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="IT / Software Development"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Company Size</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  >
                    <option value="Small">Small (1-50 employees)</option>
                    <option value="Medium">Medium (51-200 employees)</option>
                    <option value="Large">Large (201-1000 employees)</option>
                    <option value="Enterprise">Enterprise (1000+ employees)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Logo Image URL</label>
                  <input
                    type="url"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Corporate Website URL</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Corporate Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="hr@techsolutions.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Corporate Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="+1 555-019-2834"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="123 Corporate Park, Floor 4"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="United States"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">About / Description</label>
                  <textarea
                    rows={3}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="Brief outline of company focus, team, and projects..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl text-sm transition shadow-sm ml-auto"
                >
                  {submitting ? 'Registering...' : 'Register Corporate Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COMPANY MODAL */}
      {isEditOpen && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h5 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-blue-600" />
                Edit Corporate Profile
              </h5>
              <button onClick={() => setIsEditOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Industry Type</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Company Size</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  >
                    <option value="Small">Small (1-50 employees)</option>
                    <option value="Medium">Medium (51-200 employees)</option>
                    <option value="Large">Large (201-1000 employees)</option>
                    <option value="Enterprise">Enterprise (1000+ employees)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Logo Image URL</label>
                  <input
                    type="url"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Corporate Website URL</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Corporate Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Corporate Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">About / Description</label>
                  <textarea
                    rows={3}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl text-sm transition shadow-sm ml-auto"
                >
                  {submitting ? 'Updating...' : 'Save Corporate Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD RECRUITER MODAL */}
      {isAddRecruiterOpen && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h5 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                Assign Recruiter for {selectedCompany.companyName}
              </h5>
              <button onClick={() => setIsAddRecruiterOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitRecruiter} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Recruiter Full Name *</label>
                <input
                  type="text"
                  required
                  value={recName}
                  onChange={(e) => setRecName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Recruiter Email *</label>
                <input
                  type="email"
                  required
                  value={recEmail}
                  onChange={(e) => setRecEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  placeholder="jane.doe@techsolutions.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Designation / Title</label>
                <input
                  type="text"
                  value={recDesignation}
                  onChange={(e) => setRecDesignation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  placeholder="Lead HR Recruiter"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={recPhone}
                  onChange={(e) => setRecPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  placeholder="+1 (555) 912-8342"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl text-sm transition shadow-sm ml-auto"
                >
                  {submitting ? 'Registering...' : 'Add Recruiter Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
