import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Network, 
  UploadCloud, 
  TrendingUp, 
  ShieldCheck, 
  AlertOctagon, 
  Wrench, 
  FileText, 
  Clock, 
  Search, 
  RefreshCw,
  Loader,
  AlertTriangle,
  Menu,
  X,
  MessageSquare,
  Brain,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Send,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { fetchAPI as originalFetchAPI } from './utils/api';
import GraphVisualizer from './components/GraphVisualizer';
import RiskScorePanel from './components/RiskScorePanel';
import CompliancePanel from './components/CompliancePanel';
import IncidentTimeline from './components/IncidentTimeline';
import MaintenanceLogs from './components/MaintenanceLogs';
import ExecutiveDashboard from './components/ExecutiveDashboard';


export default function App() {
  const [theme, setTheme] = useState('synthwave');
  const [apiStatus, setApiStatus] = useState('healthy');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // ── AI Runtime & Fallback Monitor Telemetry States ────────────────────────
  const [isMonitorOpen, setIsMonitorOpen] = useState(false);
  const [telemetry, setTelemetry] = useState({
    groq: { reqs: 0, errs: 0, totalLatency: 0, status: 'ONLINE' },
    gemini: { reqs: 0, errs: 0, totalLatency: 0, status: 'ONLINE' },
    mistral: { reqs: 0, errs: 0, totalLatency: 0, status: 'ONLINE' },
    promptCacheHits: 0,
    searchCacheHits: 0
  });
  const [fallbackLogs, setFallbackLogs] = useState([]);
  const [lastCopilotQuery, setLastCopilotQuery] = useState('');

  const fetchAPI = async (url, options) => {
    const start = performance.now();
    let provider = null;

    // Detect provider based on API route
    if (url.includes('/pid/parse')) provider = 'gemini';
    else if (url.includes('/agents/rca') || url.includes('/agents/risk') || url.includes('/agents/compliance') || url.includes('/agents/lessons-learned')) provider = 'groq';
    else if (url.includes('/agents/knowledge')) provider = 'groq'; // defaults to Groq as the router

    if (provider) {
      setTelemetry(prev => ({
        ...prev,
        [provider]: { ...prev[provider], reqs: prev[provider].reqs + 1 }
      }));
    }

    try {
      const res = await originalFetchAPI(url, options);
      const latency = performance.now() - start;

      // Update provider success telemetry
      if (provider) {
        setTelemetry(prev => {
          let updated = { ...prev };
          let nextStatus = 'ONLINE';
          
          // If knowledge agent has sources, it invoked Mistral RAG pipeline
          if (url.includes('/agents/knowledge') && res.data?.sources?.length > 0) {
            updated.mistral = {
              ...updated.mistral,
              reqs: updated.mistral.reqs + 1,
              totalLatency: updated.mistral.totalLatency + (latency * 0.6), // rough share of RAG query
              status: 'ONLINE'
            };
            
            // Check for high similarity search cache hit (e.g. score > 0.90)
            const topScore = res.data.sources[0].similarity_score;
            if (topScore && topScore > 0.90) {
              updated.searchCacheHits += 1;
            }
          }

          updated[provider] = {
            ...updated[provider],
            totalLatency: updated[provider].totalLatency + latency,
            status: nextStatus
          };
          return updated;
        });
      }

      setApiStatus('healthy');
      return res;
    } catch (err) {
      const latency = performance.now() - start;
      const timestamp = new Date().toLocaleTimeString();

      // Log fallback/failure events
      const actionName = url.split('/').pop();
      const failedProvider = provider || 'unknown';
      const logMsg = `[${timestamp}] Provider ${failedProvider.toUpperCase()} (${actionName}) failed: ${err.message || 'Network error'}`;
      
      setFallbackLogs(prev => [logMsg, ...prev]);

      if (provider) {
        setTelemetry(prev => {
          const nextErrs = prev[provider].errs + 1;
          const nextStatus = nextErrs >= prev[provider].reqs ? 'OFFLINE' : 'DEGRADED';
          return {
            ...prev,
            [provider]: {
              ...prev[provider],
              errs: nextErrs,
              totalLatency: prev[provider].totalLatency + latency,
              status: nextStatus
            }
          };
        });
      }

      setApiStatus('error');
      throw err;
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getThemeNeonBorder = () => {
    if (theme === 'slate') return 'border-slate-500/40 text-slate-300 shadow-[0_0_8px_rgba(148,163,184,0.15)]';
    if (theme === 'coquette') return 'border-pink-500/40 text-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.15)]';
    if (theme === 'matrix') return 'border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]';
    return 'border-cyan-500/40 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.2)]'; // synthwave default
  };

  const getThemeRootClasses = () => {
    let classes = "flex h-screen font-sans overflow-hidden relative transition-all duration-300 ";
    if (theme === 'slate') {
      classes += "bg-slate-950 text-slate-100";
    } else if (theme === 'coquette') {
      classes += "bg-[#181215] text-rose-100";
    } else if (theme === 'matrix') {
      classes += "bg-black text-emerald-400 font-mono";
    } else {
      classes += "bg-slate-950 text-slate-100"; // synthwave
    }
    return classes;
  };

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'executive', 'twin', 'ingestion'
  
  // Data States
  const [assets, setAssets] = useState([]);
  const [selectedAssetTag, setSelectedAssetTag] = useState(null);
  const [selectedAssetDetails, setSelectedAssetDetails] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [executiveData, setExecutiveData] = useState(null);
  
  // Loading & Error States
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingExecutive, setLoadingExecutive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Ingestion File State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [liveAlarmsActive, setLiveAlarmsActive] = useState(false);

  // P&ID Parser State
  const [pidFile, setPidFile] = useState(null);
  const [parsingPid, setParsingPid] = useState(false);
  const [pidParseResult, setPidParseResult] = useState(null);
  const [pidSuccess, setPidSuccess] = useState(null);

  // ── Agent Copilot State ──────────────────────────────────────────────────
  const [agentQuery, setAgentQuery] = useState('');
  const [knowledgeResult, setKnowledgeResult] = useState(null);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [knowledgeError, setKnowledgeError] = useState(null);

  const [rcaResult, setRcaResult] = useState(null);
  const [rcaLoading, setRcaLoading] = useState(false);
  const [rcaError, setRcaError] = useState(null);

  const [riskAgentResult, setRiskAgentResult] = useState(null);
  const [riskAgentLoading, setRiskAgentLoading] = useState(false);

  const [complianceAgentResult, setComplianceAgentResult] = useState(null);
  const [complianceAgentLoading, setComplianceAgentLoading] = useState(false);

  const [lessonsResult, setLessonsResult] = useState(null);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  // Mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load assets list
  const loadAssets = async () => {
    setLoadingAssets(true);
    setError(null);
    try {
      const res = await fetchAPI('/assets');
      setAssets(res.data || []);
      if (res.data && res.data.length > 0 && !selectedAssetTag) {
        setSelectedAssetTag(res.data[0].tag_number);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load assets list.');
    } finally {
      setLoadingAssets(false);
    }
  };

  // Load selected asset detailed telemetry twin
  const loadAssetDetails = async (tag) => {
    if (!tag) return;
    setLoadingDetails(true);
    try {
      const res = await fetchAPI(`/assets/${tag}/details`);
      setSelectedAssetDetails(res.data);
    } catch (err) {
      console.error(err);
      setSelectedAssetDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Load documents
  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetchAPI('/ingest/documents');
      setDocuments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Load executive dashboard statistics
  const loadExecutiveData = async () => {
    setLoadingExecutive(true);
    try {
      const res = await fetchAPI('/dashboard/executive');
      setExecutiveData(res.data || null);
    } catch (err) {
      console.error(err);
      setError('Failed to load executive dashboard data.');
    } finally {
      setLoadingExecutive(false);
    }
  };

  useEffect(() => {
    loadAssets();
    loadDocuments();
    loadExecutiveData();
  }, []);

  const handleSelectAsset = (tagNumber) => {
    setSelectedAssetTag(tagNumber);
    setActiveTab('twin');
  };

  useEffect(() => {
    if (selectedAssetTag) {
      loadAssetDetails(selectedAssetTag);
    }
  }, [selectedAssetTag]);

  // Live Alarm Simulation for Presentation Mode
  useEffect(() => {
    if (!liveAlarmsActive) return;

    const mockAlertTitles = [
      "Oven #24 High flue temperature limit exceeded",
      "Gas collector GCM-104 flow sensor error log",
      "Coal Charging Car CC-101 torque limit spike",
      "Battery door graphite seal deterioration detected",
      "Emergency steam bleed bypass valve pressure warning",
      "Coke Pusher ram guide alignment calibration warning",
      "Exchanger HE-301 liquor return check failure"
    ];
    
    const mockSeverities = ["High", "Critical", "Medium"];
    const mockTags = ["COB-1", "GCM-104", "CC-101", "CP-102", "PSV-202", "HE-301"];

    const interval = setInterval(() => {
      setExecutiveData((prev) => {
        if (!prev) return prev;
        
        const randomTitle = mockAlertTitles[Math.floor(Math.random() * mockAlertTitles.length)];
        const randomSeverity = mockSeverities[Math.floor(Math.random() * mockSeverities.length)];
        const randomTag = mockTags[Math.floor(Math.random() * mockTags.length)];
        
        const newAlert = {
          type: Math.random() > 0.5 ? 'incident' : 'risk',
          title: randomTitle,
          severity: randomSeverity,
          date: new Date().toISOString(),
          tag: randomTag
        };
        
        // Fluctuates average risk score
        const riskDelta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const nextAvg = Math.max(0, Math.min(100, prev.avg_risk_score + riskDelta));
        
        // Update feed
        const nextFeed = [newAlert, ...prev.alert_feed].slice(0, 15);
        
        // Randomly modify one critical asset score in the critical register
        const nextCritical = prev.critical_assets.map(item => {
          if (item.tag_number === randomTag) {
            const nextScore = Math.max(75, Math.min(100, item.risk_score + (Math.random() > 0.5 ? 2 : -2)));
            return { ...item, risk_score: nextScore };
          }
          return item;
        });

        return {
          ...prev,
          avg_risk_score: nextAvg,
          alert_feed: nextFeed,
          critical_assets: nextCritical
        };
      });

    }, 6000);

    return () => clearInterval(interval);
  }, [liveAlarmsActive]);

  // Handle document upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadSuccess(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await fetchAPI('/ingest/document', {
        method: 'POST',
        body: formData,
      });
      setUploadSuccess('Document uploaded successfully. Chunking and indexing started.');
      setSelectedFile(null);
      // Reset input element
      document.getElementById('file-upload-input').value = '';
      loadDocuments();
    } catch (err) {
      console.error(err);
      setError(err.message || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Handle P&ID Parser upload
  const handlePidUpload = async (e) => {
    e.preventDefault();
    if (!pidFile) return;

    setParsingPid(true);
    setPidSuccess(null);
    setPidParseResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', pidFile);

    try {
      const res = await fetchAPI('/pid/parse', {
        method: 'POST',
        body: formData,
      });
      setPidSuccess('P&ID diagram uploaded successfully. Gemini computer vision parsing completed!');
      setPidParseResult(res.data);
      setPidFile(null);
      document.getElementById('pid-upload-input').value = '';
      
      // Reload assets list to reflect new assets
      loadAssets();
      loadExecutiveData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'P&ID parsing failed.');
    } finally {
      setParsingPid(false);
    }
  };

  // ── Agent Handler Functions ─────────────────────────────────────────────

  const runKnowledgeAgent = async (e) => {
    e.preventDefault();
    const q = agentQuery.trim();
    if (!q) return;

    // Detect Prompt Cache Hit
    if (lastCopilotQuery && q.toLowerCase() === lastCopilotQuery.toLowerCase()) {
      setTelemetry(prev => ({
        ...prev,
        promptCacheHits: prev.promptCacheHits + 1
      }));
    } else {
      setLastCopilotQuery(q);
    }

    setKnowledgeLoading(true);
    setKnowledgeError(null);
    setKnowledgeResult(null);
    try {
      const res = await fetchAPI('/agents/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, tag_number: selectedAssetTag || null }),
      });
      setKnowledgeResult(res.data);
    } catch (err) {
      setKnowledgeError(err.message || 'Knowledge Agent failed.');
    } finally {
      setKnowledgeLoading(false);
    }
  };

  const runRCAAgent = async () => {
    if (!selectedAssetTag) return;
    setRcaLoading(true);
    setRcaError(null);
    setRcaResult(null);
    try {
      const res = await fetchAPI('/agents/rca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Investigate and determine the root cause of the most recent failure or active incident.',
          tag_number: selectedAssetTag,
        }),
      });
      setRcaResult(res.data);
    } catch (err) {
      setRcaError(err.message || 'RCA Agent failed.');
    } finally {
      setRcaLoading(false);
    }
  };

  const runRiskAgent = async () => {
    if (!selectedAssetTag) return;
    setRiskAgentLoading(true);
    setRiskAgentResult(null);
    try {
      const res = await fetchAPI('/agents/risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Calculate the current risk profile including all incident, compliance and maintenance factors.',
          tag_number: selectedAssetTag,
        }),
      });
      setRiskAgentResult(res.data);
      // Also refresh asset details to show updated score
      loadAssetDetails(selectedAssetTag);
      loadExecutiveData();
    } catch (err) {
      console.error('Risk Agent error:', err);
    } finally {
      setRiskAgentLoading(false);
    }
  };

  const runComplianceAgent = async () => {
    if (!selectedAssetTag) return;
    setComplianceAgentLoading(true);
    setComplianceAgentResult(null);
    try {
      const res = await fetchAPI('/agents/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Assess current regulatory and safety compliance status against all applicable regulations.',
          tag_number: selectedAssetTag,
        }),
      });
      setComplianceAgentResult(res.data);
    } catch (err) {
      console.error('Compliance Agent error:', err);
    } finally {
      setComplianceAgentLoading(false);
    }
  };

  const runLessonsLearnedAgent = async () => {
    if (!selectedAssetTag) return;
    setLessonsLoading(true);
    setLessonsResult(null);
    try {
      const res = await fetchAPI('/agents/lessons-learned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Extract key lessons learned from failure history and generate preventive safety checklists.',
          tag_number: selectedAssetTag,
        }),
      });
      setLessonsResult(res.data);
    } catch (err) {
      console.error('Lessons Learned Agent error:', err);
    } finally {
      setLessonsLoading(false);
    }
  };

  // Clear agent results when selected asset changes
  useEffect(() => {
    setRcaResult(null);
    setRcaError(null);
    setRiskAgentResult(null);
    setComplianceAgentResult(null);
    setLessonsResult(null);
    setKnowledgeResult(null);
    setKnowledgeError(null);
  }, [selectedAssetTag]);

  // ── Helper: Risk Level Color ─────────────────────────────────────────────
  const riskLevelColor = (level) => {
    if (!level) return 'text-slate-400';
    const l = level.toLowerCase();
    if (l === 'critical') return 'text-rose-400';
    if (l === 'high') return 'text-orange-400';
    if (l === 'medium') return 'text-amber-400';
    return 'text-emerald-400';
  };

  const riskLevelBg = (level) => {
    if (!level) return 'bg-slate-700/30 border-slate-600/30';
    const l = level.toLowerCase();
    if (l === 'critical') return 'bg-rose-500/10 border-rose-500/30';
    if (l === 'high') return 'bg-orange-500/10 border-orange-500/30';
    if (l === 'medium') return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-emerald-500/10 border-emerald-500/30';
  };

  // ── Calculated Stats for Dashboard
  const stats = {
    totalAssets: assets.length,
    activeIncidents: assets.reduce((acc, a) => acc + (a.incidents_count || 0), 0), // hypothetical count
    complianceRate: 100, // default placeholder
    criticalRiskCount: 0,
  };

  // Run minor calculation if detail cards are loaded
  let recentIncidents = [];
  if (assets.length > 0) {
    // If we have incidents in database from selected asset details
    if (selectedAssetDetails && selectedAssetDetails.incidents) {
      recentIncidents = [...selectedAssetDetails.incidents];
    }
  }

  return (
    <div className={getThemeRootClasses()}>
      <style>{`
        :root {
          --theme-accent: ${
            theme === 'slate' ? '#94a3b8'
            : theme === 'coquette' ? '#f472b6'
            : theme === 'matrix' ? '#10b981'
            : '#22d3ee'
          };
        }
        ${theme === 'matrix' ? `
          /* Matrix overrides */
          .bg-slate-900, .bg-slate-900\\/40, .bg-slate-900\\/50, .bg-slate-900\\/60, .bg-slate-900\\/70, .bg-slate-950 {
            background-color: #000000 !important;
          }
          .border-slate-800, .border-slate-700\\/40, .border-slate-700\\/50, .border-slate-700\\/60, .border-slate-700 {
            border-color: rgba(16, 185, 129, 0.3) !important;
          }
          .text-slate-100, .text-slate-200, .text-slate-300, .text-slate-400, .text-slate-500 {
            color: #34d399 !important;
          }
          .text-cyan-400, .text-rose-400, .text-orange-400, .text-amber-400, .text-fuchsia-400 {
            color: #10b981 !important;
          }
          .bg-cyan-500\\/10, .bg-rose-500\\/10, .bg-orange-500\\/10, .bg-amber-500\\/10, .bg-fuchsia-500\\/10 {
            background-color: rgba(16, 185, 129, 0.1) !important;
            border-color: rgba(16, 185, 129, 0.3) !important;
          }
        ` : ''}
        ${theme === 'coquette' ? `
          /* Coquette overrides */
          .bg-slate-900, .bg-slate-900\\/40, .bg-slate-900\\/50, .bg-slate-900\\/60, .bg-slate-900\\/70, .bg-slate-950 {
            background-color: #1e1519 !important;
          }
          .border-slate-800, .border-slate-700\\/40, .border-slate-700\\/50, .border-slate-700\\/60, .border-slate-700 {
            border-color: rgba(244, 114, 182, 0.25) !important;
          }
          .text-slate-100, .text-slate-200, .text-slate-300 {
            color: #fbcfe8 !important;
          }
          .text-slate-400, .text-slate-500 {
            color: #db2777 !important;
          }
          .text-cyan-400, .text-rose-400, .text-orange-400, .text-amber-400, .text-fuchsia-400 {
            color: #f472b6 !important;
          }
          .bg-cyan-500\\/10, .bg-rose-500\\/10, .bg-orange-500\\/10, .bg-amber-500\\/10, .bg-fuchsia-500\\/10 {
            background-color: rgba(244, 114, 182, 0.1) !important;
            border-color: rgba(244, 114, 182, 0.2) !important;
          }
        ` : ''}
        ${theme === 'slate' ? `
          /* Slate overrides */
          .bg-slate-900, .bg-slate-900\\/40, .bg-slate-900\\/50, .bg-slate-900\\/60, .bg-slate-900\\/70, .bg-slate-950 {
            background-color: #0f172a !important;
          }
          .border-slate-800, .border-slate-700\\/40, .border-slate-700\\/50, .border-slate-700\\/60, .border-slate-700 {
            border-color: rgba(148, 163, 184, 0.2) !important;
          }
          .text-slate-100, .text-slate-200, .text-slate-300 {
            color: #f1f5f9 !important;
          }
          .text-slate-400, .text-slate-500 {
            color: #94a3b8 !important;
          }
          .text-cyan-400, .text-rose-400, .text-orange-400, .text-amber-400, .text-fuchsia-400 {
            color: #cbd5e1 !important;
          }
          .bg-cyan-500\\/10, .bg-rose-500\\/10, .bg-orange-500\\/10, .bg-amber-500\\/10, .bg-fuchsia-500\\/10 {
            background-color: rgba(148, 163, 184, 0.08) !important;
            border-color: rgba(148, 163, 184, 0.2) !important;
          }
        ` : ''}
      `}</style>
      {/* P5: Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* P5: Responsive sidebar — fixed on mobile, static on md+ */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-cyan-400" />
          <span className="font-extrabold text-lg tracking-wider text-slate-100">OPSBRAIN AI</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
              activeTab === 'dashboard' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Database className="h-4 w-4" />
            Dashboard
          </button>

          <button 
            onClick={() => {
              setActiveTab('executive');
              loadExecutiveData();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
              activeTab === 'executive' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Executive View
          </button>
          
          <button 
            onClick={() => setActiveTab('twin')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
              activeTab === 'twin' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Network className="h-4 w-4" />
            Digital Twin
          </button>
          
          <button 
            onClick={() => {
              setActiveTab('ingestion');
              loadDocuments();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
              activeTab === 'ingestion' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            Ingestion
          </button>

          <button 
            onClick={() => {
              setActiveTab('pid_parser');
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
              activeTab === 'pid_parser' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Network className="h-4 w-4 text-cyan-400" />
            P&ID Parser
          </button>
        </nav>
        
        {/* Presentation & Demo Control Panel */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
          <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-cyan-400" />
            Hackathon Mode
          </div>
          
          <button
            onClick={async () => {
              if (confirm("Reset database and seed Vizag Steel Coke Oven Battery dataset?")) {
                try {
                  setLoadingAssets(true);
                  const res = await fetchAPI('/demo/seed-vizag', { method: 'POST' });
                  alert("Successfully seeded Vizag Steel Coke Oven Battery dataset!");
                  
                  // Reload datasets
                  await loadAssets();
                  await loadExecutiveData();
                  
                  // Switch to Executive view
                  setActiveTab('executive');
                  if (res.data && res.data.assets && res.data.assets.length > 0) {
                    setSelectedAssetTag(res.data.assets[0].tag_number);
                  }
                } catch (err) {
                  alert("Failed to seed scenario: " + err.message);
                } finally {
                  setLoadingAssets(false);
                }
              }
            }}
            className="w-full py-1.5 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            Seed Vizag Steel
          </button>
          
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-slate-400">Live Alarms</span>
            <button
              onClick={() => {
                setLiveAlarmsActive(!liveAlarmsActive);
              }}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${
                liveAlarmsActive
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {liveAlarmsActive ? 'SIMULATING' : 'INACTIVE'}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Engine Online</span>
          <span>v1.0.0</span>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-8 bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* P5: Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-100 capitalize">
              {activeTab === 'twin' ? 'Asset Digital Twin'
                : activeTab === 'executive' ? 'Executive View'
                : activeTab === 'pid_parser' ? 'P&ID Blueprint Parser'
                : `${activeTab} Workspace`}
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end py-1">
            {/* Theme Selector */}
            <div className={`flex items-center gap-1.5 px-3 py-1 bg-slate-900/60 border rounded-full text-xs transition duration-300 ${getThemeNeonBorder()}`}>
              <span className="font-semibold opacity-60">THEME:</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer pr-1 text-xs font-bold"
              >
                <option value="slate" className="bg-slate-900 text-slate-200">Slate Obsidian 🌑</option>
                <option value="coquette" className="bg-slate-900 text-pink-400">Coquette Core 🌸</option>
                <option value="synthwave" className="bg-slate-900 text-cyan-400">Synthwave Neon 🌊</option>
                <option value="matrix" className="bg-slate-900 text-emerald-400 font-mono">Matrix Green 🟢</option>
              </select>
            </div>

            {/* API Status Pill */}
            <button
              onClick={() => setIsMonitorOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1 bg-slate-900/60 border rounded-full text-[10px] md:text-xs font-bold tracking-wider transition duration-300 hover:bg-slate-800/80 focus:outline-none cursor-pointer ${
                apiStatus === 'healthy' 
                  ? 'border-emerald-500/40 text-emerald-400 hover:border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
                  : 'border-rose-500/40 text-rose-400 hover:border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${apiStatus === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`}></span>
              <span>API STATUS</span>
            </button>

            {/* Online Pill */}
            <div className={`flex items-center gap-1.5 px-3 py-1 bg-slate-900/60 border rounded-full text-[10px] md:text-xs font-bold tracking-wider transition duration-300 ${
              isOnline 
                ? 'border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
                : 'border-rose-500/40 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-950 relative">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* --- EXECUTIVE VIEW TAB --- */}
          {activeTab === 'executive' && (
            <div className="relative">
              {loadingExecutive && !executiveData && (
                <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center min-h-[400px]">
                  <div className="flex flex-col items-center gap-2 text-cyan-400">
                    <Loader className="h-8 w-8 animate-spin" />
                    <span className="text-sm font-semibold">Updating Executive dashboard...</span>
                  </div>
                </div>
              )}
              <ExecutiveDashboard data={executiveData} onSelectAsset={handleSelectAsset} />
            </div>
          )}

          {/* --- DASHBOARD TAB --- */}
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Hero Banner */}
              <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full filter blur-3xl"></div>
                <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-2">OpsBrain AI Command Center</h2>
                <p className="text-slate-400 max-w-xl text-sm leading-relaxed mb-6">
                  Industrial plant operations optimizer. Map P&IDs into graph digital twins, ingestion SOP documentation, and query RAG agents for safety assessments.
                </p>
                
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Digital twins</div>
                    <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">{stats.totalAssets} Assets</div>
                  </div>
                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Failures</div>
                    <div className="text-2xl font-extrabold text-rose-400 font-mono mt-1">
                      {selectedAssetDetails && selectedAssetDetails.incidents ? selectedAssetDetails.incidents.length : 0} Unresolved
                    </div>
                  </div>
                  {/* P6: Real compliance stat from backend */}
                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Compliance checks</div>
                    <div className="text-2xl font-extrabold font-mono mt-1"
                      style={{ color: executiveData?.compliance_summary?.non_compliant > 0 ? '#f87171' : '#34d399' }}
                    >
                      {executiveData?.compliance_summary
                        ? `${executiveData.compliance_summary.compliant}/${executiveData.compliance_summary.total} OK`
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">BGE Vector Dimension</div>
                    <div className="text-2xl font-extrabold text-fuchsia-400 font-mono mt-1">384 Dimensions</div>
                  </div>
                </div>
              </div>

              {/* Recent Failures Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
                  <h3 className="font-extrabold text-slate-200 tracking-tight flex items-center gap-2">
                    <AlertOctagon className="h-4.5 w-4.5 text-rose-400" />
                    Failures & Critical Events
                  </h3>
                  <div className="max-h-[300px] overflow-y-auto pr-2">
                    <IncidentTimeline incidents={recentIncidents} />
                  </div>
                </div>

                <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
                  <h3 className="font-extrabold text-slate-200 tracking-tight flex items-center gap-2">
                    <Wrench className="h-4.5 w-4.5 text-cyan-400" />
                    Maintenance Operations
                  </h3>
                  <div className="max-h-[300px] overflow-y-auto pr-2">
                    <MaintenanceLogs maintenanceLogs={selectedAssetDetails ? selectedAssetDetails.maintenance_logs : []} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- DIGITAL TWIN TAB --- */}
          {activeTab === 'twin' && (
            <div className="flex h-full gap-8 max-w-7xl mx-auto items-stretch">
              {/* Asset list sub-sidebar */}
              <div className="w-80 flex flex-col border border-slate-800 bg-slate-900/40 rounded-xl p-4 space-y-4 flex-shrink-0">
                <h3 className="font-bold text-slate-200 px-2 flex items-center gap-2">
                  <Database className="h-4.5 w-4.5 text-cyan-400" />
                  Asset Register ({assets.length})
                </h3>
                
                {loadingAssets ? (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-sm gap-2">
                    <Loader className="h-4 w-4 animate-spin text-cyan-400" />
                    Loading list...
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-1 space-y-1">
                    {assets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => setSelectedAssetTag(asset.tag_number)}
                        className={`w-full text-left p-3 rounded-lg transition border text-sm flex flex-col gap-1 ${
                          selectedAssetTag === asset.tag_number
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-semibold'
                            : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-mono text-xs uppercase font-extrabold">{asset.tag_number}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{asset.category}</span>
                        </div>
                        <span className="text-xs font-medium truncate w-full">{asset.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Asset Details Workspace */}
              <div className="flex-1 space-y-8 overflow-y-auto pr-2">
                {loadingDetails ? (
                  <div className="h-96 flex flex-col items-center justify-center text-slate-500 text-sm gap-3">
                    <Loader className="h-6 w-6 animate-spin text-cyan-400" />
                    Syncing Asset Digital Twin telemetry...
                  </div>
                ) : selectedAssetDetails ? (
                  <>
                    {/* Hero Card */}
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full filter blur-2xl"></div>
                      <div className="flex justify-between items-start gap-4 flex-wrap">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold font-mono text-cyan-400 uppercase">
                              {selectedAssetDetails.asset.tag_number}
                            </span>
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                              Category: {selectedAssetDetails.asset.category}
                            </span>
                          </div>
                          <h2 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
                            {selectedAssetDetails.asset.name}
                          </h2>
                          {selectedAssetDetails.asset.description && (
                            <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                              {selectedAssetDetails.asset.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs text-slate-500 font-mono">
                          Twin ID: {selectedAssetDetails.asset.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>

                    {/* P2: Agent Action Bar */}
                    <div className="p-4 bg-slate-900/60 border border-cyan-500/10 rounded-xl">
                      <div className="text-[10px] uppercase font-black tracking-widest text-cyan-500/60 mb-3 flex items-center gap-1.5">
                        <Brain className="h-3 w-3" /> AI Agent Actions — {selectedAssetDetails.asset.tag_number}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {/* Run RCA */}
                        <button
                          onClick={runRCAAgent}
                          disabled={rcaLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition disabled:opacity-50"
                        >
                          {rcaLoading ? <Loader className="h-3 w-3 animate-spin" /> : <AlertOctagon className="h-3 w-3" />}
                          {rcaLoading ? 'Analyzing...' : 'Run RCA'}
                        </button>
                        {/* Run Risk */}
                        <button
                          onClick={runRiskAgent}
                          disabled={riskAgentLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 transition disabled:opacity-50"
                        >
                          {riskAgentLoading ? <Loader className="h-3 w-3 animate-spin" /> : <Activity className="h-3 w-3" />}
                          {riskAgentLoading ? 'Calculating...' : 'Run Risk Score'}
                        </button>
                        {/* Run Compliance */}
                        <button
                          onClick={runComplianceAgent}
                          disabled={complianceAgentLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/20 transition disabled:opacity-50"
                        >
                          {complianceAgentLoading ? <Loader className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                          {complianceAgentLoading ? 'Checking...' : 'Run Compliance'}
                        </button>
                        {/* Lessons Learned */}
                        <button
                          onClick={runLessonsLearnedAgent}
                          disabled={lessonsLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition disabled:opacity-50"
                        >
                          {lessonsLoading ? <Loader className="h-3 w-3 animate-spin" /> : <BookOpen className="h-3 w-3" />}
                          {lessonsLoading ? 'Extracting...' : 'Extract Lessons'}
                        </button>
                      </div>
                      {rcaError && (
                        <p className="mt-2 text-xs text-rose-400">{rcaError}</p>
                      )}
                    </div>

                    {/* P2: RCA Result Card */}
                    {rcaResult && (
                      <div className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-rose-300 text-sm flex items-center gap-2">
                            <AlertOctagon className="h-4 w-4" /> Root Cause Analysis Result
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${
                            rcaResult.severity_assessment?.toLowerCase() === 'critical' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                            : rcaResult.severity_assessment?.toLowerCase() === 'high' ? 'text-orange-400 border-orange-500/30 bg-orange-500/10'
                            : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                          }`}>{rcaResult.severity_assessment}</span>
                        </div>
                        <div>
                          <div className="text-[10px] text-rose-400/60 uppercase font-bold tracking-wider mb-1">Root Cause</div>
                          <p className="text-sm text-slate-200 leading-relaxed">{rcaResult.identified_root_cause}</p>
                        </div>
                        {rcaResult.contributing_factors?.length > 0 && (
                          <div>
                            <div className="text-[10px] text-rose-400/60 uppercase font-bold tracking-wider mb-1">Contributing Factors</div>
                            <ul className="space-y-1">
                              {rcaResult.contributing_factors.map((f, i) => (
                                <li key={i} className="flex gap-2 text-xs text-slate-300">
                                  <span className="text-rose-400 font-bold mt-0.5">›</span>{f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {rcaResult.suggested_mitigations?.length > 0 && (
                          <div>
                            <div className="text-[10px] text-emerald-400/60 uppercase font-bold tracking-wider mb-1">Suggested Mitigations</div>
                            <ul className="space-y-1">
                              {rcaResult.suggested_mitigations.map((m, i) => (
                                <li key={i} className="flex gap-2 text-xs text-slate-300">
                                  <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0 mt-0.5" />{m}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* P2: Risk Agent Result */}
                    {riskAgentResult && (
                      <div className={`p-5 border rounded-xl space-y-3 ${riskLevelBg(riskAgentResult.risk_level)}`}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm flex items-center gap-2 text-slate-200">
                            <Activity className="h-4 w-4 text-orange-400" /> Risk Agent Assessment
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl font-black font-mono ${riskLevelColor(riskAgentResult.risk_level)}`}>
                              {riskAgentResult.calculated_score}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${riskLevelBg(riskAgentResult.risk_level)} ${riskLevelColor(riskAgentResult.risk_level)}`}>
                              {riskAgentResult.risk_level}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{riskAgentResult.explanation}</p>
                        <p className="text-[10px] text-slate-500">Risk score written to database. Refresh Executive Dashboard to see updated distribution.</p>
                      </div>
                    )}

                    {/* P2: Compliance Agent Result */}
                    {complianceAgentResult && (
                      <div className={`p-5 border rounded-xl space-y-3 ${
                        complianceAgentResult.status === 'NON_COMPLIANT' ? 'bg-rose-500/5 border-rose-500/20'
                        : complianceAgentResult.status === 'UNDER_REVIEW' ? 'bg-amber-500/5 border-amber-500/20'
                        : 'bg-emerald-500/5 border-emerald-500/20'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm flex items-center gap-2 text-slate-200">
                            <ShieldCheck className="h-4 w-4 text-fuchsia-400" /> Compliance Agent Result
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${
                            complianceAgentResult.status === 'NON_COMPLIANT' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                            : complianceAgentResult.status === 'UNDER_REVIEW' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                            : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                          }`}>{complianceAgentResult.status}</span>
                        </div>
                        {complianceAgentResult.violations?.length > 0 && (
                          <div>
                            <div className="text-[10px] text-rose-400/60 uppercase font-bold tracking-wider mb-1">Violations Detected</div>
                            <ul className="space-y-1">
                              {complianceAgentResult.violations.map((v, i) => (
                                <li key={i} className="flex gap-2 text-xs text-slate-300">
                                  <XCircle className="h-3 w-3 text-rose-400 flex-shrink-0 mt-0.5" />{v}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-sm text-slate-300 leading-relaxed">{complianceAgentResult.findings}</p>
                      </div>
                    )}

                    {/* Middle grid: Risk Score & Compliance */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-bold text-slate-300 tracking-tight uppercase text-xs">Risk Profile</h3>
                        <RiskScorePanel latestRisk={selectedAssetDetails.latest_risk} />
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-bold text-slate-300 tracking-tight uppercase text-xs">Compliance Audit Status</h3>
                        <CompliancePanel complianceRecords={selectedAssetDetails.compliance_records} />
                      </div>
                    </div>

                    {/* Graph Neighborhood Visualizer */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-300 tracking-tight uppercase text-xs">Graph Topology Connections</h3>
                      <GraphVisualizer 
                        graphData={selectedAssetDetails.neighborhood} 
                        selectedNodeName={selectedAssetDetails.asset.tag_number}
                      />
                    </div>

                    {/* Timeline & Maintenance log list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-bold text-slate-300 tracking-tight uppercase text-xs">Active Incidents timeline</h3>
                        <IncidentTimeline incidents={selectedAssetDetails.incidents} />
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-bold text-slate-300 tracking-tight uppercase text-xs">Maintenance history logs</h3>
                        <MaintenanceLogs maintenanceLogs={selectedAssetDetails.maintenance_logs} />
                      </div>
                    </div>

                    {/* P3: Lessons Learned Result */}
                    {lessonsResult && (
                      <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-4">
                        <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                          <BookOpen className="h-4 w-4" /> Lessons Learned & Failure Intelligence
                        </h4>
                        {lessonsResult.lessons_extracted?.length > 0 && (
                          <div>
                            <div className="text-[10px] text-amber-400/60 uppercase font-bold tracking-wider mb-2">Key Lessons Extracted</div>
                            <ul className="space-y-1.5">
                              {lessonsResult.lessons_extracted.map((l, i) => (
                                <li key={i} className="flex gap-2 text-xs text-slate-300">
                                  <span className="text-amber-400 font-bold mt-0.5">›</span>{l}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {lessonsResult.preventive_actions?.length > 0 && (
                          <div>
                            <div className="text-[10px] text-cyan-400/60 uppercase font-bold tracking-wider mb-2">Preventive Actions</div>
                            <ul className="space-y-1.5">
                              {lessonsResult.preventive_actions.map((a, i) => (
                                <li key={i} className="flex gap-2 text-xs text-slate-300">
                                  <CheckCircle className="h-3 w-3 text-cyan-400 flex-shrink-0 mt-0.5" />{a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {lessonsResult.safety_recommendations?.length > 0 && (
                          <div>
                            <div className="text-[10px] text-emerald-400/60 uppercase font-bold tracking-wider mb-2">Safety Recommendations</div>
                            <ul className="space-y-1.5">
                              {lessonsResult.safety_recommendations.map((r, i) => (
                                <li key={i} className="flex gap-2 text-xs text-slate-300">
                                  <ShieldCheck className="h-3 w-3 text-emerald-400 flex-shrink-0 mt-0.5" />{r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* P1 + P4: Agent Knowledge Copilot Chat Panel */}
                    <div className="p-5 bg-slate-900/70 border border-slate-700/60 rounded-xl space-y-4">
                      <h4 className="font-bold text-cyan-300 text-sm flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> Knowledge Copilot
                        <span className="text-[10px] font-normal text-slate-500 ml-1">— Ask anything about this asset, SOPs, or safety limits</span>
                      </h4>

                      <form onSubmit={runKnowledgeAgent} className="flex gap-2">
                        <input
                          type="text"
                          value={agentQuery}
                          onChange={(e) => setAgentQuery(e.target.value)}
                          placeholder={selectedAssetTag ? `Ask about ${selectedAssetTag}... e.g. "Why is ${selectedAssetTag} at risk?"` : 'Select an asset first...'}
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                        />
                        <button
                          type="submit"
                          disabled={knowledgeLoading || !agentQuery.trim()}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold rounded-lg text-sm transition flex items-center gap-2 flex-shrink-0"
                        >
                          {knowledgeLoading
                            ? <Loader className="h-4 w-4 animate-spin text-cyan-300" />
                            : <Send className="h-4 w-4" />}
                          {knowledgeLoading ? 'Thinking...' : 'Ask'}
                        </button>
                      </form>

                      {knowledgeError && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
                          {knowledgeError}
                        </div>
                      )}

                      {knowledgeResult && (
                        <div className="space-y-3">
                          {/* Answer block */}
                          <div className="p-4 bg-slate-800/60 border border-slate-700/40 rounded-lg space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="text-[10px] text-cyan-400/60 uppercase font-bold tracking-wider">AI Answer</div>
                              {knowledgeResult.confidence !== undefined && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                  knowledgeResult.confidence >= 0.8 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                  : knowledgeResult.confidence >= 0.5 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                                  : 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                                }`}>
                                  Confidence: {Math.round(knowledgeResult.confidence * 100)}%
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{knowledgeResult.answer}</p>
                            {knowledgeResult.related_tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {knowledgeResult.related_tags.map((tag) => (
                                  <button
                                    key={tag}
                                    onClick={() => { setSelectedAssetTag(tag); setSidebarOpen(false); }}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition"
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* P4: Source Citations */}
                          {knowledgeResult.sources && knowledgeResult.sources.length > 0 ? (
                            <div className="space-y-1.5">
                              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Source Citations</div>
                              <div className="flex flex-wrap gap-2">
                                {knowledgeResult.sources.map((src, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800 border border-slate-700/60 rounded-lg"
                                  >
                                    <FileText className="h-3 w-3 text-cyan-400 flex-shrink-0" />
                                    <div>
                                      <div className="text-[10px] font-bold text-slate-300 truncate max-w-[180px]">{src.title || src.label}</div>
                                      <div className="text-[9px] text-slate-500">
                                        {src.page_number ? `Page ${src.page_number}` : ''}
                                        {src.similarity_score ? ` · ${Math.round(src.similarity_score * 100)}% match` : ''}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-500 italic">No source citations returned for this response.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-96 flex items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    Select an asset from the register to examine details.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- INGESTION TAB --- */}
          {activeTab === 'ingestion' && (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Uploader Form */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-100">Document Ingestion Pipeline</h3>
                  <p className="text-xs text-slate-400">
                    Upload manuals, safety SOPs, or compliant checklists. Supported extensions: PDF, DOCX, XLSX, CSV, TXT.
                  </p>
                </div>

                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="border-2 border-dashed border-slate-800 rounded-lg p-8 text-center bg-slate-950 flex flex-col items-center justify-center gap-3">
                    <UploadCloud className="h-10 w-10 text-slate-500" />
                    <div className="text-xs text-slate-400">
                      Select a file from your system to upload to the ingestion router.
                    </div>
                    <input 
                      id="file-upload-input"
                      type="file" 
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 cursor-pointer"
                    />
                  </div>

                  {uploadSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs rounded-lg">
                      {uploadSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!selectedFile || uploading}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-lg text-sm transition flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Uploading document...
                      </>
                    ) : (
                      'Start Ingestion Pipeline'
                    )}
                  </button>
                </form>
              </div>

              {/* List of uploaded files */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <FileText className="h-4.5 w-4.5 text-cyan-400" />
                    Ingested Document Registry
                  </h3>
                  <button 
                    onClick={loadDocuments}
                    className="p-2 hover:bg-slate-900 border border-slate-850 rounded-lg transition text-slate-400"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                {loadingDocs ? (
                  <div className="p-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                    <Loader className="h-4 w-4 animate-spin text-cyan-400" />
                    Loading documents...
                  </div>
                ) : documents.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 border border-dashed border-slate-805 rounded-lg text-sm">
                    No documents ingested yet.
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-800 text-slate-500 font-bold text-xs uppercase tracking-wider">
                          <th className="p-4">Title</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Uploaded At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {documents.map((doc) => {
                          const status = doc.metadata?.status || 'PROCESSED';
                          let statusClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                          if (status === 'PENDING') statusClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                          if (status === 'FAILED') statusClass = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                          
                          return (
                            <tr key={doc.id} className="hover:bg-slate-800/20">
                              <td className="p-4 font-bold text-slate-200">{doc.title}</td>
                              <td className="p-4 font-mono text-xs uppercase">{doc.file_type}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-xs border font-bold ${statusClass}`}>
                                  {status}
                                </span>
                              </td>
                              <td className="p-4 text-right text-xs text-slate-500 font-mono">
                                {new Date(doc.created_at).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- P&ID BLUEPRINT PARSER TAB --- */}
          {activeTab === 'pid_parser' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Network className="h-5 w-5 text-cyan-400" />
                    P&ID Computer Vision Parser
                  </h3>
                  <p className="text-xs text-slate-400">
                    Upload Piping & Instrumentation Diagram drawings (PNG, JPEG, PDF) for Gemini 2.5 Flash to automatically extract physical equipment assets and build the relational digital twin topology.
                  </p>
                </div>

                <form onSubmit={handlePidUpload} className="space-y-4">
                  <div className="border-2 border-dashed border-slate-800 rounded-lg p-8 text-center bg-slate-950 flex flex-col items-center justify-center gap-3">
                    <UploadCloud className="h-10 w-10 text-cyan-500" />
                    <div className="text-xs text-slate-400 font-medium">
                      Select P&ID image blueprint from your computer
                    </div>
                    <input 
                      id="pid-upload-input"
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={(e) => setPidFile(e.target.files[0])}
                      className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 cursor-pointer"
                    />
                  </div>

                  {pidSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs rounded-lg">
                      {pidSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!pidFile || parsingPid}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-lg text-sm transition flex items-center justify-center gap-2"
                  >
                    {parsingPid ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Gemini analyzing P&ID blueprint & updating database...
                      </>
                    ) : (
                      'Run Gemini Vision Parser'
                    )}
                  </button>
                </form>
              </div>

              {pidParseResult && (
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                  <h4 className="font-bold text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />
                    Extraction Result Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Assets Found</div>
                      <div className="text-2xl font-extrabold text-cyan-400 mt-1">+{pidParseResult.assets_created}</div>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Graph Nodes Created</div>
                      <div className="text-2xl font-extrabold text-fuchsia-400 mt-1">+{pidParseResult.nodes_created}</div>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Graph Edges Mapped</div>
                      <div className="text-2xl font-extrabold text-emerald-400 mt-1">+{pidParseResult.edges_created}</div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => setActiveTab('twin')}
                      className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-bold rounded-lg text-slate-300 transition"
                    >
                      Examine in Digital Twin View →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* AI Runtime & Fallback Monitor Modal */}
      {isMonitorOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl bg-slate-900 border rounded-2xl p-6 relative flex flex-col max-h-[90vh] shadow-2xl transition duration-300 ${getThemeNeonBorder()}`}>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-cyan-400" />
                <h2 className="font-extrabold text-lg tracking-tight text-slate-100 uppercase">AI Runtime & Fallback Monitor</h2>
              </div>
              <button
                onClick={() => setIsMonitorOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Providers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {/* Groq Card */}
              <div className="p-4 bg-slate-950/60 border border-slate-855 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs uppercase text-slate-400">Groq</span>
                  <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    telemetry.groq.status === 'ONLINE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : telemetry.groq.status === 'DEGRADED' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${telemetry.groq.status === 'ONLINE' ? 'bg-emerald-500' : telemetry.groq.status === 'DEGRADED' ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'}`}></span>
                    {telemetry.groq.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">llama-3.3-70b-versatile</div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Requests</span>
                    <span className="font-mono font-bold text-slate-200">{telemetry.groq.reqs}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Errors</span>
                    <span className="font-mono font-bold text-rose-400">{telemetry.groq.errs}</span>
                  </div>
                </div>
                <div className="pt-2 text-xs">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Avg Latency</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {telemetry.groq.reqs > 0 ? `${Math.round(telemetry.groq.totalLatency / telemetry.groq.reqs)}ms` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Gemini Card */}
              <div className="p-4 bg-slate-950/60 border border-slate-855 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs uppercase text-slate-400">Gemini</span>
                  <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    telemetry.gemini.status === 'ONLINE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : telemetry.gemini.status === 'DEGRADED' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${telemetry.gemini.status === 'ONLINE' ? 'bg-emerald-500' : telemetry.gemini.status === 'DEGRADED' ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'}`}></span>
                    {telemetry.gemini.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">gemini-2.5-flash</div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Requests</span>
                    <span className="font-mono font-bold text-slate-200">{telemetry.gemini.reqs}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Errors</span>
                    <span className="font-mono font-bold text-rose-400">{telemetry.gemini.errs}</span>
                  </div>
                </div>
                <div className="pt-2 text-xs">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Avg Latency</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {telemetry.gemini.reqs > 0 ? `${Math.round(telemetry.gemini.totalLatency / telemetry.gemini.reqs)}ms` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Mistral Card */}
              <div className="p-4 bg-slate-950/60 border border-slate-855 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs uppercase text-slate-400">Mistral</span>
                  <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    telemetry.mistral.status === 'ONLINE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : telemetry.mistral.status === 'DEGRADED' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${telemetry.mistral.status === 'ONLINE' ? 'bg-emerald-500' : telemetry.mistral.status === 'DEGRADED' ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'}`}></span>
                    {telemetry.mistral.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">open-mistral-7b</div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Requests</span>
                    <span className="font-mono font-bold text-slate-200">{telemetry.mistral.reqs}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Errors</span>
                    <span className="font-mono font-bold text-rose-400">{telemetry.mistral.errs}</span>
                  </div>
                </div>
                <div className="pt-2 text-xs">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Avg Latency</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {telemetry.mistral.reqs > 0 ? `${Math.round(telemetry.mistral.totalLatency / telemetry.mistral.reqs)}ms` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cache Row */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950/40 border border-slate-800 rounded-xl mb-6 text-xs">
              <div className="flex justify-between items-center px-2">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Prompt Cache Hits</span>
                <span className="font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">{telemetry.promptCacheHits}</span>
              </div>
              <div className="flex justify-between items-center px-2 border-l border-slate-800">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Search Cache Hits</span>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">{telemetry.searchCacheHits}</span>
              </div>
            </div>

            {/* Fallback Logs Terminal Box */}
            <div className="flex-1 flex flex-col min-h-[160px] overflow-hidden space-y-2">
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Fallback & Event logs</div>
              <div className="flex-1 p-4 bg-black border border-slate-800 rounded-xl font-mono text-[11px] overflow-y-auto space-y-1.5 text-slate-400">
                {fallbackLogs.length > 0 ? (
                  fallbackLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed break-all">
                      <span className="text-amber-400">›</span> {log}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-600 text-center py-8">
                    No fallback events recorded yet. Ready to rotate.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
