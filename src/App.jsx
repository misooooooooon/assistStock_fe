import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import logo from './assets/logo.png';

function App() {
    const [recommendations, setRecommendations] = useState([]);
    const [market, setMarket] = useState("KR"); // Default to KR
    const [ticker, setTicker] = useState("");
    const [prediction, setPrediction] = useState(null);
    const [optimizationStatus, setOptimizationStatus] = useState(null);
    const [loading, setLoading] = useState(false);

    // Use environment variable for API URL (Production) or default to proxy (Development)
    const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

    useEffect(() => {
        fetchRecommendations();
        fetchOptimizationStatus();
        const interval = setInterval(fetchOptimizationStatus, 5000);
        return () => clearInterval(interval);
    }, [market]); // Re-fetch when market changes

    const fetchRecommendations = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/recommendations?market=${market}`);
            setRecommendations(res.data.recommendations || []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchOptimizationStatus = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/optimization/status`);
            setOptimizationStatus(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    // Modified to accept optional ticker argument
    const handlePredict = async (tickerOverride) => {
        const targetTicker = typeof tickerOverride === 'string' ? tickerOverride : ticker;
        if (!targetTicker) return;

        // If clicked from list, update state
        if (typeof tickerOverride === 'string') {
            setTicker(targetTicker);
        }

        setLoading(true);
        setPrediction(null);
        try {
            const res = await axios.post(`${API_BASE_URL}/predict`, { ticker: targetTicker });
            setPrediction({
                ...res.data.prediction,
                news_sentiment: res.data.news_sentiment
            });
        } catch (e) {
            console.error(e);
            alert("Error fetching prediction");
        }
        setLoading(false);
    };

    const startOptimization = async () => {
        try {
            await axios.post(`${API_BASE_URL}/optimization/run`);
            alert("Optimization (Evolution) started!");
            fetchOptimizationStatus();
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
            <header style={{ marginBottom: '2rem', borderBottom: '1px solid #30363d', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="header-container">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                    <h1 style={{ margin: 0, fontSize: '2rem', background: 'linear-gradient(90deg, #58a6ff, #8b949e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
                        주식 투자 어드바이저
                    </h1>
                    <span style={{ color: '#8b949e', fontSize: '0.9rem', fontWeight: 'normal', paddingBottom: '2px', lineHeight: 1.2 }}>( AI 기반의 투자 지원 솔루션 )</span>
                </div>
                <img src={logo} alt="Logo" style={{ height: '50px' }} />
            </header>

            <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Sidebar: Recommendations */}
                {/* Sidebar: Recommendations */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '2px solid #238636', paddingBottom: '0.5rem' }}>
                        <h2 style={{ color: '#3fb950', margin: 0, fontSize: '1.25rem' }}>
                            AI 추천 종목 ({market})
                        </h2>
                        <div style={{ display: 'flex', gap: '0.2rem' }}>
                            <button
                                onClick={() => setMarket("KR")}
                                style={{
                                    background: market === "KR" ? '#238636' : 'transparent',
                                    border: '1px solid #30363d',
                                    color: 'white',
                                    padding: '0.2rem 0.5rem',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                }}
                            >
                                KR
                            </button>
                            <button
                                onClick={() => setMarket("US")}
                                style={{
                                    background: market === "US" ? '#1f6feb' : 'transparent',
                                    border: '1px solid #30363d',
                                    color: 'white',
                                    padding: '0.2rem 0.5rem',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                }}
                            >
                                US
                            </button>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#8b949e', marginBottom: '1rem', lineHeight: '1.4' }}>
                        AI가 <strong>기술적 지표</strong>(이평선, RSI)와 <strong>기업 가치</strong>(P/E, 이익률)를 종합 분석해 상승 확률이 높은 종목을 엄선했습니다. (Buy 신호 우선)
                    </p>
                    <button onClick={fetchRecommendations} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#238636', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Refresh</button>

                    {recommendations.length === 0 ? (
                        <p>Scanning 30+ major stocks... No bullish signals found yet.</p>
                    ) : (
                        <ul style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                            {recommendations.map((rec, idx) => (
                                <li key={idx}
                                    onClick={() => handlePredict(rec.ticker)}
                                    style={{ marginBottom: '1rem', borderBottom: '1px solid #30363d', paddingBottom: '0.5rem', cursor: 'pointer' }}
                                    className="hover-item"
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ margin: 0 }}>{rec.name || rec.ticker}</h3>
                                            <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>{rec.ticker}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            {/* Fundamental Badges */}
                                            {rec.analysis.fundamental && rec.analysis.fundamental.badges && rec.analysis.fundamental.badges.map((b, i) => (
                                                <span key={i} className="tag" style={{ backgroundColor: '#1f6feb', color: 'white' }}>{b}</span>
                                            ))}
                                            <span className="tag buy">{rec.analysis.signal}</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#8b949e', marginBottom: '0.5rem' }}>
                                        {/* Dynamic Currency for Recommendations (Fallback to Market) */}
                                        Total Score: <strong>{rec.total_score ? rec.total_score.toFixed(1) : rec.analysis.score}</strong> | Price: {(rec.ticker.endsWith('.KS') || rec.ticker.endsWith('.KQ') || market === "KR") ? "₩" : "$"}{rec.analysis.current_price.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#8b949e', marginBottom: '0.2rem' }}>
                                        {/* Key Metrics */}
                                        {rec.analysis.fundamental && (
                                            <>
                                                P/E: {rec.analysis.fundamental.key_metrics['P/E'] ? rec.analysis.fundamental.key_metrics['P/E'].toFixed(1) : 'N/A'} |
                                                Margin: {rec.analysis.fundamental.key_metrics['Profit Margin'] ? (rec.analysis.fundamental.key_metrics['Profit Margin'] * 100).toFixed(1) + '%' : 'N/A'}
                                            </>
                                        )}
                                    </div>
                                    <small style={{ color: '#c9d1d9' }}>
                                        {rec.analysis.details.join(", ")}
                                        {rec.analysis.fundamental && rec.analysis.fundamental.insights.length > 0 && " • " + rec.analysis.fundamental.insights.join(", ")}
                                    </small>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Prediction Section */}
                <section className="card">
                    <h2>🔮 Price Prediction & Insight</h2>
                    <p style={{ fontSize: '0.85rem', color: '#8b949e', marginBottom: '1rem' }}>
                        과거 30일 패턴과 최신 뉴스(Reuters, Bloomberg, Google News 등)를 분석해 <strong>향후 7일간의 주가 흐름</strong>을 예측합니다.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handlePredict()}
                            placeholder="Enter Ticker (e.g. AAPL)"
                            style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #30363d', background: '#0d1117', color: 'white', flex: 1 }}
                        />
                        <button onClick={() => handlePredict()} disabled={loading}>
                            {loading ? 'Analyzing...' : 'Predict'}
                        </button>
                    </div>

                    {prediction && (
                        <div style={{ background: '#0d1117', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem 0' }}>{ticker} Outlook: <span style={{ color: prediction.outlook === "Bullish" ? 'var(--success-color)' : 'var(--danger-color)' }}>{prediction.outlook}</span></h3>
                                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Current Price</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                    {/* Correct Currency Logic: based on ticker suffix */}
                                                    {(ticker.endsWith('.KS') || ticker.endsWith('.KQ')) ? "₩" : "$"}{prediction.current_price ? prediction.current_price.toLocaleString(undefined, { maximumFractionDigits: (ticker.endsWith('.KS') || ticker.endsWith('.KQ')) ? 0 : 2 }) : 'N/A'}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '1.5rem', color: '#8b949e' }}>→</div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Target Price (7d)</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: prediction.predicted_price_7d > prediction.current_price ? '#238636' : '#da3633' }}>
                                                    {(ticker.endsWith('.KS') || ticker.endsWith('.KQ')) ? "₩" : "$"}{prediction.predicted_price_7d ? prediction.predicted_price_7d.toLocaleString(undefined, { maximumFractionDigits: (ticker.endsWith('.KS') || ticker.endsWith('.KQ')) ? 0 : 2 }) : 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Potential</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: prediction.predicted_price_7d > prediction.current_price ? '#238636' : '#da3633' }}>
                                                    {prediction.predicted_price_7d && prediction.current_price ? (
                                                        ((prediction.predicted_price_7d - prediction.current_price) / prediction.current_price * 100).toFixed(2) + "%"
                                                    ) : "N/A"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', maxWidth: '250px' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#8b949e', marginBottom: '0.3rem' }}>
                                            Is based on <strong>Linear Regression</strong> trend of last 30 days.
                                        </div>
                                        {prediction.news_sentiment && prediction.news_sentiment.sources && (
                                            <div style={{ fontSize: '0.75rem', color: '#58a6ff' }}>
                                                Sources: {prediction.news_sentiment.sources.join(", ")}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Graph */}
                            <div style={{ height: '300px', marginBottom: '1rem', position: 'relative' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={prediction.graph_data}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                                        <XAxis dataKey="day" stroke="#8b949e" />
                                        <YAxis domain={['auto', 'auto']} stroke="#8b949e" tickFormatter={(value) => value.toLocaleString()} />
                                        <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d' }} />
                                        <Legend />
                                        <ReferenceLine x="D-1" stroke="red" label="Today" />
                                        <Line type="monotone" dataKey="price" stroke="#58a6ff" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Reasoning */}
                            <div style={{ background: '#161b22', padding: '1rem', borderRadius: '8px', border: '1px solid #30363d', marginBottom: '1rem' }}>
                                <strong>💡 AI Reasoning:</strong>
                                <p style={{ marginTop: '0.5rem', lineHeight: '1.5' }}>{prediction.reasoning}</p>
                            </div>

                            {/* News Section */}
                            {prediction.news_sentiment && (
                                <div style={{ background: '#161b22', padding: '1rem', borderRadius: '8px', border: '1px solid #30363d' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <strong>📰 Latest News Sentiment (Last 30 Days)</strong>
                                        <span className={`tag ${prediction.news_sentiment.sentiment === "Positive" ? "buy" : prediction.news_sentiment.sentiment === "Negative" ? "sell" : ""}`}>
                                            {prediction.news_sentiment.sentiment} {prediction.news_sentiment.score !== 0 && `(${prediction.news_sentiment.score > 0 ? "+" : ""}${prediction.news_sentiment.score})`}
                                        </span>
                                    </div>

                                    {prediction.news_sentiment.headlines.length > 0 ? (
                                        <ul style={{ fontSize: '0.9rem', color: '#c9d1d9', paddingLeft: '1.2rem', margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
                                            {prediction.news_sentiment.headlines.map((h, i) => (
                                                <li key={i} style={{ marginBottom: '0.5rem' }}>
                                                    <a href={h.link} target="_blank" rel="noopener noreferrer" style={{ color: '#58a6ff', textDecoration: 'none' }}>
                                                        {h.title || h.title_en || "제목 없음"}
                                                    </a>
                                                    <div style={{ fontSize: '0.8rem', color: '#8b949e', marginTop: '0.1rem' }}>
                                                        [{h.source || "News"}] {h.published ? new Date(h.published).toLocaleDateString() : "날짜 없음"}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p style={{ fontSize: '0.9rem', color: '#8b949e', fontStyle: 'italic' }}>
                                            {prediction.news_sentiment.message || "No news found in the last 30 days."}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Optimization Status Section */}
            </div>

            {/* Bottom Section: Optimization & Donation (Side by Side) */}
            {/* Optimization (Removed UI, background only) */}

            {/* Donation */}
            <div style={{ background: '#161b22', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', marginTop: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#e6edf3' }}>☕ 개발자 후원 (Donation)</h3>
                <div style={{ display: 'inline-block', background: '#0d1117', padding: '1rem', borderRadius: '8px', border: '1px solid #30363d', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#58a6ff', marginBottom: '0.5rem' }}>
                        우리은행 1002-632-473859
                    </div>
                    <div style={{ color: '#8b949e' }}>예금주: 이재성</div>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#8b949e', marginTop: '1rem', lineHeight: '1.5' }}>
                    모든 기능은 무료이며 후원여부 무관하게 동일한 기능<br />
                    을 제공하고, 후원자 전용 상담은 받지 않습니다. 🙌
                </p>
            </div>

            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#8b949e', fontSize: '0.85rem', marginTop: '1rem' }}>
                ⚠️ 투자 판단은 본인 책임! 수익은 보장되지 않아요.<br />
                Contact: phan98susan@gmail.com
            </div>
        </div>
    )
}

export default App
