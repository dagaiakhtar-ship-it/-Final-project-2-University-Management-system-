import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/api-client';
import { toast } from 'react-hot-toast';
import { Grid, Users, Layout, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { Exam, ExamSeatPlan } from './types';

interface SeatPlanGeneratorProps {
  exam: Exam;
  onRefresh: () => void;
}

export const SeatPlanGenerator: React.FC<SeatPlanGeneratorProps> = ({ exam, onRefresh }) => {
  const [loading, setLoading] = useState(false);

  const hasSeatPlans = exam.seatPlans && exam.seatPlans.length > 0;
  const roomCapacity = exam.room?.capacity || 0;
  const enrolledCount = exam.courseOffering?.enrollments?.length || 0;

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await apiClient.post(`/exams/${exam.id}/generate-seat-plan`);
      toast.success(res.data?.message || 'Sequential seat plan generated successfully!');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to generate seat plan.');
    } finally {
      setLoading(false);
    }
  };

  // Group seat plan by row numbers to draw a visual grid
  const maxRow = Math.max(...(exam.seatPlans?.map((sp) => sp.rowNumber) || [1]));
  const maxCol = Math.max(...(exam.seatPlans?.map((sp) => sp.columnNumber) || [5]));

  // Build a grid of seats
  const grid: (ExamSeatPlan | null)[][] = Array.from({ length: maxRow }, () =>
    Array.from({ length: maxCol }, () => null)
  );

  exam.seatPlans?.forEach((sp) => {
    if (sp.rowNumber <= maxRow && sp.columnNumber <= maxCol) {
      grid[sp.rowNumber - 1][sp.columnNumber - 1] = sp;
    }
  });

  return (
    <div className="space-y-6" id="exam-seat-plan-view">
      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-white border border-slate-100">
          <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Students Enrolled</span>
            <span className="text-xl font-extrabold text-slate-800 mt-1 block">{enrolledCount} Students</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-white border border-slate-100">
          <div className="h-10 w-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center shrink-0">
            <Layout className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Hall Capacity</span>
            <span className="text-xl font-extrabold text-slate-800 mt-1 block">
              {exam.room ? `${exam.room.building?.code || ''}-${exam.room.roomNumber} (${roomCapacity} Seats)` : 'No Room Allocated'}
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-white border border-slate-100">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Grid className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Seats Assigned</span>
            <span className="text-xl font-extrabold text-slate-800 mt-1 block">
              {hasSeatPlans ? `${exam.seatPlans.length} / ${enrolledCount}` : 'Not Generated'}
            </span>
          </div>
        </Card>
      </div>

      {/* Main Seat Map Content */}
      <Card className="p-6 md:p-8" id="seat-map-editor">
        {!hasSeatPlans ? (
          <div className="text-center py-12 max-w-md mx-auto space-y-4">
            <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-800">Sequential Seat Allocation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No seat plan exists for this exam. The Smart University system allocates classroom rows and columns sequentially to ensure maximum structural efficiency.
            </p>
            {roomCapacity < enrolledCount && exam.room ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <span>Error: Room capacity is insufficient for class enrollments. Please re-schedule with a larger room.</span>
              </div>
            ) : (
              <Button onClick={handleGenerate} variant="primary" disabled={loading} className="w-full">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Generating Seats...
                  </span>
                ) : (
                  'Generate Seat Plan Now'
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Exam Hall Map</h3>
                <p className="text-xs text-slate-400 mt-1">Grid view of generated seats in {exam.room?.building?.code}-{exam.room?.roomNumber}.</p>
              </div>
              <Button onClick={handleGenerate} variant="outline" size="sm" disabled={loading} className="text-xs">
                {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                Regenerate Seat Plan
              </Button>
            </div>

            {/* Front Stage Indicator */}
            <div className="relative max-w-xl mx-auto py-2.5 bg-slate-100 border border-slate-200 text-center rounded-xl text-xs font-bold font-mono text-slate-500 tracking-wider shadow-inner uppercase mb-10">
              <span className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-white px-3 text-[9px] text-slate-400 font-extrabold">Exam Front</span>
               Examiner Desk / Whiteboard
            </div>

            {/* Visual Grid layout */}
            <div className="overflow-x-auto pb-4">
              <div className="min-w-max flex flex-col gap-4 items-center px-4">
                {grid.map((row, rIdx) => (
                  <div key={rIdx} className="flex gap-4 items-center">
                    {/* Row Label */}
                    <span className="w-8 text-center text-[10px] font-black text-slate-300 font-mono">ROW {rIdx + 1}</span>

                    {row.map((seat, cIdx) => (
                      <div
                        key={cIdx}
                        className={`h-20 w-36 rounded-xl border flex flex-col justify-between p-2.5 shadow-xs transition-all relative ${
                          seat
                            ? 'bg-emerald-50 border-emerald-200 hover:scale-102 hover:border-emerald-400 hover:shadow-md'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        {seat ? (
                          <>
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold text-emerald-800 truncate max-w-[80px]">
                                {seat.student?.user?.firstName || 'Student'}
                              </span>
                              <span className="text-[9px] font-black font-mono px-1.5 py-0.5 bg-emerald-100 rounded-sm text-emerald-700">
                                {seat.seatNumber}
                              </span>
                            </div>
                            <div className="text-left mt-1">
                              <span className="block text-[8px] text-slate-400 font-bold uppercase">Roll Number</span>
                              <span className="text-[10px] font-mono font-black text-slate-700">{seat.student?.rollNumber || 'N/A'}</span>
                            </div>
                          </>
                        ) : (
                          <div className="m-auto text-[10px] text-slate-300 font-mono font-semibold uppercase">Empty</div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Back Stage Indicator */}
            <div className="relative max-w-xl mx-auto py-1 bg-slate-50 border border-dashed border-slate-200 text-center rounded-xl text-[10px] font-bold font-mono text-slate-400 tracking-wider uppercase">
              Hall Entry / Exit Door
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
