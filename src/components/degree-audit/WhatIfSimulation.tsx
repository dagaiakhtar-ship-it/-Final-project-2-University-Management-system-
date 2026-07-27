import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/api-client';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Search, 
  BookOpen, 
  Award, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw,
  TrendingUp,
  Clock
} from 'lucide-react';

interface WhatIfSimulationProps {
  studentId: number;
  currentCGPA: number;
  completedCredits: number;
}

export const WhatIfSimulation: React.FC<WhatIfSimulationProps> = ({ studentId, currentCGPA, completedCredits }) => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingSubjects, setFetchingSubjects] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      setFetchingSubjects(true);
      try {
        const res = await apiClient.get('/subjects');
        setSubjects(res.data?.data || res.data || []);
      } catch (err) {
        console.error('Error fetching subjects for simulation', err);
      } finally {
        setFetchingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  const handleSubjectToggle = (subId: number) => {
    setSelectedSubjects(prev => 
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  const handleReset = () => {
    setSelectedSubjects([]);
    setSimulationResult(null);
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post('/degree-audit/simulate', {
        studentId,
        simulatedSubjectIds: selectedSubjects
      });
      setSimulationResult(res.data?.data || res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Simulation failed to run.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(sub => 
    sub.name?.toLowerCase().includes(search.toLowerCase()) || 
    sub.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Selection Column */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            What-If Simulator
          </h3>
          {selectedSubjects.length > 0 && (
            <button 
              onClick={handleReset}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition"
            >
              <RotateCcw className="h-3. w-3" /> Reset
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Select courses you plan to enroll in next semester to calculate your estimated eligibility, CGPA, and completion probability.
        </p>

        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search subjects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Subjects Checklist */}
        <div className="max-h-[350px] overflow-y-auto border border-slate-100 rounded-xl p-2 space-y-1 bg-slate-50/50">
          {fetchingSubjects ? (
            <div className="text-center py-8 text-sm text-slate-400">Loading subjects...</div>
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">No subjects matched.</div>
          ) : (
            filteredSubjects.map(sub => (
              <label 
                key={sub.id} 
                className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition text-xs border ${
                  selectedSubjects.includes(sub.id) 
                    ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900' 
                    : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(sub.id)}
                  onChange={() => handleSubjectToggle(sub.id)}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-slate-300 rounded"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold">{sub.code}: {sub.name}</span>
                  <div className="flex gap-2 text-[10px] text-slate-400 font-medium">
                    <span>{sub.creditHours} Credits</span>
                    <span>•</span>
                    <span>{sub.category}</span>
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        <button
          onClick={runSimulation}
          disabled={selectedSubjects.length === 0 || loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/10"
        >
          {loading ? 'Simulating...' : `Simulate Passing (${selectedSubjects.length} Courses)`}
        </button>
      </div>

      {/* Results View */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between min-h-[400px]">
        {simulationResult ? (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">Simulation Report</h3>
            
            {/* Probability Score & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Graduation Probability</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-indigo-600">{simulationResult.probability}%</span>
                  <span className="text-xs text-slate-500 font-semibold">probability score</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${simulationResult.probability}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Hypothetical Status</span>
                <span className={`text-xl font-bold inline-block px-3 py-1 mt-1 rounded-lg border ${
                  simulationResult.isEligible 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                  {simulationResult.isEligible ? 'Eligible to Graduate' : 'Ineligible to Graduate'}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Status calculated with high pass accuracy.</p>
              </div>
            </div>

            {/* Compare KPI grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white border border-slate-100 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Simulated CGPA</span>
                  <span className="text-xl font-bold text-slate-800 block">{simulationResult.currentCGPA.toFixed(2)}</span>
                  <span className="text-[10px] text-emerald-500 flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" />
                    +{Math.max(0, simulationResult.currentCGPA - currentCGPA).toFixed(2)} gain
                  </span>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                  <Award className="h-5 w-5" />
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-100 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Simulated Credits</span>
                  <span className="text-xl font-bold text-slate-800 block">{simulationResult.completedCredits}</span>
                  <span className="text-[10px] text-emerald-500 flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" />
                    +{simulationResult.completedCredits - completedCredits} gained
                  </span>
                </div>
                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-100 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Simulated Remaining</span>
                  <span className="text-xl font-bold text-slate-800 block">{simulationResult.remainingCredits}</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Credits needed</span>
                </div>
                <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Simulated missing reason lists */}
            {simulationResult.missingReasons?.length > 0 ? (
              <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 space-y-2 text-xs">
                <h4 className="font-semibold text-rose-800 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                  Remaining Barriers to Graduate
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-rose-700">
                  {simulationResult.missingReasons.map((m: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-1.5 bg-white/50 p-2 rounded-lg">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-center gap-2.5 text-emerald-800 text-xs">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <div>
                  <span className="font-semibold block">Outstanding! Perfect Match.</span>
                  With these courses passed, you fulfill 100% of the academic criteria to graduate.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center h-full my-auto">
            <Sparkles className="h-12 w-12 text-indigo-300 animate-pulse mb-3" />
            <h4 className="text-base font-semibold text-slate-800">Simulation Playground</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Select one or more courses in the checklist, and hit the Simulate button to run full hypothetical compliance diagnostics.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
