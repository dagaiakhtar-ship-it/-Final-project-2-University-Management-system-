import React, { useState } from 'react';
import { 
  DollarSign, Heart, Award, Gift, Clock, 
  MessageSquare, UserCheck, ShieldAlert 
} from 'lucide-react';

interface Donation {
  id: number;
  alumniId?: number;
  campaignTitle: string;
  amount: number;
  currency: string;
  remarks?: string;
  isAnonymous: boolean;
  createdAt: string;
  alumni?: {
    student: {
      firstName: string;
      lastName: string;
    };
  };
}

interface AlumniDonationsProps {
  donations: Donation[];
  currentUserRole?: string;
  onSubmitDonation: (donationData: any) => Promise<void>;
}

export const AlumniDonations: React.FC<AlumniDonationsProps> = ({
  donations,
  currentUserRole,
  onSubmitDonation,
}) => {
  const [campaignTitle, setCampaignTitle] = useState('Scholarship Endowment Fund');
  const [amount, setAmount] = useState('100');
  const [remarks, setRemarks] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    try {
      setIsSubmitting(true);
      await onSubmitDonation({
        campaignTitle,
        amount: Number(amount),
        currency: 'USD',
        remarks,
        isAnonymous,
      });
      setRemarks('');
      setAmount('100');
      setIsAnonymous(false);
      setSuccessMessage('Thank you for your generous contribution!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" id="alumni-donations-container">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl md:col-span-2 flex flex-col justify-between border border-slate-700 shadow-md">
          <div>
            <span className="bg-slate-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider mb-2 inline-block">University Advancement</span>
            <h3 className="text-xl font-bold mb-2">Support the Next Generation</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
              Contributions to our campus development programs directly fund student scholarships, modernized engineering laboratories, research initiatives, and community service grants.
            </p>
          </div>
          <div className="mt-6 flex items-baseline space-x-2">
            <span className="text-sm font-semibold text-slate-300">Total Campaign Fund Raised:</span>
            <span className="text-2xl font-black text-white">${totalRaised.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Active Campaigns</h4>
            <ul className="space-y-2 text-xs text-slate-600 mt-2">
              <li className="flex justify-between items-center font-semibold">
                <span>🎓 Scholarship Endowment</span>
                <span className="text-slate-900">Active</span>
              </li>
              <li className="flex justify-between items-center font-semibold">
                <span>🔬 STEM Lab Modernization</span>
                <span className="text-slate-900">Active</span>
              </li>
              <li className="flex justify-between items-center font-semibold">
                <span>📚 Library Digital Renewal</span>
                <span className="text-slate-900">Active</span>
              </li>
            </ul>
          </div>
          <div className="border-t border-slate-100 pt-4 mt-4 flex items-center gap-1.5 text-[10px] text-slate-400">
            <Heart className="h-4 w-4 text-rose-500" /> Secure 256-bit payment integration simulation
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Donation Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
          <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-1.5">
            <Gift className="h-5 w-5 text-slate-700" /> Submit New Contribution
          </h4>

          {successMessage && (
            <div className="mb-4 bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 text-xs font-semibold">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Campaign Target</label>
              <select
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-500"
                required
              >
                <option value="Scholarship Endowment Fund">🎓 Scholarship Endowment Fund</option>
                <option value="STEM Lab Modernization">🔬 STEM Lab Modernization</option>
                <option value="Library Digital Renewal">📚 Library Digital Renewal</option>
                <option value="Annual Campus Sports Facility">⚽ Annual Campus Sports Facility</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Contribution Amount (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  min="5"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Personal Note / Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                rows={3}
                placeholder="Write your brief dedication note..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded text-slate-900 focus:ring-slate-500"
              />
              <label htmlFor="anonymous" className="text-xs text-slate-600">
                Keep contribution anonymous on public ledger
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Processing Payment...' : 'Contribute Securely'}
            </button>
          </form>
        </div>

        {/* Right Column: Donation Ledger */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-1.5">
            <Clock className="h-5 w-5 text-slate-500" /> Recent Contributions Ledger
          </h4>

          {donations.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-6 text-center">No donations have been submitted yet. Be the first to support!</p>
          ) : (
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
              {donations.map((donation) => {
                const donorName = donation.isAnonymous 
                  ? 'Anonymous Supporter' 
                  : (donation.alumni?.student 
                      ? `${donation.alumni.student.firstName} ${donation.alumni.student.lastName}` 
                      : 'University Alumnus');

                return (
                  <div key={donation.id} className="p-3.5 border border-slate-100 bg-slate-50 rounded-lg flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{donorName}</span>
                        {donation.isAnonymous ? (
                          <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold">Anon</span>
                        ) : (
                          <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-indigo-100 flex items-center gap-0.5">
                            <UserCheck className="h-2.5 w-2.5" /> Alumni
                          </span>
                        )}
                      </div>
                      
                      <p className="text-[11px] text-slate-600">
                        Targeted Campaign: <span className="font-semibold text-slate-800">{donation.campaignTitle}</span>
                      </p>
                      
                      {donation.remarks && (
                        <p className="text-xs text-slate-500 italic bg-white p-2 rounded border border-slate-100 flex items-start gap-1">
                          <MessageSquare className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                          "{donation.remarks}"
                        </p>
                      )}

                      <p className="text-[9px] text-slate-400">
                        Submitted: {new Date(donation.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md text-xs font-black border border-emerald-100">
                        +${donation.amount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
