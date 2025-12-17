import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import logo from './assets/logo.png';

const TRANSLATIONS = {
    ko: {
        title: "주식 투자 어드바이저",
        subtitle_1: "1. 추천종목 확인 하거나,",
        subtitle_2: "2. 종목을 입력해서 지표 및 최신 뉴스 확인 기능",
        ai_recs: "AI 추천 종목",
        scan_msg: "AI가 기술적 지표(이평선, RSI)와 기업 가치(P/E, 이익률)를 종합 분석해 상승 확률이 높은 종목을 엄선했습니다. (Buy 신호 우선)",
        refresh_btn: "새로고침",
        scanning: "시장 데이터 스캔 중... 잠시만 기다려주세요...",
        no_bullish: "주요 30개 종목 스캔 중... 강력한 매수 신호가 아직 없습니다.",
        prediction_title: "🔮 주가 예측 & 인사이트",
        prediction_desc: "과거 30일 패턴과 최신 뉴스(Reuters, Bloomberg 등)를 분석해 향후 7일간의 주가 흐름을 예측합니다.",
        input_placeholder: "종목코드 입력 (예: AAPL, 005930.KS)",
        predict_btn: "예측하기",
        analyzing_btn: "분석 중...",
        outlook_label: "전망:",
        current_price: "현재가",
        target_price: "목표가 (7일)",
        potential: "예상 수익률",
        based_on: "최근 30일간의 선형 회귀(Linear Regression) 추세 기반",
        ai_reasoning: "💡 AI 분석 결과:",
        news_sentiment: "📰 최신 뉴스 감성 분석",
        last_30_days: "( 최근 30일 )",
        donation_title: "☕ 개발자 후원 (Donation)",
        donation_desc: "모든 기능은 무료이며 후원여부 무관하게 동일한 기능을 제공하고, 후원자 전용 상담은 받지 않습니다. 🙌",
        disclaimer: "⚠️ 투자 판단은 본인 책임! 수익은 보장되지 않아요.",
        contact: "Contact: phan98susan@gmail.com",
        total_score: "종합 점수",
        price_label: "주가",
        pe_label: "P/E",
        margin_label: "이익률",
        sources_label: "출처:",
        account_holder_label: "예금주",
        no_title: "제목 없음",
        no_date: "날짜 없음",
        no_news_fallback: "최근 30일간 뉴스 없음"
    },
    en: {
        title: "Stock Investment Advisor",
        subtitle_1: "1. Check recommended stocks,",
        subtitle_2: "2. Or enter a ticker for analysis & news.",
        ai_recs: "AI Recommendations",
        scan_msg: "AI analyzes technical indicators (RSI, MA) and fundamentals (P/E) to select stocks with high upside potential. (Buy signals prioritized)",
        refresh_btn: "Refresh",
        scanning: "Scanning market data... Please wait...",
        no_bullish: "Scanning 30+ major stocks... No bullish signals found yet.",
        prediction_title: "🔮 Price Prediction & Insight",
        prediction_desc: "Predicts 7-day price trends based on 30-day patterns and latest news (Reuters, Bloomberg, etc).",
        input_placeholder: "Enter Ticker (e.g. AAPL)",
        predict_btn: "Predict",
        analyzing_btn: "Analyzing...",
        outlook_label: "Outlook:",
        current_price: "Current Price",
        target_price: "Target Price (7d)",
        potential: "Potential",
        based_on: "Based on Linear Regression trend of last 30 days.",
        ai_reasoning: "💡 AI Reasoning:",
        news_sentiment: "📰 Latest News Sentiment",
        last_30_days: "( Last 30 Days )",
        donation_title: "☕ Developer Donation",
        donation_desc: "All features are free regardless of donation. No private consultation provided. 🙌",
        disclaimer: "⚠️ Investment decisions are your responsibility. Returns are not guaranteed.",
        contact: "Contact: phan98susan@gmail.com",
        total_score: "Total Score",
        price_label: "Price",
        pe_label: "P/E",
        margin_label: "Margin",
        sources_label: "Sources:",
        account_holder_label: "Account Holder",
        no_title: "No Title",
        no_date: "No Date",
        no_news_fallback: "No news found in the last 30 days."
    }
};

