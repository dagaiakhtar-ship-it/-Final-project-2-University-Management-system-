import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Quiz, QuestionBank, QuizSubmission } from './types';
import { apiClient } from '../../api/api-client';
import { toast } from 'react-hot-toast';
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle,
  AlertTriangle,
  Eye,
  Camera,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface QuizAttemptPageProps {
  quiz: Quiz;
  initialSubmission: QuizSubmission;
  initialQuestions: QuestionBank[];
  onBack: () => void;
  onFinish: (sub: QuizSubmission) => void;
}

export const QuizAttemptPage: React.FC<QuizAttemptPageProps> = ({
  quiz,
  initialSubmission,
  initialQuestions,
  onBack,
  onFinish,
}) => {
  const [questions] = useState<QuestionBank[]>(initialQuestions);
  const [submission, setSubmission] = useState<QuizSubmission>(initialSubmission);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Answers State: map questionId to single answer (id) or array of answers
  const [answers, setAnswers] = useState<Record<number, any>>(
    initialSubmission.answers || {}
  );
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});

  // Countdown Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Proctoring simulation states
  const [proctorLogs, setProctorLogs] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [focusWarnings, setFocusWarnings] = useState(0);

  // Initialize Timer
  useEffect(() => {
    const start = new Date(submission.startedAt).getTime();
    const durationMs = quiz.durationMinutes * 60 * 1000;
    const end = start + durationMs;

    const tick = () => {
      const now = Date.now();
      const remainingSecs = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(remainingSecs);

      if (remainingSecs === 0) {
        toast.error('Time expired! Submitting your attempt automatically...');
        handleAutoSubmit();
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [submission, quiz]);

  // Handle Tab Focus Proctoring Simulation
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setFocusWarnings((prev) => {
          const next = prev + 1;
          const logMsg = `[Warning #${next}] Tab out detected at ${new Date().toLocaleTimeString()}`;
          setProctorLogs((logs) => [logMsg, ...logs]);
          toast.error(`Proctor Alert: Browser focus lost! Warning ${next}/3.`, {
            duration: 5000,
          });
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Format remaining seconds as HH:MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [
      h > 0 ? String(h).padStart(2, '0') : null,
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0'),
    ]
      .filter(Boolean)
      .join(':');
  };

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (questionId: number, optionId: number, isMulti = false) => {
    const currentAns = answers[questionId];

    let nextAns: any;
    if (isMulti) {
      const arr = Array.isArray(currentAns) ? [...currentAns] : [];
      if (arr.includes(optionId)) {
        nextAns = arr.filter((id) => id !== optionId);
      } else {
        nextAns = [...arr, optionId];
      }
    } else {
      nextAns = optionId;
    }

    const updatedAnswers = {
      ...answers,
      [questionId]: nextAns,
    };

    setAnswers(updatedAnswers);

    // Auto save answers progress in background
    saveProgress(updatedAnswers);
  };

  const saveProgress = async (currentAnswers: any) => {
    try {
      await apiClient.post(`/quizzes/${submission.id}/submit?saveProgress=true`, {
        submissionId: submission.id,
        currentAnswers,
      });
    } catch (err) {
      console.error('Failed to auto-save answers:', err);
    }
  };

  const toggleFlag = (questionId: number) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleAutoSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const res = await apiClient.post(`/quizzes/${submission.id}/submit`, {
        submissionId: submission.id,
        answers,
        isAutoSubmit: true,
      });
      if (res.data?.success) {
        toast.success('Quiz submitted successfully!');
        onFinish(res.data.data);
      }
    } catch (err) {
      toast.error('Submission failed. Please contact your instructor.');
    }
  };

  const handleSubmitAttempt = async () => {
    const unansweredCount = questions.filter((q) => answers[q.id] === undefined || (Array.isArray(answers[q.id]) && answers[q.id].length === 0)).length;

    let confirmMsg = 'Are you sure you want to submit your quiz attempt?';
    if (unansweredCount > 0) {
      confirmMsg = `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`;
    }

    if (!window.confirm(confirmMsg)) return;

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const res = await apiClient.post(`/quizzes/${submission.id}/submit`, {
        submissionId: submission.id,
        answers,
      });
      if (res.data?.success) {
        toast.success('Quiz submitted successfully!');
        onFinish(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit quiz.');
    }
  };

  // Determine timer color warning
  const timerColor =
    timeLeft < 60
      ? 'text-red-600 bg-red-50 border-red-200 animate-pulse'
      : timeLeft < 300
      ? 'text-amber-600 bg-amber-50 border-amber-200'
      : 'text-indigo-600 bg-indigo-50 border-indigo-200';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
      {/* Question Details and Content */}
      <div className="lg:col-span-3 space-y-6">
        {/* Navigation & Question Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-gray-500">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">
              {currentQuestion.marks} Mark(s)
            </span>
          </div>

          <button
            type="button"
            onClick={() => toggleFlag(currentQuestion.id)}
            className={`flex items-center space-x-1 text-xs px-3 py-1.5 rounded-lg border transition-all ${
              flaggedQuestions[currentQuestion.id]
                ? 'border-amber-300 bg-amber-50 text-amber-700 font-semibold shadow-xs'
                : 'border-gray-200 hover:bg-gray-50 text-gray-500'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${flaggedQuestions[currentQuestion.id] ? 'fill-amber-500' : ''}`} />
            <span>{flaggedQuestions[currentQuestion.id] ? 'Flagged for Review' : 'Mark for Review'}</span>
          </button>
        </div>

        {/* Question Text */}
        <Card className="p-6 border border-gray-100 bg-white shadow-xs">
          <p className="text-base text-gray-900 font-medium leading-relaxed mb-6 whitespace-pre-wrap">
            {currentQuestion.questionText}
          </p>

          {/* Options List */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const optionId = option.id as number;
              const isMulti = currentQuestion.questionType === 'MultipleSelect';
              const currentAns = answers[currentQuestion.id];

              const isSelected = isMulti
                ? Array.isArray(currentAns) && currentAns.includes(optionId)
                : currentAns === optionId;

              const label = String.fromCharCode(65 + idx); // A, B, C, D...

              return (
                <button
                  key={optionId}
                  onClick={() => handleSelectOption(currentQuestion.id, optionId, isMulti)}
                  className={`w-full flex items-center space-x-4 p-4 border rounded-xl text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-600/10'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 text-gray-700'
                  }`}
                >
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center font-semibold text-xs border transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {label}
                  </div>
                  <span className="flex-1 text-sm font-medium">{option.optionText}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((idx) => idx - 1)}
            className="flex items-center space-x-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          {currentIndex === questions.length - 1 ? (
            <Button
              variant="primary"
              onClick={handleSubmitAttempt}
              className="bg-emerald-600 hover:bg-emerald-700 flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Finish & Submit</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => setCurrentIndex((idx) => idx + 1)}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Sidebar Details: Timer, Question Grid, AI Proctoring */}
      <div className="space-y-6">
        {/* Floating Timer Card */}
        <Card className={`p-5 border flex items-center justify-between rounded-2xl shadow-xs transition-colors ${timerColor}`}>
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 animate-pulse" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Remaining Time</p>
              <p className="text-2xl font-bold tracking-tight font-mono">{formatTime(timeLeft)}</p>
            </div>
          </div>
        </Card>

        {/* Questions Navigator Grid */}
        <Card className="p-5 border border-gray-100 bg-white shadow-xs">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Question Navigator</h4>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const currentAns = answers[q.id];
              const isAnswered = currentAns !== undefined && (!Array.isArray(currentAns) || currentAns.length > 0);
              const isFlagged = flaggedQuestions[q.id];
              const isCurrent = idx === currentIndex;

              let btnStyle = 'border-gray-200 text-gray-600 hover:bg-gray-50';
              if (isCurrent) {
                btnStyle = 'border-indigo-600 bg-indigo-600 text-white shadow-xs font-bold';
              } else if (isFlagged) {
                btnStyle = 'border-amber-300 bg-amber-500 text-white';
              } else if (isAnswered) {
                btnStyle = 'border-emerald-600 bg-emerald-50 text-emerald-800';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-10 w-10 border rounded-xl text-xs font-medium flex items-center justify-center transition-all ${btnStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
            <div className="flex items-center space-x-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Answered</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Flagged</span>
            </div>
          </div>
        </Card>

        {/* Simulated AI Proctoring & Security Panel */}
        <Card className="p-5 border border-gray-100 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
              <Sparkles className="h-4 w-4 text-indigo-500 mr-1.5" /> AI Proctoring Logs
            </h4>
            <span className={`h-2.5 w-2.5 rounded-full ${cameraActive ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Virtual Security Camera</span>
            <button
              onClick={() => {
                setCameraActive(!cameraActive);
                const log = `[Camera] Simulated camera feed ${!cameraActive ? 'started' : 'paused'} at ${new Date().toLocaleTimeString()}`;
                setProctorLogs((prev) => [log, ...prev]);
              }}
              className={`flex items-center space-x-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded transition-colors ${
                cameraActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              <Camera className="h-3 w-3" />
              <span>{cameraActive ? 'Camera ON' : 'Camera OFF'}</span>
            </button>
          </div>

          {/* Warning state indicator */}
          <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs">
              <AlertTriangle className={`h-4 w-4 ${focusWarnings > 0 ? 'text-amber-500 animate-bounce' : 'text-gray-400'}`} />
              <span className="font-semibold text-gray-700">Tab Exit Warnings</span>
            </div>
            <span className="text-sm font-mono font-bold text-gray-900">{focusWarnings}/3</span>
          </div>

          {cameraActive && (
            <div className="aspect-video w-full rounded-xl bg-slate-900 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay animate-pulse" />
              <div className="text-center text-slate-400 font-medium space-y-1">
                <Camera className="h-8 w-8 mx-auto text-slate-500 animate-pulse" />
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Live AI Eye Tracking</p>
                <p className="text-[9px] text-emerald-500">Face Center Verified</p>
              </div>
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[8px] text-white font-mono uppercase tracking-widest">
                REC ●
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Security Log Stream</span>
            <div className="h-24 overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50/50 space-y-1 font-mono text-[9px] text-gray-400">
              {proctorLogs.length === 0 ? (
                <p className="italic text-center text-gray-300 py-6">All integrity checks green.</p>
              ) : (
                proctorLogs.map((log, idx) => (
                  <p key={idx} className={log.includes('Warning') ? 'text-rose-600 font-semibold' : 'text-gray-500'}>
                    {log}
                  </p>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
