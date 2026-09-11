const KEY = 'engageai_generated_insights';
export function saveInsight(entry){
  try{
    const current=JSON.parse(localStorage.getItem(KEY)||'[]');
    const next=[{...entry,generatedAt:new Date().toISOString()},...current].slice(0,12);
    localStorage.setItem(KEY,JSON.stringify(next));
  }catch{}
}
export function getInsights(){
  try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}
}