function App() {
    const [recommendations, setRecommendations] = useState([]);
    const [market, setMarket] = useState("KR"); // Default to KR
    const [ticker, setTicker] = useState("");
    const [prediction, setPrediction] = useState(null);
    const [optimizationStatus, setOptimizationStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingRecs, setLoadingRecs] = useState(false);

    // Auto-detect language
    const [language, setLanguage] = useState(() => {
        const browserLang = navigator.language || navigator.userLanguage || "ko";
        return browserLang.includes("ko") ? "ko" : "en";
    });

    const t = TRANSLATIONS[language];

    // Use environment variable for API URL (Production) or default to proxy (Development)
    const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

    useEffect(() => {
        fetchRecommendations();
        fetchOptimizationStatus();
        const interval = setInterval(fetchOptimizationStatus, 5000);
        return () => clearInterval(interval);
    }, [market]); // Re-fetch when market changes

    const fetchRecommendations = async () => {
        setLoadingRecs(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/recommendations?market=${market}`);
            setRecommendations(res.data.recommendations || []);
        } catch (e) {
            console.error(e);
        }
        setLoadingRecs(false);
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
        <div className="app-container" style={{ fontFamily: 'Inter, sans-serif' }}>
            <header style={{ marginBottom: '2rem', borderBottom: '1px solid #30363d', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="header-container">
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap', width: '100%', justifyContent: 'center' }}>
                        <h1 style={{ margin: 0, fontSize: '2rem', background: 'linear-gradient(90deg, #58a6ff, #8b949e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, textAlign: 'center' }}>
                            {t.title}
                        </h1>
                        <span style={{ color: '#8b949e', fontSize: '0.8rem', fontWeight: 'normal', paddingBottom: '2px', lineHeight: 1.4, textAlign: 'center' }}>
                            ( {t.subtitle_1} <br className="mobile-only" /> {t.subtitle_2} )
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }} className="desktop-only">
                    <img src={logo} alt="Logo" style={{ height: '50px' }} />
                    <button
                        onClick={() => setLanguage(lang => lang === 'ko' ? 'en' : 'ko')}
                        style={{ background: 'transparent', border: '1px solid #30363d', color: '#8b949e', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        {language === 'ko' ? '🇺🇸 English' : '🇰🇷 한국어'}
                    </button>
                </div>
            </header>

            <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Sidebar: Recommendations */}
                {/* Sidebar: Recommendations */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '2px solid #238636', paddingBottom: '0.5rem' }}>
                        <h2 style={{ color: '#3fb950', margin: 0, fontSize: '1.25rem' }}>
                            {t.ai_recs} ({market})
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
                        {t.scan_msg}
                    </p>
                    <button onClick={fetchRecommendations} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#238636', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t.refresh_btn}</button>

                    {loadingRecs ? (
                        <p style={{ color: '#8b949e' }}>{t.scanning}</p>
                    ) : recommendations.length === 0 ? (
                        <p>{t.no_bullish}</p>
                    ) : (
                        <ul style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                            {recommendations.map((rec, idx) => (
                                <li key={idx}
                                    onClick={() => handlePredict(rec.ticker)}
                                    style={{ marginBottom: '1rem', borderBottom: '1px solid #30363d', paddingBottom: '0.5rem', cursor: 'pointer' }}
                                    className="hover-item"
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div>
                                            <h3 style={{ margin: 0, wordBreak: 'break-all' }}>{rec.name || rec.ticker}</h3>
                                            <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>{rec.ticker}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            {/* Fundamental Badges */}
                                            {rec.analysis.fundamental && rec.analysis.fundamental.badges && rec.analysis.fundamental.badges.map((b, i) => (
                                                <span key={i} className="tag" style={{ backgroundColor: '#1f6feb', color: 'white', whiteSpace: 'nowrap' }}>{b}</span>
                                            ))}
                                            <span className="tag buy" style={{ whiteSpace: 'nowrap' }}>{rec.analysis.signal}</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#8b949e', marginBottom: '0.5rem' }}>
                                        {/* Dynamic Currency for Recommendations (Fallback to Market) */}
                                        {t.total_score}: <strong>{rec.total_score ? rec.total_score.toFixed(1) : rec.analysis.score}</strong> | {t.price_label}: {(rec.ticker.endsWith('.KS') || rec.ticker.endsWith('.KQ') || market === "KR") ? "₩" : "$"}{rec.analysis.current_price.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#8b949e', marginBottom: '0.2rem' }}>
                                        {/* Key Metrics */}
                                        {rec.analysis.fundamental && (
                                            <>
                                                {t.pe_label}: {rec.analysis.fundamental.key_metrics['P/E'] ? rec.analysis.fundamental.key_metrics['P/E'].toFixed(1) : 'N/A'} |
                                                {t.margin_label}: {rec.analysis.fundamental.key_metrics['Profit Margin'] ? (rec.analysis.fundamental.key_metrics['Profit Margin'] * 100).toFixed(1) + '%' : 'N/A'}
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
                    <h2>{t.prediction_title}</h2>
                    <p style={{ fontSize: '0.85rem', color: '#8b949e', marginBottom: '1rem' }}>
                        {t.prediction_desc}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handlePredict()}
                            placeholder={t.input_placeholder}
                            style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #30363d', background: '#0d1117', color: 'white', flex: 1 }}
                        />
                        <button onClick={() => handlePredict()} disabled={loading}>
                            {loading ? t.analyzing_btn : t.predict_btn}
                        </button>
                    </div>

                    {prediction && (
                        <div style={{ background: '#0d1117', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem 0' }}>{ticker} {t.outlook_label} <span style={{ color: prediction.outlook === "Bullish" ? 'var(--success-color)' : 'var(--danger-color)' }}>{prediction.outlook}</span></h3>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>{t.current_price}</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                    {/* Correct Currency Logic: based on ticker suffix */}
                                                    {(ticker.endsWith('.KS') || ticker.endsWith('.KQ')) ? "₩" : "$"}{prediction.current_price ? prediction.current_price.toLocaleString(undefined, { maximumFractionDigits: (ticker.endsWith('.KS') || ticker.endsWith('.KQ')) ? 0 : 2 }) : 'N/A'}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '1.5rem', color: '#8b949e' }}>→</div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>{t.target_price}</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: prediction.predicted_price_7d > prediction.current_price ? '#238636' : '#da3633' }}>
                                                    {(ticker.endsWith('.KS') || ticker.endsWith('.KQ')) ? "₩" : "$"}{prediction.predicted_price_7d ? prediction.predicted_price_7d.toLocaleString(undefined, { maximumFractionDigits: (ticker.endsWith('.KS') || ticker.endsWith('.KQ')) ? 0 : 2 }) : 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>{t.potential}</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: prediction.predicted_price_7d > prediction.current_price ? '#238636' : '#da3633' }}>
                                                    {prediction.predicted_price_7d && prediction.current_price ? (
                                                        ((prediction.predicted_price_7d - prediction.current_price) / prediction.current_price * 100).toFixed(2) + "%"
                                                    ) : "N/A"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', maxWidth: 'none', width: '100%' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#8b949e', marginBottom: '0.3rem', textAlign: 'left' }}>
                                            {t.based_on}
                                        </div>
                                        {prediction.news_sentiment && prediction.news_sentiment.sources && (
                                            <div style={{ fontSize: '0.75rem', color: '#58a6ff', textAlign: 'left' }}>
                                                {t.sources_label} {prediction.news_sentiment.sources.join(", ")}
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
                                <strong>{t.ai_reasoning}</strong>
                                <p style={{ marginTop: '0.5rem', lineHeight: '1.5' }}>{prediction.reasoning}</p>
                            </div>

                            {/* News Section */}
                            {prediction.news_sentiment && (
                                <div style={{ background: '#161b22', padding: '1rem', borderRadius: '8px', border: '1px solid #30363d' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                        <div>
                                            <strong>{t.news_sentiment}</strong>
                                            <div className="mobile-only-block" style={{ fontSize: '0.85rem', color: '#8b949e' }}>{t.last_30_days}</div>
                                            <span className="desktop-only" style={{ marginLeft: '0.5rem' }}>{t.last_30_days}</span>
                                        </div>
                                        <span className={`tag ${prediction.news_sentiment.sentiment === "Positive" ? "buy" : prediction.news_sentiment.sentiment === "Negative" ? "sell" : ""}`}>
                                            {prediction.news_sentiment.sentiment} {prediction.news_sentiment.score !== 0 && `(${prediction.news_sentiment.score > 0 ? "+" : ""}${prediction.news_sentiment.score})`}
                                        </span>
                                    </div>

                                    {prediction.news_sentiment.headlines.length > 0 ? (
                                        <ul style={{ fontSize: '0.9rem', color: '#c9d1d9', paddingLeft: '1.2rem', margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
                                            {prediction.news_sentiment.headlines.map((h, i) => (
                                                <li key={i} style={{ marginBottom: '0.5rem' }}>
                                                    <a href={h.link} target="_blank" rel="noopener noreferrer" style={{ color: '#58a6ff', textDecoration: 'none' }}>
                                                        {h.title || h.title_en || t.no_title}
                                                    </a>
                                                    <div style={{ fontSize: '0.8rem', color: '#8b949e', marginTop: '0.1rem' }}>
                                                        [{h.source || "News"}] {h.published ? new Date(h.published).toLocaleDateString() : t.no_date}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p style={{ fontSize: '0.9rem', color: '#8b949e', fontStyle: 'italic' }}>
                                            {prediction.news_sentiment.message || t.no_news_fallback}
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
                <h3 style={{ margin: '0 0 1rem 0', color: '#e6edf3' }}>{t.donation_title}</h3>
                <div style={{ display: 'block', background: '#0d1117', padding: '1rem', borderRadius: '8px', border: '1px solid #30363d', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#58a6ff', marginBottom: '0.5rem' }}>
                        우리은행 1002-632-473859
                    </div>
                    <div style={{ color: '#8b949e' }}>{t.account_holder_label}: 이재성</div>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#8b949e', marginTop: '1rem', lineHeight: '1.5' }}>
                    {t.donation_desc}
                </p>
            </div>

            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#8b949e', fontSize: '0.85rem', marginTop: '1rem' }}>
                {t.disclaimer}<br />
                {t.contact}
            </div>

            {/* Mobile Bottom Logo */}
            <div className="mobile-only" style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '1rem' }}>
                <img src={logo} alt="Logo" style={{ height: '50px', opacity: 0.8 }} />
            </div>
        </div>
    )
}

export default App
