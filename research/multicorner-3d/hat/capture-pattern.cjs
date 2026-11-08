// Capture the existing planar engine in fixed reference coordinates, without UI.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../..'),out=path.join(root,'research/output/multicorner-hat');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',file.endsWith('.svg')?'image/svg+xml':file.endsWith('.js')?'text/javascript':'text/plain');res.end(data);});
});
(async()=>{
 fs.mkdirSync(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch();
 try{
 const page=await browser.newPage({viewport:{width:2500,height:2500},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/madweave.svg`);
 await page.evaluate(()=>{
 stripWidth=.75;stripSpacing=.25;stripSpacingFraction=1/3;
 starMadWeaveCenter=false;hand=false;alternate=false;showC=[true,true,true];showD=[true,true,true];starHexWeaveCenter=false;
 setupNewBaseSize(document,32);colorPattern=1;colorCount=3;
 colorArray[0]='#83b8ca';colorArray[1]='#a9cda0';colorArray[2]='#8c9abd';
 opacityArray.fill(1);showingLines=true;colorIndexArray=null;buildStrips(document);
 const svg=document.documentElement;
 svg.querySelectorAll('script,#buttons,#viewButtons,#documentations,#tools,#pattern').forEach(e=>e.remove());
 svg.setAttribute('viewBox','-15 -15 50 50');svg.setAttribute('width','2500');svg.setAttribute('height','2500');svg.style.background='white';
 });
 await page.screenshot({path:path.join(out,'pattern.png')});
 fs.writeFileSync(path.join(out,'pattern.svg'),await page.evaluate(()=>new XMLSerializer().serializeToString(document.documentElement)));
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Captured original engine: class colors, P=1, W=.75, bounds [-15,-15,35,35], 2500 pixels.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
