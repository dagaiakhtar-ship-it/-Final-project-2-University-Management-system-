import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { toast } from 'react-hot-toast';
import {
  FileText,
  Clock,
  Calendar,
  MapPin,
  Users,
  Grid,
  ShieldCheck,
  Award,
  ArrowLeft,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Exam } from './types';
import { SeatPlanGenerator } from './SeatPlanGenerator';
import { AdmitCardsView } from './AdmitCardsView';
import { InvigilatorAssigner } from './InvigilatorAssigner';

interface ExamDetailsModalProps {
  examId: number;
  onBack: () => void;
}

export const ExamDetailsModal: React.FC<ExamDetailsModalProps> = ({ examId, onBack }) => {
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'seat_plan' | 'invigilators' | 'admit_cards'>('overview');

  const loadExamDetails = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/exams/${examId}`);
      setExam(res.data);
    } catch (err: any) {
      toast.error('Failed to load exam specs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamDetails();
  }, [examId]);

  if (loading || !exam) {
    return (
      <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 max-w-4xl mx-auto" id="loading-details">
        <RotateCcw className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
        <span className="text-slate-500 font-semibold text-xs uppercase">Fetching exam blueprints...</span>
      </div>
    );
  }

  const isCancelled = exam.status === 'Cancelled';
  const isDraft = exam.status === 'Draft';

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left" id="exam-detailed-dashboard">
      {/* 1. Header Hero Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-150">
        <div>
          <button
            onClick={onBack}
            className="flex items-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-all mb-2 cursor-pointer focus:outline-none"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Exam Dashboard
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">{exam.title}</h2>
            <span className="text-[10px] font-black font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-sm uppercase">
              {exam.examType}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">CODE ID: {exam.examCode}</p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2">
          {isCancelled ? (
            <span className="text-xs font-black bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1 rounded-full uppercase tracking-wider">
              Cancelled
            </span>
          ) : isDraft ? (
            <span className="text-xs font-black bg-slate-100 border border-slate-200 text-slate-500 px-3 py-1 rounded-full uppercase tracking-wider">
              Draft Mode
            </span>
          ) : (
            <span className="text-xs font-black bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-wider">
              {exam.status}
            </span>
          )}
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        {[
          { key: 'overview', label: 'Overview Specs', icon: FileText },
          { key: 'seat_plan', label: 'Seat Allocation Map', icon: Grid },
          { key: 'invigilators', label: 'Duty Supervision Roster', icon: Users },
          { key: 'admit_cards', label: 'Verify Admit Cards', icon: ShieldCheck },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 pb-3.5 text-xs font-bold transition-all relative border-b-2 cursor-pointer focus:outline-none ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Sub views mapping */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Spec Details Column */}
            <div className="md:col-span-2 space-y-6">
              <Card className="p-6 bg-white border border-slate-100 space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-50">
                  Academic Framework Parameters
                </h3>
                <div className="grid grid-cols-2 gap-6 text-xs text-left">
                  <div>
                    <span className="block font-bold text-slate-400 uppercase text-[9px] tracking-wider">Subject Group</span>
                    <span className="text-sm font-extrabold text-slate-800 block mt-1">
                      {exam.subject?.name} ({exam.subject?.code})
                    </span>
                  </div>
                  <div>
                    <span className="block font-bold text-slate-400 uppercase text-[9px] tracking-wider">Class Section / Semester</span>
                    <span className="text-sm font-extrabold text-slate-800 block mt-1">
                      Section {exam.courseOffering?.section?.name || 'A'} | {exam.courseOffering?.semester?.name || 'Sem'}
                    </span>
                  </div>
                  <div>
                    <span className="block font-bold text-slate-400 uppercase text-[9px] tracking-wider">Chief Examiner</span>
                    <span className="text-sm font-extrabold text-slate-800 block mt-1">
                      {exam.teacher?.user ? `${exam.teacher.user.firstName} ${exam.teacher.user.lastName}` : 'No Chief Instructor'}
                    </span>
                  </div>
                  <div>
                    <span className="block font-bold text-slate-400 uppercase text-[9px] tracking-wider">Marks Allocation</span>
                    <span className="text-sm font-extrabold text-slate-800 block mt-1">
                      {exam.totalMarks} Marks (Passing: {exam.passingMarks} Marks)
                    </span>
                  </div>
                </div>
              </Card>

              {exam.instructions && (
                <Card className="p-6 bg-white border border-slate-100 space-y-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-50">
                    Candidate Instructions Guidelines
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
                    {exam.instructions}
                  </p>
                </Card>
              )}
            </div>

            {/* Timetable Agenda Column */}
            <div className="md:col-span-1 space-y-6">
              <Card className="p-6 bg-white border border-slate-100 space-y-4 text-left">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-50">
                  Timetable Allocation
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <Calendar className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Exam Date</span>
                      <span className="text-xs font-extrabold text-slate-800 mt-1 block">
                        {new Date(exam.examDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <Clock className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Exam Hours</span>
                      <span className="text-xs font-extrabold text-slate-800 mt-1 block">
                        {exam.startTime} - {exam.endTime} ({exam.durationMinutes} minutes)
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <MapPin className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Hall</span>
                      <span className="text-xs font-extrabold text-slate-800 mt-1 block">
                        {exam.room ? `${exam.room.building?.name} - Room ${exam.room.roomNumber}` : 'Hall Unallocated'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'seat_plan' && <SeatPlanGenerator exam={exam} onRefresh={loadExamDetails} />}

        {activeTab === 'invigilators' && <InvigilatorAssigner exam={exam} onRefresh={loadExamDetails} />}

        {activeTab === 'admit_cards' && <AdmitCardsView exam={exam} />}
      </div>
    </div>
  );
};
