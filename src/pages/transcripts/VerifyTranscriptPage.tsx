import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, Check, XCircle, RefreshCw, GraduationCap, 
  BookOpen, Clock, Building, Calendar, Award, FileText
} from 'lucide-react';
import axios from 'axios';

interface VerifiedStudent {
  firstName: string;
  lastName: string;
  registrationNumber: string;
  email: string;
  program?: { name: string };
  department?: { name: string };
}

interface VerifiedTranscript {
  transcriptNumber: string;
  student: VerifiedStudent;
  program: { name: string };
  department: { name: string };
  issueDate: string;
  totalCreditsEarned: number;
  cgpa: number;
  academicStanding: string;
  transcriptStatus: string;
  verificationToken: string;
  approvalDate?: string;
}

export const VerifyTranscriptPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [loading, setLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState<VerifiedTranscript | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleVerify = async (searchToken: string) => {
    if (!searchToken.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setVerifiedData(null);
    setSearched(true);
    try {
      // Direct call to public endpoint
      const res = await axios.get(`/api/transcripts/verify/${searchToken.trim()}`);
      setVerifiedData(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Verification failed. The token is invalid, expired, or has been revoked.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(token);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8" id="verify-transcript-public-container">
      <div className="max-w-xl mx-auto w-full space-y-8">
        
        {/* Upper Brand Info */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm border border-emerald-200">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Smart University</h2>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Official Credentials & Transcript Ledger</p>
        </div>

        {/* Search Input Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Transcript Verification Token
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShieldCheck className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="token"
                  id="token"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter the crypt-signature or verification token..."
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-50 shadow-sm"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Validate Credentials'}
            </button>
          </form>

          {/* Results section */}
          {loading && (
            <div className="p-8 text-center space-y-2">
              <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Decrypting ledger credentials...</p>
            </div>
          )}

          {!loading && errorMsg && (
            <div className="p-5 border border-rose-200 bg-rose-50/50 rounded-xl flex items-start gap-3.5">
              <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-extrabold text-rose-800">Verification Rejected</h4>
                <p className="text-rose-700 leading-relaxed">{errorMsg}</p>
                <p className="text-[10px] text-rose-500 pt-1">
                  Ensure the token exactly matches the one printed at the bottom of the transcript document.
                </p>
              </div>
            </div>
          )}

          {!loading && verifiedData && (
            <div className="border border-emerald-200 bg-emerald-50/10 rounded-2xl p-6 space-y-6 shadow-xs animate-fade-in" id="public-verified-card">
              {/* Card top banner */}
              <div className="flex items-center justify-between border-b border-emerald-100/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-emerald-150 text-emerald-650 rounded-full flex items-center justify-center">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-emerald-800 font-extrabold text-xs tracking-wider uppercase">AUTHENTICITY CONFIRMED</h3>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">Transcript Number: {verifiedData.transcriptNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Ledger Status</span>
                  <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold mt-1">
                    {verifiedData.transcriptStatus}
                  </span>
                </div>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Student Full Name</span>
                  <span className="text-slate-800 font-extrabold">{verifiedData.student?.firstName} {verifiedData.student?.lastName}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Registration Number</span>
                  <span className="text-slate-800 font-bold font-mono">{verifiedData.student?.registrationNumber}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Degree Program</span>
                  <span className="text-slate-800 font-medium">{verifiedData.program?.name}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Academic Status</span>
                  <span className="text-slate-800 font-semibold">{verifiedData.academicStanding}</span>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Verified CGPA</span>
                  <span className="text-emerald-600 font-black text-base font-mono">{verifiedData.cgpa?.toFixed(2)} / 4.00</span>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Credits Completed</span>
                  <span className="text-slate-800 font-extrabold font-mono">{verifiedData.totalCreditsEarned} Credit Hours</span>
                </div>
              </div>

              {/* Footer Stamp details */}
              <div className="border-t border-slate-150 pt-4 flex justify-between items-center text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Live verification certified
                </span>
                <span className="font-mono font-bold">
                  Seal Date: {verifiedData.approvalDate ? new Date(verifiedData.approvalDate).toLocaleDateString() : new Date(verifiedData.issueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {!searched && !tokenFromUrl && (
            <div className="p-8 border border-slate-100 bg-slate-50/30 rounded-xl text-center space-y-1.5">
              <FileText className="h-8 w-8 text-slate-300 mx-auto mb-1.5" />
              <p className="font-bold text-slate-600 text-xs">Verify Student Credentials Instantly</p>
              <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                Third-party employers, background checks providers, or other universities can securely verify the academic integrity of transcripts here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer text */}
      <div className="text-center text-[10px] text-slate-450 font-medium">
        &copy; {new Date().getFullYear()} Smart University ERP. Protected by Cryptographic Anti-Forgery Signatures. All rights reserved.
      </div>
    </div>
  );
};
