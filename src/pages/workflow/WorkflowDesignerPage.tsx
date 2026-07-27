import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Network, Save, ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, 
  Settings, Play, CheckCircle2, Inbox, Clock, Send, Sparkles, AlertCircle, Info, ToggleLeft, ToggleRight
} from 'lucide-react';

interface DesignerStep {
  id?: number;
  stepName: string;
  stepType: 'Start' | 'Approval' | 'Notification' | 'Timer' | 'End';
  configuration: string; // JSON string
  order: number;
}

export const WorkflowDesignerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');

  // Workflow definitions state
  const [workflowCode, setWorkflowCode] = useState('');
  const [workflowName, setWorkflowName] = useState('');
  const [module, setModule] = useState('Academic Operations');
  const [version, setVersion] = useState('1.0.0');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  // Steps state
  const [steps, setSteps] = useState<DesignerStep[]>([
    { stepName: 'Initiate Request', stepType: 'Start', configuration: '{}', order: 1 },
    { stepName: 'Dean Sign-off', stepType: 'Approval', configuration: JSON.stringify({ role: 'DEAN', label: 'Dean Final Review' }), order: 2 },
    { stepName: 'Notify Applicant', stepType: 'Notification', configuration: JSON.stringify({ message: 'Request has been processed successfully.' }), order: 3 },
    { stepName: 'End Process', stepType: 'End', configuration: '{}', order: 4 },
  ]);

  // Selected step for detail editing drawer
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  // States for feedback
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Preload existing workflow if editId exists
  useEffect(() => {
    if (editId) {
      const fetchWorkflow = async () => {
        const token = localStorage.getItem('su_access_token');
        try {
          const res = await fetch(`/api/workflows`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const list = await res.json();
            const current = list.find((w: any) => w.id === Number(editId));
            if (current) {
              setWorkflowCode(current.workflowCode);
              setWorkflowName(current.workflowName);
              setModule(current.module);
              setVersion(current.version);
              setDescription(current.description || '');
              setActive(current.active);
              setSteps(current.steps.map((s: any) => ({
                id: s.id,
                stepName: s.stepName,
                stepType: s.stepType,
                configuration: s.configuration,
                order: s.order
              })));
            }
          }
        } catch (err) {
          console.error('Error preloading workflow definition:', err);
        }
      };
      fetchWorkflow();
    }
  }, [editId]);

  // Reorder steps helpers
  const moveStepUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[index - 1];
    newSteps[index - 1] = temp;
    
    // Recalculate orders
    const updated = newSteps.map((st, i) => ({ ...st, order: i + 1 }));
    setSteps(updated);
    if (selectedStepIndex === index) setSelectedStepIndex(index - 1);
    else if (selectedStepIndex === index - 1) setSelectedStepIndex(index);
  };

  const moveStepDown = (index: number) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[index + 1];
    newSteps[index + 1] = temp;

    // Recalculate orders
    const updated = newSteps.map((st, i) => ({ ...st, order: i + 1 }));
    setSteps(updated);
    if (selectedStepIndex === index) setSelectedStepIndex(index + 1);
    else if (selectedStepIndex === index + 1) setSelectedStepIndex(index);
  };

  // Add Step
  const handleAddStep = (type: 'Start' | 'Approval' | 'Notification' | 'Timer' | 'End') => {
    const defaultConfigs: Record<string, string> = {
      'Start': '{}',
      'Approval': JSON.stringify({ role: 'DEPARTMENT_HEAD', label: 'Screening approval' }),
      'Notification': JSON.stringify({ message: 'A process milestone has been reached.' }),
      'Timer': JSON.stringify({ duration: '24h' }),
      'End': '{}'
    };

    const newStep: DesignerStep = {
      stepName: `New ${type} Step`,
      stepType: type,
      configuration: defaultConfigs[type],
      order: steps.length + 1
    };

    setSteps([...steps, newStep]);
    setSelectedStepIndex(steps.length);
  };

  // Remove Step
  const handleRemoveStep = (index: number) => {
    const filtered = steps.filter((_, i) => i !== index);
    const updated = filtered.map((st, i) => ({ ...st, order: i + 1 }));
    setSteps(updated);
    setSelectedStepIndex(null);
  };

  // Update step configuration fields helper
  const handleStepConfigChange = (field: string, value: string) => {
    if (selectedStepIndex === null) return;
    const newSteps = [...steps];
    const currentStep = newSteps[selectedStepIndex];

    if (field === 'stepName') {
      currentStep.stepName = value;
    } else {
      // Configuration JSON changes
      try {
        const parsed = JSON.parse(currentStep.configuration);
        parsed[field] = value;
        currentStep.configuration = JSON.stringify(parsed);
      } catch {
        const fallback: Record<string, string> = {};
        fallback[field] = value;
        currentStep.configuration = JSON.stringify(fallback);
      }
    }
    setSteps(newSteps);
  };

  // Get config field helper safely
  const getStepConfigValue = (field: string): string => {
    if (selectedStepIndex === null) return '';
    try {
      const parsed = JSON.parse(steps[selectedStepIndex].configuration);
      return parsed[field] || '';
    } catch {
      return '';
    }
  };

  // Save changes to DB
  const handleSave = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!workflowCode || !workflowName || !module) {
      setErrorMsg('Please populate Workflow Code, Name, and Module fields.');
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem('su_access_token');
    
    const payload = {
      workflowCode,
      workflowName,
      module,
      version,
      description,
      active,
      steps: steps.map(s => ({
        stepName: s.stepName,
        stepType: s.stepType,
        configuration: s.configuration,
        order: s.order
      }))
    };

    try {
      let url = '/api/workflows';
      let method = 'POST';

      if (editId) {
        url = `/api/workflows/${editId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg(editId ? 'Workflow blueprint updated successfully!' : 'New workflow blueprint saved successfully!');
        setTimeout(() => navigate('/workflow'), 1500);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to save workflow blueprint.');
      }
    } catch (err) {
      setErrorMsg('Network error saving workflow blueprint.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6" id="workflow-designer-root">
      {/* Back Header navigation */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <button
          onClick={() => navigate('/workflow')}
          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-150 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Workflows
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span>Interactive Designer</span>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Save className="h-4 w-4 shrink-0" />
            {isSaving ? 'Saving...' : editId ? 'Publish Changes' : 'Publish New Blueprint'}
          </button>
        </div>
      </div>

      {/* Message alerts */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Blueprint fields left, Step editor right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Meta definition Form */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 h-fit">
          <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Settings className="h-4 w-4 text-slate-500" /> General Blueprint settings
          </h2>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase tracking-wide">Workflow Code Identifier</label>
              <input
                type="text"
                placeholder="e.g. STUDENT_LEAVE_APPROVAL"
                value={workflowCode}
                onChange={(e) => setWorkflowCode(e.target.value.toUpperCase())}
                disabled={!!editId}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100 disabled:text-slate-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase tracking-wide">Workflow Blueprint Name</label>
              <input
                type="text"
                placeholder="e.g. Student Academic Leave Workflow"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wide">ERP Module Domain</label>
                <select
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  <option value="Academic Operations">Academic Operations</option>
                  <option value="Student Admissions">Student Admissions</option>
                  <option value="Student Registration">Student Registration</option>
                  <option value="Leave Management">Leave Management</option>
                  <option value="Procurement">Procurement</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wide">Semantic Version</label>
                <input
                  type="text"
                  placeholder="e.g. 1.0.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase tracking-wide">Description</label>
              <textarea
                placeholder="Describe what business policies and guidelines this workflow models..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                rows={3}
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-slate-700">Blueprint Active Status</span>
              <button
                type="button"
                onClick={() => setActive(!active)}
                className="text-slate-500 hover:text-slate-800 transition-all cursor-pointer focus:outline-none"
              >
                {active ? (
                  <ToggleRight className="h-9 w-9 text-emerald-500" />
                ) : (
                  <ToggleLeft className="h-9 w-9 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* MIDDLE & RIGHT COMBINED: STEP ORCHESTRATION CANVAS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
            
            {/* Step builder header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Step Orchestration Canvas</h3>
                <p className="text-xs text-slate-500 font-mono">Sequential pipeline nodes execution sequence</p>
              </div>

              {/* Toolbox of quick steps */}
              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold font-mono">
                <button
                  onClick={() => handleAddStep('Start')}
                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 text-emerald-700 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3 shrink-0" /> +Start Node
                </button>
                <button
                  onClick={() => handleAddStep('Approval')}
                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-150 text-amber-700 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3 shrink-0" /> +Approval Node
                </button>
                <button
                  onClick={() => handleAddStep('Notification')}
                  className="px-2 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-150 text-sky-700 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3 shrink-0" /> +Notification Node
                </button>
                <button
                  onClick={() => handleAddStep('Timer')}
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3 shrink-0" /> +Timer Node
                </button>
                <button
                  onClick={() => handleAddStep('End')}
                  className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3 shrink-0" /> +End Node
                </button>
              </div>
            </div>

            {/* Steps Container Graph View */}
            <div className="space-y-4">
              {steps.map((st, index) => {
                const isSelected = selectedStepIndex === index;
                return (
                  <div key={index} className="flex flex-col items-center">
                    {/* SVG Connector Line */}
                    {index > 0 && (
                      <div className="h-6 w-0.5 bg-slate-200 relative my-0.5">
                        <div className="absolute -bottom-1 -left-1 border-t-4 border-t-slate-200 border-x-4 border-x-transparent" />
                      </div>
                    )}

                    {/* Step Card node */}
                    <div 
                      onClick={() => setSelectedStepIndex(index)}
                      className={`w-full max-w-xl p-4 rounded-xl border flex justify-between items-center transition-all cursor-pointer shadow-sm ${
                        isSelected 
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/5' 
                          : 'border-slate-200 bg-white hover:border-slate-350'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="h-6 w-6 bg-slate-100 border border-slate-200 text-slate-500 text-xs font-black rounded-lg flex items-center justify-center font-mono">
                          {index + 1}
                        </span>

                        <div className={`h-10 w-10 rounded-lg border flex items-center justify-center shrink-0 ${
                          st.stepType === 'Start' ? 'bg-emerald-50 border-emerald-150 text-emerald-600' :
                          st.stepType === 'End' ? 'bg-slate-50 border-slate-200 text-slate-600' :
                          st.stepType === 'Approval' ? 'bg-amber-50 border-amber-150 text-amber-600' :
                          st.stepType === 'Timer' ? 'bg-indigo-50 border-indigo-150 text-indigo-600' :
                          'bg-sky-50 border-sky-150 text-sky-600'
                        }`}>
                          {st.stepType === 'Start' ? <Play className="h-5 w-5 fill-current" /> :
                           st.stepType === 'End' ? <CheckCircle2 className="h-5 w-5" /> :
                           st.stepType === 'Approval' ? <Inbox className="h-5 w-5" /> :
                           st.stepType === 'Timer' ? <Clock className="h-5 w-5" /> :
                           <Send className="h-5 w-5" />}
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-slate-800 block">{st.stepName}</span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">{st.stepType} node</span>
                        </div>
                      </div>

                      {/* Controls up, down, trash */}
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => moveStepUp(index)}
                          disabled={index === 0}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStepDown(index)}
                          disabled={index === steps.length - 1}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(index)}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-all cursor-pointer"
                          title="Delete step node"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sidebar drawer editor - dynamic per selected node */}
            {selectedStepIndex !== null && (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl mt-4 animate-scaleUp space-y-4 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Settings className="h-4 w-4" /> Configure Node: {steps[selectedStepIndex].stepName}
                  </h4>
                  <button
                    onClick={() => setSelectedStepIndex(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Close Settings
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Step Custom Name</label>
                    <input
                      type="text"
                      value={steps[selectedStepIndex].stepName}
                      onChange={(e) => handleStepConfigChange('stepName', e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Node Execution Type</label>
                    <select
                      value={steps[selectedStepIndex].stepType}
                      onChange={(e) => {
                        const copy = [...steps];
                        copy[selectedStepIndex].stepType = e.target.value as any;
                        setSteps(copy);
                      }}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                    >
                      <option value="Start">Start</option>
                      <option value="Approval">Approval</option>
                      <option value="Notification">Notification</option>
                      <option value="Timer">Timer</option>
                      <option value="End">End</option>
                    </select>
                  </div>
                </div>

                {/* Conditional fields based on selected stepType */}
                {steps[selectedStepIndex].stepType === 'Approval' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Target Approver Role</label>
                      <select
                        value={getStepConfigValue('role')}
                        onChange={(e) => handleStepConfigChange('role', e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none font-bold"
                      >
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="ADMIN">Administrator</option>
                        <option value="DEPARTMENT_HEAD">Department Head</option>
                        <option value="REGISTRAR">Registrar Officer</option>
                        <option value="DEAN">Dean</option>
                        <option value="FINANCE_MANAGER">Finance Manager</option>
                        <option value="HR_MANAGER">HR Manager</option>
                        <option value="FACULTY">Faculty Member</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Visual Label Descriptor</label>
                      <input
                        type="text"
                        placeholder="e.g. Dean Screenings review"
                        value={getStepConfigValue('label')}
                        onChange={(e) => handleStepConfigChange('label', e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {steps[selectedStepIndex].stepType === 'Notification' && (
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <label className="font-bold text-slate-600">Notification Email Message Body</label>
                    <textarea
                      placeholder="Write standard notification body details..."
                      value={getStepConfigValue('message')}
                      onChange={(e) => handleStepConfigChange('message', e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      rows={3}
                    />
                  </div>
                )}

                {steps[selectedStepIndex].stepType === 'Timer' && (
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <label className="font-bold text-slate-600">Delay SLA Timer Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 24h, 48h, 7d"
                      value={getStepConfigValue('duration')}
                      onChange={(e) => handleStepConfigChange('duration', e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none font-mono"
                    />
                    <span className="text-[10px] text-slate-400 block flex items-center gap-1 mt-1">
                      <Info className="h-3 w-3 shrink-0 text-slate-400" />
                      Automatic escalation or breach flags occur if pending review exceeds duration.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
