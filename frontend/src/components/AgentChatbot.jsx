import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const COMPATIBILITY_INFO = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-']
};

const AgentChatbot = () => {
  const { user, isAuthenticated } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dispatch'); // 'dispatch' or 'chat'
  const [activeRequests, setActiveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agent',
      text: '👋 Hello! I am the LifeLink Autonomous Dispatch & Escalation Agent. I continuously monitor emergency blood requests, auto-expand dispatch radius (5km ➔ 15km ➔ 30km), orchestrate WhatsApp & IVR voice calls, and secure atomic cross-inventory holds.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickActions: ['status', 'escalate', 'compatibility', 'bloodbanks']
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  // Fetch active requests
  const fetchActiveBroadcasts = async () => {
    setLoading(true);
    try {
      if (isAuthenticated && user?.role === 'patient') {
        const res = await API.get('/blood-requests');
        const active = res.data.filter(r => r.status === 'active');
        setActiveRequests(active);
      } else {
        const res = await API.get('/blood-requests/active');
        setActiveRequests(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching agent requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveBroadcasts();
  }, [isAuthenticated, user]);

  // Listen for real-time agent updates
  useEffect(() => {
    if (!socket) return;

    const handleEscalation = (data) => {
      setUnreadCount((prev) => prev + 1);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'agent',
          text: `🚨 Autonomous Agent Escalation: Request #${data.requestId.toString().slice(-6)} escalated to Tier ${data.escalationTier} (${data.radius / 1000} km). ${data.summary || ''}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickActions: ['status', 'bloodbanks']
        }
      ]);
      fetchActiveBroadcasts();
    };

    const handleHold = (data) => {
      setUnreadCount((prev) => prev + 1);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'agent',
          text: `🏥 Cross-Inventory Hold Secured! ${data.message}`,
          routingUrl: data.hold?.routingUrl,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      fetchActiveBroadcasts();
    };

    const handleDonorRes = (data) => {
      setUnreadCount((prev) => prev + 1);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'agent',
          text: `🙋 Voluntary Donor Response: ${data.donorName || 'A donor'} has ${data.status} Request #${data.requestId.toString().slice(-6)}!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      fetchActiveBroadcasts();
    };

    socket.on('agentEscalationUpdate', handleEscalation);
    socket.on('autonomousHoldSecured', handleHold);
    socket.on('donorResponse', handleDonorRes);

    return () => {
      socket.off('agentEscalationUpdate', handleEscalation);
      socket.off('autonomousHoldSecured', handleHold);
      socket.off('donorResponse', handleDonorRes);
    };
  }, [socket]);

  const handleToggle = () => {
    if (!isOpen) {
      setUnreadCount(0);
      fetchActiveBroadcasts();
    }
    setIsOpen(!isOpen);
  };

  const handleForceEscalate = async (requestId) => {
    setActionLoading(true);
    try {
      const res = await API.post(`/blood-requests/${requestId}/escalate`);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'agent',
          text: `⚡ Manually Triggered Escalation for #${requestId.toString().slice(-6)}: ${res.data.actionSummary || 'Advanced to next tier!'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      await fetchActiveBroadcasts();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'agent',
          text: `⚠️ Escalation note: ${err.response?.data?.message || 'Could not escalate request.'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunAgentCycle = async () => {
    setActionLoading(true);
    try {
      await API.post('/blood-requests/run-escalation-agent');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'agent',
          text: '✅ Autonomous Dispatch Monitoring cycle executed across all active broadcasts.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      await fetchActiveBroadcasts();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendChat = (textToSend) => {
    const query = (textToSend || chatInput).trim();
    if (!query) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    // Agent response generation
    setTimeout(() => {
      const lower = query.toLowerCase();
      let replyText = '';
      let quick = null;

      if (lower.includes('status') || lower.includes('request') || lower.includes('my blood')) {
        if (activeRequests.length > 0) {
          const r = activeRequests[0];
          replyText = `📊 Active Broadcast #${r._id.toString().slice(-6)}:\n• Patient Needs: ${r.bloodGroup} (${r.unitsNeeded} units)\n• Current Tier: Tier ${r.escalationTier || 1} (${(r.radius || 5000) / 1000} km)\n• Status: ${r.status.toUpperCase()}\n• Autonomous Hold: ${r.autonomousHold?.placed ? `Secured at ${r.autonomousHold.bloodBankName} (${r.autonomousHold.unitsHeld} units)` : 'Pending donor response'}`;
          quick = ['escalate', 'bloodbanks'];
        } else {
          replyText = 'There are no active emergency blood requests pending for your account right now. You can broadcast an urgent request from the Emergency Request portal.';
          quick = ['create', 'bloodbanks'];
        }
      } else if (lower.includes('escalat') || lower.includes('tier') || lower.includes('expand')) {
        if (activeRequests.length > 0) {
          const r = activeRequests[0];
          handleForceEscalate(r._id);
          return;
        } else {
          replyText = 'No active blood broadcasts found to escalate. Create a request first or check regional broadcasts.';
        }
      } else if (lower.includes('compatib') || lower.includes('group') || lower.includes('b+') || lower.includes('o-') || lower.includes('a+')) {
        replyText = '🩸 WHO 4-Tier Compatibility Matrix:\n• O- can safely donate to: ALL blood groups (Universal Donor)\n• AB+ can safely receive from: ALL blood groups (Universal Recipient)\n• B+ can receive: B+, B-, O+, O-\n• A+ can receive: A+, A-, O+, O-\n• O+ can receive: O+, O-';
        quick = ['status', 'bloodbanks'];
      } else if (lower.includes('bank') || lower.includes('blood bank') || lower.includes('inventory')) {
        replyText = '🏥 LifeLink connects directly with 2,439+ verified certified blood banks across India with real-time cold-storage inventories.';
        quick = ['bloodbanks', 'hospitals'];
      } else if (lower.includes('hold') || lower.includes('cross')) {
        const withHold = activeRequests.find(r => r.autonomousHold?.placed);
        if (withHold) {
          replyText = `🏥 Hold Confirmed: ${withHold.autonomousHold.unitsHeld} units of ${withHold.autonomousHold.bloodGroup} held at ${withHold.autonomousHold.bloodBankName} (${withHold.autonomousHold.pickupAddress}).`;
        } else {
          replyText = 'When voluntary donors are unresponsive or when Tier 3 (30 km) is reached, the agent autonomously locks units at the nearest verified blood bank and provides turn-by-turn driving directions.';
        }
      } else {
        replyText = `I can help you monitor emergency blood broadcasts, escalate search tiers, explain compatibility, or route to certified blood banks. Click one of the quick options below:`;
        quick = ['status', 'escalate', 'compatibility', 'bloodbanks'];
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'agent',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickActions: quick
        }
      ]);
    }, 450);
  };

  const handleQuickAction = (actionKey) => {
    switch (actionKey) {
      case 'status':
        handleSendChat('What is the status of my blood request?');
        break;
      case 'escalate':
        handleSendChat('Escalate active blood broadcast');
        break;
      case 'compatibility':
        handleSendChat('Show blood compatibility rules');
        break;
      case 'bloodbanks':
        navigate('/search/bloodbanks');
        break;
      case 'hospitals':
        navigate('/search/hospitals');
        break;
      case 'create':
        navigate('/blood-request/create');
        break;
      default:
        break;
    }
  };

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* FLOATING TRIGGER BUTTON (BOTTOM-RIGHT CORNER)                 */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1050
        }}
      >
        <button
          type="button"
          className="btn btn-danger rounded-pill shadow-lg d-flex align-items-center gap-2 px-3 py-2 border-2 border-white"
          onClick={handleToggle}
          style={{
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <span className="fs-5">🤖</span>
          <div className="text-start d-none d-sm-block">
            <div className="fw-bold text-white small lh-1">LifeLink Agent</div>
            <div className="text-white-50" style={{ fontSize: '0.68rem' }}>
              ● Autonomous Dispatch
            </div>
          </div>

          {unreadCount > 0 && (
            <span className="badge rounded-pill bg-warning text-dark px-2 py-1 ms-1 animate__animated animate__pulse animate__infinite">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FLOATING AGENT CHATBOT / DISPATCH MONITOR MODAL                */}
      {/* ------------------------------------------------------------- */}
      {isOpen && (
        <div
          className="card shadow-lg border-0"
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '24px',
            width: '390px',
            maxWidth: 'calc(100vw - 32px)',
            height: '560px',
            maxHeight: 'calc(100vh - 120px)',
            zIndex: 1051,
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Header */}
          <div className="card-header bg-danger text-white py-2 px-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <span className="fs-4">🤖</span>
              <div>
                <div className="fw-bold small lh-1">LifeLink Autonomous Agent</div>
                <div className="text-white-50" style={{ fontSize: '0.68rem' }}>
                  Active Daemon • Multi-Channel IVR & WhatsApp
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn btn-sm btn-link text-white text-decoration-none p-1"
                onClick={handleRunAgentCycle}
                title="Run Agent Evaluation Cycle Now"
                disabled={actionLoading}
              >
                🔄
              </button>
              <button
                type="button"
                className="btn btn-sm btn-link text-white text-decoration-none p-1 fs-5 lh-1"
                onClick={() => setIsOpen(false)}
                title="Close Agent Window"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="bg-light border-bottom p-1 d-flex">
            <button
              className={`btn btn-sm flex-fill fw-bold rounded-pill ${activeTab === 'dispatch' ? 'btn-danger text-white' : 'btn-light text-secondary'}`}
              onClick={() => setActiveTab('dispatch')}
            >
              🚨 Live Dispatch ({activeRequests.length})
            </button>
            <button
              className={`btn btn-sm flex-fill fw-bold rounded-pill ${activeTab === 'chat' ? 'btn-danger text-white' : 'btn-light text-secondary'}`}
              onClick={() => setActiveTab('chat')}
            >
              💬 AI Copilot Chat
            </button>
          </div>

          {/* TAB 1: LIVE DISPATCH MONITOR */}
          {activeTab === 'dispatch' && (
            <div className="p-3 overflow-auto flex-grow-1 bg-light">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small fw-bold text-secondary text-uppercase" style={{ fontSize: '0.72rem' }}>
                  Live Broadcast Feeds
                </span>
                <button
                  className="btn btn-link btn-sm p-0 text-decoration-none small"
                  onClick={fetchActiveBroadcasts}
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh ↻'}
                </button>
              </div>

              {activeRequests.length > 0 ? (
                activeRequests.map((req) => (
                  <div key={req._id} className="card border-0 shadow-sm mb-3 rounded-3 overflow-hidden">
                    <div className="card-header bg-white py-2 px-3 border-0 d-flex justify-content-between align-items-center">
                      <span className="badge bg-danger">
                        {req.bloodGroup} • {req.unitsNeeded} Units
                      </span>
                      <span className={`badge ${
                        req.escalationTier === 3
                          ? 'bg-danger'
                          : req.escalationTier === 2
                          ? 'bg-warning text-dark'
                          : 'bg-success-subtle text-success'
                      }`}>
                        Tier {req.escalationTier || 1} ({(req.radius || 5000) / 1000} km)
                      </span>
                    </div>

                    <div className="card-body p-3 pt-1">
                      <div className="small fw-semibold text-dark mb-1">
                        🏥 {req.hospitalName || 'Emergency Center'}
                      </div>
                      <div className="small text-muted mb-2">
                        📞 {req.contactPhone}
                      </div>

                      {/* Tier Progress Bar */}
                      <div className="mb-2">
                        <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.65rem' }}>
                          <span className={req.escalationTier >= 1 ? 'fw-bold text-danger' : ''}>5 km</span>
                          <span className={req.escalationTier >= 2 ? 'fw-bold text-warning' : ''}>15 km (WA)</span>
                          <span className={req.escalationTier >= 3 ? 'fw-bold text-danger' : ''}>30 km (IVR+Hold)</span>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div
                            className={`progress-bar ${req.escalationTier === 3 ? 'bg-danger' : req.escalationTier === 2 ? 'bg-warning' : 'bg-success'}`}
                            role="progressbar"
                            style={{ width: `${(req.escalationTier || 1) * 33.3}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Autonomous Hold Alert */}
                      {req.autonomousHold?.placed && (
                        <div className="p-2 mb-2 bg-success-subtle rounded border border-success small">
                          <div className="fw-bold text-success d-flex align-items-center gap-1">
                            <span>🏥</span> Cross-Hold Secured!
                          </div>
                          <div className="text-dark" style={{ fontSize: '0.75rem' }}>
                            {req.autonomousHold.bloodBankName} ({req.autonomousHold.unitsHeld} Units)
                          </div>
                          {req.autonomousHold.routingUrl && (
                            <a
                              href={req.autonomousHold.routingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-success fw-bold py-0 px-2 mt-1"
                              style={{ fontSize: '0.72rem' }}
                            >
                              🗺️ Directions
                            </a>
                          )}
                        </div>
                      )}

                      {/* Controls */}
                      <div className="d-flex gap-2 mt-2 pt-2 border-top">
                        {req.escalationTier < 3 ? (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm flex-fill fw-bold py-1"
                            style={{ fontSize: '0.75rem' }}
                            disabled={actionLoading}
                            onClick={() => handleForceEscalate(req._id)}
                          >
                            ⚡ Force Tier { (req.escalationTier || 1) + 1 }
                          </button>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary w-100 py-2">
                            Maximum Escalation Reached (30 km)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted">
                  <div className="fs-1 mb-2">🏥</div>
                  <h6 className="fw-bold">No Active Emergency Requests</h6>
                  <p className="small mb-3">When an emergency broadcast is created, the autonomous agent loop monitors and expands it here.</p>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => navigate('/blood-request/create')}
                  >
                    Create Blood Broadcast
                  </button>
                </div>
              )}

              {/* Multi-Channel Daemon Info */}
              <div className="card border-0 bg-white shadow-sm p-3 rounded-3 mt-3">
                <div className="fw-bold small text-dark mb-1">🤖 Agent Autonomous Rules:</div>
                <ul className="list-unstyled small text-muted mb-0" style={{ fontSize: '0.75rem' }}>
                  <li>• <strong>Tier 1 (5 km):</strong> Real-time WebSocket dispatch</li>
                  <li>• <strong>Tier 2 (15 km):</strong> Multi-channel WhatsApp alert</li>
                  <li>• <strong>Tier 3 (30 km):</strong> Automated IVR voice calls</li>
                  <li>• <strong>Cross-Hold:</strong> Atomic lock at nearest certified blood bank</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: AI COPILOT CHAT */}
          {activeTab === 'chat' && (
            <div className="d-flex flex-column flex-grow-1 overflow-hidden">
              <div className="flex-grow-1 overflow-auto p-3 bg-light" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`d-flex flex-column ${m.sender === 'user' ? 'align-items-end' : 'align-items-start'}`}
                  >
                    <div
                      className={`p-2 px-3 rounded-3 shadow-sm ${m.sender === 'user' ? 'bg-danger text-white' : 'bg-white text-dark border'}`}
                      style={{
                        maxWidth: '85%',
                        fontSize: '0.82rem',
                        whiteSpace: 'pre-line',
                        borderTopRightRadius: m.sender === 'user' ? '4px' : '14px',
                        borderTopLeftRadius: m.sender === 'agent' ? '4px' : '14px'
                      }}
                    >
                      {m.text}

                      {m.routingUrl && (
                        <div className="mt-2">
                          <a
                            href={m.routingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-success fw-bold py-1 px-2"
                            style={{ fontSize: '0.75rem' }}
                          >
                            🗺️ Open Direct Google Maps Route
                          </a>
                        </div>
                      )}
                    </div>
                    <span className="text-muted mt-1 px-1" style={{ fontSize: '0.62rem' }}>
                      {m.time}
                    </span>

                    {/* Quick Action Chips */}
                    {m.quickActions && (
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {m.quickActions.map((qa) => (
                          <button
                            key={qa}
                            className="btn btn-outline-danger btn-sm py-0 px-2 rounded-pill bg-white"
                            style={{ fontSize: '0.7rem' }}
                            onClick={() => handleQuickAction(qa)}
                          >
                            {qa === 'status' && '📊 Check Status'}
                            {qa === 'escalate' && '⚡ Escalate Broadcast'}
                            {qa === 'compatibility' && '🩸 Compatibility Matrix'}
                            {qa === 'bloodbanks' && '🏥 Blood Banks'}
                            {qa === 'hospitals' && '🏥 Search Hospitals'}
                            {qa === 'create' && '🚨 Create Request'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Field */}
              <div className="p-2 border-top bg-white d-flex gap-2 align-items-center">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Ask agent: e.g. status, escalate, compatibility..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                />
                <button
                  type="button"
                  className="btn btn-danger btn-sm px-3 fw-bold"
                  onClick={() => handleSendChat()}
                >
                  ➤
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AgentChatbot;
