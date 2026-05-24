import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const SimulationContext = createContext(null);

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};

export const SimulationProvider = ({ children }) => {
  // --- 1. USER PARAMETERS & SYSTEM DIALS (Interactive Weights) ---
  const [rlExploration, setRlExploration] = useState(0.35); 
  const [modelWeightCF, setModelWeightCF] = useState(0.60); 
  const [abTrafficSplit, setAbTrafficSplit] = useState(50); 
  const [attentionHeads, setAttentionHeads] = useState(8); 
  const [threeDMode, setThreeDMode] = useState('graph'); 
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  // Connection Bridge & Security States
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [userToken, setUserToken] = useState(localStorage.getItem("nexus_jwt") || "");
  const [activeUser, setActiveUser] = useState(localStorage.getItem("nexus_user") || "anonymous");
  const [userRole, setUserRole] = useState(localStorage.getItem("nexus_role") || "Guest");
  const [rateLimitLimit, setRateLimitLimit] = useState(60);
  const [rateLimitRemaining, setRateLimitRemaining] = useState(60);
  const [securityAlert, setSecurityAlert] = useState(null);

  // --- 2. LIVE SYSTEM RUNTIME METRICS ---
  const [throughput, setThroughput] = useState(8920); 
  const [latencyP99, setLatencyP99] = useState(31.4); 
  const [latencyAvg, setLatencyAvg] = useState(12.8); 
  const [activeConnections, setActiveConnections] = useState(145020);
  const [modelAccuracyA, setModelAccuracyA] = useState(0.892);
  const [modelAccuracyB, setModelAccuracyB] = useState(0.854);
  const [totalServed, setTotalServed] = useState(1240958100);
  const [conceptDrift, setConceptDrift] = useState(0.24); // Concept drift ratio

  // --- 3. KAFKA REAL-TIME STREAM LOGS ---
  const [logs, setLogs] = useState([]);
  
  // --- 4. RECHARTS HISTORICAL CHART DATA ---
  const [chartData, setChartData] = useState([]);
  const [rlRewardData, setRlRewardData] = useState([]);
  const [abPerformanceData, setAbPerformanceData] = useState([]);

  // --- 5. A/B EXPERIMENTS VARIANT STATISTICS ---
  const [abStats, setAbStats] = useState({
    variant_a: { trials: 1240, clicks: 235, ctr: 18.95, ci: [16.2, 21.7] },
    variant_b: { trials: 1205, clicks: 182, ctr: 15.10, ci: [12.6, 17.6] },
    statistics: { z_score: 1.892, p_value: 0.0585, is_significant: false }
  });

  // --- 6. EXPLAINABILITY DATA (Live Focus Node Details) ---
  const [selectedNode, setSelectedNode] = useState({
    id: 'user_1024',
    category: 'Synth-Streetwear',
    lastInteracted: 'Product #882',
    attentionWeights: [0.35, 0.28, 0.15, 0.12, 0.05, 0.03, 0.01, 0.01],
    cosineSimilarity: 0.942,
    rankingConfidence: 0.985,
    rlDecision: 'EXPLOITATION (Greedy Core Cosine Cluster)'
  });

  const nextLogId = useRef(0);
  const episodeCount = useRef(0);

  // Audio oscillator helper
  const playBeep = (freq, type = 'sine', duration = 0.05) => {
    if (!isAudioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = type;
      oscillator.frequency.value = freq;
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context init failed", e);
    }
  };

  // JWT Authenticated Login
  const loginUser = async (username, password) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUserToken(data.token);
        setActiveUser(data.username);
        setUserRole(data.role);
        
        localStorage.setItem("nexus_jwt", data.token);
        localStorage.setItem("nexus_user", data.username);
        localStorage.setItem("nexus_role", data.role);
        
        playBeep(1200, 'sine', 0.15);
        return { success: true };
      } else {
        const error = await res.json();
        playBeep(220, 'square', 0.12);
        return { success: false, error: error.detail || "Authentication Failed" };
      }
    } catch (err) {
      return { success: false, error: "Gateway Server Offline" };
    }
  };

  const logoutUser = () => {
    setUserToken("");
    setActiveUser("anonymous");
    setUserRole("Guest");
    localStorage.removeItem("nexus_jwt");
    localStorage.removeItem("nexus_user");
    localStorage.removeItem("nexus_role");
    playBeep(500, 'triangle', 0.1);
  };

  // Generate local mock logs if offline
  const generateMockLog = () => {
    const users = ['user_1024', 'user_7721', 'user_8829', 'user_4821', 'user_3092', 'user_9011', 'user_5119'];
    const products = ['Neon Jacket #29', 'Holo Glasses v3', 'Glitch Boots #02', 'Cyborg Glove #82', 'Neural Jack #01', 'Synth-Grid Deck'];
    const categories = ['Cyberwear', 'Implants', 'Holo-Tech', 'Software', 'Retro-Synth'];
    const retrievers = ['VectorDB', 'CollaborativeFilter', 'AnnoySearch', 'BM25_Heuristics'];
    
    const user = users[Math.floor(Math.random() * users.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const retriever = retrievers[Math.floor(Math.random() * retrievers.length)];
    
    const steps = [
      {
        timestamp: new Date().toLocaleTimeString() + '.' + String(Date.now() % 1000).padStart(3, '0'),
        type: 'RETRIEVAL',
        message: `[KAFKA] Input Event: ${user} requested suggestions. VectorDB fetched 120 nodes based on cosine mapping.`
      },
      {
        timestamp: new Date().toLocaleTimeString() + '.' + String(Date.now() % 1000).padStart(3, '0'),
        type: 'ATTENTION',
        message: `[ATTENTION] Computing dot-product score for ${user}. Multi-head depth set at ${attentionHeads} active heads.`
      },
      {
        timestamp: new Date().toLocaleTimeString() + '.' + String(Date.now() % 1000).padStart(3, '0'),
        type: 'RANKING',
        message: `[RANKER] Model A (${abTrafficSplit}%) ranked '${product}' first (Score: ${(0.85 + Math.random() * 0.14).toFixed(3)}) using DLRM structure.`
      },
      {
        timestamp: new Date().toLocaleTimeString() + '.' + String(Date.now() % 1000).padStart(3, '0'),
        type: 'BANDIT',
        message: `[RL_BANDIT] Epsilon-Greedy (${rlExploration}) decided: ${Math.random() < rlExploration ? 'EXPLORATION (Random orbit item)' : 'EXPLOITATION (Top matched cosine node)'}.`
      },
      {
        timestamp: new Date().toLocaleTimeString() + '.' + String(Date.now() % 1000).padStart(3, '0'),
        type: 'OUT',
        message: `[DELIVERY] Served '${product}' to ${user}. p99 Latency: ${latencyP99.toFixed(1)}ms. Cosine Match: ${(0.88 + Math.random() * 0.1).toFixed(3)}.`
      }
    ];

    return steps[Math.floor(Math.random() * steps.length)];
  };

  // Push Slider Changes to Python FastAPI (RBAC Enforced via Auth Header!)
  const syncSettingsToServer = async (eps, cf, ab, heads) => {
    if (!isServerOnline) return;
    try {
      const headers = { "Content-Type": "application/json" };
      if (userToken) {
        headers["Authorization"] = `Bearer ${userToken}`;
      }
      
      const res = await fetch("http://127.0.0.1:8000/api/control", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          exploration_eps: eps,
          cf_weight: cf,
          ab_traffic_split: ab,
          attention_heads: heads
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        // If RBAC blocked (e.g. 403 Forbidden because User is Guest/Auditor!)
        if (res.status === 403) {
          playBeep(180, 'square', 0.25); // Warning flat buzz
          setSecurityAlert(`[SECURITY BLOCKED] ${error.detail}`);
          setTimeout(() => setSecurityAlert(null), 5000);
          
          // Revert React local states to original values
          return false;
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  // Trigger slider value adjustments (Guarded with local rollbacks on RBAC blockage)
  const updateExploration = async (val) => {
    const success = await syncSettingsToServer(val, modelWeightCF, abTrafficSplit, attentionHeads);
    if (success !== false) {
      setRlExploration(val);
    }
  };

  const updateCFWeight = async (val) => {
    const success = await syncSettingsToServer(rlExploration, val, abTrafficSplit, attentionHeads);
    if (success !== false) {
      setModelWeightCF(val);
    }
  };

  const updateTrafficSplit = async (val) => {
    const success = await syncSettingsToServer(rlExploration, modelWeightCF, val, attentionHeads);
    if (success !== false) {
      setAbTrafficSplit(val);
    }
  };

  const updateAttentionHeads = async (val) => {
    const success = await syncSettingsToServer(rlExploration, modelWeightCF, abTrafficSplit, val);
    if (success !== false) {
      setAttentionHeads(val);
    }
  };

  // Heartbeat Probe and telemetry/experiments pull
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const headers = {};
        if (userToken) {
          headers["Authorization"] = `Bearer ${userToken}`;
        }

        const telRes = await fetch("http://127.0.0.1:8000/api/telemetry", { headers });
        if (telRes.ok) {
          const telData = await telRes.json();
          setIsServerOnline(true);
          
          setThroughput(telData.throughput);
          setLatencyAvg(telData.latency_avg);
          setLatencyP99(telData.latency_p99);
          setActiveConnections(telData.active_connections);
          setModelAccuracyA(telData.model_accuracy_a);
          setModelAccuracyB(telData.model_accuracy_b);
          setTotalServed(prev => prev + telData.total_served_delta);
          setConceptDrift(telData.concept_drift);

          const logRes = await fetch("http://127.0.0.1:8000/api/logs", { headers });
          if (logRes.ok) {
            const logsData = await logRes.json();
            setLogs(logsData);
          }

          // Fetch predictions and capture Rate limit headers!
          const recRes = await fetch("http://127.0.0.1:8000/api/recommend", { headers });
          if (recRes.ok) {
            // Read limits headers
            const limLimit = recRes.headers.get("X-RateLimit-Limit");
            const limRemaining = recRes.headers.get("X-RateLimit-Remaining");
            if (limLimit) setRateLimitLimit(parseInt(limLimit));
            if (limRemaining) setRateLimitRemaining(parseInt(limRemaining));

            const recData = await recRes.json();
            const topRec = recData.served_recommendations[0];
            
            setSelectedNode({
              id: recData.user_profile.id,
              category: topRec.category,
              lastInteracted: topRec.name,
              attentionWeights: topRec.attentionWeights,
              cosineSimilarity: topRec.cosineSimilarity,
              rankingConfidence: topRec.rankingConfidence,
              rlDecision: topRec.rlDecision
            });
          }

          // Pull dynamic A/B testing statistical calculations!
          const abRes = await fetch("http://127.0.0.1:8000/api/experiments", { headers });
          if (abRes.ok) {
            const abData = await abRes.json();
            setAbStats(abData);
          }

        } else {
          setIsServerOnline(false);
        }
      } catch (e) {
        setIsServerOnline(false);
      }
    };

    const apiTimer = setInterval(checkServerStatus, 1000);
    return () => clearInterval(apiTimer);
  }, [userToken]);

  // Sync parameters on login/start
  useEffect(() => {
    if (isServerOnline) {
      syncSettingsToServer(rlExploration, modelWeightCF, abTrafficSplit, attentionHeads);
    }
  }, [isServerOnline, userToken]);

  // Main Fallback Chart Logic
  useEffect(() => {
    const initialChartData = [];
    for (let i = 20; i > 0; i--) {
      initialChartData.push({
        time: `T-${i}s`,
        latency: 12 + Math.random() * 3,
        throughput: 8800 + Math.floor(Math.random() * 300),
      });
    }
    setChartData(initialChartData);

    const initialRewardData = [];
    for (let i = 20; i > 0; i--) {
      initialRewardData.push({
        episode: i,
        rewardA: 0.65 + Math.random() * 0.15,
        rewardB: 0.60 + Math.random() * 0.12,
      });
    }
    episodeCount.current = 20;
    setRlRewardData(initialRewardData);

    const initialAB = [];
    for (let i = 20; i > 0; i--) {
      initialAB.push({
        tick: i,
        modelA: 18 + Math.random() * 3,
        modelB: 15 + Math.random() * 2,
      });
    }
    setAbPerformanceData(initialAB);

    const timer = setInterval(() => {
      setChartData(prev => {
        const next = [...prev.slice(1)];
        next.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          latency: latencyAvg,
          throughput: throughput
        });
        return next;
      });

      episodeCount.current += 1;
      setRlRewardData(prev => {
        const next = [...prev.slice(1)];
        const optFactor = rlExploration > 0.1 && rlExploration < 0.4 ? 0.05 : -0.05;
        next.push({
          episode: episodeCount.current,
          rewardA: Number((0.74 + optFactor + Math.random() * 0.08).toFixed(3)),
          rewardB: Number((0.68 + (Math.random() - 0.5) * 0.05).toFixed(3))
        });
        return next;
      });

      setAbPerformanceData(prev => {
        const next = [...prev.slice(1)];
        const trafficA = abTrafficSplit / 100;
        const trafficB = (100 - abTrafficSplit) / 100;
        next.push({
          tick: episodeCount.current,
          modelA: Number((18 + trafficA * 3.5 + (Math.random() - 0.5) * 1.5).toFixed(2)),
          modelB: Number((16 + trafficB * 2.5 + (Math.random() - 0.5) * 1.2).toFixed(2))
        });
        return next;
      });

      if (isServerOnline) return;

      // Local Fallback indicators
      const deltaThroughput = Math.floor((Math.random() - 0.5) * 80);
      const targetThroughput = 8900 + Math.floor(modelWeightCF * 300) + Math.floor((1 - rlExploration) * 200);
      setThroughput(prev => Math.min(10500, Math.max(7200, Math.round(prev * 0.95 + targetThroughput * 0.05 + deltaThroughput))));
      
      const baseLat = 10 + (rlExploration * 5) + (attentionHeads * 0.4);
      setLatencyAvg(prev => Number((prev * 0.9 + baseLat * 0.1 + (Math.random() - 0.5) * 0.3).toFixed(2)));
      setLatencyP99(prev => Number((prev * 0.95 + (baseLat * 2.8) * 0.05 + (Math.random() - 0.5) * 1.5).toFixed(2)));
      
      setTotalServed(prev => prev + Math.floor(throughput / 10));
      setActiveConnections(prev => prev + Math.floor((Math.random() - 0.5) * 100));

      const drift_mock = Math.abs(modelWeightCF - rlExploration) * 0.75 + Math.random() * 0.05;
      setConceptDrift(Number(drift_mock.toFixed(2)));

      if (Math.random() < 0.15) {
        const nodeIds = ['user_1024', 'user_7721', 'user_8829', 'user_4821', 'user_3092', 'product_991', 'product_102'];
        const cats = ['Cyberwear', 'Implants', 'Holo-Tech', 'Software', 'Retro-Synth'];
        const nodeId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
        
        const headWeights = Array.from({ length: 8 }, () => Math.random());
        const sum = headWeights.reduce((a, b) => a + b, 0);
        const normWeights = headWeights.map(w => Number((w / sum).toFixed(3)));

        setSelectedNode({
          id: nodeId,
          category: cats[Math.floor(Math.random() * cats.length)],
          lastInteracted: `Item #${Math.floor(Math.random() * 900 + 100)}`,
          attentionWeights: normWeights,
          cosineSimilarity: Number((0.85 + Math.random() * 0.14).toFixed(3)),
          rankingConfidence: Number((0.92 + Math.random() * 0.07).toFixed(3)),
          rlDecision: Math.random() < rlExploration 
            ? 'EXPLORATION (Multi-Armed Bandit Orbit Match)' 
            : 'EXPLOITATION (Greedy Core Cosine Cluster)'
        });
        playBeep(880, 'triangle', 0.03);
      }

    }, 1000);

    return () => clearInterval(timer);
  }, [rlExploration, modelWeightCF, abTrafficSplit, attentionHeads, latencyAvg, throughput, isAudioEnabled, isServerOnline]);

  // Local logs loop (Offline)
  useEffect(() => {
    if (isServerOnline) return;

    const logInterval = setInterval(() => {
      const newLog = generateMockLog();
      nextLogId.current += 1;
      
      setLogs(prev => {
        const next = [{ ...newLog, id: nextLogId.current }, ...prev];
        if (next.length > 60) next.pop();
        return next;
      });

      if (Math.random() < 0.3) {
        playBeep(440, 'sine', 0.015);
      }
    }, 450);

    return () => clearInterval(logInterval);
  }, [attentionHeads, abTrafficSplit, rlExploration, isAudioEnabled, isServerOnline]);

  // Push Click rewards on Manual events triggers
  useEffect(() => {
    const handleManualFeedback = async (e) => {
      const model = e.detail.model;
      if (isServerOnline) {
        try {
          const headers = { "Content-Type": "application/json" };
          if (userToken) {
            headers["Authorization"] = `Bearer ${userToken}`;
          }
          await fetch("http://127.0.0.1:8000/api/feedback", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
              category: selectedNode.category || "Cyberwear",
              click: 1,
              watch_time: model === 'A' ? 65.5 : 45.0,
              purchased: model === 'A' ? 1 : 0
            })
          });
        } catch (err) {}
      }
    };

    window.addEventListener('conversion-trigger', handleManualFeedback);
    return () => window.removeEventListener('conversion-trigger', handleManualFeedback);
  }, [isServerOnline, selectedNode, userToken]);

  const value = {
    rlExploration, setRlExploration: updateExploration,
    modelWeightCF, setModelWeightCF: updateCFWeight,
    abTrafficSplit, setAbTrafficSplit: updateTrafficSplit,
    attentionHeads, setAttentionHeads: updateAttentionHeads,
    threeDMode, setThreeDMode,
    isAudioEnabled, setIsAudioEnabled,
    throughput,
    latencyP99,
    latencyAvg,
    activeConnections,
    modelAccuracyA,
    modelAccuracyB,
    totalServed,
    conceptDrift,
    logs,
    chartData,
    rlRewardData,
    abPerformanceData,
    abStats,
    selectedNode,
    setSelectedNode,
    playBeep,
    isServerOnline,
    
    // Auth & Rate Limit additions
    activeUser,
    userRole,
    userToken,
    loginUser,
    logoutUser,
    rateLimitLimit,
    rateLimitRemaining,
    securityAlert
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
};
