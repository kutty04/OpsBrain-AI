import React, { useState, useEffect, useRef } from 'react';
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
import EvaluationDashboard from './components/EvaluationDashboard';


// ── Error Boundary ────────────────────────────────────────────────────────────
// Catches render-time exceptions in child components so the entire app doesn't
// crash to a blank white screen. Displays a polished recovery card instead.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Unknown error' };
  }

  componentDidCatch(error, info) {
    // In production this would go to a monitoring service (e.g. Sentry)
    // eslint-disable-next-line no-console
    console.error('[OpsBrain ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
          <div className="max-w-lg w-full mx-4 p-8 border border-rose-500/30 bg-rose-950/20 rounded-xl space-y-4 text-center">
            <div className="text-rose-400 text-4xl">⚠</div>
            <h2 className="text-lg font-bold text-rose-300 font-mono tracking-wide">PANEL FAILURE DETECTED</h2>
            <p className="text-sm text-slate-400">
              A component encountered an unexpected error and could not render.
            </p>
            <p className="text-xs font-mono text-rose-400/60 bg-slate-900/60 rounded px-3 py-2 text-left break-all">
              {this.state.errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 text-sm font-semibold rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition"
            >
              Reload OpsBrain
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

function LoaderSkeleton({ type = 'card' }) {
  if (type === 'list') {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-3.5 bg-slate-850 rounded w-1/4"></div>
              <div className="h-3.5 bg-slate-850 rounded w-1/12"></div>
            </div>
            <div className="h-3 bg-slate-850 rounded w-full"></div>
            <div className="h-3 bg-slate-850 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    );
  }
  if (type === 'details') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg space-y-3">
          <div className="flex gap-2">
            <div className="h-4.5 bg-slate-850 rounded w-16"></div>
            <div className="h-4.5 bg-slate-850 rounded w-28"></div>
          </div>
          <div className="h-6 bg-slate-850 rounded w-1/2"></div>
          <div className="h-3.5 bg-slate-850 rounded w-3/4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[200px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg"></div>
          <div className="h-[200px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg"></div>
        </div>
      </div>
    );
  }
  return (
    <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg space-y-3 animate-pulse">
      <div className="h-3.5 bg-slate-850 rounded w-2/3"></div>
      <div className="h-3 bg-slate-850 rounded w-full"></div>
      <div className="h-3 bg-slate-850 rounded w-5/6"></div>
    </div>
  );
}

const renderCadCorners = () => (
  <>
    <div className="cad-corner-tl" />
    <div className="cad-corner-tr" />
    <div className="cad-corner-bl" />
    <div className="cad-corner-br" />
  </>
);

const renderProviderMetadataChip = (result) => {
  const meta = result?.provider_metadata;
  if (!meta || !meta.provider_used) return null;

  let text = '';
  let colorClass = '';

  if (meta.provider_used === 'demo_fallback') {
    text = 'Demo fallback: live AI provider unavailable';
    colorClass = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  } else if (meta.provider_used === 'extractive_fallback') {
    text = 'Extractive fallback: generated from retrieved document evidence';
    colorClass = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  } else if (meta.fallback_used) {
    const formattedName = meta.provider_used.charAt(0).toUpperCase() + meta.provider_used.slice(1);
    text = `Answered using fallback provider: ${formattedName}`;
    colorClass = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  } else {
    const formattedName = meta.provider_used.charAt(0).toUpperCase() + meta.provider_used.slice(1);
    text = `AI Source: ${formattedName} (${meta.latency_ms ? `${meta.latency_ms}ms` : 'online'})`;
    colorClass = 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
  }

  return (
    <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border font-bold uppercase tracking-wider ${colorClass}`}>
      {text}
    </div>
  );
};

const ENABLE_INVESTIGATION_HUD = false;

function AppContent() {
  const [theme, setTheme] = useState('slate');
  const [apiStatus, setApiStatus] = useState('healthy');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // ── AI Runtime & Fallback Monitor Telemetry States ────────────────────────
  const [isMonitorOpen, setIsMonitorOpen] = useState(false);
  const [telemetry, setTelemetry] = useState({
    groq: { reqs: 0, errs: 0, totalLatency: 0, status: 'IDLE' },
    gemini: { reqs: 0, errs: 0, totalLatency: 0, status: 'IDLE' },
    mistral: { reqs: 0, errs: 0, totalLatency: 0, status: 'IDLE' },
    promptCacheHits: 0,
    searchCacheHits: 0,
    telemetryStream: 'IDLE'
  });
  const [fallbackLogs, setFallbackLogs] = useState([]);
  const [lastCopilotQuery, setLastCopilotQuery] = useState('');

  const handleClearTelemetry = async () => {
    try {
      const res = await fetchAPI('/health');
      const providers = res.data?.providers || {};
      setTelemetry(prev => ({
        groq: { reqs: 0, errs: 0, totalLatency: 0, status: providers.groq ? 'IDLE' : 'NOT CONFIGURED' },
        gemini: { reqs: 0, errs: 0, totalLatency: 0, status: providers.gemini ? 'IDLE' : 'NOT CONFIGURED' },
        mistral: { reqs: 0, errs: 0, totalLatency: 0, status: providers.mistral ? 'IDLE' : 'NOT CONFIGURED' },
        promptCacheHits: 0,
        searchCacheHits: 0,
        telemetryStream: prev.telemetryStream
      }));
    } catch (e) {
      setTelemetry(prev => ({
        groq: { reqs: 0, errs: 0, totalLatency: 0, status: 'IDLE' },
        gemini: { reqs: 0, errs: 0, totalLatency: 0, status: 'IDLE' },
        mistral: { reqs: 0, errs: 0, totalLatency: 0, status: 'IDLE' },
        promptCacheHits: 0,
        searchCacheHits: 0,
        telemetryStream: prev.telemetryStream
      }));
    }
    setFallbackLogs([]);
  };

  useEffect(() => {
    const initTelemetryConfig = async () => {
      try {
        const res = await fetchAPI('/health');
        if (res.success && res.data && res.data.providers) {
          setTelemetry(prev => {
            let updated = { ...prev };
            Object.keys(res.data.providers).forEach(prov => {
              if (updated[prov]) {
                const isConfigured = res.data.providers[prov];
                updated[prov] = {
                  ...updated[prov],
                  status: isConfigured ? 'IDLE' : 'NOT CONFIGURED'
                };
              }
            });
            return updated;
          });
        }
      } catch (err) {
        console.error('Failed to retrieve telemetry configuration:', err);
      }
    };
    initTelemetryConfig();
  }, []);

  const fetchAPI = async (url, options) => {
    const start = performance.now();
    let provider = null;

    // Detect default provider based on API route (only used for fallback/errors before metadata arrives)
    if (url.includes('/pid/parse')) provider = 'gemini';
    else if (url.includes('/agents/rca') || url.includes('/agents/risk') || url.includes('/agents/compliance') || url.includes('/agents/lessons-learned')) provider = 'groq';
    else if (url.includes('/agents/knowledge')) provider = 'groq';

    try {
      const res = await originalFetchAPI(url, options);
      const latency = performance.now() - start;
      const timestamp = new Date().toLocaleTimeString();

      const metadata = res.data?.provider_metadata;
      if (metadata) {
        const used = metadata.provider_used;
        const fallback = metadata.fallback_used;
        const attempted = metadata.attempted_providers || [];
        const reason = metadata.fallback_reason;

        setTelemetry(prev => {
          let updated = { ...prev };
          
          attempted.forEach(prov => {
            const mappedProv = prov === 'gemini_vision' ? 'gemini' : prov;
            if (mappedProv !== used && updated[mappedProv]) {
              updated[mappedProv] = {
                ...updated[mappedProv],
                reqs: updated[mappedProv].reqs + 1,
                errs: updated[mappedProv].errs + 1,
                status: 'DEGRADED'
              };
            }
          });

          const mappedUsed = used === 'gemini_vision' ? 'gemini' : used;
          if (updated[mappedUsed]) {
            updated[mappedUsed] = {
              ...updated[mappedUsed],
              reqs: updated[mappedUsed].reqs + 1,
              totalLatency: updated[mappedUsed].totalLatency + (metadata.latency_ms || latency),
              status: 'ONLINE'
            };
          }

          return updated;
        });

        if (fallback) {
          const actionName = url.split('/').pop();
          const logMsg = `[${timestamp}] [FAILOVER] ${actionName.toUpperCase()} routed to ${used.toUpperCase()}. Reason: ${reason || 'Rate limit'}`;
          setFallbackLogs(prev => [logMsg, ...prev]);
        }
      } else {
        if (provider) {
          setTelemetry(prev => {
            let updated = { ...prev };
            let nextStatus = 'ONLINE';
            
            if (url.includes('/agents/knowledge') && res.data?.sources?.length > 0) {
              updated.mistral = {
                ...updated.mistral,
                reqs: updated.mistral.reqs + 1,
                totalLatency: updated.mistral.totalLatency + (latency * 0.6),
                status: 'ONLINE'
              };
              const topScore = res.data.sources[0].similarity_score;
              if (topScore && topScore > 0.90) {
                updated.searchCacheHits += 1;
              }
            }

            updated[provider] = {
              ...updated[provider],
              reqs: updated[provider].reqs + 1,
              totalLatency: updated[provider].totalLatency + latency,
              status: nextStatus
            };
            return updated;
          });
        }
      }

      setApiStatus('healthy');
      return res;
    } catch (err) {
      const latency = performance.now() - start;
      const timestamp = new Date().toLocaleTimeString();

      const actionName = url.split('/').pop();
      const failedProvider = provider || 'unknown';
      const logMsg = `[${timestamp}] Provider ${failedProvider.toUpperCase()} (${actionName}) failed: ${err.message || 'Network error'}`;
      
      setFallbackLogs(prev => [logMsg, ...prev]);

      if (provider) {
        setTelemetry(prev => {
          const nextReqs = prev[provider].reqs + 1;
          const nextErrs = prev[provider].errs + 1;
          const nextStatus = nextErrs >= nextReqs ? 'OFFLINE' : 'DEGRADED';
          return {
            ...prev,
            [provider]: {
              ...prev[provider],
              reqs: nextReqs,
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
    return 'border-[var(--border-color)] text-[var(--text-primary)] shadow-sm';
  };

  const getThemeRootClasses = () => {
    return `flex h-screen font-sans overflow-hidden relative transition-all duration-150 theme-${theme} bg-[var(--bg-app)] text-[var(--text-primary)] bg-grid-blueprint`;
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
  const [riskAgentError, setRiskAgentError] = useState(null);

  const [complianceAgentResult, setComplianceAgentResult] = useState(null);
  const [complianceAgentLoading, setComplianceAgentLoading] = useState(false);
  const [complianceAgentError, setComplianceAgentError] = useState(null);

  const [lessonsResult, setLessonsResult] = useState(null);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState(null);

  // ── AI Investigation Mode State ──────────────────────────────────────────
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [investigationStep, setInvestigationStep] = useState(0);
  const [investigationLogs, setInvestigationLogs] = useState([]);
  const [activeGraphTrace, setActiveGraphTrace] = useState(null);


  // Tracks all setTimeout IDs fired during an investigation sequence so they
  // can be cancelled if the user switches asset or the component unmounts.
  const investigationTimers = useRef([]);

  // Helper: clear all pending investigation timers
  const clearInvestigationTimers = () => {
    investigationTimers.current.forEach(clearTimeout);
    investigationTimers.current = [];
  };

  // Prevent background scrolling while AI Investigation Mode is active.
  // Also clear any lingering investigation timers when mode exits.
  useEffect(() => {
    if (isInvestigating) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      clearInvestigationTimers();
    }
    return () => {
      document.body.style.overflow = '';
      clearInvestigationTimers(); // cleanup on unmount
    };
  }, [isInvestigating]);

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
    setActiveGraphTrace(null);
    setSelectedAssetTag(tagNumber);
    setActiveTab('twin');
  };

  useEffect(() => {
    if (selectedAssetTag) {
      setActiveGraphTrace(null);
      loadAssetDetails(selectedAssetTag);
    }
  }, [selectedAssetTag]);

  // Live Telemetry EventSource Connection
  useEffect(() => {
    if (!liveAlarmsActive) {
      setTelemetry(prev => ({ ...prev, telemetryStream: 'IDLE' }));
      return;
    }

    console.log("Connecting to backend industrial telemetry EventSource...");
    let eventSource;
    
    const triggerLocalAlarmFallback = () => {
      // Set up the local simulation interval
      const mockAlertTitles = [
        "Demo fallback: Oven #24 High flue temperature limit exceeded (local)",
        "Demo fallback: Gas collector GCM-104 flow sensor error log (local)",
        "Demo fallback: Coal Charging Car CC-101 torque limit spike (local)",
        "Demo fallback: Battery door graphite seal deterioration detected (local)"
      ];
      const mockTags = ["COB-1", "GCM-104", "CC-101", "CP-102"];
      
      const interval = setInterval(() => {
        setExecutiveData((prev) => {
          if (!prev) return prev;
          const randomTitle = mockAlertTitles[Math.floor(Math.random() * mockAlertTitles.length)];
          const randomTag = mockTags[Math.floor(Math.random() * mockTags.length)];
          const newAlert = {
            type: 'incident',
            title: randomTitle,
            severity: 'High',
            date: new Date().toISOString(),
            tag: randomTag
          };
          return {
            ...prev,
            alert_feed: [newAlert, ...prev.alert_feed].slice(0, 15)
          };
        });
      }, 6000);
      
      if (eventSource) {
        eventSource.localInterval = interval;
      }
    };

    try {
      eventSource = new EventSource('http://127.0.0.1:8000/api/v1/telemetry/stream');
      
      eventSource.onopen = () => {
        console.log("Telemetry EventSource stream connected successfully.");
        setTelemetry(prev => ({ ...prev, telemetryStream: 'CONNECTED' }));
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log("Received telemetry stream event:", payload);
          
          setExecutiveData((prev) => {
            if (!prev) return prev;
            
            const newAlert = {
              type: payload.event_type.includes('warning') || payload.event_type.includes('deviation') || payload.event_type.includes('spike') ? 'incident' : 'risk',
              title: payload.message,
              severity: payload.severity,
              date: payload.timestamp,
              tag: payload.asset_tag
            };
            
            const riskDelta = Math.floor(Math.random() * 3) - 1; // -1 to +1 minor fluctuation
            const nextAvg = Math.max(0, Math.min(100, prev.avg_risk_score + riskDelta));
            const nextFeed = [newAlert, ...prev.alert_feed].slice(0, 15);
            
            const nextCritical = prev.critical_assets.map(item => {
              if (item.tag_number === payload.asset_tag && payload.severity === 'Critical') {
                const nextScore = Math.max(75, Math.min(100, item.risk_score + 2));
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
        } catch (err) {
          console.error("Failed to parse telemetry stream message:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.error("Telemetry EventSource error. Falling back to local simulation.", err);
        setTelemetry(prev => ({ ...prev, telemetryStream: 'DISCONNECTED' }));
        triggerLocalAlarmFallback();
      };
    } catch (err) {
      console.error("Failed to initialize EventSource. Falling back to local simulation.", err);
      setTelemetry(prev => ({ ...prev, telemetryStream: 'DISCONNECTED' }));
      triggerLocalAlarmFallback();
    }

    return () => {
      setTelemetry(prev => ({ ...prev, telemetryStream: 'IDLE' }));
      if (eventSource) {
        eventSource.close();
        if (eventSource.localInterval) {
          clearInterval(eventSource.localInterval);
        }
      }
    };
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

  // ── AI Investigation Timer Sequence ──────────────────────────────────────
  const startInvestigation = (targetAsset, type, onComplete) => {
    clearInvestigationTimers(); // Cancel any still-running investigation before starting a new one
    setIsInvestigating(true);
    setInvestigationStep(0);
    setInvestigationLogs([]);

    let steps = [];
    if (type === 'rca') {
      steps = [
        { log: `> SYS: INITIALIZING AI ROOT CAUSE DIAGNOSIS ROUTE FOR [${targetAsset}]...`, delay: 0 },
        { log: `> [01/05] IDENTIFYING SCAN TARGET: ${targetAsset} SELECTED`, delay: 800 },
        { log: `> [02/05] AUDITING ASSET REGISTRIES: RECENT MAINTENANCE ORDERS FOUND FOR ${targetAsset}`, delay: 1800 },
        { log: `> [03/05] CORRELATING SENSOR ANOMALIES: DETECTING TEMPERATURE/PRESSURE ANOMALIES`, delay: 2800 },
        { log: `> [04/05] TRAVERSING DIGITAL TWIN NETWORK: AUDITING CONNECTIONS AROUND ${targetAsset}`, delay: 3800 },
        { log: `> [05/05] RAG REASONING ROUTE CONCLUDED: RECALCULATING OPERATIONAL RISK VECTOR`, delay: 4800 },
      ];
    } else if (type === 'risk') {
      steps = [
        { log: `> SYS: SPINNING UP AUTOMATED OPERATIONAL RISK ASSESSMENT FOR [${targetAsset}]...`, delay: 0 },
        { log: `> [01/05] SCANNING SENSOR TELEMETRY AND ANOMALY DETECTION LIMITS...`, delay: 800 },
        { log: `> [02/05] COMPUTING DOWNSTREAM CASCADE COEFFICIENTS ACROSS TWIN CONNECTIONS...`, delay: 1800 },
        { log: `> [03/05] EVALUATING ACTIVE CRITICAL FAILURES LINKED TO ${targetAsset}...`, delay: 2800 },
        { log: `> [04/05] COMPARING EMISSION ACCUMULATIONS WITH COMPLIANCE REGULATIONS...`, delay: 3800 },
        { log: `> [05/05] CRITICAL THRESHOLD VERIFIED: ESTIMATING RISK MATRIX VALUE...`, delay: 4800 },
      ];
    } else if (type === 'compliance') {
      steps = [
        { log: `> SYS: INITIALIZING REGULATORY COMPLIANCE AND SAFETY AUDITOR REPORT FOR [${targetAsset}]...`, delay: 0 },
        { log: `> [01/05] PARSING ENVIRONMENTAL PROTECTION SOP MANUALS...`, delay: 800 },
        { log: `> [02/05] COMPARING ACTIVE PRESSURE/TEMP LOGS AGAINST SAFETY STANDARD SE-12...`, delay: 1800 },
        { log: `> [03/05] EXTRACTING EMISSION THRESHOLDS AND TEMPERATURE LIMITS...`, delay: 2800 },
        { log: `> [04/05] AUDITING INDUCTION SEAL INTEGRITY MAPS FOR ${targetAsset}...`, delay: 3800 },
        { log: `> [05/05] COMPLIANCE RECORD MATRIX COMPILED FOR AUDITORS`, delay: 4800 },
      ];
    } else { // lessons learned
      steps = [
        { log: `> SYS: GATHERING FAILURE INTELLIGENCE AND PREVENTIVE CHECKLISTS FOR [${targetAsset}]...`, delay: 0 },
        { log: `> [01/05] INGESTING HISTORICAL ACCIDENT RECORDS AND SHUTDOWN LOGS...`, delay: 800 },
        { log: `> [02/05] COMPARATIVE ANALYSIS: LOCATING SIMILAR SEAL FAILURE VECTORS...`, delay: 1800 },
        { log: `> [03/05] EXTRACTING CORRECTIVE MAINTENANCE SOP PROTOCOLS FOR ${targetAsset}...`, delay: 2800 },
        { log: `> [04/05] SYNTHESIZING SAFETY PROCEDURAL AUDITS FOR SITE TECHNICIANS...`, delay: 3800 },
        { log: `> [05/05] SAFETY INSTRUCTION MATRIX FORWARDED FOR COMMAND REVIEW`, delay: 4800 },
      ];
    }

    steps.forEach((step, idx) => {
      const tid = setTimeout(() => {
        setInvestigationStep(idx + 1);
        setInvestigationLogs((prev) => [...prev, step.log]);
      }, step.delay);
      investigationTimers.current.push(tid);
    });

    const completionTid = setTimeout(() => {
      investigationTimers.current = [];
      setIsInvestigating(false);
      setInvestigationStep(0);
      onComplete();
    }, 5600);
    investigationTimers.current.push(completionTid);
  };

  const runRCAAgent = async () => {
    if (!selectedAssetTag) return;
    if (rcaLoading || riskAgentLoading || complianceAgentLoading || lessonsLoading) return;
    setRcaLoading(true);
    setRcaError(null);
    setRcaResult(null);

    const runCall = async () => {
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
        if (res.data && res.data.graph_trace) {
          setActiveGraphTrace(res.data.graph_trace);
          if (ENABLE_INVESTIGATION_HUD && res.data.graph_trace.reasoning_steps) {
            for (let i = 0; i < res.data.graph_trace.reasoning_steps.length; i++) {
              await new Promise(r => setTimeout(r, 600));
              setInvestigationLogs(prev => [...prev, `> [INFERENCE] ${res.data.graph_trace.reasoning_steps[i]}`]);
            }
          }
        }
        if (ENABLE_INVESTIGATION_HUD) {
          await new Promise(r => setTimeout(r, 800));
        }
      } catch (err) {
        setRcaError(err.message || 'RCA analysis failed. Please retry.');
      } finally {
        setRcaLoading(false);
        setIsInvestigating(false);
        setInvestigationStep(0);
      }
    };

    if (ENABLE_INVESTIGATION_HUD) {
      startInvestigation(selectedAssetTag, 'rca', runCall);
    } else {
      runCall();
    }
  };

  const runRiskAgent = async () => {
    if (!selectedAssetTag) return;
    if (rcaLoading || riskAgentLoading || complianceAgentLoading || lessonsLoading) return;
    setRiskAgentLoading(true);
    setRiskAgentError(null);
    setRiskAgentResult(null);

    const runCall = async () => {
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
        if (res.data && res.data.graph_trace) {
          setActiveGraphTrace(res.data.graph_trace);
          if (ENABLE_INVESTIGATION_HUD && res.data.graph_trace.reasoning_steps) {
            for (let i = 0; i < res.data.graph_trace.reasoning_steps.length; i++) {
              await new Promise(r => setTimeout(r, 600));
              setInvestigationLogs(prev => [...prev, `> [INFERENCE] ${res.data.graph_trace.reasoning_steps[i]}`]);
            }
          }
        }
        if (ENABLE_INVESTIGATION_HUD) {
          await new Promise(r => setTimeout(r, 800));
        }
      } catch (err) {
        setRiskAgentError(err.message || 'Risk analysis failed. Please retry.');
      } finally {
        setRiskAgentLoading(false);
        setIsInvestigating(false);
        setInvestigationStep(0);
      }
    };

    if (ENABLE_INVESTIGATION_HUD) {
      startInvestigation(selectedAssetTag, 'risk', runCall);
    } else {
      runCall();
    }
  };

  const runComplianceAgent = async () => {
    if (!selectedAssetTag) return;
    if (rcaLoading || riskAgentLoading || complianceAgentLoading || lessonsLoading) return;
    setComplianceAgentLoading(true);
    setComplianceAgentError(null);
    setComplianceAgentResult(null);

    const runCall = async () => {
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
        if (res.data && res.data.graph_trace) {
          setActiveGraphTrace(res.data.graph_trace);
          if (ENABLE_INVESTIGATION_HUD && res.data.graph_trace.reasoning_steps) {
            for (let i = 0; i < res.data.graph_trace.reasoning_steps.length; i++) {
              await new Promise(r => setTimeout(r, 600));
              setInvestigationLogs(prev => [...prev, `> [INFERENCE] ${res.data.graph_trace.reasoning_steps[i]}`]);
            }
          }
        }
        if (ENABLE_INVESTIGATION_HUD) {
          await new Promise(r => setTimeout(r, 800));
        }
      } catch (err) {
        setComplianceAgentError(err.message || 'Compliance analysis failed. Please retry.');
      } finally {
        setComplianceAgentLoading(false);
        setIsInvestigating(false);
        setInvestigationStep(0);
      }
    };

    if (ENABLE_INVESTIGATION_HUD) {
      startInvestigation(selectedAssetTag, 'compliance', runCall);
    } else {
      runCall();
    }
  };

  const runLessonsLearnedAgent = async () => {
    if (!selectedAssetTag) return;
    if (rcaLoading || riskAgentLoading || complianceAgentLoading || lessonsLoading) return;
    setLessonsLoading(true);
    setLessonsError(null);
    setLessonsResult(null);

    const runCall = async () => {
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
        if (res.data && res.data.graph_trace) {
          setActiveGraphTrace(res.data.graph_trace);
          if (ENABLE_INVESTIGATION_HUD && res.data.graph_trace.reasoning_steps) {
            for (let i = 0; i < res.data.graph_trace.reasoning_steps.length; i++) {
              await new Promise(r => setTimeout(r, 600));
              setInvestigationLogs(prev => [...prev, `> [INFERENCE] ${res.data.graph_trace.reasoning_steps[i]}`]);
            }
          }
        }
        if (ENABLE_INVESTIGATION_HUD) {
          await new Promise(r => setTimeout(r, 800));
        }
      } catch (err) {
        setLessonsError(err.message || 'Lessons extraction failed. Please retry.');
      } finally {
        setLessonsLoading(false);
        setIsInvestigating(false);
        setInvestigationStep(0);
      }
    };

    if (ENABLE_INVESTIGATION_HUD) {
      startInvestigation(selectedAssetTag, 'lessons', runCall);
    } else {
      runCall();
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
          --theme-accent: var(--accent-primary);
        }
        /* Custom scrollbar to match industrial look */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: var(--bg-app);
        }
        ::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--border-hover);
        }
        /* Standard card override rules for custom themes */
        .theme-slate, .theme-steel, .theme-graphite {
          --tw-bg-opacity: 1;
        }
        .bg-slate-900, .bg-slate-900\\/40, .bg-slate-900\\/60, .bg-slate-900\\/70, .bg-slate-950, .bg-slate-950\\/40, .bg-slate-950\\/50 {
          background-color: var(--bg-card) !important;
        }
        .border-slate-800, .border-slate-850, .border-slate-700\\/60, .border-slate-700\\/40 {
          border-color: var(--border-color) !important;
        }
        .text-slate-100, .text-slate-200, .text-slate-300 {
          color: var(--text-primary) !important;
        }
        .text-slate-400, .text-slate-500 {
          color: var(--text-muted) !important;
        }
        .text-cyan-400, .text-fuchsia-400 {
          color: var(--accent-primary) !important;
        }
        .bg-cyan-500\\/10, .bg-fuchsia-500\\/10, .bg-emerald-500\\/10 {
          background-color: var(--bg-pill) !important;
          border-color: var(--border-pill) !important;
        }
        .border-cyan-500\\/10, .border-cyan-500\\/20, .border-cyan-500\\/30, .border-fuchsia-500\\/20 {
          border-color: var(--border-pill) !important;
        }
        .text-cyan-300 {
          color: var(--accent-primary) !important;
        }
      `}</style>
      {/* P5: Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden animate-backdrop-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* P5: Responsive sidebar — fixed on mobile, static on md+ */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 bg-[var(--bg-card)] border-r border-[var(--border-color)] flex flex-col flex-shrink-0
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-5 border-b border-[var(--border-color)] flex flex-col gap-1 bg-slate-950/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5.5 w-5.5 text-[var(--accent-primary)]" />
            <span className="font-black text-[16px] tracking-wider text-[var(--text-primary)] uppercase">OPSBRAIN AI</span>
          </div>
          <div className="text-[9px] font-mono text-slate-500 uppercase leading-none tracking-widest mt-1">
            SYS: OPSBRAIN_V1.2 // REGION: VIZAG_STEEL // STATUS: ACTIVE
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1.5">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-[15px] font-semibold transition duration-150 border ${
              activeTab === 'dashboard' 
                ? 'bg-[var(--bg-pill)] text-[var(--accent-primary)] border-[var(--border-pill)]' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-800/25 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Database className="h-4.5 w-4.5" />
              <span>Dashboard</span>
            </div>
            <span className="text-[9px] font-mono opacity-50 font-bold">[01]</span>
          </button>

          <button 
            onClick={() => {
              setActiveTab('executive');
              loadExecutiveData();
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-[15px] font-semibold transition duration-150 border ${
              activeTab === 'executive' 
                ? 'bg-[var(--bg-pill)] text-[var(--accent-primary)] border-[var(--border-pill)]' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-800/25 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4.5 w-4.5" />
              <span>Executive View</span>
            </div>
            <span className="text-[9px] font-mono opacity-50 font-bold">[02]</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('twin')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-[15px] font-semibold transition duration-150 border ${
              activeTab === 'twin' 
                ? 'bg-[var(--bg-pill)] text-[var(--accent-primary)] border-[var(--border-pill)]' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-800/25 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Network className="h-4.5 w-4.5" />
              <span>Digital Twin</span>
            </div>
            <span className="text-[9px] font-mono opacity-50 font-bold">[03]</span>
          </button>
          
          <button 
            onClick={() => {
              setActiveTab('ingestion');
              loadDocuments();
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-[15px] font-semibold transition duration-150 border ${
              activeTab === 'ingestion' 
                ? 'bg-[var(--bg-pill)] text-[var(--accent-primary)] border-[var(--border-pill)]' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-800/25 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <UploadCloud className="h-4.5 w-4.5" />
              <span>Ingestion</span>
            </div>
            <span className="text-[9px] font-mono opacity-50 font-bold">[04]</span>
          </button>

          <button 
            onClick={() => {
              setActiveTab('pid_parser');
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-[15px] font-semibold transition duration-150 border ${
              activeTab === 'pid_parser' 
                ? 'bg-[var(--bg-pill)] text-[var(--accent-primary)] border-[var(--border-pill)]' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-800/25 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Network className="h-4.5 w-4.5" />
              <span>P&ID Parser</span>
            </div>
            <span className="text-[9px] font-mono opacity-50 font-bold">[05]</span>
          </button>

          <button 
            onClick={() => {
              setActiveTab('evaluation');
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-[15px] font-semibold transition duration-150 border ${
              activeTab === 'evaluation' 
                ? 'bg-[var(--bg-pill)] text-[var(--accent-primary)] border-[var(--border-pill)]' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-800/25 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4.5 w-4.5" />
              <span>Evaluation & Benchmarks</span>
            </div>
            <span className="text-[9px] font-mono opacity-50 font-bold">[06]</span>
          </button>
        </nav>

        
        {/* Presentation & Demo Control Panel */}
        <div className="p-4 border-t border-[var(--border-color)] space-y-3 bg-[var(--bg-app)]/30">
          <div className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-[var(--accent-primary)]" />
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
            className="w-full py-1.5 px-3 bg-[var(--bg-pill)] hover:bg-[var(--bg-pill)]/20 text-[var(--accent-primary)] border border-[var(--border-pill)] hover:border-[var(--accent-primary)] rounded-lg text-xs font-bold transition duration-200 ease-in-out flex items-center justify-center gap-1.5"
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
        <header className="h-16 border-b border-[var(--border-color)] flex items-center justify-between px-4 md:px-8 bg-[var(--bg-card)]/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* P5: Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-[var(--text-primary)] capitalize">
              {activeTab === 'twin' ? 'Asset Digital Twin'
                : activeTab === 'executive' ? 'Executive View'
                : activeTab === 'pid_parser' ? 'P&ID Blueprint Parser'
                : `${activeTab} Workspace`}
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end py-1">
            {/* Theme Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/60 border border-[var(--border-color)] rounded-full text-xs transition duration-300">
              <span className="font-semibold opacity-60">THEME:</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer pr-1 text-xs font-bold"
              >
                <option value="slate" className="bg-slate-900 text-slate-200">Slate Obsidian 🌑</option>
                <option value="steel" className="bg-slate-900 text-slate-200">Industrial Steel ⚙️</option>
                <option value="graphite" className="bg-slate-900 text-slate-200">Midnight Graphite ⬢</option>
              </select>
            </div>

            {/* API Status Pill */}
            <button
              onClick={() => setIsMonitorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/40 border border-[var(--border-color)] rounded-full text-[10px] md:text-xs font-semibold tracking-wider transition duration-200 hover:bg-slate-800/40 focus:outline-none cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${apiStatus === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <span>API STATUS</span>
            </button>

            {/* Online Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/40 border border-[var(--border-color)] rounded-full text-[10px] md:text-xs font-semibold tracking-wider text-[var(--text-muted)]">
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
            <div className="max-w-7xl mx-auto space-y-6 px-2">
              {/* Hero Banner */}
              <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg relative overflow-hidden shadow-sm card-premium">
                {renderCadCorners()}
                <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--accent-primary)]/5 rounded-full filter blur-3xl"></div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-[26px] md:text-[30px] font-black text-[var(--text-primary)] tracking-tight">OpsBrain AI Command Center</h2>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">[SYS_CENTRAL_CONSOLE // NODE: 001]</span>
                </div>
                <p className="text-[14px] text-[var(--text-muted)] max-w-xl leading-relaxed mb-6 font-medium">
                  Industrial plant operations optimizer. Map P&IDs into graph digital twins, ingestion SOP documentation, and query RAG agents for safety assessments.
                </p>
                
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-950/30 border border-[var(--border-color)] rounded-lg relative card-premium">
                    {renderCadCorners()}
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Digital twins</div>
                    <div className="text-[28px] font-black text-[var(--accent-primary)] font-mono mt-1">{stats.totalAssets} Assets</div>
                  </div>
                  <div className="p-4 bg-slate-950/30 border border-[var(--border-color)] rounded-lg relative card-premium">
                    {renderCadCorners()}
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Active Failures</div>
                    <div className="text-[28px] font-black text-[var(--color-critical)] font-mono mt-1">
                      {selectedAssetDetails && selectedAssetDetails.incidents ? selectedAssetDetails.incidents.length : 0} Active
                    </div>
                  </div>
                  <div className="p-4 bg-slate-950/30 border border-[var(--border-color)] rounded-lg relative card-premium">
                    {renderCadCorners()}
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Compliance checks</div>
                    <div className="text-[28px] font-black font-mono mt-1"
                      style={{ color: executiveData?.compliance_summary?.non_compliant > 0 ? 'var(--color-critical)' : 'var(--color-healthy)' }}
                    >
                      {executiveData?.compliance_summary
                        ? `${executiveData.compliance_summary.compliant}/${executiveData.compliance_summary.total} OK`
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-950/30 border border-[var(--border-color)] rounded-lg relative card-premium">
                    {renderCadCorners()}
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Embedding Dim</div>
                    <div className="text-[28px] font-black text-[var(--accent-ai)] font-mono mt-1">384 Dim</div>
                  </div>
                </div>
              </div>

              {/* Recent Failures Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg space-y-4 relative card-premium">
                  {renderCadCorners()}
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-[var(--text-primary)] text-[16px] tracking-wider uppercase flex items-center gap-2">
                      <AlertOctagon className="h-4.5 w-4.5 text-[var(--color-critical)]" />
                      Failures & Critical Events
                    </h3>
                    <span className="text-[9px] font-mono text-slate-500">[LOG_INCIDENTS]</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto pr-2">
                    <IncidentTimeline incidents={recentIncidents} />
                  </div>
                </div>

                <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg space-y-4 relative card-premium">
                  {renderCadCorners()}
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-[var(--text-primary)] text-[16px] tracking-wider uppercase flex items-center gap-2">
                      <Wrench className="h-4.5 w-4.5 text-[var(--accent-primary)]" />
                      Maintenance Operations
                    </h3>
                    <span className="text-[9px] font-mono text-slate-500">[LOG_WORKORDERS]</span>
                  </div>
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
              <div className={`w-80 flex flex-col border border-slate-800 bg-slate-900/40 rounded-xl p-4 space-y-4 flex-shrink-0 transition-all duration-500 ${isInvestigating ? 'opacity-20 blur-[0.5px] pointer-events-none' : ''}`}>
                <h3 className="font-bold text-slate-200 px-2 flex items-center gap-2">
                  <Database className="h-4.5 w-4.5 text-cyan-400" />
                  Asset Register ({assets.length})
                </h3>
                
                {loadingAssets ? (
                  <div className="flex-1 py-4">
                    <LoaderSkeleton type="list" />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-1 space-y-1">
                    {assets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => setSelectedAssetTag(asset.tag_number)}
                        className={`w-full text-left p-2.5 rounded-lg transition duration-150 border text-xs flex flex-col gap-1 ${
                          selectedAssetTag === asset.tag_number
                            ? 'bg-[var(--bg-pill)] border-[var(--border-pill)] text-[var(--accent-primary)] font-semibold shadow-sm'
                            : 'bg-slate-900/40 border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-mono text-xs uppercase font-extrabold">{asset.tag_number}</span>
                          <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">{asset.category}</span>
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
                  <div className="py-8">
                    <LoaderSkeleton type="details" />
                  </div>
                ) : selectedAssetDetails ? (
                  <>
                    {/* Hero Card */}
                    <div className={`p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg relative overflow-hidden shadow-sm card-premium transition-all duration-500 ${isInvestigating ? 'opacity-20 blur-[0.5px] pointer-events-none' : ''}`}>
                      {renderCadCorners()}
                      <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent-primary)]/5 rounded-full filter blur-2xl"></div>
                      <div className="flex justify-between items-start gap-4 flex-wrap">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="px-2.5 py-1 rounded bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-xs font-bold font-mono text-[var(--accent-primary)] uppercase">
                              {selectedAssetDetails.asset.tag_number}
                            </span>
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                              Category: {selectedAssetDetails.asset.category}
                            </span>
                          </div>
                          <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight">
                            {selectedAssetDetails.asset.name}
                          </h2>
                          {selectedAssetDetails.asset.description && (
                            <p className="text-[14px] text-[var(--text-muted)] leading-relaxed max-w-2xl font-medium">
                              {selectedAssetDetails.asset.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs text-slate-500 font-mono">
                          [SYS_twin_id // {selectedAssetDetails.asset.id.slice(0, 8)}]
                        </div>
                      </div>
                    </div>

                    {/* P2: Agent Action Bar */}
                    <div className={`p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg relative overflow-hidden card-premium shadow-sm transition-all duration-500 ${isInvestigating ? 'opacity-20 blur-[0.5px] pointer-events-none' : ''}`}>
                      {renderCadCorners()}
                      <div className="text-[10px] uppercase font-black tracking-widest text-[var(--accent-ai)] mb-3 flex items-center gap-1.5 justify-between">
                        <span className="flex items-center gap-1.5"><Brain className="h-3.5 w-3.5" /> AI Agent Actions — {selectedAssetDetails.asset.tag_number}</span>
                        <span className="text-[8px] font-mono text-slate-500">[SYS_AGENT_ROUTING]</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {/* Run RCA */}
                        <button
                          type="button"
                          onClick={(e) => { e && e.preventDefault(); e && e.stopPropagation(); runRCAAgent(); }}
                          disabled={rcaLoading || riskAgentLoading || complianceAgentLoading || lessonsLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition disabled:opacity-50"
                        >
                          {rcaLoading ? <Loader className="h-3 w-3 animate-spin" /> : <AlertOctagon className="h-3 w-3" />}
                          {rcaLoading ? 'Analyzing...' : 'Run RCA'}
                        </button>
                        {/* Run Risk */}
                        <button
                          type="button"
                          onClick={(e) => { e && e.preventDefault(); e && e.stopPropagation(); runRiskAgent(); }}
                          disabled={rcaLoading || riskAgentLoading || complianceAgentLoading || lessonsLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 transition disabled:opacity-50"
                        >
                          {riskAgentLoading ? <Loader className="h-3 w-3 animate-spin" /> : <Activity className="h-3 w-3" />}
                          {riskAgentLoading ? 'Calculating...' : 'Run Risk Score'}
                        </button>
                        {/* Run Compliance */}
                        <button
                          type="button"
                          onClick={(e) => { e && e.preventDefault(); e && e.stopPropagation(); runComplianceAgent(); }}
                          disabled={rcaLoading || riskAgentLoading || complianceAgentLoading || lessonsLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/20 transition disabled:opacity-50"
                        >
                          {complianceAgentLoading ? <Loader className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                          {complianceAgentLoading ? 'Checking...' : 'Run Compliance'}
                        </button>
                        {/* Lessons Learned */}
                        <button
                          type="button"
                          onClick={(e) => { e && e.preventDefault(); e && e.stopPropagation(); runLessonsLearnedAgent(); }}
                          disabled={rcaLoading || riskAgentLoading || complianceAgentLoading || lessonsLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition disabled:opacity-50"
                        >
                          {lessonsLoading ? <Loader className="h-3 w-3 animate-spin" /> : <BookOpen className="h-3 w-3" />}
                          {lessonsLoading ? 'Extracting...' : 'Extract Lessons'}
                        </button>
                      </div>
                      {rcaError && (
                        <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg text-xs font-semibold">
                          RCA analysis failed: {rcaError} Please retry.
                        </div>
                      )}
                      {riskAgentError && (
                        <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg text-xs font-semibold">
                          Risk analysis failed: {riskAgentError} Please retry.
                        </div>
                      )}
                      {complianceAgentError && (
                        <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg text-xs font-semibold">
                          Compliance analysis failed: {complianceAgentError} Please retry.
                        </div>
                      )}
                      {lessonsError && (
                        <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg text-xs font-semibold">
                          Lessons extraction failed: {lessonsError} Please retry.
                        </div>
                      )}

                      {rcaLoading && !ENABLE_INVESTIGATION_HUD && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400 font-semibold font-mono animate-pulse">
                          <Loader className="h-3.5 w-3.5 animate-spin" /> Running RCA analysis...
                        </div>
                      )}
                      {riskAgentLoading && !ENABLE_INVESTIGATION_HUD && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-400 font-semibold font-mono animate-pulse">
                          <Loader className="h-3.5 w-3.5 animate-spin" /> Running Risk Score calculation...
                        </div>
                      )}
                      {complianceAgentLoading && !ENABLE_INVESTIGATION_HUD && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-fuchsia-400 font-semibold font-mono animate-pulse">
                          <Loader className="h-3.5 w-3.5 animate-spin" /> Running Compliance safety audit...
                        </div>
                      )}
                      {lessonsLoading && !ENABLE_INVESTIGATION_HUD && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400 font-semibold font-mono animate-pulse">
                          <Loader className="h-3.5 w-3.5 animate-spin" /> Extracting Lessons learned...
                        </div>
                      )}
                    </div>

                    {/* P2: RCA Result Card */}
                    {rcaResult && (
                      <div className={`p-5 bg-rose-500/5 border border-rose-500/20 rounded-lg space-y-3 relative overflow-hidden card-premium shadow-sm transition-all duration-500 ${isInvestigating ? 'opacity-20 blur-[0.5px] pointer-events-none' : ''}`}>
                        {renderCadCorners()}
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
                          <div className="text-[10px] text-rose-400/60 uppercase font-bold tracking-wider mb-1 font-mono">Root Cause</div>
                          <p className="text-sm text-slate-200 leading-relaxed font-medium">{rcaResult.identified_root_cause}</p>
                        </div>
                        {rcaResult.contributing_factors?.length > 0 && (
                          <div>
                            <div className="text-[10px] text-rose-400/60 uppercase font-bold tracking-wider mb-1 font-mono">Contributing Factors</div>
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
                            <div className="text-[10px] text-emerald-400/60 uppercase font-bold tracking-wider mb-1 font-mono">Suggested Mitigations</div>
                            <ul className="space-y-1">
                              {rcaResult.suggested_mitigations.map((m, i) => (
                                <li key={i} className="flex gap-2 text-xs text-slate-300">
                                  <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0 mt-0.5" />{m}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {renderProviderMetadataChip(rcaResult)}
                      </div>
                    )}

                    {/* P2: Risk Agent Result */}
                    {riskAgentResult && (
                      <div className={`p-5 border rounded-lg space-y-3 relative overflow-hidden card-premium shadow-sm transition-all duration-500 ${riskLevelBg(riskAgentResult.risk_level)} ${isInvestigating ? 'opacity-20 blur-[0.5px] pointer-events-none' : ''}`}>
                        {renderCadCorners()}
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
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">{riskAgentResult.explanation}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Risk score written to database. Refresh Executive Dashboard to see updated distribution.</p>
                        {renderProviderMetadataChip(riskAgentResult)}
                      </div>
                    )}

                    {/* P2: Compliance Agent Result */}
                    {complianceAgentResult && (
                      <div className={`p-5 border rounded-lg space-y-3 relative overflow-hidden card-premium shadow-sm transition-all duration-500 ${isInvestigating ? 'opacity-20 blur-[0.5px] pointer-events-none' : ''} ${
                        complianceAgentResult.status === 'NON_COMPLIANT' ? 'bg-rose-500/5 border-rose-500/20'
                        : complianceAgentResult.status === 'UNDER_REVIEW' ? 'bg-amber-500/5 border-amber-500/20'
                        : 'bg-emerald-500/5 border-emerald-500/20'
                      }`}>
                        {renderCadCorners()}
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
                            <div className="text-[10px] text-rose-400/60 uppercase font-bold tracking-wider mb-1 font-mono">Violations Detected</div>
                            <ul className="space-y-1">
                              {complianceAgentResult.violations.map((v, i) => (
                                <li key={i} className="flex gap-2 text-xs text-slate-300">
                                  <XCircle className="h-3 w-3 text-rose-400 flex-shrink-0 mt-0.5" />{v}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">{complianceAgentResult.findings}</p>

                        {/* Explainable Compliance Evidence Section */}
                        <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-3">
                          <div className="text-[10px] text-fuchsia-400/80 uppercase font-black tracking-widest font-mono">
                            Explainable Compliance Evidence
                          </div>
                          {complianceAgentResult.compliance_evidence && complianceAgentResult.compliance_evidence.length > 0 ? (
                            <div className="space-y-3">
                              {complianceAgentResult.compliance_evidence.map((ev, idx) => (
                                <div key={idx} className="p-3 bg-slate-950/40 border border-slate-800/40 rounded-lg space-y-2 text-xs">
                                  <div className="flex justify-between items-start gap-2 flex-wrap">
                                    <div>
                                      <span className="font-bold text-slate-300">Asset:</span> <span className="font-mono text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded">{ev.affected_asset || 'N/A'}</span>
                                    </div>
                                    <div className="flex gap-2 text-[9px] font-mono">
                                      <span className="text-rose-400 border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.2 rounded uppercase">{ev.severity || 'Medium'}</span>
                                      <span className="text-slate-400 border border-slate-500/20 bg-slate-500/10 px-1.5 py-0.2 rounded uppercase">Confidence: {ev.confidence || 'High'}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-400">Issue:</span> <span className="text-slate-200">{ev.issue || 'Compliance review required'}</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-900/30 p-2 rounded">
                                    <div>
                                      <span className="text-slate-500 font-medium">Observed Value:</span> <span className="font-bold text-slate-300">{ev.observed_value || 'N/A'} {ev.unit || ''}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 font-medium">Allowed Threshold:</span> <span className="font-bold text-emerald-400">{ev.allowed_threshold || 'N/A'} {ev.unit || ''}</span>
                                    </div>
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    <span className="text-slate-500 font-medium">Source Document:</span> <span className="italic text-slate-300">{ev.source_document || 'N/A'}</span> 
                                    {ev.citation && <span className="text-slate-500 text-[10px] ml-1">({ev.citation})</span>}
                                  </div>
                                  {ev.recommended_action && (
                                    <div className="pt-1.5 border-t border-slate-800/60">
                                      <span className="font-bold text-emerald-400 block mb-0.5">Recommended Action:</span>
                                      <p className="text-slate-300 text-[11px] leading-relaxed">{ev.recommended_action}</p>
                                    </div>
                                  )}
                                  {ev.why_it_matters && (
                                    <div className="text-[10px] text-slate-500 italic">
                                      * {ev.why_it_matters}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 font-mono italic">
                              No structured compliance evidence returned for this run.
                            </div>
                          )}
                        </div>

                        {renderProviderMetadataChip(complianceAgentResult)}
                      </div>
                    )}

                    {/* Middle grid: Risk Score & Compliance */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 ${isInvestigating ? 'opacity-20 blur-[0.5px] pointer-events-none' : ''}`}>
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
                        investigationStep={investigationStep}
                        isInvestigating={isInvestigating}
                        activeGraphTrace={activeGraphTrace}
                      />
                    </div>

                    {/* Timeline & Maintenance log list */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 ${isInvestigating ? 'opacity-20 blur-[0.5px] pointer-events-none' : ''}`}>
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
                      <div className={`p-5 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-4 relative overflow-hidden card-premium shadow-sm transition-all duration-500 ${isInvestigating ? 'opacity-20 blur-[0.5px] pointer-events-none' : ''}`}>
                        {renderCadCorners()}
                        <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                          <BookOpen className="h-4 w-4" /> Lessons Learned & Failure Intelligence
                        </h4>
                        {lessonsResult.lessons_extracted?.length > 0 && (
                          <div>
                            <div className="text-[10px] text-amber-400/60 uppercase font-bold tracking-wider mb-2 font-mono">Key Lessons Extracted</div>
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
                            <div className="text-[10px] text-cyan-400/60 uppercase font-bold tracking-wider mb-2 font-mono">Preventive Actions</div>
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
                            <div className="text-[10px] text-emerald-400/60 uppercase font-bold tracking-wider mb-2 font-mono">Safety Recommendations</div>
                            <ul className="space-y-1.5">
                              {lessonsResult.safety_recommendations.map((r, i) => (
                                <li key={i} className="flex gap-2 text-xs text-slate-300">
                                  <ShieldCheck className="h-3 w-3 text-emerald-400 flex-shrink-0 mt-0.5" />{r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {renderProviderMetadataChip(lessonsResult)}
                      </div>
                    )}

                    {/* P1 + P4: Agent Knowledge Copilot Chat Panel */}
                    <div className={`p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg space-y-4 shadow-sm relative overflow-hidden card-premium transition-all duration-500 ${isInvestigating ? 'opacity-20 blur-[0.5px] pointer-events-none' : ''}`}>
                      {renderCadCorners()}
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-[var(--accent-ai)] text-[16px] flex items-center gap-2 uppercase tracking-wider">
                          <MessageSquare className="h-4.5 w-4.5" /> Knowledge Copilot
                          <span className="text-[10px] font-normal text-slate-500 ml-1 lowercase normal-case">— Ask anything about safety SOPs, manuals, or failures</span>
                        </h4>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">[SYS_KNOWLEDGE_RAG]</span>
                      </div>

                      <form onSubmit={runKnowledgeAgent} className="flex gap-2">
                        <input
                          type="text"
                          value={agentQuery}
                          onChange={(e) => setAgentQuery(e.target.value)}
                          placeholder={selectedAssetTag ? `Ask about ${selectedAssetTag}... e.g. "Why is ${selectedAssetTag} at risk?"` : 'Select an asset first...'}
                          className="flex-1 px-4 py-2 bg-slate-950/60 border border-[var(--border-color)] rounded-lg text-[15px] text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-[var(--accent-ai)]/50 focus:ring-1 focus:ring-[var(--accent-ai)]/30"
                        />
                        <button
                          type="submit"
                          disabled={knowledgeLoading || !agentQuery.trim()}
                          className="px-5 py-2 bg-[var(--accent-ai)] hover:opacity-90 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-lg text-xs transition duration-150 flex items-center gap-1.5 flex-shrink-0 hover:shadow-md"
                        >
                          {knowledgeLoading
                            ? <Loader className="h-4 w-4 animate-spin text-slate-950" />
                            : <Send className="h-4 w-4 text-slate-950" />}
                          {knowledgeLoading ? 'Thinking...' : 'Ask'}
                        </button>
                      </form>

                      <div className="flex items-center gap-3 text-[9px] font-mono text-slate-500 uppercase tracking-wider border-t border-[var(--border-color)]/60 pt-3">
                        <span className="font-extrabold text-[var(--accent-ai)]">Powered by:</span>
                        <span>Groq LLM</span>
                        <span className="opacity-40">|</span>
                        <span>Mistral RAG</span>
                        <span className="opacity-40">|</span>
                        <span>BGE Embeddings</span>
                      </div>

                      {knowledgeError && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs rounded-lg flex items-center gap-2">
                          <AlertOctagon className="h-4 w-4 text-rose-400" />
                          <span>{knowledgeError}</span>
                        </div>
                      )}

                      {knowledgeResult && (
                        <div className="space-y-3.5">
                          {/* Answer block */}
                          <div className="p-3.5 bg-slate-950/60 border border-[var(--border-color)] rounded-lg space-y-2.5 shadow-sm">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="text-[10px] text-[var(--accent-primary)]/80 uppercase font-black tracking-widest">AI Answer</div>
                              {knowledgeResult.confidence !== undefined && (
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${
                                  knowledgeResult.confidence >= 0.8 ? 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10'
                                  : knowledgeResult.confidence >= 0.5 ? 'text-amber-400 border-amber-500/25 bg-amber-500/10'
                                  : 'text-rose-400 border-rose-500/25 bg-rose-500/10'
                                }`}>
                                  Confidence: {Math.round(knowledgeResult.confidence * 100)}%
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap font-medium">{knowledgeResult.answer}</p>
                            {renderProviderMetadataChip(knowledgeResult)}
                            {knowledgeResult.related_tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {knowledgeResult.related_tags.map((tag) => (
                                  <button
                                    key={tag}
                                    onClick={() => { setSelectedAssetTag(tag); setSidebarOpen(false); }}
                                    className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-[var(--accent-primary)] bg-[var(--bg-pill)] border border-[var(--border-pill)] hover:bg-[var(--bg-pill)]/30 transition"
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Evidence Path Panel */}
                          <div className="p-3.5 bg-slate-950/40 border border-[var(--border-color)] rounded-lg space-y-3 shadow-sm relative overflow-hidden">
                            <div className="text-[10px] text-cyan-400/80 uppercase font-black tracking-widest flex items-center gap-1.5">
                              <Network className="h-3.5 w-3.5" />
                              Graph-Aware Evidence Path
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 text-xs text-slate-300 flex-wrap">
                              {/* Selected Asset */}
                              <div className="px-2 py-1 bg-slate-900 border border-[var(--border-color)] rounded font-mono font-bold text-slate-200">
                                {selectedAssetTag || "N/A"}
                              </div>
                              
                              <span className="text-slate-600 hidden sm:inline">→</span>
                              
                              {/* Related Graph Nodes */}
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {knowledgeResult.graph_trace?.affected_nodes?.filter(n => n !== selectedAssetTag).length > 0 ? (
                                  knowledgeResult.graph_trace.affected_nodes.filter(n => n !== selectedAssetTag).map(node => (
                                    <span key={node} className="px-2 py-1 bg-cyan-950/30 border border-cyan-800/30 text-cyan-400 rounded font-mono text-[11px] font-bold">
                                      {node}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-500 italic">No connected nodes</span>
                                )}
                              </div>
                              
                              <span className="text-slate-600 hidden sm:inline">→</span>
                              
                              {/* Retrieved Documents & Regulations */}
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {knowledgeResult.graph_trace?.evidence_refs?.length > 0 ? (
                                  knowledgeResult.graph_trace.evidence_refs.map(ref => (
                                    <span key={ref} className="px-2 py-1 bg-fuchsia-950/30 border border-fuchsia-800/30 text-fuchsia-400 rounded font-mono text-[10px] font-bold">
                                      {ref}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-500 italic">No regulations referenced</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Detailed reasoning path bullet logs if available */}
                            {knowledgeResult.graph_trace?.reasoning_steps?.length > 0 && (
                              <div className="pt-2 border-t border-[var(--border-color)]/60 text-[11px] text-slate-400 space-y-1">
                                <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Trace Reasoning:</div>
                                {knowledgeResult.graph_trace.reasoning_steps.map((step, idx) => (
                                  <div key={idx} className="flex gap-1">
                                    <span className="text-cyan-400">›</span> {step}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* P4: Source Citations */}
                          {knowledgeResult.sources && knowledgeResult.sources.length > 0 ? (
                            <div className="space-y-2">
                              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Source Citations</div>
                              <div className="flex flex-wrap gap-2">
                                {knowledgeResult.sources.map((src, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-950/40 border border-[var(--border-color)] rounded-lg hover:border-[var(--border-hover)] transition duration-150 shadow-sm"
                                  >
                                    <FileText className="h-3.5 w-3.5 text-[var(--accent-primary)] flex-shrink-0" />
                                    <div>
                                      <div className="text-[10px] font-bold text-slate-300 truncate max-w-[180px]">{src.title || src.label}</div>
                                      <div className="text-[9px] text-slate-500 font-mono">
                                        {src.page_number ? `Page ${src.page_number}` : ''}
                                        {src.page_number && src.similarity_score ? ' · ' : ''}
                                        {src.similarity_score ? `${Math.round(src.similarity_score * 100)}% match` : ''}
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
                  <div className="h-[400px] flex flex-col items-center justify-center text-[var(--text-muted)] border border-dashed border-[var(--border-color)] rounded-lg gap-3 bg-[var(--bg-card)]/20 p-8 text-center relative overflow-hidden card-premium">
                    {renderCadCorners()}
                    <Database className="h-10 w-10 text-slate-600 mb-1" />
                    <span className="text-[16px] font-bold text-slate-300 uppercase tracking-wider">No Asset Selected</span>
                    <span className="text-[14px] text-[var(--text-muted)] max-w-md font-medium leading-relaxed">
                      Select an active coke oven battery node, sensor, or valve from the Asset Register on the left to examine telemetry logs, incident records, safety audits, and to interact with operational agents.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- INGESTION TAB --- */}
          {activeTab === 'ingestion' && (
            <div className="max-w-7xl mx-auto space-y-6 px-2">
              {/* Uploader Form */}
              <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg space-y-4 shadow-sm relative overflow-hidden card-premium">
                {renderCadCorners()}
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Document Ingestion Pipeline</h3>
                    <p className="text-xs text-[var(--text-muted)] font-medium">
                      Upload manuals, safety SOPs, or compliant checklists. Supported extensions: PDF, DOCX, XLSX, CSV, TXT.
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">[SYS_INGEST_UPLOADER]</span>
                </div>

                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="border border-dashed border-[var(--border-color)] rounded-lg p-8 text-center bg-[var(--bg-app)]/30 flex flex-col items-center justify-center gap-3 hover:border-[var(--accent-primary)]/40 transition duration-200 ease-in-out">
                    <UploadCloud className="h-9 w-9 text-slate-500" />
                    <div className="text-xs text-slate-400 font-medium">
                      Select a file from your system to upload to the ingestion router.
                    </div>
                    <input 
                      id="file-upload-input"
                      type="file" 
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-[var(--bg-pill)] file:text-[var(--accent-primary)] hover:file:bg-[var(--bg-pill)]/30 cursor-pointer"
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
                    className="w-full py-2 bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-semibold rounded-lg text-xs transition duration-150 flex items-center justify-center gap-1.5 hover:shadow-md"
                  >
                    {uploading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin text-slate-950" />
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
                  <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 text-sm uppercase tracking-wider">
                    <FileText className="h-4.5 w-4.5 text-[var(--accent-primary)]" />
                    Ingested Document Registry
                  </h3>
                  <button 
                    onClick={loadDocuments}
                    className="p-2 hover:bg-slate-900 border border-[var(--border-color)] rounded-lg transition text-slate-400"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                {loadingDocs ? (
                  <div className="py-4">
                    <LoaderSkeleton type="list" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 border border-dashed border-[var(--border-color)] rounded-lg text-xs font-semibold">
                    No documents ingested yet.
                  </div>
                ) : (
                  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm relative card-premium p-1">
                    {renderCadCorners()}
                    <table className="w-full text-left border-collapse text-xs mt-1">
                      <thead>
                        <tr className="bg-slate-950/60 border-b border-[var(--border-color)] text-slate-500 font-bold uppercase tracking-wider">
                          <th className="p-3">Title</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Uploaded At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]/60">
                        {documents.map((doc) => {
                          const status = doc.metadata?.status || 'PROCESSED';
                          let statusClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
                          if (status === 'PENDING') statusClass = 'text-amber-400 bg-amber-500/10 border-amber-500/25';
                          if (status === 'FAILED') statusClass = 'text-rose-400 bg-rose-500/10 border-rose-500/25';
                          
                          return (
                            <tr key={doc.id} className="hover:bg-slate-800/10 transition duration-150">
                              <td className="p-3 font-semibold text-[var(--text-primary)]">{doc.title}</td>
                              <td className="p-3 font-mono text-[10px] uppercase text-slate-400">{doc.file_type}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] border font-bold uppercase tracking-wider ${statusClass}`}>
                                  {status}
                                </span>
                              </td>
                              <td className="p-3 text-right text-[10px] text-slate-400 font-mono">
                                {new Date(doc.created_at).toLocaleDateString()} {new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            <div className="max-w-7xl mx-auto space-y-6 px-2">
              <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg space-y-4 shadow-sm relative overflow-hidden card-premium">
                {renderCadCorners()}
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                      <Network className="h-4.5 w-4.5 text-[var(--accent-primary)]" />
                      P&ID Computer Vision Parser
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] font-medium">
                      Upload Piping & Instrumentation Diagram drawings (PNG, JPEG, PDF) for Gemini 2.5 Flash to automatically extract physical equipment assets and build the relational digital twin topology.
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">[SYS_VISION_PARSER]</span>
                </div>

                <form onSubmit={handlePidUpload} className="space-y-4">
                  <div className="border border-dashed border-[var(--border-color)] rounded-lg p-8 text-center bg-[var(--bg-app)]/30 flex flex-col items-center justify-center gap-3 hover:border-[var(--accent-primary)]/40 transition duration-200 ease-in-out">
                    <UploadCloud className="h-9 w-9 text-[var(--accent-primary)]" />
                    <div className="text-xs text-slate-400 font-medium">
                      Select P&ID image blueprint from your computer
                    </div>
                    <input 
                      id="pid-upload-input"
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={(e) => setPidFile(e.target.files[0])}
                      className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-[var(--bg-pill)] file:text-[var(--accent-primary)] hover:file:bg-[var(--bg-pill)]/30 cursor-pointer"
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
                    className="w-full py-2 bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-lg text-xs transition duration-150 flex items-center justify-center gap-1.5 hover:shadow-md"
                  >
                    {parsingPid ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin text-slate-950" />
                        Gemini analyzing P&ID blueprint & updating database...
                      </>
                    ) : (
                      'Run Gemini Vision Parser'
                    )}
                  </button>
                </form>
              </div>

              {pidParseResult && (
                <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg space-y-4 relative overflow-hidden card-premium">
                  {renderCadCorners()}
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-[var(--text-primary)] text-sm uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="h-4.5 w-4.5 text-[var(--color-healthy)]" />
                      Extraction Result Summary
                    </h4>
                    <span className="text-[9px] font-mono text-slate-500">[SYS_EXTRACTION_RESULTS]</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-950/40 rounded-lg border border-[var(--border-color)] text-center relative">
                      <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Assets Found</div>
                      <div className="text-2xl font-extrabold text-[var(--accent-ai)] mt-1">+{pidParseResult.assets_created}</div>
                    </div>
                    <div className="p-4 bg-slate-950/40 rounded-lg border border-[var(--border-color)] text-center relative">
                      <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Graph Nodes Created</div>
                      <div className="text-2xl font-extrabold text-[var(--accent-ai)] mt-1">+{pidParseResult.nodes_created}</div>
                    </div>
                    <div className="p-4 bg-slate-950/40 rounded-lg border border-[var(--border-color)] text-center relative">
                      <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Graph Edges Mapped</div>
                      <div className="text-2xl font-extrabold text-[var(--accent-ai)] mt-1">+{pidParseResult.edges_created}</div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => setActiveTab('twin')}
                      className="px-4 py-2 bg-slate-900 border border-[var(--border-color)] hover:border-[var(--accent-primary)] text-xs font-bold rounded-lg text-slate-300 transition"
                    >
                      Examine in Digital Twin View →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- EVALUATION & BENCHMARKS TAB --- */}
          {activeTab === 'evaluation' && (
            <EvaluationDashboard />
          )}
        </main>

      </div>

      {/* AI Runtime & Fallback Monitor Modal */}
      {isMonitorOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-backdrop-in">
          <div className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 relative flex flex-col max-h-[90vh] shadow-2xl animate-modal-in relative overflow-hidden card-premium rounded-lg">
            {renderCadCorners()}
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)]/60 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-[var(--accent-ai)]" />
                <h2 className="font-black text-lg tracking-tight text-slate-100 uppercase flex items-center gap-2">
                  AI Runtime & Fallback Monitor
                  <span className="text-[9px] font-mono text-slate-500 normal-case font-normal lowercase">— monitor LLM latency and fallback routing</span>
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClearTelemetry}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition"
                >
                  Clear Logs
                </button>
                <button
                  onClick={() => setIsMonitorOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Providers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {/* Groq Card */}
              <div className="p-4 bg-slate-950/40 border border-[var(--border-color)] rounded-lg space-y-2 relative">
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
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-color)]/60 text-xs">
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
                  <span className="font-mono font-bold text-[var(--accent-ai)]">
                    {telemetry.groq.reqs > 0 ? `${Math.round(telemetry.groq.totalLatency / telemetry.groq.reqs)}ms` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Gemini Card */}
              <div className="p-4 bg-slate-950/40 border border-[var(--border-color)] rounded-lg space-y-2 relative">
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
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-color)]/60 text-xs">
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
                  <span className="font-mono font-bold text-[var(--accent-ai)]">
                    {telemetry.gemini.reqs > 0 ? `${Math.round(telemetry.gemini.totalLatency / telemetry.gemini.reqs)}ms` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Mistral Card */}
              <div className="p-4 bg-slate-950/40 border border-[var(--border-color)] rounded-lg space-y-2 relative">
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
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-color)]/60 text-xs">
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
                  <span className="font-mono font-bold text-[var(--accent-ai)]">
                    {telemetry.mistral.reqs > 0 ? `${Math.round(telemetry.mistral.totalLatency / telemetry.mistral.reqs)}ms` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            {/* Telemetry Stream Monitor */}

            <div className="p-3 bg-slate-950/40 border border-[var(--border-color)] rounded-lg mb-4 text-xs flex justify-between items-center px-4 relative">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">SCADA Telemetry Stream (SSE)</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${
                telemetry.telemetryStream === 'CONNECTED' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                : telemetry.telemetryStream === 'DISCONNECTED' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                : telemetry.telemetryStream === 'FALLBACK_LOCAL' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                : 'text-slate-500 border-slate-500/30 bg-slate-500/10'
              }`}>
                {telemetry.telemetryStream}
              </span>
            </div>

            {/* Cache Row */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950/40 border border-[var(--border-color)] rounded-lg mb-6 text-xs relative">

              <div className="flex justify-between items-center px-2">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Prompt Cache Hits</span>
                <span className="font-mono font-bold text-[var(--accent-ai)] bg-[var(--accent-ai)]/10 border border-[var(--accent-ai)]/20 px-2 py-0.5 rounded">{telemetry.promptCacheHits}</span>
              </div>
              <div className="flex justify-between items-center px-2 border-l border-[var(--border-color)]/60">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Search Cache Hits</span>
                <span className="font-mono font-bold text-[var(--color-healthy)] bg-[var(--color-healthy)]/10 border border-[var(--color-healthy)]/20 px-2 py-0.5 rounded">{telemetry.searchCacheHits}</span>
              </div>
            </div>

            {/* Fallback Logs Terminal Box */}
            <div className="flex-1 flex flex-col min-h-[160px] overflow-hidden space-y-2">
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Fallback & Event logs</div>
              <div className="flex-1 p-4 bg-black border border-[var(--border-color)] rounded-lg font-mono text-[11px] overflow-y-auto space-y-1.5 text-slate-400">
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

      {/* AI Traversal Auditing Engine Viewport HUD Overlay */}
      {isInvestigating && ENABLE_INVESTIGATION_HUD && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 animate-backdrop-in">
          <div className="w-full max-w-4xl max-h-[70vh] bg-slate-900 border border-[var(--accent-ai)]/30 rounded-lg flex flex-col p-6 font-mono text-xs shadow-2xl relative overflow-hidden card-premium animate-modal-in">
            {renderCadCorners()}
            
            {/* HUD Header */}
            <div className="flex items-center justify-between border-b border-[var(--accent-ai)]/20 pb-3 mb-4">
              <span className="text-[var(--accent-ai)] font-black uppercase tracking-widest flex items-center gap-2 text-sm animate-pulse">
                <Brain className="h-4.5 w-4.5" /> AI Traversal Auditing Engine
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">[SYS_AGENT_REASONING_TRACE // VIEWPORT_HUD]</span>
            </div>
            
            {/* Terminal logs content */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 select-none min-h-[150px]">
              {investigationLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed text-cyan-400 font-medium font-mono text-[14px] animate-modal-in">
                  {log}
                </div>
              ))}
              {investigationStep < 5 && (
                <div className="text-slate-600 animate-pulse text-[14px] font-mono pl-3">
                  ⬢ Traversing graph edges...
                </div>
              )}
            </div>
            
            {/* HUD Footer */}
            <div className="border-t border-[var(--accent-ai)]/20 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
              <span>Status: Processing RAG & Graph Data</span>
              <span className="font-mono">Route Step: {investigationStep}/5</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap the entire exported app in the ErrorBoundary so any unhandled render
// exception in any panel shows a recovery screen instead of a blank page.
export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
