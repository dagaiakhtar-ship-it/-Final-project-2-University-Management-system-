import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Network, Play, CheckCircle2, XCircle, AlertTriangle, Clock, 
  Plus, Users, FileText, ChevronRight, BarChart3, Settings, 
  ArrowRight, Sparkles, Inbox, RefreshCw, Layers, ShieldAlert,
  Send, AlertCircle, FileSpreadsheet, ListTodo, ClipboardList, Database, Download, Upload
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { motion } from 'framer-motion';

// Types representing DB schema
interface WorkflowStep {
  id: number;
  stepName: string;
  stepType: string; // 'Start' | 'Approval' | 'Notification' | 'Timer' | 'End'
  configuration: string;
  order: number;
}

interface Workflow {
  id: number;
  workflowCode: string;
  workflowName: string;
  module: string;
  version: string;
  description: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
  steps: WorkflowStep[];
}

interface WorkflowApproval {
  id: number;
  executionId: number;
  approverId: number;
  approvalLevel: number;
  decision: 'Pending' | 'Approved' | 'Rejected';
  comments: string;
  approvedAt?: string;
  createdAt: string;
  execution?: {
    workflow: {
      workflowName: string;
      module: string;
    }
  };
}

interface WorkflowExecution {
  id: number;
  workflowId: number;
  entityId?: string;
  status: 'Running' | 'WaitingApproval' | 'Completed' | 'Rejected' | 'Cancelled';
  startedAt: string;
  completedAt?: string;
  workflow: Workflow;
  approvals: WorkflowApproval[];
}

