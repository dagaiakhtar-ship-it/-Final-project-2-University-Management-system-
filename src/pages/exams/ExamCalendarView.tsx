import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Layers, Users } from 'lucide-react';
import { Exam } from './types';

interface ExamCalendarViewProps {
  exams: Exam[];
}

export const ExamCalendarView: React.FC<ExamCalendarViewProps> = ({ exams }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month navigation helpers
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // List of days in this month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  // Group exams by Date string
  const examsByDateMap: Record<string, Exam[]> = {};
  exams.forEach((exam) => {
    if (exam.examDate && exam.status !== 'Cancelled') {
      const dateStr = exam.examDate.split('T')[0];
      if (!examsByDateMap[dateStr]) {
        examsByDateMap[dateStr] = [];
      }
      examsByDateMap[dateStr].push(exam);
    }
  });

  const getFullDateString = (day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    return `${year}-${formattedMonth}-${formattedDay}`;
  };

  const selectedDayExams = examsByDateMap[selectedDateStr] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="exam-calendar-module">
      {/* 1. Monthly Calendar Grid */}
      <Card className="p-5 md:p-6 bg-white border border-slate-100 lg:col-span-2 text-center" id="calendar-grid-card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-indigo-500" /> Exam Roster Calendar
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              type="button"
              className="p-1 rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-800 transition-all focus:outline-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 font-mono tracking-wide">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={nextMonth}
              type="button"
              className="p-1 rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-800 transition-all focus:outline-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Headers */}
        <div className="grid grid-cols-7 gap-2 text-center mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <span key={d} className="text-[9px] font-black font-mono text-slate-350 uppercase tracking-wider">
              {d}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Blanks */}
          {blankDays.map((b) => (
            <div key={`blank-${b}`} className="h-10 sm:h-12 border border-transparent" />
          ))}

          {/* Days */}
          {daysArray.map((day) => {
            const dateStr = getFullDateString(day);
            const examsOnDay = examsByDateMap[dateStr] || [];
            const hasExams = examsOnDay.length > 0;
            const isSelected = selectedDateStr === dateStr;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDateStr(dateStr)}
                className={`h-10 sm:h-12 border rounded-xl flex flex-col justify-between p-1.5 transition-all focus:outline-none relative ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/40 text-indigo-800 ring-2 ring-indigo-500/20'
                    : hasExams
                    ? 'border-emerald-100 bg-emerald-50/15 text-slate-800 hover:bg-emerald-50/40 hover:border-emerald-200'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-650'
                }`}
              >
                <span className="text-[10px] font-bold font-mono">{day}</span>
                {hasExams && (
                  <div className="flex gap-1 items-center justify-end w-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[7px] font-black font-mono text-emerald-600 hidden sm:inline">
                      {examsOnDay.length} EXAM
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* 2. Agenda details for selected day */}
      <Card className="p-5 md:p-6 bg-white border border-slate-100 col-span-1 text-left flex flex-col justify-between" id="selected-agenda-card">
        <div>
          <div className="border-b border-slate-100 pb-3 mb-4">
            <span className="text-[10px] font-black text-indigo-600 tracking-wider font-mono uppercase block">Daily Agenda</span>
            <span className="text-xs font-bold text-slate-700 block mt-0.5 font-mono">
              {new Date(selectedDateStr).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          {selectedDayExams.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <span className="text-xs text-slate-400 font-bold block">No exams scheduled.</span>
              <span className="text-[10px] text-slate-350">Check another date on the roster board.</span>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
              {selectedDayExams.map((exam) => (
                <div key={exam.id} className="p-3 bg-slate-50 border border-slate-150/60 rounded-xl space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-black font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-sm uppercase">
                      {exam.examType}
                    </span>
                    <span className="text-[8px] font-black font-mono text-slate-400">{exam.examCode}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 block leading-tight">{exam.title}</span>
                  <div className="space-y-1 pt-1 border-t border-slate-200/50 text-slate-500 text-[10px] font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        {exam.startTime} - {exam.endTime} ({exam.durationMinutes} mins)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{exam.room ? `${exam.room.building?.code}-${exam.room.roomNumber}` : 'Room unassigned'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        Course: {exam.courseOffering?.subject?.code} - Sec {exam.courseOffering?.section?.name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
