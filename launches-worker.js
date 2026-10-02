// MemeScanner live launch detector — Cloudflare Worker
// Pump.fun is implemented first. The adapter shape is ready for Raydium LaunchLab,
// LetsBONK, Bags, Believe and Moonshot.

const RPC = 'https://api.mainnet-beta.solana.com';
const PUMP = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const CREATE = [24,30,200,40,5,28,7,119];
const CREATE_V2 = [214,144,76,236,95,139,49,180];
const MAX = 24;

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':'*'}})}
async function rpc(method,params){
  const r=await fetch(RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
  if(!r.ok) throw new Error('Solana RPC HTTP '+r.status);
  const d=await r.json(); if(d.error) throw new Error(d.error.message||'Solana RPC error'); return d.result;
}
function b58(bytes){const alpha='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';let n=0n;for(const b of bytes)n=n*256n+BigInt(b);let out='';while(n){const r=Number(n%58n);out=alpha[r]+out;n/=58n}for(const b of bytes){if(b!==0)break;out='1'+out}return out||'1'}
function same(a,b){return a.length===b.length&&a.every((v,i)=>v===b[i])}
function decodeB58(s){const alpha='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';let n=0n;for(const c of s){const i=alpha.indexOf(c);if(i<0)throw Error('bad base58');n=n*58n+BigInt(i)}const out=[];while(n){out.push(Number(n&255n));n>>=8n}out.reverse();for(const c of s){if(c!=='1')break;out.unshift(0)}return Uint8Array.from(out)}
function readU32(a,o){return a[o]|(a[o+1]<<8)|(a[o+2]<<16)|(a[o+3]*0x1000000)}
function readString(a,o){const len=readU32(a,o);o+=4;return [new TextDecoder().decode(a.slice(o,o+len)),o+len]}
function decodeCreate(data){
  try{let o=8;let name,symbol,uri;[name,o]=readString(data,o);[symbol,o]=readString(data,o);[uri,o]=readString(data,o);return {name,symbol,uri}}catch{return {name:'Unknown',symbol:'?',uri:''}}
}
function parseCurve(data){
  try{
    const a=decodeB58(data); if(a.length<81) return null;
    const dv=new DataView(a.buffer,a.byteOffset,a.byteLength);
    const u64=o=>Number(dv.getBigUint64(o,true));
    return {virtualToken:u64(8),virtualSol:u64(16),realToken:u64(24),realSol:u64(32),supply:u64(40),complete:Boolean(a[48])};
  }catch{return null}
}
async function txFor(sig){return rpc('getTransaction',[sig,{encoding:'jsonParsed',commitment:'confirmed',maxSupportedTransactionVersion:0}])}
function extractCreate(tx){
  const keys=(tx?.transaction?.message?.accountKeys||[]).map(x=>typeof x==='string'?x:x.pubkey);
  const ix=[...(tx?.transaction?.message?.instructions||[])];
  for(const i of ix){
    if(i.programId!==PUMP || typeof i.data!=='string') continue;
    const raw=decodeB58(i.data); const d=Array.from(raw.slice(0,8));
    if(same(d,CREATE)||same(d,CREATE_V2)){
      return {mint:keys[0],curve:keys[2],decoded:decodeCreate(raw)};
    }
  }
  return null;
}
async function pumpLaunches(){
  const sigs=await rpc('getSignaturesForAddress',[PUMP,{limit:MAX}]);
  const rows=[];
  for(const s of sigs.slice(0,MAX)){
    try{
      const tx=await txFor(s.signature); if(!tx)continue;
      const c=extractCreate(tx); if(!c?.mint||!c?.curve)continue;
      const acc=await rpc('getAccountInfo',[c.curve,{encoding:'base64',commitment:'confirmed'}]);
      const curve=acc?.value?.data?.[0]?parseCurve(acc.value.data[0]):null;
      if(!curve)continue;
      const createdAt=(Number(tx.blockTime)||Math.floor(Date.now()/1000))*1000;
      let status=curve.complete?'graduated':(Date.now()-createdAt<120000?'new':'bonding');
      let progress=curve.supply>0?((curve.supply-curve.realToken)/curve.supply)*100:0;
      rows.push({address:c.mint,name:c.decoded.name,symbol:c.decoded.symbol,uri:c.decoded.uri,launchpad:'Pump.fun',chain:'solana',createdAt,status,progress,marketCap:0,liquidity:0,volume:0,signature:s.signature});
    }catch{}
  }
  return rows;
}
export default {async fetch(request){
  const u=new URL(request.url);
  if(u.pathname==='/api/launches'){
    try{
      const rows=await pumpLaunches();
      const groups={new:rows.filter(x=>x.status==='new'),bonding:rows.filter(x=>x.status==='bonding'),graduated:rows.filter(x=>x.status==='graduated')};
      return json({updatedAt:Date.now(),groups,launchpads:['Pump.fun']});
    }catch(e){return json({error:e.message||'Launch detector failed'},502)}
  }
  return new Response('MemeScanner launch worker',{status:200,headers:{'content-type':'text/plain'}});
}};
