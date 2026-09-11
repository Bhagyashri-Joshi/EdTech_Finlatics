import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { saveInsight } from '../lib/insightStore';

const label=s=>s?.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const fmt=d=>d?new Intl.DateTimeFormat('en',{month:'short',day:'numeric',year:'numeric'}).format(new Date(d)):'No activity';
const eventLabel={LOGIN:'Login',ASSIGNMENT_SUBMITTED:'Assignment submitted',ASSIGNMENT_COMPLETED:'Assignment completed',QUIZ_ATTEMPTED:'Quiz attempted',QUIZ_COMPLETED:'Quiz completed',QUIZ_SCORE:'Quiz score'};
export default function StudentDetails(){
 const {id}=useParams(), navigate=useNavigate();
 const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [ai,setAi]=useState(null),[aiLoading,setAiLoading]=useState(false),[aiError,setAiError]=useState(''),[aiFallback,setAiFallback]=useState(false);
 const load=async()=>{setLoading(true);setError('');try{const r=await api.get(`/students/${id}`);setData(r.data)}catch(e){setError(e.response?.data?.message||'Could not load student details.')}finally{setLoading(false)}};
 useEffect(()=>{load()},[id]);
 const history=useMemo(()=>data?.engagementHistory?.slice(-30)||[],[data]);
 const generateInsight=async()=>{if(aiLoading)return;setAiLoading(true);setAiError('');try{const r=await api.post('/ai/student-insight',{studentId:Number(id)});setAi(r.data.insight);setAiFallback(Boolean(r.data.fallback));saveInsight({type:'student',studentId:Number(id),title:data?.student?.name||`Student ${id}`,insight:r.data.insight})}catch(e){setAiError(e.response?.data?.message||'Could not generate AI insight. Please try again.')}finally{setAiLoading(false)}};
 if(loading)return <div className="detail-grid"><div className="skeleton detail-hero"/><div className="skeleton detail-chart"/><div className="skeleton detail-chart"/></div>;
 if(error)return <div className="state-card"><h2>Student details unavailable</h2><p>{error}</p><button className="primary-btn" onClick={load}>Try again</button></div>;
 const s=data.student,e=data.engagement,l=data.loginMetrics,a=data.assignmentMetrics,q=data.quizMetrics;
 return <div className="student-detail-page">
  <button className="back-btn" onClick={()=>navigate(-1)}><ArrowLeft size={16} aria-hidden="true"/> Back to students</button>
  <section className="student-hero panel"><div className="avatar-lg">{s.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div><div className="student-hero-copy"><p className="eyebrow">STUDENT PROFILE</p><h1>{s.name}</h1><p>{s.email}</p></div><div className="student-hero-score"><span className={`status ${e.status==='AT_RISK'?'risk':e.status==='NEEDS_ATTENTION'?'attention':e.status==='ENGAGED'?'engaged':'high'}`}>{label(e.status)}</span><strong>{e.score}%</strong><small>Engagement score</small></div></section>
  <div className="metric-grid"><Metric title="Login frequency" value={`${l.activeLoginDaysLast30}/${l.expectedLoginDays}`} sub="active days in last 30"/><Metric title="Assignment completion" value={`${a.completion}%`} sub={`${a.completed} of ${a.assigned} completed`}/><Metric title="Quiz score" value={`${q.averageScore}%`} sub={`${q.completed} quizzes completed`}/><Metric title="Last active" value={fmt(e.lastActive)} sub={e.atRisk?'At-risk rule triggered':'Recent activity recorded'}/></div>
  <section className="panel ai-card ai-student-card">
    <div className="ai-card-head"><div><p className="eyebrow">AI INSIGHT</p><h2>Teacher guidance for {s.name}</h2><p>Generated only from the metrics shown on this profile.</p></div><button className="primary-btn" onClick={generateInsight} disabled={aiLoading}>{aiLoading?'Generating…':ai?'Regenerate':'Generate AI Insight'}</button></div>
    {aiError&&<div className="ai-error">{aiError}</div>}
    {aiFallback&&!aiLoading&&<div className="ai-error">Automated data-based fallback, not AI-generated. Gemini was unavailable, so this insight uses backend metrics.</div>}
    {aiLoading&&<div className="ai-loading"><span/><span/><span/></div>}
    {ai&&!aiLoading&&<div className="ai-grid"><div><h3>Summary</h3><p>{ai.summary}</p></div><div><h3>Key observations</h3><BulletList items={ai.keyObservations}/></div><div><h3>Risk factors</h3>{ai.riskFactors?.length?<BulletList items={ai.riskFactors}/>:<p className="muted">No additional risk factors identified from the supplied data.</p>}</div><div><h3>Recommendations</h3><BulletList items={ai.recommendations}/></div></div>}
    {!ai&&!aiLoading&&!aiError&&<div className="ai-empty">Generate a concise, data-grounded summary and teacher recommendations.</div>}
  </section>
  <div className="detail-grid two"><section className="panel chart-panel"><div className="section-head"><div><h2>Engagement over time</h2><p>Deterministic daily score from database activity</p></div></div>{history.length?<div className="chart-box"><ResponsiveContainer width="100%" height="100%"><LineChart data={history}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date" tickFormatter={v=>v.slice(5)} minTickGap={28}/><YAxis domain={[0,100]}/><Tooltip/><Line type="monotone" dataKey="engagementScore" stroke="#2563eb" strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer></div>:<div className="empty-state"><strong>No engagement data</strong><p>There is no activity history for this student yet.</p></div>}</section>
  <section className="panel chart-panel"><div className="section-head"><div><h2>Performance by topic</h2><p>Latest stored topic-level performance</p></div></div>{data.topicPerformance.length?<div className="chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.topicPerformance}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis domain={[0,100]}/><Tooltip/><Bar dataKey="score" fill="#3b82f6" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div>:<div className="empty-state"><strong>No topic performance</strong><p>No topic scores have been recorded for this student yet.</p></div>}</section></div>
  <div className="detail-grid two"><section className="panel activity-panel"><div className="section-head"><div><h2>Recent activity</h2><p>Latest learning events</p></div></div>{data.recentActivity.length?<div className="timeline">{data.recentActivity.map(ev=><div className="timeline-item" key={ev.id}><span className="timeline-dot"/><div><b>{eventLabel[ev.event_type]||label(ev.event_type)}</b><small>{fmt(ev.occurred_at)}{ev.event_type==='QUIZ_SCORE'&&ev.metadata?.score!=null?` · ${ev.metadata.score}%`:''}</small></div></div>)}</div>:<div className="empty-state"><strong>No recent activity</strong><p>Learning events will appear here when recorded.</p></div>}</section>
  <section className="panel summary-panel"><div className="section-head"><div><h2>Performance summary</h2><p>Core engagement components</p></div></div>{[['Login score',e.components.loginScore],['Assignment score',e.components.assignmentScore],['Quiz score',e.components.quizScore],['Recency score',e.components.recencyScore]].map(([n,v])=><div className="summary-row" key={n}><span>{n}</span><div><i><em style={{width:`${v}%`}}/></i><b>{v}%</b></div></div>)}</section></div>
 </div>
}
function Metric({title,value,sub}){return <article className="metric-card"><span>{title}</span><strong>{value}</strong><small>{sub}</small></article>}
function BulletList({items=[]}){return items.length?<ul className="ai-list">{items.map((x,i)=><li key={i}>{x}</li>)}</ul>:<p className="muted">No items returned.</p>}
