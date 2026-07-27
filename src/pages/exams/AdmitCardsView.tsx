import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { toast } from 'react-hot-toast';
import { Printer, RefreshCw, FileCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { Exam, AdmitCard } from './types';

interface AdmitCardsViewProps {
  exam: Exam;
}

export const AdmitCardsView: React.FC<AdmitCardsViewProps> = ({ exam }) => {
  const [admitCards, setAdmitCards] = useState<AdmitCard[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAdmitCards = async () => {
    try {
      setLoading(true);
      const res = await apiClient.post(`/exams/${exam.id}/generate-admit-cards`);
      if (res.data?.admitCards) {
        setAdmitCards(res.data.admitCards);
      }
    } catch (err: any) {
      toast.error('Failed to generate admit cards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmitCards();
  }, [exam]);

  const handlePrint = () => {
    window.print();
  };

  const hasAdmitCards = admitCards && admitCards.length > 0;

  return (
    <div className="space-y-6" id="exam-admit-cards-viewport">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-800">Student Admit Cards</h3>
          <p className="text-xs text-slate-400 mt-1">Generate official verification passes with secure anti-forgery QR Codes.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button onClick={loadAdmitCards} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Re-sync Cards
          </Button>
          <Button onClick={handlePrint} variant="primary" size="sm" disabled={!hasAdmitCards || loading}>
            <Printer className="h-3.5 w-3.5 mr-1" /> Print All Cards
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white border border-slate-100 rounded-2xl">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
          <span className="text-slate-500 font-medium">Drafting official admit card profiles...</span>
        </div>
      ) : !hasAdmitCards ? (
        <Card className="p-8 text-center max-w-md mx-auto space-y-4">
          <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <h4 className="text-sm font-black text-slate-800">Generate Student Passes</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ensure that your class offerings contain registered enrollments and that your seat allocation plan has been generated before syncing admit cards.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="print-admit-cards-grid">
          {admitCards.map((card) => (
            <Card
              key={card.id}
              className="p-5 border-2 border-slate-200/80 bg-white rounded-2xl relative shadow-xs overflow-hidden print:shadow-none print:border-slate-800 print:rounded-none flex flex-col justify-between h-96"
            >
              {/* Card Header */}
              <div>
                <div className="flex justify-between items-start pb-3 border-b border-slate-200/60">
                  <div className="text-left">
                    <span className="text-[10px] font-black text-indigo-600 tracking-wider font-mono uppercase block">Admit Card Pass</span>
                    <span className="text-sm font-extrabold text-slate-800 block mt-0.5">Smart University ERP</span>
                    <span className="text-[8px] text-slate-400 font-mono mt-0.5 block">Session: {exam.session} {exam.academicYear}</span>
                  </div>
                  <div className="h-9 w-9 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs font-black select-none shrink-0">
                    SU
                  </div>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                  {/* Photo Placeholder */}
                  <div className="col-span-1 flex flex-col items-center justify-center border border-dashed border-slate-200 bg-slate-50 rounded-lg py-4">
                    <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 text-xs font-bold font-sans uppercase">
                      {card.studentName.charAt(0)}
                    </div>
                    <span className="text-[8px] text-slate-400 mt-2 font-mono font-bold uppercase">Candidate</span>
                  </div>

                  {/* Student Specs */}
                  <div className="col-span-2 text-left space-y-2">
                    <div>
                      <span className="block text-[8px] text-slate-400 font-bold uppercase">Student Name</span>
                      <span className="text-xs font-extrabold text-slate-800 truncate block">{card.studentName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[8px] text-slate-400 font-bold uppercase">Roll No</span>
                        <span className="text-[10px] font-mono font-black text-slate-700">{card.rollNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 font-bold uppercase">Reg No</span>
                        <span className="text-[10px] font-mono font-semibold text-slate-500 truncate block">{card.registrationNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exam Details */}
                <div className="pt-4 border-t border-slate-100 mt-4 grid grid-cols-2 gap-4 text-left">
                  <div>
                    <span className="block text-[8px] text-slate-400 font-bold uppercase">Subject (Code)</span>
                    <span className="text-[10px] font-extrabold text-slate-800 block truncate">{card.subject}</span>
                    <span className="text-[8px] text-slate-500 font-mono font-bold">{card.subjectCode}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-400 font-bold uppercase">Examination Hall</span>
                    <span className="text-[10px] font-extrabold text-slate-800 block truncate">{card.room}</span>
                    <span className="text-[9px] font-black text-emerald-600 block mt-0.5">Seat: {card.seatNumber}</span>
                  </div>
                </div>
              </div>

              {/* QR Code Validation Section */}
              <div className="pt-3 border-t border-slate-200/60 mt-auto flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[8px] text-slate-400 font-bold uppercase block">Exam Date & Time</span>
                  <span className="text-[10px] font-mono font-black text-slate-800 block mt-0.5">
                    {new Date(card.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                    {card.startTime} - {card.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={card.qrCodeUrl}
                    alt="Anti-Forgery Pass QR"
                    className="h-12 w-12 border border-slate-100 rounded-sm shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-right hidden sm:block">
                    <span className="text-[7px] text-slate-350 block uppercase font-mono font-bold">Verification</span>
                    <span className="text-[8px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                      <FileCheck className="h-2.5 w-2.5" /> SECURED
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
