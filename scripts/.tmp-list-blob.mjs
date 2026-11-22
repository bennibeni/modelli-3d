import { list } from '@vercel/blob';
let cursor, all=[];
do { const r = await list({ cursor, limit: 1000 }); all.push(...r.blobs); cursor = r.hasMore ? r.cursor : undefined; } while (cursor);
let tot=0; for (const b of all.sort((a,b)=>b.size-a.size)) { tot+=b.size; console.log((b.size/1e6).toFixed(1).padStart(7),'MB', b.uploadedAt.toISOString().slice(0,16), b.pathname); }
console.log('TOTALE', all.length, 'file', (tot/1e6).toFixed(1), 'MB');