export const WorkflowPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRole = user?.role?.toUpperCase() || 'STUDENT';

  // Active tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'approvals' | 'templates' | 'executions' | 'automation'>('dashboard');

  // API Data States
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [approvals, setApprovals] = useState<WorkflowApproval[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Modal / Interactive States
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [approvalComments, setApprovalComments] = useState('');
  const [instantiateEntityId, setInstantiateEntityId] = useState('');
  const [selectedTemplateForRun, setSelectedTemplateForRun] = useState<any | null>(null);

  // File import state
  const [importJson, setImportJson] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  // Fetch all workflow data helper
  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('su_access_token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      // Fetch Workflows
      const wfRes = await fetch('/api/workflows', { headers });
      if (wfRes.ok) {
        const data = await wfRes.json();
        setWorkflows(data);
      }

      // Fetch Executions
      const execRes = await fetch('/api/workflows/executions', { headers });
      if (execRes.ok) {
        const data = await execRes.json();
        setExecutions(data);
      }

      // Fetch Approvals
      const appRes = await fetch('/api/workflows/approvals', { headers });
      if (appRes.ok) {
        const data = await appRes.json();
        setApprovals(data);
      }

      // Fetch Templates
      const tempRes = await fetch('/api/workflows/templates', { headers });
      if (tempRes.ok) {
        const data = await tempRes.json();
        setTemplates(data);
      }

    } catch (err) {
      console.error('Error fetching workflow data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleActionFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Instantiate Template
  const handleInstantiate = async (workflowId: number) => {
    const token = localStorage.getItem('su_access_token');
    try {
      const res = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflowId,
          entityId: instantiateEntityId || 'ENT-' + Math.floor(Math.random() * 90000 + 10000)
        })
      });

      if (res.ok) {
        handleActionFeedback('success', 'Workflow execution started successfully!');
        setInstantiateEntityId('');
        setSelectedTemplateForRun(null);
        fetchData();
      } else {
        const err = await res.json();
        handleActionFeedback('error', err.error || 'Failed to trigger workflow execution.');
      }
    } catch (error) {
      handleActionFeedback('error', 'Network failure starting execution.');
    }
  };

  // Approve Approval Record
  const handleApprove = async (approvalId: number) => {
    const token = localStorage.getItem('su_access_token');
    try {
      const res = await fetch('/api/workflows/approve', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approvalId,
          comments: approvalComments
        })
      });

      if (res.ok) {
        handleActionFeedback('success', 'Workflow step approved successfully!');
        setApprovalComments('');
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        handleActionFeedback('error', err.error || 'Failed to approve step.');
      }
    } catch (error) {
      handleActionFeedback('error', 'Error sending approval Request.');
    }
  };

  // Reject Approval Record
  const handleReject = async (approvalId: number) => {
    const token = localStorage.getItem('su_access_token');
    try {
      const res = await fetch('/api/workflows/reject', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approvalId,
          comments: approvalComments
        })
      });

      if (res.ok) {
        handleActionFeedback('success', 'Workflow step rejected.');
        setApprovalComments('');
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        handleActionFeedback('error', err.error || 'Failed to reject step.');
      }
    } catch (error) {
      handleActionFeedback('error', 'Error sending rejection Request.');
    }
  };

  // Import JSON configuration
  const handleImportWorkflow = async () => {
    const token = localStorage.getItem('su_access_token');
    try {
      const parsed = JSON.parse(importJson);
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parsed)
      });

      if (res.ok) {
        handleActionFeedback('success', 'Workflow imported successfully!');
        setImportJson('');
        setShowImportModal(false);
        fetchData();
      } else {
        const err = await res.json();
        handleActionFeedback('error', err.error || 'Failed to import workflow.');
      }
    } catch (e) {
      handleActionFeedback('error', 'Invalid JSON syntax inside import editor.');
    }
  };

  // Export Workflow Definition helper
  const handleExportWorkflow = (workflow: Workflow) => {
    const content = JSON.stringify({
      workflowCode: workflow.workflowCode + '_EXPORT',
      workflowName: workflow.workflowName + ' (Imported)',
      module: workflow.module,
      version: workflow.version,
      description: workflow.description,
      active: workflow.active,
      steps: workflow.steps.map(s => ({
        stepName: s.stepName,
        stepType: s.stepType,
        configuration: s.configuration,
        order: s.order
      }))
    }, null, 2);

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflow.workflowCode}_definition.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper filter approvals for logged in user's role
  const getFilteredMyApprovals = () => {
    // Determine user's target approval label from their role
    // E.g., SUPER_ADMIN and ADMIN see everything; others see their matching steps
    return approvals.filter(app => {
      if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') return true;
      
      // Attempt to check step configuration for matching role
      const exec = executions.find(e => e.id === app.executionId);
      const step = exec?.workflow.steps.find(s => s.stepType === 'Approval' && s.order === app.approvalLevel);
      if (step) {
        try {
          const config = JSON.parse(step.configuration);
          return config.role === userRole;
        } catch {
          return false;
        }
      }
      return false;
    });
  };

  const myApprovals = getFilteredMyApprovals();
  const activeApprovalsCount = myApprovals.filter(a => a.decision === 'Pending').length;

  return (
    <div className="p-6 md:p-8 space-y-8" id="workflow-platform-root">
      {/* 1. Header Hero Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-300">BPMN 2.0 Certified Execution Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Process Automation & Workflow Platform</h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Model, execute, and monitor enterprise business logic. Streamline academic approvals, overload waivers, procurement pipelines, and student admission lifecycles in real time.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <Upload className="h-4 w-4" /> Import JSON
            </button>
            <button
              onClick={() => navigate('/workflow/designer')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3px]" /> Workflow Designer
            </button>
          </div>
        </div>
      </div>

      {/* Action Feedbacks */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm animate-bounce ${
          feedbackMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />}
          <span className="font-medium">{feedbackMsg.text}</span>
        </div>
      )}

      {/* 2. Top-Level Status Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'dashboard' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="h-4 w-4" /> Executive Dashboard
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer relative flex items-center gap-2 ${
            activeTab === 'approvals' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Inbox className="h-4 w-4" /> Approval Inbox
          {activeApprovalsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black h-4.5 w-4.5 rounded-full flex items-center justify-center animate-pulse">
              {activeApprovalsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'templates' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="h-4 w-4" /> Templates
        </button>
        <button
          onClick={() => setActiveTab('executions')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'executions' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RefreshCw className="h-4 w-4" /> Active Executions
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'automation' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="h-4 w-4" /> Automation Rules
        </button>
      </div>

      {/* 3. Tab Contents Rendering */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">Synchronizing platform data pipelines...</p>
        </div>
      ) : (
        <div>
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn" id="tab-dashboard">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Total Workflows</span>
                    <h3 className="text-2xl font-black text-slate-900">{workflows.length}</h3>
                  </div>
                  <div className="h-12 w-12 bg-indigo-50 border border-indigo-150 rounded-xl flex items-center justify-center text-indigo-500">
                    <Network className="h-6 w-6" />
                  </div>
                </div>

                <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Active Running</span>
                    <h3 className="text-2xl font-black text-slate-900">{executions.filter(e => e.status === 'Running' || e.status === 'WaitingApproval').length}</h3>
                  </div>
                  <div className="h-12 w-12 bg-emerald-50 border border-emerald-150 rounded-xl flex items-center justify-center text-emerald-500">
                    <Play className="h-6 w-6 animate-pulse" />
                  </div>
                </div>

                <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</span>
                    <h3 className="text-2xl font-black text-rose-600">{approvals.filter(a => a.decision === 'Pending').length}</h3>
                  </div>
                  <div className="h-12 w-12 bg-rose-50 border border-rose-150 rounded-xl flex items-center justify-center text-rose-500">
                    <Inbox className="h-6 w-6" />
                  </div>
                </div>

                <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-600 uppercase tracking-wider">SLA Breaches</span>
                    <h3 className="text-2xl font-black text-amber-700">0</h3>
                  </div>
                  <div className="h-12 w-12 bg-amber-100 border border-amber-250 rounded-xl flex items-center justify-center text-amber-600">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Bento Grid: Core Analytics & SLA status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual success funnel chart in SVG */}
                <div className="p-6 bg-white border border-slate-200 rounded-2xl lg:col-span-2 space-y-6 shadow-sm">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">Performance Funnel</h4>
                      <p className="text-sm font-bold text-slate-800">Workflow Node Success Rate & Load Metrics</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold uppercase rounded-md">Realtime</span>
                  </div>

                  <div className="h-60 flex flex-col justify-between">
                    {/* Visual bar graph representation using dynamic SVG style */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span className="font-bold">Student Admissions Workflow</span>
                          <span className="font-mono">94% Efficiency</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-500 h-full" style={{ width: '94%' }} />
                          <div className="bg-amber-400 h-full" style={{ width: '6%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span className="font-bold">Course Overload Waiver Process</span>
                          <span className="font-mono">88% Efficiency</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-500 h-full" style={{ width: '88%' }} />
                          <div className="bg-rose-500 h-full" style={{ width: '12%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span className="font-bold">Procurement Approval Chains</span>
                          <span className="font-mono">100% Efficiency</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-500 h-full" style={{ width: '100%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span className="font-bold">Faculty Leave Authorizations</span>
                          <span className="font-mono">79% Efficiency</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-500 h-full" style={{ width: '79%' }} />
                          <div className="bg-amber-400 h-full" style={{ width: '15%' }} />
                          <div className="bg-rose-500 h-full" style={{ width: '6%' }} />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 items-center text-[10px] text-slate-400 font-mono mt-4">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-emerald-500 rounded-full" /> Success</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-amber-400 rounded-full" /> Idle/Delay</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-rose-500 rounded-full" /> Escalated/Rejected</span>
                    </div>
                  </div>
                </div>

                {/* SLA Monitoring Center */}
                <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6 shadow-sm">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">SLA & Escalate Engine</h4>
                      <p className="text-sm font-bold text-slate-800">Deadlines & Violations Tracker</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                      <Clock className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs font-extrabold text-emerald-800 block">All Pipelines Green</span>
                        <p className="text-[11px] text-emerald-700">No pending workflow steps have breached their target resolution times in the last 24 hours.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">SLA Threshold Rules</span>
                      
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                        <div className="flex justify-between font-bold">
                          <span>Rule 1: Leave Request Review</span>
                          <span className="text-slate-500">24 hrs limit</span>
                        </div>
                        <p className="text-slate-500 text-[11px]">Auto-reassigns request from Department Head to HR Director.</p>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                        <div className="flex justify-between font-bold">
                          <span>Rule 2: Procurement Approval</span>
                          <span className="text-slate-500">48 hrs limit</span>
                        </div>
                        <p className="text-slate-500 text-[11px]">Triggers high priority dashboard alert and email warning to CFO.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live activity logs */}
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">Platform Live Activity Feed</h3>
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-mono rounded">Updated Live</span>
                </div>

                <div className="space-y-3">
                  {executions.length === 0 ? (
                    <p className="text-xs text-slate-400 font-mono">No actions processed on the platform yet.</p>
                  ) : (
                    executions.slice(0, 5).map((exec) => (
                      <div key={exec.id} className="flex justify-between items-center text-xs p-2.5 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            exec.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                            exec.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            <Network className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">{exec.workflow.workflowName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {exec.id} • Entity: {exec.entityId || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase ${
                            exec.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            exec.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {exec.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{new Date(exec.startedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: APPROVAL INBOX */}
          {activeTab === 'approvals' && (
            <div className="space-y-6 animate-fadeIn" id="tab-approvals">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-slate-900">My Action Items Inbox</h2>
                  <p className="text-xs text-slate-500">Tasks requiring your organizational evaluation and explicit sign-off.</p>
                </div>
                <span className="px-3 py-1 bg-rose-50 border border-rose-150 text-rose-700 text-xs font-extrabold rounded-lg">
                  {myApprovals.filter(a => a.decision === 'Pending').length} Pending Requests
                </span>
              </div>

              {myApprovals.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-slate-350 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-mono">Inbox pristine & cleared!</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">No pending workflow approval requests are currently waiting for your role action.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Approval List */}
                  <div className="lg:col-span-2 space-y-4">
                    {myApprovals.map((app) => {
                      const associatedExec = executions.find(e => e.id === app.executionId);
                      return (
                        <div 
                          key={app.id} 
                          className={`p-5 bg-white border rounded-2xl transition-all shadow-sm space-y-4 ${
                            app.decision === 'Pending' ? 'border-amber-300 bg-amber-50/5' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-mono uppercase rounded-md font-bold">
                                {associatedExec?.workflow.module || 'Platform Core'}
                              </span>
                              <h3 className="text-sm font-extrabold text-slate-900">{associatedExec?.workflow.workflowName}</h3>
                              <p className="text-xs text-slate-500 font-mono">Level {app.approvalLevel} Sign-off Pipeline • Exec ID: {app.executionId}</p>
                            </div>

                            <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold font-mono uppercase ${
                              app.decision === 'Pending' ? 'bg-amber-100 text-amber-800' :
                              app.decision === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {app.decision}
                            </span>
                          </div>

                          {/* Steps Visualization */}
                          <div className="p-3 bg-slate-50/50 rounded-xl space-y-2">
                            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Workflow execution steps progress:</span>
                            <div className="flex items-center gap-1 overflow-x-auto py-1">
                              {associatedExec?.workflow.steps.map((st, i) => (
                                <React.Fragment key={st.id}>
                                  {i > 0 && <ChevronRight className="h-3 w-3 text-slate-350 shrink-0" />}
                                  <div className={`px-2 py-1 rounded text-[10px] font-medium shrink-0 flex items-center gap-1.5 border ${
                                    st.stepType === 'Approval' && st.order === app.approvalLevel && app.decision === 'Pending'
                                      ? 'bg-amber-100 border-amber-250 text-amber-800 font-extrabold'
                                      : st.order <= app.approvalLevel && app.decision !== 'Pending'
                                      ? 'bg-emerald-50 border-emerald-150 text-emerald-700'
                                      : 'bg-slate-100 border-slate-200 text-slate-500'
                                  }`}>
                                    {st.stepType === 'Approval' ? <Inbox className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                                    {st.stepName}
                                  </div>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>

                          {/* Decision Form - only active if pending */}
                          {app.decision === 'Pending' && (
                            <div className="space-y-3 pt-2">
                              <textarea
                                value={approvalComments}
                                onChange={(e) => setApprovalComments(e.target.value)}
                                placeholder="Enter comments, audit notes, or rejection justifications..."
                                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                                rows={2}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleReject(app.id)}
                                  className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <XCircle className="h-4 w-4" /> Reject Process
                                </button>
                                <button
                                  onClick={() => handleApprove(app.id)}
                                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                                >
                                  <CheckCircle2 className="h-4 w-4 stroke-[3px]" /> Approve & Advance
                                </button>
                              </div>
                            </div>
                          )}

                          {app.decision !== 'Pending' && app.comments && (
                            <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
                              <strong>Decision Comment:</strong> {app.comments}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Sidebar stats */}
                  <div className="p-6 bg-slate-900 text-white border border-slate-800 rounded-2xl space-y-6 shadow-xl h-fit">
                    <h3 className="text-xs font-mono uppercase font-bold tracking-widest text-slate-400">Process Audit Checklist</h3>
                    <ul className="space-y-3.5 text-xs">
                      <li className="flex gap-2.5 items-start">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Verify applicant identity and entity references are properly resolved.</span>
                      </li>
                      <li className="flex gap-2.5 items-start">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Ensure comments clearly denote policy justification under Section 4B.</span>
                      </li>
                      <li className="flex gap-2.5 items-start">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Confirm system audit log registers the transition action.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: WORKFLOW TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-6 animate-fadeIn" id="tab-templates">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-slate-900">Standardized Workflow Blueprint Templates</h2>
                  <p className="text-xs text-slate-500">Select, import, export, or instantiate pre-built process automation templates.</p>
                </div>
              </div>

              {/* Selection for quick execute */}
              {selectedTemplateForRun && (
                <div className="p-6 bg-slate-950 border border-slate-800 text-white rounded-3xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Instantiate Workflow: {selectedTemplateForRun.workflowName}</h3>
                    <button 
                      onClick={() => setSelectedTemplateForRun(null)}
                      className="text-slate-400 hover:text-white text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Reference entity ID (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. STUDENT-73892, PROC-101"
                        value={instantiateEntityId}
                        onChange={(e) => setInstantiateEntityId(e.target.value)}
                        className="w-full text-xs p-3 bg-slate-900 border border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white"
                      />
                    </div>
                    <button
                      onClick={() => handleInstantiate(selectedTemplateForRun.id)}
                      className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black rounded-xl transition-all"
                    >
                      Launch Real-Time Process
                    </button>
                  </div>
                </div>
              )}

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {workflows.map((wf) => (
                  <div key={wf.id} className="p-6 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all shadow-sm space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono uppercase rounded-md font-bold">
                          {wf.module}
                        </span>
                        <div className="flex gap-1.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-mono rounded">v{wf.version}</span>
                          <button
                            onClick={() => handleExportWorkflow(wf)}
                            title="Export Workflow JSON"
                            className="p-1 hover:bg-slate-150 text-slate-500 rounded transition-all cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-base font-extrabold text-slate-900">{wf.workflowName}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2">{wf.description || 'No description provided.'}</p>
                      </div>

                      {/* Steps chain preview */}
                      <div className="pt-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Steps Map:</span>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          {wf.steps.map((st, index) => (
                            <span 
                              key={st.id} 
                              className={`px-2 py-0.5 rounded flex items-center gap-1 font-mono border ${
                                st.stepType === 'Start' ? 'bg-emerald-50 border-emerald-150 text-emerald-700' :
                                st.stepType === 'End' ? 'bg-indigo-50 border-indigo-150 text-indigo-700' :
                                st.stepType === 'Approval' ? 'bg-amber-50 border-amber-150 text-amber-700' :
                                'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              {index + 1}. {st.stepName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => navigate(`/workflow/designer?editId=${wf.id}`)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
                      >
                        Modify Blueprints
                      </button>
                      <button
                        onClick={() => setSelectedTemplateForRun(wf)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Play className="h-3.5 w-3.5 fill-current shrink-0" /> Launch Process
                      </button>
                    </div>
                  </div>
                ))}

                {/* Pre-made Blueprint loader card if no workflows */}
                {workflows.length === 0 && (
                  <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 lg:col-span-2">
                    <Layers className="h-10 w-10 text-slate-400" />
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-800">Seed Standard University Blueprints</h3>
                      <p className="text-xs text-slate-400 max-w-md">Instantly provision leave requests, student admissions, overloads, and procurement order approval workflow templates into your tenant database.</p>
                    </div>
                    <button
                      onClick={async () => {
                        const token = localStorage.getItem('su_access_token');
                        setIsLoading(true);
                        try {
                          for (const t of templates) {
                            await fetch('/api/workflows', {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify(t)
                            });
                          }
                          handleActionFeedback('success', 'Successfully provisioned 4 standard enterprise workflow blueprints!');
                          fetchData();
                        } catch {
                          handleActionFeedback('error', 'Provisioning templates failed.');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Provision Blueprints Into Database
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: ACTIVE EXECUTIONS */}
          {activeTab === 'executions' && (
            <div className="space-y-6 animate-fadeIn" id="tab-executions">
              <div className="space-y-1">
                <h2 className="text-lg font-black text-slate-900">Active Executing Processes</h2>
                <p className="text-xs text-slate-500">Track and trace running BPMN orchestration engines, status traces, and execution history.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider font-mono">
                        <th className="p-4">Process / Blueprint</th>
                        <th className="p-4">Entity ID</th>
                        <th className="p-4">Started At</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Approvals History</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {executions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            No active processes currently running. Run a workflow template to trigger execution.
                          </td>
                        </tr>
                      ) : (
                        executions.map((exec) => (
                          <tr key={exec.id} className="hover:bg-slate-50 transition-all">
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="font-extrabold text-slate-800">{exec.workflow.workflowName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">ID: {exec.id} • Code: {exec.workflow.workflowCode}</span>
                              </div>
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-700">{exec.entityId || 'None'}</td>
                            <td className="p-4 text-slate-500 font-mono">{new Date(exec.startedAt).toLocaleString()}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono uppercase ${
                                exec.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                exec.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                                exec.status === 'WaitingApproval' ? 'bg-amber-100 text-amber-800 font-extrabold' :
                                'bg-indigo-100 text-indigo-800 animate-pulse'
                              }`}>
                                {exec.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1 font-mono text-[10px]">
                                {exec.approvals.length === 0 ? (
                                  <span className="text-slate-400">None required</span>
                                ) : (
                                  exec.approvals.map((app) => (
                                    <span 
                                      key={app.id} 
                                      title={`Level ${app.approvalLevel}: ${app.decision} • ${app.comments || ''}`}
                                      className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                                        app.decision === 'Approved' ? 'bg-emerald-500 text-white' :
                                        app.decision === 'Rejected' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-900'
                                      }`}
                                    >
                                      L{app.approvalLevel}
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setSelectedExecution(exec)}
                                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                              >
                                View Interactive Trace Map
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AUTOMATION RULES */}
          {activeTab === 'automation' && (
            <div className="space-y-6 animate-fadeIn" id="tab-automation">
              <div className="space-y-1">
                <h2 className="text-lg font-black text-slate-900">Automation Trigger Rules & SLA Escalation Settings</h2>
                <p className="text-xs text-slate-500">Enable event-driven integrations across ERP modules to automatically kick-start workflows based on database mutations or external API payloads.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Event triggers list */}
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Database className="h-5 w-5 text-indigo-500" /> Event-Driven Automation Triggers
                  </h3>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase block">Leave Request Module</span>
                        <h4 className="text-xs font-extrabold text-slate-800">Submit New Leave Request</h4>
                        <p className="text-[11px] text-slate-500">Auto-launches "Faculty & Staff Leave Request Workflow".</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold rounded-md uppercase">Active</span>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase block">Finance & Procurement</span>
                        <h4 className="text-xs font-extrabold text-slate-800">Requisition Exceeds $1000</h4>
                        <p className="text-[11px] text-slate-500">Auto-launches "Procurement Order Authorization" workflow steps.</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold rounded-md uppercase">Active</span>
                    </div>

                    <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center p-6 text-slate-400 hover:text-slate-600 transition-all cursor-pointer">
                      <div className="text-center text-xs space-y-1">
                        <Plus className="h-5 w-5 mx-auto" />
                        <span className="font-bold">Add Custom Integration Trigger</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SLA Rule engine */}
                <div className="p-6 bg-slate-900 text-white border border-slate-800 rounded-2xl space-y-6 shadow-xl">
                  <h3 className="text-sm font-extrabold flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-400" /> SLA Breach Escalation Policies
                  </h3>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-850 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono font-bold text-amber-400 uppercase">Policy 1: Academic Overload Exception</span>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-mono rounded">Enabled</span>
                      </div>
                      <div className="text-xs space-y-1">
                        <p><strong>Breach Condition:</strong> Advisor pending approval &gt; 48 hours</p>
                        <p className="text-slate-400"><strong>Escalation Path:</strong> Automatic rollover. Re-assigns approval directly to Department Head, fires alert notification stream.</p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-850 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono font-bold text-amber-400 uppercase">Policy 2: Procurement Authorization Delay</span>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-mono rounded">Enabled</span>
                      </div>
                      <div className="text-xs space-y-1">
                        <p><strong>Breach Condition:</strong> Sign-off pending &gt; 72 hours</p>
                        <p className="text-slate-400"><strong>Escalation Path:</strong> Direct push alert to University CFO and flags item as RED CRITICAL inside queue viewports.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. MODAL: JSON Import Editor */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-scaleUp">
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Import Workflow JSON Definition</h3>
              <p className="text-xs text-slate-500">Input standard blueprint JSON representation directly to sync database pipelines.</p>
            </div>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder={`{
  "workflowCode": "STUDENT_LEAVE_SCHEDULER",
  "workflowName": "Student Attendance Leave Auto-approve Workflow",
  "module": "Student Registration",
  "version": "1.0.0",
  "description": "Custom leave schedule approval system",
  "active": true,
  "steps": [
    { "order": 1, "stepName": "Start Request", "stepType": "Start" },
    { "order": 2, "stepName": "Department screening", "stepType": "Approval", "configuration": "{\\"role\\":\\"DEPARTMENT_HEAD\\"}" },
    { "order": 3, "stepName": "Completed", "stepType": "End" }
  ]
}`}
              className="w-full text-xs font-mono p-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
              rows={10}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setImportJson('');
                  setShowImportModal(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleImportWorkflow}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-xl"
              >
                Validate & Import Definition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: Detailed Workflow Interactive Trace Map */}
      {selectedExecution && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-4xl w-full space-y-6 shadow-2xl animate-scaleUp h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono uppercase rounded-md font-bold">
                  Active Runtime Trace
                </span>
                <h3 className="text-lg font-black text-slate-900">{selectedExecution.workflow.workflowName}</h3>
                <p className="text-xs text-slate-500 font-mono">Execution Reference ID: {selectedExecution.id} • Started: {new Date(selectedExecution.startedAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedExecution(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold shrink-0 cursor-pointer"
              >
                Close Trace View
              </button>
            </div>

            {/* Execution Trace Timeline Visualizer */}
            <div className="space-y-6">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">BPMN Interactive Workflow Graph State</h4>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 py-4 relative">
                {/* Horizontal line connector in desktop */}
                <div className="hidden md:block absolute top-[2.2rem] left-[10%] right-[10%] h-0.5 bg-slate-200 z-0" />

                {selectedExecution.workflow.steps.map((st, index) => {
                  // Determine status of this step based on index / current execution status
                  const isEnd = st.stepType === 'End';
                  const isStart = st.stepType === 'Start';
                  
                  // Simple logical evaluation to color code steps:
                  let stepStatus: 'completed' | 'active' | 'pending' = 'pending';
                  if (selectedExecution.status === 'Completed') {
                    stepStatus = 'completed';
                  } else if (selectedExecution.status === 'Rejected') {
                    stepStatus = index < selectedExecution.workflow.steps.length - 1 ? 'completed' : 'pending';
                  } else {
                    // Running or WaitingApproval
                    // Approvals count will tell us where we are
                    const completedApprovalsCount = selectedExecution.approvals.filter(a => a.decision === 'Approved').length;
                    
                    if (isStart) {
                      stepStatus = 'completed';
                    } else if (st.stepType === 'Approval') {
                      // Work out approval levels
                      const thisApprovalLevel = selectedExecution.workflow.steps
                        .slice(0, index + 1)
                        .filter(s => s.stepType === 'Approval').length;
                      
                      if (thisApprovalLevel <= completedApprovalsCount) {
                        stepStatus = 'completed';
                      } else if (thisApprovalLevel === completedApprovalsCount + 1) {
                        stepStatus = 'active';
                      } else {
                        stepStatus = 'pending';
                      }
                    } else if (st.stepType === 'Notification' || st.stepType === 'Timer') {
                      // Match against preceding approvals
                      const leadingApprovalsCount = selectedExecution.workflow.steps
                        .slice(0, index)
                        .filter(s => s.stepType === 'Approval').length;
                      
                      if (leadingApprovalsCount < completedApprovalsCount) {
                        stepStatus = 'completed';
                      } else if (leadingApprovalsCount === completedApprovalsCount) {
                        stepStatus = 'active';
                      } else {
                        stepStatus = 'pending';
                      }
                    } else if (isEnd) {
                      stepStatus = 'pending';
                    }
                  }

                  return (
                    <div key={st.id} className="relative z-10 flex flex-col items-center text-center space-y-3">
                      <div className={`h-12 w-12 rounded-full border-4 flex items-center justify-center transition-all ${
                        stepStatus === 'completed' 
                          ? 'bg-emerald-500 border-emerald-200 text-white shadow-lg shadow-emerald-500/20' 
                          : stepStatus === 'active'
                          ? 'bg-amber-400 border-amber-200 text-slate-900 shadow-lg shadow-amber-400/20 animate-pulse'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}>
                        {isStart ? (
                          <Play className="h-5 w-5 fill-current shrink-0" />
                        ) : isEnd ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0" />
                        ) : st.stepType === 'Approval' ? (
                          <Inbox className="h-5 w-5 shrink-0" />
                        ) : st.stepType === 'Timer' ? (
                          <Clock className="h-5 w-5 shrink-0" />
                        ) : (
                          <Send className="h-5 w-5 shrink-0" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-black text-slate-800 block">{st.stepName}</span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">{st.stepType}</span>
                        {stepStatus === 'active' && (
                          <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-[8px] font-mono rounded animate-pulse">Running</span>
                        )}
                        {stepStatus === 'completed' && (
                          <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-mono rounded">Completed</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audit Log table */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">Transition History & Decision Logs</h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono font-bold uppercase tracking-wider">
                      <th className="p-3">Level</th>
                      <th className="p-3">Decision</th>
                      <th className="p-3">Comments</th>
                      <th className="p-3">Actioned At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {selectedExecution.approvals.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">No transition history log available for this running instance.</td>
                      </tr>
                    ) : (
                      selectedExecution.approvals.map((app) => (
                        <tr key={app.id}>
                          <td className="p-3 font-bold">Level {app.approvalLevel}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              app.decision === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                              app.decision === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {app.decision}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{app.comments || 'N/A'}</td>
                          <td className="p-3 text-slate-400">{app.approvedAt ? new Date(app.approvedAt).toLocaleString() : 'Pending'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedExecution(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Dismiss Trace View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
