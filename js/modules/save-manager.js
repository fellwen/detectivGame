const KEY='grace-hotel-case-v1';
export function loadState(){try{const raw=localStorage.getItem(KEY);if(raw){const data=JSON.parse(raw);if(data&&Array.isArray(data.foundEvidence)&&Number.isInteger(data.stage))return data;}}catch(error){console.warn('Не удалось загрузить сохранение',error);}return {stage:1,foundEvidence:['report','autopsy','decanter','lock','button','note'],readInterrogations:[],answers:{},notes:{},finished:false,ending:null};}
export function saveState(state){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch(error){console.warn('Не удалось сохранить прогресс',error);return false;}}
export function clearState(){try{localStorage.removeItem(KEY);}catch(error){console.warn('Не удалось очистить сохранение',error);}}
