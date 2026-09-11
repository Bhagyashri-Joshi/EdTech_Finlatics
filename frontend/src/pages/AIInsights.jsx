import { useEffect, useState } from 'react';
import { getInsights } from '../lib/insightStore';

const fmt=d=>new Intl.DateTimeFormat('en',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(d));
export default function AIInsights(){
 const [items,setItems]=useState([]);
 useEffect(()=>setItems(getInsights()),[]);
 return <div className="ai-insights-page"><div className="page-intro"><div><p className="eyebrow">AI INSIGHTS</p><h1>Generated engagement insights</h1><p>Recent dashboard and student analyses generated in this browser.</p></div></div>
  {items.length===0?<div className="panel empty-state"><strong>No generated insights yet</strong><p>Generate an insight from the dashboard or a student profile.</p></div>:<div className="insight-history">{items.map((item,i)=><article className="panel history-card" key={`${item.generatedAt}-${i}`}><div className="history-head"><div><span>{item.type==='dashboard'?'Dashboard':'Student'}</span><h2>{item.title}</h2></div><small>{fmt(item.generatedAt)}</small></div><p>{item.insight?.summary}</p>{item.insight?.recommendedAction&&<div><b>Recommended action</b><p>{item.insight.recommendedAction}</p></div>}{item.insight?.recommendations?.length>0&&<div><b>Recommendations</b><ul className="ai-list">{item.insight.recommendations.map((x,j)=><li key={j}>{x}</li>)}</ul></div>}</article>)}</div>}
 </div>
}
