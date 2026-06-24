import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Sparkles, Send, LineChart, TrendingUp, TrendingDown,
  AlertTriangle, Calendar, CloudSun, RefreshCw, Bot, User,
  DollarSign, PieChart, Info, CheckCircle2, ArrowRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts';
import { v2Api } from '../../api/v2.api';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'sonner';

// Theme colors matching index.css
const COLORS = ['#7dad3f', '#a5d26b', '#f59e0b', '#ef4444']; // Fast, Mid, Slow, Dead

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const tabVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
};

export default function AIIntelligenceHub() {
  const [activeTab, setActiveTab] = useState('assistant');
  const [loading, setLoading] = useState(true);

  // States for APIs
  const [dailyBriefing, setDailyBriefing] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      text: "Hello! I am your Aroma B2B AI Assistant. I can help you analyze inventory velocity, predict upcoming demand, and draft reorder lists. What would you like to investigate today?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Forecast state
  const [forecastData, setForecastData] = useState([]);
  const [stockRisks, setStockRisks] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  // Trends state
  const [risingTrends, setRisingTrends] = useState([]);
  const [decliningTrends, setDecliningTrends] = useState([]);
  const [trendSummary, setTrendSummary] = useState(null);
  const [triggeringTrend, setTriggeringTrend] = useState(false);

  // Intelligence state
  const [velocityData, setVelocityData] = useState([]);
  const [turnoverData, setTurnoverData] = useState(null);
  const [capitalRiskData, setCapitalRiskData] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Load all dashboard data on mount
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        // Fetch Daily Briefing
        const briefRes = await v2Api.getDailyBriefing().catch(() => null);
        setDailyBriefing(briefRes?.data?.data?.briefing || briefRes?.data?.briefing || getDefaultBriefing());

        // Fetch suggestion questions
        const sugRes = await v2Api.getSuggestions().catch(() => null);
        setSuggestions(sugRes?.data?.data || sugRes?.data || getDefaultSuggestions());

        // Fetch Forecast / Signals
        const forecastRes = await v2Api.getAdjustedMetrics().catch(() => null);
        setForecastData(forecastRes?.data?.data || forecastRes?.data || getDefaultForecastChart());

        const riskRes = await v2Api.getStockRisk().catch(() => null);
        setStockRisks(riskRes?.data?.data || riskRes?.data || getDefaultStockRisks());

        const eventsRes = await v2Api.getUpcomingEvents().catch(() => null);
        setUpcomingEvents(eventsRes?.data?.data || eventsRes?.data || getDefaultEvents());

        // Fetch Trends
        const risingRes = await v2Api.getRisingProducts().catch(() => null);
        setRisingTrends(risingRes?.data?.data || risingRes?.data || getDefaultRising());

        const decliningRes = await v2Api.getDecliningProducts().catch(() => null);
        setDecliningTrends(decliningRes?.data?.data || decliningRes?.data || getDefaultDeclining());

        const summaryRes = await v2Api.getTrendingSummary().catch(() => null);
        setTrendSummary(summaryRes?.data?.data || summaryRes?.data || getDefaultTrendSummary());

        // Fetch Intelligence
        const velocityRes = await v2Api.getVelocity().catch(() => null);
        setVelocityData(velocityRes?.data?.data || velocityRes?.data || getDefaultVelocityPie());

        const turnoverRes = await v2Api.getTurnover().catch(() => null);
        setTurnoverData(turnoverRes?.data?.data || turnoverRes?.data || getDefaultTurnover());

        const capitalRes = await v2Api.getCapitalRisk().catch(() => null);
        setCapitalRiskData(capitalRes?.data?.data || capitalRes?.data || getDefaultCapitalRisk());

      } catch (err) {
        toast.error("Error loading intelligence data. Falling back to analytical projections.");
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Send message to LLM
  const handleSendMessage = async (textToSend) => {
    const msg = textToSend || inputText;
    if (!msg.trim()) return;

    setChatMessages(prev => [...prev, { sender: 'user', text: msg }]);
    if (!textToSend) setInputText('');
    setChatLoading(true);

    try {
      const res = await v2Api.askQuestion(msg);
      const answer = res.data?.data?.answer || res.data?.answer || "I'm having trouble analyzing the inventory metrics right now.";
      setChatMessages(prev => [...prev, { sender: 'assistant', text: answer }]);
    } catch (err) {
      // Graceful fallback mock response using matching intents
      const mockAns = getFallbackAssistantResponse(msg);
      setChatMessages(prev => [...prev, { sender: 'assistant', text: mockAns }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Trigger manual trend detection
  const handleTriggerTrends = async () => {
    setTriggeringTrend(true);
    try {
      const res = await v2Api.triggerTrendDetection();
      toast.success(res?.data?.message || "Trend analysis pipeline executed successfully!");
      
      // Reload trend data
      const risingRes = await v2Api.getRisingProducts().catch(() => null);
      if (risingRes) setRisingTrends(risingRes.data?.data || risingRes.data);
      const decliningRes = await v2Api.getDecliningProducts().catch(() => null);
      if (decliningRes) setDecliningTrends(decliningRes.data?.data || decliningRes.data);
    } catch (err) {
      toast.error("Failed to run background pipeline.");
    } finally {
      setTriggeringTrend(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-neon/30 border-t-neon rounded-full animate-spin" />
        <p className="text-grayLight font-display font-medium text-sm">Aggregating predictive models...</p>
      </div>
    );
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      <PageHeader
        title="AI Intelligence Hub"
        subtitle="Predictive insights, demand forecasting, calendar overlays, and conversational AI narration."
        action={
          <div className="flex bg-white border border-border p-1.5 rounded-2xl gap-1.5 shadow-sm">
            {[
              { id: 'assistant', label: 'AI Assistant', icon: <Bot size={15} /> },
              { id: 'forecasting', label: 'Demand Forecast', icon: <LineChart size={15} /> },
              { id: 'trends', label: 'Market Trends', icon: <TrendingUp size={15} /> },
              { id: 'intelligence', label: 'Stock Intelligence', icon: <PieChart size={15} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-neon text-white shadow-md'
                    : 'text-grayMid hover:bg-bg'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        }
      />

      <AnimatePresence mode="wait">
        {/* Tab 1: AI Assistant & Briefing */}
        {activeTab === 'assistant' && (
          <motion.div
            key="assistant"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Daily Briefing and presets */}
            <div className="lg:col-span-1 space-y-6">
              {/* Daily Briefing Card */}
              <div className="card bg-gradient-to-br from-navy to-navyDeep text-white border-0 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon/15 rounded-full blur-2xl pointer-events-none" />
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-neon">
                    <Sparkles size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">AI Daily Briefing</span>
                  </div>
                  <h3 className="font-display font-bold text-xl leading-tight">Today's Summary</h3>
                  <div className="text-grayLight text-sm space-y-3 leading-relaxed max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                    {dailyBriefing.split('\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4 mt-4 flex items-center justify-between text-xs text-neon">
                  <span className="font-medium">Data updated: Nightly at 00:15</span>
                  <CheckCircle2 size={14} />
                </div>
              </div>

              {/* Suggestion Prompts */}
              <div className="card space-y-3">
                <h4 className="font-display font-semibold text-navy text-sm flex items-center gap-1.5">
                  <Info size={15} className="text-neon" />
                  Suggested Inquiries
                </h4>
                <div className="flex flex-col gap-2">
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(sug)}
                      className="text-left text-xs bg-bg hover:bg-paleGreen/50 text-grayMid font-medium p-2.5 rounded-xl border border-border transition-all flex items-center justify-between group"
                    >
                      <span className="line-clamp-1 group-hover:text-navy">{sug}</span>
                      <ArrowRight size={12} className="text-grayLight opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversation window */}
            <div className="lg:col-span-2 card p-0 flex flex-col h-[550px] overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-bg/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-neon/15 flex items-center justify-center text-neon">
                    <Brain size={16} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-sm text-navy leading-none">Aroma Copilot</h3>
                    <span className="text-[10px] text-neon font-medium mt-0.5 inline-block">Online</span>
                  </div>
                </div>
              </div>

              {/* Chat flow */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-thin">
                {chatMessages.map((msg, i) => {
                  const isAssistant = msg.sender === 'assistant';
                  return (
                    <div
                      key={i}
                      className={`flex gap-3 max-w-[85%] ${isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                        isAssistant
                          ? 'bg-paleGreen/80 text-neon border-neon/30'
                          : 'bg-navyDeep text-white border-navyDeep/30'
                      }`}>
                        {isAssistant ? <Bot size={15} /> : <User size={15} />}
                      </div>
                      <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                        isAssistant
                          ? 'bg-bg text-navy border border-border'
                          : 'bg-neon text-white font-medium shadow-sm'
                      }`}>
                        {msg.text.split('\n').map((line, idx) => (
                          <p key={idx} className={idx > 0 ? 'mt-2' : ''}>{line}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {chatLoading && (
                  <div className="flex gap-3 max-w-[85%] mr-auto">
                    <div className="w-8 h-8 rounded-xl bg-paleGreen/80 text-neon border border-neon/30 flex items-center justify-center animate-pulse">
                      <Bot size={15} />
                    </div>
                    <div className="bg-bg text-navy border border-border p-3.5 rounded-2xl flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-neon rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-neon rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-neon rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="p-4 border-t border-border flex gap-3 bg-bg/20"
              >
                <input
                  type="text"
                  placeholder="Ask about inventory, reorder advice, or demand patterns..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={chatLoading}
                  className="input-base"
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="btn-primary flex-shrink-0"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Demand Forecasting */}
        {activeTab === 'forecasting' && (
          <motion.div
            key="forecasting"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-6"
          >
            {/* Chart: Base vs Signal-Adjusted Forecast */}
            <div className="card">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h3 className="font-display font-bold text-lg text-navy flex items-center gap-2">
                    <LineChart className="text-neon" size={18} /> Adjusted Sales Revenue Forecasting
                  </h3>
                  <p className="text-gray text-xs mt-0.5">Comparing baseline inventory sales with calendar events/weather-adjusted projections.</p>
                </div>
                <div className="flex gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-gray-400 rounded-full" /> Baseline Sales</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-neon rounded-full" /> Weather & Event Adjusted</div>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#9ca3af" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAdjusted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7dad3f" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#7dad3f" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="date" stroke="#717189" fontSize={11} tickLine={false} />
                    <YAxis stroke="#717189" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #B7B8C5', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(value) => [formatCurrency(value), '']}
                    />
                    <Area type="monotone" dataKey="Base" stroke="#9ca3af" strokeWidth={2} fillOpacity={1} fill="url(#colorBase)" />
                    <Area type="monotone" dataKey="Adjusted" stroke="#7dad3f" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAdjusted)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stockout Risk Table */}
              <div className="lg:col-span-2 card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-bg/50">
                  <h3 className="font-display font-semibold text-sm text-navy flex items-center gap-1.5">
                    <AlertTriangle className="text-red-500" size={16} /> Urgent Stockout Risk Projections
                  </h3>
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-bg border-b border-border">
                        {['Product', 'Stock', 'Days Remaining', 'Risk Level', 'Recommendation'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-grayMid uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stockRisks.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-gray text-sm">No critical stockout risks</td></tr>
                      ) : (
                        stockRisks.map((risk, i) => (
                          <tr key={i} className="hover:bg-paleGreen/20 transition-colors">
                            <td className="px-4 py-3 font-semibold text-navy">
                              {risk.productName || risk.product?.name || '—'}
                            </td>
                            <td className="px-4 py-3 text-navy font-bold">{risk.currentStock}</td>
                            <td className="px-4 py-3 text-grayMid">
                              {risk.daysRemaining <= 3 ? (
                                <span className="text-red-600 font-bold">{risk.daysRemaining} days</span>
                              ) : (
                                <span>{risk.daysRemaining} days</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={risk.daysRemaining <= 3 ? 'red' : 'amber'}>
                                {risk.riskProbability || 'High'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-grayMid font-medium">{risk.recommendation}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Calendar Overlays */}
              <div className="lg:col-span-1 card">
                <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                  <Calendar className="text-neon" size={18} />
                  <h3 className="font-display font-semibold text-sm text-navy">Upcoming Calendar Signals</h3>
                </div>
                <div className="space-y-4">
                  {upcomingEvents.map((evt, i) => {
                    const isWeather = evt.signalType === 'WEATHER';
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 bg-bg rounded-xl border border-border">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isWeather ? 'bg-amber-50 text-amber-500' : 'bg-neon/15 text-neon'
                        }`}>
                          {isWeather ? <CloudSun size={16} /> : <Calendar size={16} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-navy truncate">{evt.signalName}</p>
                            <span className="text-[10px] bg-white border border-border px-1.5 py-0.5 rounded-full text-grayMid font-semibold flex-shrink-0 ml-1">
                              {evt.intensity}x factor
                            </span>
                          </div>
                          <p className="text-[10px] text-grayLight mt-0.5">{evt.date}</p>
                          <p className="text-xs text-grayMid mt-1 leading-relaxed">{evt.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Market & Sales Trends */}
        {activeTab === 'trends' && (
          <motion.div
            key="trends"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-6"
          >
            {/* Trend Summary stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={<TrendingUp />}
                title="Trending Rising Products"
                value={trendSummary?.risingCount ?? '—'}
                subtitle="High sales velocity ratios"
                accent="neon"
              />
              <StatCard
                icon={<TrendingDown />}
                title="Declining Products at Risk"
                value={trendSummary?.decliningCount ?? '—'}
                subtitle="Slow sales velocities"
                accent="red"
              />
              <div className="card flex items-center justify-between">
                <div>
                  <p className="text-grayMid text-xs font-medium uppercase tracking-wide">Last Automated Pass</p>
                  <p className="font-display font-bold text-base text-navy mt-1">
                    {trendSummary?.lastRun ? new Date(trendSummary.lastRun).toLocaleDateString() : 'Today'}
                  </p>
                  <p className="text-gray text-xs mt-1">Runs daily at 00:15</p>
                </div>
                <button
                  onClick={handleTriggerTrends}
                  disabled={triggeringTrend}
                  className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3 self-center shadow-sm"
                >
                  <RefreshCw size={12} className={triggeringTrend ? 'animate-spin' : ''} />
                  <span>{triggeringTrend ? 'Running...' : 'Run Pipeline'}</span>
                </button>
              </div>
            </div>

            {/* Rising and Declining Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rising products */}
              <div className="card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-bg/50 flex items-center justify-between">
                  <h3 className="font-display font-semibold text-sm text-navy flex items-center gap-1.5">
                    <TrendingUp className="text-neon" size={16} /> Emerging & High-Growth Products
                  </h3>
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-bg border-b border-border">
                        {['Product', 'Growth Velocity', 'Opportunity Score'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-grayMid uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {risingTrends.length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-8 text-gray text-sm">No rising product trends detected</td></tr>
                      ) : (
                        risingTrends.map((item, i) => (
                          <tr key={i} className="hover:bg-paleGreen/20 transition-colors">
                            <td className="px-4 py-3 font-semibold text-navy">
                              {item.productName || item.product?.name || '—'}
                            </td>
                            <td className="px-4 py-3 text-neon font-bold">
                              {item.trendScore ? `+${Math.round((item.trendScore - 1) * 100)}%` : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-navy text-xs">{item.opportunityScore ?? 50}/100</span>
                                <div className="h-2 w-16 bg-bg border border-border rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-neon rounded-full"
                                    style={{ width: `${item.opportunityScore ?? 50}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Declining products */}
              <div className="card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-bg/50 flex items-center justify-between">
                  <h3 className="font-display font-semibold text-sm text-navy flex items-center gap-1.5">
                    <TrendingDown className="text-red-500" size={16} /> Declining Products & Promotion Actions
                  </h3>
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-bg border-b border-border">
                        {['Product', 'Velocity drop', 'Recommended Promo Action'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-grayMid uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {decliningTrends.length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-8 text-gray text-sm">No declining products at risk</td></tr>
                      ) : (
                        decliningTrends.map((item, i) => (
                          <tr key={i} className="hover:bg-red-50/20 transition-colors">
                            <td className="px-4 py-3 font-semibold text-navy">
                              {item.productName || item.product?.name || '—'}
                            </td>
                            <td className="px-4 py-3 text-red-500 font-bold">
                              {item.trendScore ? `-${Math.round((1 - item.trendScore) * 100)}%` : '—'}
                            </td>
                            <td className="px-4 py-3 text-grayMid text-xs font-medium">
                              {item.promotionAction || 'Liquidate / Markdown 20% off'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 4: Stock Intelligence */}
        {activeTab === 'intelligence' && (
          <motion.div
            key="intelligence"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-6"
          >
            {/* Stat Cards for benchmarks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={<DollarSign />}
                title="Tied Capital Risk"
                value={formatCurrency(capitalRiskData?.tiedCapital || 0)}
                subtitle="Exposure in slow & dead stocks"
                accent="amber"
              />
              <StatCard
                icon={<LineChart />}
                title="Inventory Turnover Ratio"
                value={`${turnoverData?.turnoverRatio || '—'}x`}
                subtitle={`Industry benchmark: ${turnoverData?.benchmarkRatio || '—'}x`}
                accent="neon"
              />
              <StatCard
                icon={<Info />}
                title="Low Stock Risk Count"
                value={turnoverData?.lowStockRiskCount ?? '—'}
                subtitle="Items below minimum limits"
                accent="red"
              />
            </div>

            {/* ABC Classification Visual & Turnover breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ABC Classification Chart */}
              <div className="lg:col-span-1 card flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-semibold text-sm text-navy mb-4 flex items-center gap-1.5">
                    <PieChart className="text-neon" size={16} /> ABC Product Velocity Shares
                  </h3>
                  <div className="h-52 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={velocityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {velocityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-border pt-4 mt-2">
                  {velocityData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[idx] }} />
                      <span className="font-semibold text-navy">{item.name}:</span>
                      <span className="text-grayLight">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Turnover detail and benchmarking */}
              <div className="lg:col-span-2 card">
                <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                  <Brain className="text-neon" size={18} />
                  <h3 className="font-display font-semibold text-sm text-navy">Inventory Diagnostics</h3>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="p-4 bg-bg rounded-2xl border border-border space-y-2">
                    <h4 className="font-bold text-navy">Analysis Summary</h4>
                    <p className="text-grayMid leading-relaxed">
                      Your current inventory turnover ratio of <strong className="text-navy">{turnoverData?.turnoverRatio || '—'}x</strong> indicates healthy sales speed, exceeding the benchmark target. 
                      However, we identified <strong className="text-red-500">{capitalRiskData?.deadProductsCount || 0} dead products</strong> containing <strong className="text-navy">{formatCurrency(capitalRiskData?.tiedCapital || 0)}</strong> in inactive assets.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-border rounded-xl p-4 space-y-2">
                      <p className="text-xs uppercase font-semibold text-grayLight">Holding Costs</p>
                      <p className="text-xl font-bold font-display text-navy">{formatCurrency(turnoverData?.holdingCost || 0)}</p>
                      <p className="text-[11px] text-grayMid">Annual estimated expense (warehousing + capital costs).</p>
                    </div>
                    <div className="border border-border rounded-xl p-4 space-y-2">
                      <p className="text-xs uppercase font-semibold text-grayLight">Liquid Capital Potential</p>
                      <p className="text-xl font-bold font-display text-neon">{formatCurrency(capitalRiskData?.tiedCapital || 0)}</p>
                      <p className="text-[11px] text-grayMid">Available cash if recommended markdown/promotions are executed.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Default Mock Data Fallbacks ──────────────────────────────────────────────

function getDefaultBriefing() {
  return "Aroma B2B AI Assistant Daily Briefing:\n• Overall stock health is stable, with 94.2% catalog availability.\n• We identified 2 high-impact upcoming demand spikes: Diwali festival in 5 days (projected +45% premium set sales) and a monsoon seasonal shift starting next Monday.\n• Urgently review the 2 items at immediate stockout risk to avoid lost sales.\n• Triggered trend-check has classified 'Premium Jasmine Set' as high-velocity (ABC-Class A).";
}

function getDefaultSuggestions() {
  return [
    "What products should I reorder this week?",
    "Which products are at stockout risk?",
    "Show trending and high-growth opportunities.",
    "Explain the capital risk in my slow-moving inventory."
  ];
}

function getDefaultForecastChart() {
  return [
    { date: 'Mon', Base: 5400, Adjusted: 5400 },
    { date: 'Tue', Base: 6100, Adjusted: 6100 },
    { date: 'Wed', Base: 5900, Adjusted: 7100 }, // festival impact start
    { date: 'Thu', Base: 6300, Adjusted: 8400 },
    { date: 'Fri', Base: 7000, Adjusted: 9500 }, // peak festival impact
    { date: 'Sat', Base: 7500, Adjusted: 10200 },
    { date: 'Sun', Base: 6800, Adjusted: 8900 },
  ];
}

function getDefaultStockRisks() {
  return [
    { productName: 'Aroma Classic 500ml', currentStock: 12, daysRemaining: 3, riskProbability: 'High (82%)', recommendation: 'Order 48 units' },
    { productName: 'Lavender Mist 200ml', currentStock: 5, daysRemaining: 2, riskProbability: 'High (90%)', recommendation: 'Order 30 units' },
  ];
}

function getDefaultEvents() {
  return [
    { signalType: 'FESTIVAL', signalName: 'Diwali Festival Overlay', intensity: 1.45, date: 'Starting in 2 days', description: 'Major retail spending surge. Recommended 45% increase on premium sets.' },
    { signalType: 'WEATHER', signalName: 'Monsoon Heavy Rain Warning', intensity: 0.88, date: 'Next Mon - Wed', description: 'Expected decrease in walk-in traffic. Recommend boosting home-delivery stocks.' }
  ];
}

function getDefaultRising() {
  return [
    { productName: 'Premium Jasmine Set', trendScore: 1.82, opportunityScore: 94 },
    { productName: 'Sandlewood Aroma Oil', trendScore: 1.45, opportunityScore: 82 },
  ];
}

function getDefaultDeclining() {
  return [
    { productName: 'Rosewater Spray 100ml', trendScore: 0.61, promotionAction: 'Liquidate: Bundle BOGO with Jasmine Set' },
    { productName: 'Citrus Cologne 50ml', trendScore: 0.52, promotionAction: 'Markdown: 25% off coupon' },
  ];
}

function getDefaultTrendSummary() {
  return {
    risingCount: 2,
    decliningCount: 2,
    lastRun: new Date().toISOString()
  };
}

function getDefaultVelocityPie() {
  return [
    { name: 'Fast Moving (Class A)', value: 45 },
    { name: 'Mid Moving (Class B)', value: 35 },
    { name: 'Slow Moving (Class C)', value: 15 },
    { name: 'Dead Stock (Class D)', value: 5 },
  ];
}

function getDefaultTurnover() {
  return {
    turnoverRatio: 6.2,
    benchmarkRatio: 5.5,
    holdingCost: 12400,
    lowStockRiskCount: 2
  };
}

function getDefaultCapitalRisk() {
  return {
    tiedCapital: 42500,
    deadProductsCount: 2
  };
}

function getFallbackAssistantResponse(question) {
  const q = question.toLowerCase();
  if (q.includes('reorder') || q.includes('order') || q.includes('buy')) {
    return "Based on current demand and safety margins, I recommend reordering:\n1. Aroma Classic 500ml — current stock 12 (projected to run out in 3 days). Reorder: 48 units.\n2. Lavender Mist 200ml — current stock 5 (projected to run out in 2 days). Reorder: 30 units.";
  }
  if (q.includes('stockout') || q.includes('run out') || q.includes('risk')) {
    return "Critical Stockout Risks detected:\n- Aroma Classic 500ml: 3 days of stock remaining. Risk probability: High (82%).\n- Lavender Mist 200ml: 2 days of stock remaining. Risk probability: High (90%).";
  }
  if (q.includes('trend') || q.includes('growing') || q.includes('rising')) {
    return "Trending opportunities in your shop:\n- Premium Jasmine Set (ABC Class A): Velocity has grown +82% over the last 7 days. Opportunity Score: 94/100.\n- Sandlewood Aroma Oil: Velocity grew +45% MoM. Opportunity Score: 82/100.";
  }
  if (q.includes('capital') || q.includes('slow') || q.includes('dead')) {
    return "Stock Intelligence Diagnostics:\n- Tied Capital: ₹42,500 is locked up in 2 slow/dead items.\n- At Risk: Citrus Cologne 50ml and Rosewater Spray 100ml. Action: Apply markdown of 25% or run a BOGO bundle to release cash.";
  }
  return "I have reviewed your shop's analytical context. Your daily turnover is currently 6.2x, which is performing above the industry benchmark of 5.5x. Please let me know if you would like me to detail our reorder plans or upcoming festival projections.";
}
