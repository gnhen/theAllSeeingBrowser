(function(){
"use strict";
var main=document.getElementById("main"),data={};
var cardState=safe(function(){return JSON.parse(localStorage.getItem("cardState")||"{}")},{});
function saveCardState(){safe(function(){localStorage.setItem("cardState",JSON.stringify(cardState))})}
function cardTitle(title){return'<div class="card-head"><button class="card-title" type="button" aria-expanded="true">'+esc(title)+'</button><button class="copy-card" type="button" aria-label="Copy section" title="Copy section">⧉</button></div>'}
function applyCardState(el){var state=cardState[el.id]||{};el.classList.toggle("collapsed",!!state.collapsed);var b=el.querySelector(".card-title");if(b)b.setAttribute("aria-expanded",String(!state.collapsed))}
var optionsButton=document.getElementById("options"),optionsPanel=document.getElementById("optionsPanel");
optionsButton.addEventListener("click",function(){optionsPanel.hidden=!optionsPanel.hidden});
["id","time","scr","hw","gpu","net","sto","perm","med","font","fp","extra","devices","privacy","snap","compare","behavior","drop","ext","bat","geo","live","inp","log"].forEach(function(i){var s=document.createElement("section");s.id="c_"+i;s.className="card";if(i==="behavior")s.innerHTML=cardTitle("Behavior diagnostics")+'<textarea id="typing" placeholder="Type here to measure typing rhythm"></textarea><div id="typingResult" class="note">Type in the box above to measure the time between keystrokes.</div><div id="dropzone" class="dropzone">Drop a file here<br><label><input id="filebox" type="file"> Choose a file</label></div><div id="pastepreview" class="note">Paste an image here to preview it.</div>';else s.innerHTML='<div class="note">Loading...</div>';if(i==="ext"||i==="snap"||i==="compare"||i==="drop")s.hidden=true;main.appendChild(s);applyCardState(s)});
function esc(s){return String(s).replace(/[&<>]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;"}[c]})}
function show(id,title,obj,live,note){
  var el=document.getElementById("c_"+id);
  if(!el){el=document.createElement("section");el.id="c_"+id;main.appendChild(el)}
  el.hidden=false;
  el.classList.add("card");
  el.classList.toggle("live",!!live);
  data[title]=obj;
  var nav=document.getElementById("quicknav"),link=document.getElementById("nav_"+id);
  if(nav&&!link){link=document.createElement("a");link.id="nav_"+id;link.href="#c_"+id;link.textContent=title;nav.appendChild(link)}
  var BOX={"Currently highlighted":1,"Last highlighted":1,"Last copied":1,"Last cut":1,"Last pasted":1};
  var sig=JSON.stringify([title,obj,live,note]);if(el._sig===sig)return;el._sig=sig;
  var h=cardTitle(title);
  for(var k in obj){var v=obj[k];if(v===undefined||v===null||v==="")v="n/a";var rendered=v==="__PUBLIC_IP_BUTTON__"?'<button class="network-action" id="grab-ip" title="This button creates a network request to show your public IPv4">Grab IP</button>':v==="__LOCAL_IP_BUTTON__"?'<button class="network-action" id="grab-local-ip" title="Try to discover a private local IPv4 using WebRTC; browsers may hide it">Find local IP</button>':esc(v);h+='<div class="row"><div class="k">'+esc(k)+'</div><div class="v'+(BOX[k]?" box":"")+'">'+rendered+"</div></div>"}
  var why={"Identity and browser":"Sites use this to identify your browser and automation environment.","Screen and window":"Sites use this to adapt layout and infer display preferences.","Fingerprint breakdown":"Sites combine these signals to tell visitors apart without cookies.","Audio, display and media":"Sites use media and rendering differences as fingerprint signals.","Privacy checks":"These checks show which tracking defenses this browser exposes.","Behavior diagnostics":"Typing, pointer, and attention patterns can identify a returning visitor.","Selection and clipboard":"Pages can observe interaction events such as selection, copy, cut, and paste."};
  if(note||why[title])h+='<div class="note">'+esc(note||why[title])+"</div>";
  var ss=[].map.call(el.querySelectorAll(".box"),function(b){return b.scrollTop});el.innerHTML=h;[].forEach.call(el.querySelectorAll(".box"),function(b,i){b.scrollTop=ss[i]||0});applyCardState(el);applyFilter();
}
function safe(f,d){try{var r=f();return r===undefined?d:r}catch(e){return d===undefined?"blocked or unsupported":d}}
function yn(b){return b?"Yes":"No"}
function bytes(n){if(!n&&n!==0)return"n/a";var u=["B","KB","MB","GB","TB"],i=0;while(n>=1024&&i<4){n/=1024;i++}return n.toFixed(1)+" "+u[i]}

// ---------- Identity ----------
var n=navigator,uad=n.userAgentData,fontsFound=[],fontCandidates=[],webglInfo={},gpuName;
function identity(extra){
  var o={"User agent":n.userAgent,"Platform":n.platform,"Vendor":n.vendor,"Browser engine":safe(function(){return /Firefox|FxiOS/.test(n.userAgent)?"Gecko":/Chrome|Chromium|Edg/.test(n.userAgent)?"Blink":/Safari/.test(n.userAgent)?"WebKit":"Unknown"}),
  "Language":n.language,"All languages":(n.languages||[]).join(", "),"Cookies enabled":yn(n.cookieEnabled),"Do Not Track":n.doNotTrack||window.doNotTrack||"not set","Global Privacy Control":safe(function(){return n.globalPrivacyControl===undefined?"not reported":yn(n.globalPrivacyControl)}),"Webdriver (automation)":yn(n.webdriver),"PDF viewer built in":safe(function(){return yn(n.pdfViewerEnabled)}),"Online":yn(n.onLine)};
  if(uad){o["Brands"]=uad.brands.map(function(b){return b.brand+" "+b.version}).join(", ");o["Mobile"]=yn(uad.mobile);o["Platform (UA-CH)"]=uad.platform}
  for(var k in extra)o[k]=extra[k];
  show("id","Identity and browser",o);
}
identity();
if(uad&&uad.getHighEntropyValues)uad.getHighEntropyValues(["architecture","bitness","model","platformVersion","fullVersionList","wow64"]).then(function(h){
  identity({"Architecture":h.architecture+" "+h.bitness+"-bit","Device model":h.model||"n/a","OS version":h.platformVersion,"Full versions":(h.fullVersionList||[]).map(function(b){return b.brand+" "+b.version}).join(", ")})}).catch(function(){});

// ---------- Time ----------
function time(){
  var d=new Date(),o=Intl.DateTimeFormat().resolvedOptions();
  show("time","Time and locale",{"Local time":d.toString(),"UTC":d.toUTCString(),"ISO":d.toISOString(),"Unix ms":d.getTime(),"Timezone":o.timeZone,"UTC offset (min)":-d.getTimezoneOffset(),"Calendar":o.calendar,"Numbering":o.numberingSystem,"Locale":o.locale,"Hour cycle":safe(function(){return new Intl.DateTimeFormat(undefined,{hour:"numeric"}).resolvedOptions().hourCycle}),"Sample number":(1234567.89).toLocaleString(),"Time on this page":((performance.now()/1000)|0)+" s","Page loaded":new Date(performance.timeOrigin).toLocaleTimeString()},true);
}
time();setInterval(time,1000);

// ---------- Screen ----------
function screens(){
  var s=screen,mm=function(q){return matchMedia(q).matches};
  show("scr","Screen and window",{"Screen size":s.width+" x "+s.height,"Available":s.availWidth+" x "+s.availHeight,"Window inner":innerWidth+" x "+innerHeight,"Window outer":outerWidth+" x "+outerHeight,"Window position":screenX+", "+screenY,"Pixel ratio":devicePixelRatio,"Color depth":s.colorDepth+" bit","Orientation":safe(function(){return s.orientation.type}),"Fullscreen":yn(!!document.fullscreenElement),"Dark mode":yn(mm("(prefers-color-scheme: dark)")),"Reduced motion":yn(mm("(prefers-reduced-motion: reduce)")),"High contrast":yn(mm("(prefers-contrast: more)")),"Forced colors":yn(mm("(forced-colors: active)")),"Inverted colors":yn(mm("(inverted-colors: inverted)")),"Reduced transparency":yn(mm("(prefers-reduced-transparency: reduce)")),"Minimum font size":safe(function(){var d=document.createElement("div");d.style.cssText="font-size:1px;position:absolute";d.textContent="x";document.body.appendChild(d);var r=d.offsetHeight;d.remove();return r+" px"}),"HDR display":yn(mm("(dynamic-range: high)")),"Wide gamut P3":yn(mm("(color-gamut: p3)")),"Hover capable":yn(mm("(hover: hover)")),"Pointer":mm("(pointer: fine)")?"fine (mouse)":mm("(pointer: coarse)")?"coarse (touch)":"none","Installed as app":yn(mm("(display-mode: standalone)")),"Zoom (approx)":Math.round(outerWidth/innerWidth*100)+"%"},true);
}
screens();addEventListener("resize",screens);

// ---------- Hardware ----------
show("hw","Hardware",{"CPU threads":n.hardwareConcurrency,"Device memory":n.deviceMemory?n.deviceMemory+" GB (rounded)":"not reported","Max touch points":n.maxTouchPoints,"Touch supported":yn("ontouchstart" in window),"Gamepads connected":safe(function(){return Array.prototype.filter.call(n.getGamepads(),Boolean).length}),"Bluetooth API":yn(!!n.bluetooth),"USB API":yn(!!n.usb),"Serial API":yn(!!n.serial),"HID API":yn(!!n.hid),"WebXR (VR/AR)":yn(!!n.xr)});
function gpu(){
  var c=document.createElement("canvas"),g=c.getContext("webgl")||c.getContext("experimental-webgl");
  if(!g)return show("gpu","Graphics",{"WebGL":"unavailable"});
  var vendor=g.getParameter(g.VENDOR),renderer=g.getParameter(g.RENDERER),version=g.getParameter(g.VERSION),details=safe(function(){return g.getExtension("WEBGL_debug_renderer_info")});
  if(details){vendor=safe(function(){return g.getParameter(details.UNMASKED_VENDOR_WEBGL)},vendor);renderer=safe(function(){return g.getParameter(details.UNMASKED_RENDERER_WEBGL)},renderer)}
  gpuName=renderer;webglInfo={vendor:vendor,renderer:renderer,version:version};
  show("gpu","Graphics",{"GPU vendor":vendor,"GPU renderer":renderer,"WebGL version":version,"Max texture size":g.getParameter(g.MAX_TEXTURE_SIZE),"WebGL extensions":g.getSupportedExtensions().length,"WebGPU":yn(!!n.gpu)});
}
safe(gpu);
if(!n.getBattery)show("bat","Battery",{"Battery API":"not supported by this browser"});
safe(function(){var b=n.getBattery();b.then(function(b){function u(){show("bat","Battery",{"Level":Math.round(b.level*100)+"%","Charging":yn(b.charging),"Time to full":b.chargingTime===Infinity?"n/a":b.chargingTime+" s","Time to empty":b.dischargingTime===Infinity?"n/a":b.dischargingTime+" s"},true)}u();["levelchange","chargingchange"].forEach(function(e){b.addEventListener(e,u)})})});

// ---------- Network ----------
var publicIp="not requested",localIp="not requested";
function net(){var c=n.connection||n.mozConnection||{};show("net","Network",{"Online":yn(n.onLine),"Connection type":c.type||"n/a","Effective type":c.effectiveType||"n/a","Downlink":c.downlink?c.downlink+" Mbps":"n/a","Round trip":c.rtt?c.rtt+" ms":"n/a","Data saver":c.saveData===undefined?"n/a":yn(c.saveData),"Public IP":publicIp==="not requested"?"__PUBLIC_IP_BUTTON__":publicIp,"Local IP":localIp==="not requested"?"__LOCAL_IP_BUTTON__":localIp,"Page URL":location.href,"Protocol":location.protocol,"Referrer":document.referrer||"none (typed or direct)","History entries":history.length,"Embedded in iframe":yn(top!==self)},true,"Public IP uses a request to an external IP service only after you press Grab IP. Local IP discovery uses WebRTC and may be hidden by browser privacy protections.")}
function grabPublicIp(){
 publicIp="requesting...";
 net();
 var pc=window.RTCPeerConnection&&new window.RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun.cloudflare.com:3478"}]}),found=[],done=false;
 function add(value){var m=String(value||"").match(/(?:^| )(\d{1,3}(?:\.\d{1,3}){3})(?: |$)/);if(m&&!/^127\.|^0\.|^192\.168\.|^10\.|^172\.(?:1[6-9]|2\d|3[01])\./.test(m[1])&&found.indexOf(m[1])<0)found.push(m[1])}
 function finish(){if(done)return;done=true;if(pc)pc.close();if(found.length){publicIp=found[0];net()}else publicIp="No public IPv4 returned (network or privacy protection)";net()}
 if(pc){
  pc.onicecandidate=function(e){if(e.candidate)add(e.candidate.candidate);else finish()};
  pc.onicegatheringstatechange=function(){if(pc.iceGatheringState==="complete")finish()};
  pc.createDataChannel("public-ip");pc.createOffer().then(function(o){return pc.setLocalDescription(o)}).catch(finish);setTimeout(finish,6000);
 }else finish();
}
function grabLocalIp(){
 localIp="checking...";
 net();
 if(!window.RTCPeerConnection){localIp="WebRTC not supported";return net()}
 var pc=new window.RTCPeerConnection({iceServers:[]}),found=[],done=false;
 function addCandidate(value){var m=String(value||"").match(/(?:^| )(\d{1,3}(?:\.\d{1,3}){3})(?: |$)/);if(m&&!/^127\.|^0\.|^0\.0\.0\.0$/.test(m[1])&&found.indexOf(m[1])<0)found.push(m[1])}
 function inspectStats(){return pc.getStats().then(function(stats){stats.forEach(function(r){if(r.type==="local-candidate")addCandidate(r.address||r.ip||r.candidate)})}).catch(function(){})}
 function finish(){if(done)return;done=true;inspectStats().then(function(){pc.close();localIp=found.length?found.join(", "):"not exposed (modern browsers hide private IPs with mDNS/privacy protection; 0.0.0.0 is not a device address)";net()})}
 pc.onicecandidate=function(e){if(e.candidate)addCandidate(e.candidate.candidate);else finish()};
 pc.onicegatheringstatechange=function(){if(pc.iceGatheringState==="complete")finish()};
 pc.createDataChannel("local-ip");
 pc.createOffer().then(function(o){return pc.setLocalDescription(o)}).catch(finish);
 setTimeout(finish,3000);
}
net();addEventListener("online",net);addEventListener("offline",net);
safe(function(){(n.connection).addEventListener("change",net)});

// ---------- Storage and permissions ----------
function store(est){
  var o={"localStorage":safe(function(){localStorage.setItem("t","1");localStorage.removeItem("t");return"works"},"blocked"),"sessionStorage":safe(function(){sessionStorage.setItem("t","1");return"works"},"blocked"),"IndexedDB":yn(!!window.indexedDB),"Service workers":yn("serviceWorker" in n),"Cookies on this page":document.cookie||"none","Storage quota":est?bytes(est.quota):"checking...","Storage used":est?bytes(est.usage):"checking...","Private mode guess":est?(est.quota<130*1048576?"Likely private/incognito (small quota)":"Probably not private"):"checking...","JS heap used":safe(function(){return bytes(performance.memory.usedJSHeapSize)}),"JS heap limit":safe(function(){return bytes(performance.memory.jsHeapSizeLimit)})};
  show("sto","Storage",o);
}
store();safe(function(){n.storage.estimate().then(store)});
var perms=["geolocation","notifications","camera","microphone","clipboard-read","clipboard-write","midi","persistent-storage","push","screen-wake-lock"],po={};
Promise.all(perms.map(function(p){if(!n.permissions)return Promise.resolve(po[p]="not supported");return n.permissions.query({name:p}).then(function(r){po[p]=r.state}).catch(function(){po[p]="not supported"})})).then(function(){show("perm","Permissions already granted or denied",po)}).catch(function(){});
if(!(n.mediaDevices&&n.mediaDevices.enumerateDevices))show("med","Media devices",{"API":"not supported"});
safe(function(){n.mediaDevices.enumerateDevices().then(function(d){var c={audioinput:0,videoinput:0,audiooutput:0};d.forEach(function(x){c[x.kind]++});show("med","Media devices",{"Microphones":c.audioinput,"Cameras":c.videoinput,"Speakers":c.audiooutput,"Device names":d.some(function(x){return x.label})?d.map(function(x){return x.label}).join(", "):"hidden until you grant camera or mic access"})})});

// ---------- Fonts, audio, voices ----------
function fonts(){
  var list=["Arial","Verdana","Times New Roman","Courier New","Georgia","Comic Sans MS","Impact","Trebuchet MS","Helvetica","Calibri","Cambria","Consolas","Segoe UI","Tahoma","Menlo","Monaco","Roboto","Ubuntu","San Francisco","Futura","Gill Sans","Palatino","Garamond","Lucida Grande","Apple Color Emoji","Noto Sans","Fira Code","Source Code Pro","Open Sans","Helvetica Neue","Avenir","Optima","Baskerville"];
  fontCandidates=list;
  var
  base=["monospace","serif","sans-serif"],t="mmmmmmmmmmlli",sp=document.createElement("span");
  sp.style.cssText="position:absolute;left:-9999px;font-size:72px;visibility:hidden";sp.textContent=t;document.body.appendChild(sp);
  var bw={};base.forEach(function(b){sp.style.fontFamily=b;bw[b]=sp.offsetWidth});
  var found=list.filter(function(f){return base.some(function(b){sp.style.fontFamily="'"+f+"',"+b;return sp.offsetWidth!==bw[b]})});
  fontsFound=found;
  sp.remove();
  var v=safe(function(){return speechSynthesis.getVoices().length},0);
  show("font","Fonts, audio and voices",{"Fonts tested":list.length,"Installed fonts found":found.join(", ")||"none",
  "Speech voices":v,"Audio sample rate":safe(function(){return (window.OfflineAudioContext||window.webkitOfflineAudioContext)?"44100 Hz (offline test)":"not supported"}),"Supports MP3":safe(function(){return new Audio().canPlayType("audio/mpeg")||"no"}),"Supports WebM video":safe(function(){return document.createElement("video").canPlayType("video/webm")||"no"}),"Supports H.264":safe(function(){return document.createElement("video").canPlayType('video/mp4; codecs="avc1.42E01E"')||"no"}),"Supports AV1":safe(function(){return document.createElement("video").canPlayType('video/mp4; codecs="av01.0.05M.08"')||"no"})});
}
safe(fonts);safe(function(){speechSynthesis.onvoiceschanged=fonts});

// ---------- Fingerprint ----------
function hash(s){var h=5381;for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return("00000000"+(h>>>0).toString(16)).slice(-8)}
var audioFingerprintPromise;
function audioFingerprint(){
  if(audioFingerprintPromise)return audioFingerprintPromise;
  audioFingerprintPromise=Promise.resolve(safe(function(){var C=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!C)return"not supported";var a=new C(1,44100,44100),o=a.createOscillator(),g=a.createGain(),c=a.createDynamicsCompressor();o.type="triangle";o.frequency.value=1000;g.gain.value=.01;o.connect(g);g.connect(c);c.connect(a.destination);o.start(0);o.stop(.5);return a.startRendering().then(function(b){var d=b.getChannelData(0),sample=[];for(var i=0;i<d.length;i+=100)sample.push(Math.round(d[i]*100000));return hash(sample.join(","))}).catch(function(){return"blocked or unsupported"})},"not supported"));
  return audioFingerprintPromise;
}
safe(function(){
  var c=document.createElement("canvas");c.width=240;c.height=60;var x=c.getContext("2d");
  x.textBaseline="top";x.font="16px Arial";x.fillStyle="#f60";x.fillRect(10,5,100,30);x.fillStyle="#069";x.fillText("Fingerprint test 123 \u{1F600}",4,18);
  var ch=hash(c.toDataURL()),fontSignal=safe(function(){return fontsFound.length+" of "+fontCandidates.length+" tested fonts detected"},"not measured"),webglSignal=hash([gpuName||"unavailable",webglInfo.version,webglInfo.vendor].join("|")),all=[n.userAgent,n.language,screen.width,screen.height,screen.colorDepth,n.hardwareConcurrency,Intl.DateTimeFormat().resolvedOptions().timeZone,ch,webglSignal,fontSignal,n.platform,n.maxTouchPoints].join("|");
  var available=[ch,gpuName,webglInfo.version,fontsFound.length,screen.width+"x"+screen.height,Intl.DateTimeFormat().resolvedOptions().timeZone,n.hardwareConcurrency,n.language].filter(function(v){return v!==undefined&&v!==null&&v!==""}).length;
  var coverage=Math.round(available/8*100);
  Promise.resolve(audioFingerprint()).then(function(ah){show("fp","Fingerprint breakdown",{"Signal coverage":coverage+"% of the measurable signals are available","Estimated distinguishability":coverage>=88?"high signal coverage":coverage>=63?"moderate signal coverage":"limited signal coverage","Canvas hash":ch,"Audio hash":ah,"WebGL hash":webglSignal,"Fonts signal":fontSignal,"GPU signal":gpuName||"not available","Screen signal":screen.width+" x "+screen.height+" @ "+devicePixelRatio+"x, "+screen.colorDepth+" bit","Timezone signal":Intl.DateTimeFormat().resolvedOptions().timeZone,"Combined hash":hash(all)+"-"+hash(all.split("").reverse().join("")),"Note":"This is coverage, not a population uniqueness percentile. A real uniqueness score requires a representative comparison dataset, which this private page does not collect."})});
});

// ---------- Additional exposed signals ----------
safe(function(){
  Promise.resolve(audioFingerprint()).then(function(audio){
    var codecs=["video/mp4; codecs=\"avc1.42E01E\"","video/webm; codecs=\"vp9\"","video/mp4; codecs=\"av01.0.05M.08\""],v=document.createElement("video");
    show("extra","Audio, display and media",{"Audio fingerprint":audio,"Refresh rate":refreshRate()+" Hz (measured)","Live FPS":"warming up","Keyboard layout":n.keyboard&&n.keyboard.getLayoutMap?"querying...":"not exposed by this browser","HDR":matchMedia("(dynamic-range: high)").matches?"supported":"not reported","Wide color":matchMedia("(color-gamut: p3)").matches?"P3":"not reported","Widevine / DRM API":yn(!!window.navigator.requestMediaKeySystemAccess),"H.264":v.canPlayType(codecs[0])||"no","VP9":v.canPlayType(codecs[1])||"no","AV1":v.canPlayType(codecs[2])||"no","Emoji rendering":emojiTest()});
    if(n.keyboard&&n.keyboard.getLayoutMap)n.keyboard.getLayoutMap().then(function(m){show("extra","Audio, display and media",{"Audio fingerprint":audio,"Refresh rate":refreshRate()+" Hz","Live FPS":fpsValue?fpsValue+" fps":"warming up","Keyboard layout":Array.from(m.entries()).slice(0,12).map(function(x){return x[0]+"="+x[1]}).join(", ")||"empty","HDR":matchMedia("(dynamic-range: high)").matches?"supported":"not reported","Wide color":matchMedia("(color-gamut: p3)").matches?"P3":"not reported","Widevine / DRM API":yn(!!window.navigator.requestMediaKeySystemAccess),"H.264":v.canPlayType(codecs[0])||"no","VP9":v.canPlayType(codecs[1])||"no","AV1":v.canPlayType(codecs[2])||"no","Emoji rendering":emojiTest()})});
  });
});
var fpsValue=0,lastFrame=performance.now(),frameCount=0,refreshValue="measuring...";
function refreshRate(){return refreshValue}
function measureRefresh(){var count=0,start=0,last=0;function frame(now){if(!start)start=now;last=now;count++;if(now-start<1000)requestAnimationFrame(frame);else{refreshValue=Math.round((count-1)/((last-start)/1000));updateMediaCard()}}requestAnimationFrame(frame)}
function fps(){frameCount++;var now=performance.now();if(now-lastFrame>=1000){fpsValue=Math.round(frameCount/((now-lastFrame)/1000));frameCount=0;lastFrame=now;updateMediaCard()}}requestAnimationFrame(function loop(){fps();requestAnimationFrame(loop)});
function updateMediaCard(){var el=document.getElementById("c_extra");if(!el)return;Promise.resolve(audioFingerprint()).then(function(audio){show("extra","Audio, display and media",{"Audio fingerprint":audio,"Refresh rate":refreshValue+" Hz","Live FPS":fpsValue?fpsValue+" fps":"warming up","Keyboard layout":n.keyboard&&n.keyboard.getLayoutMap?"available":"not exposed by this browser","HDR":matchMedia("(dynamic-range: high)").matches?"supported":"not reported","Wide color":matchMedia("(color-gamut: p3)").matches?"P3":"not reported","Widevine / DRM API":yn(!!window.navigator.requestMediaKeySystemAccess),"H.264":document.createElement("video").canPlayType("video/mp4; codecs=\"avc1.42E01E\"")||"no","VP9":document.createElement("video").canPlayType("video/webm; codecs=\"vp9\"")||"no","AV1":document.createElement("video").canPlayType("video/mp4; codecs=\"av01.0.05M.08\"")||"no","Emoji rendering":emojiTest()})})}
measureRefresh();
function emojiTest(){var c=document.createElement("canvas"),x=c.getContext("2d");x.font="32px sans-serif";x.fillText("😀🫠🪿",0,32);return hash(c.toDataURL())}
function deviceCount(api){
 if(!api||typeof api.getDevices!=="function")return Promise.resolve("not supported");
 try{return Promise.resolve(api.getDevices()).then(function(d){return d.length}).catch(function(){return"permission denied"})}
 catch(e){return Promise.resolve("permission denied")}
}
Promise.all([deviceCount(n.usb),deviceCount(n.serial),deviceCount(n.hid)]).then(function(v){show("devices","Displays and allowed devices",{"Multi-monitor API":"not queried until Detect monitors is clicked","USB devices":v[0],"Serial devices":v[1],"HID devices":v[2]})});
show("privacy","Privacy checks",{"Fingerprint protection":/Firefox/.test(n.userAgent)&&innerWidth%200===0&&innerHeight%100===0?"Possible Firefox resistance":"No strong signal","Third-party cookies":safe(function(){return n.cookieEnabled?"enabled for this page (cross-site blocking cannot be proved)":"disabled"}),"Storage inventory":"This page can only inspect its own origin; third-party storage is not exposed."});

// ---------- Extensions ----------
var injected=[];
function extShow(o){var r={};for(var k in o){if(k==="Installed plugins (legacy list)")continue;var v=String(o[k]);if(/^(No\b|none|n\/a|Cannot|Could not|check about)/i.test(v))continue;r[k]=o[k]}
var el=document.getElementById("c_ext");
if(!Object.keys(r).length){if(el){el.hidden=true;el.innerHTML="";el._sig=null}delete data["Extensions and add-ons"];return}
if(el)el.hidden=false;
show("ext","Extensions and add-ons",r,true,"Only traces your browser exposed to this page are listed. Browsers do not hand over a full extension list.")}
function seen(s){return safe(function(){return !!document.querySelector(s)},false)}
function canvasCheck(){return safe(function(){var mk=function(){var c=document.createElement("canvas");c.width=60;c.height=20;var x=c.getContext("2d");x.fillStyle="rgb(10,20,30)";x.fillRect(0,0,60,20);x.fillText("abc",2,12);return c},a=mk(),b=mk(),p=a.getContext("2d").getImageData(0,0,1,1).data;if(a.toDataURL()!==b.toDataURL()||p[0]!==10||p[1]!==20||p[2]!==30)return"Likely. Canvas output is being randomized (Brave and Firefox fingerprint protection do this too)";if(!/native code/.test(Function.prototype.toString.call(HTMLCanvasElement.prototype.toDataURL)))return"Likely. toDataURL has been replaced by a script";return"No trace. Canvas output is stable and untouched"},"Could not test")}
function tmCheck(){var e=safe(function(){return window.external&&(window.external.Tampermonkey||window.external.Violentmonkey||window.external.Greasemonkey)},null);return e||seen("[id^=tampermonkey],[class*=tampermonkey]")?"Detected":"No trace. Userscript managers usually stay invisible unless one of your scripts touches this page"}
document.addEventListener("focusin",function(){setTimeout(extScan,700)});
function extScan(){
  var found=[];
  var bait=document.createElement("div");bait.className="adsbox ad-banner ad_unit pub_300x250 textads";bait.style.cssText="position:absolute;left:-999px;height:10px;width:10px";bait.innerHTML="&nbsp;";document.body.appendChild(bait);
  setTimeout(function(){
    var blocked=!bait.offsetHeight||getComputedStyle(bait).display==="none";bait.remove();
    var sel={"Grammarly":"grammarly-desktop-integration,[data-grammarly-shadow-root],grammarly-extension","LastPass":"[data-lastpass-icon-root],[data-lastpass-root]","1Password":"com-1password-button,[data-1p-ignore]","Bitwarden":"[data-bwautofill],bit-extension","Dashlane":"[data-dashlanecreated]","Dark Reader":"meta[name=darkreader],[data-darkreader-mode]","Honey":"#honeyContainer,[id^=honey]","Google Translate":".goog-te-banner-frame,#goog-gt-tt","Loom":"#loom-companion-mv3","Wappalyzer":"#wappalyzer-container","React DevTools":"[data-reactroot]","Vue DevTools":"#vue-devtools-anchor","Metamask / wallet":"[data-metamask]","Save to Pocket":"#pocket-button"};
    for(var k in sel)if(safe(function(){return document.querySelector(sel[k])},null))found.push(k);
    var w=window;
    if(w.ethereum)found.push("Crypto wallet (window.ethereum)");
    if(w.__REACT_DEVTOOLS_GLOBAL_HOOK__)found.push("React DevTools hook");
    if(w.__VUE_DEVTOOLS_GLOBAL_HOOK__)found.push("Vue DevTools hook");
    if(w.__REDUX_DEVTOOLS_EXTENSION__)found.push("Redux DevTools");
    if(w.chrome&&w.chrome.runtime&&w.chrome.runtime.id)found.push("Extension runtime visible");
    var attrs=Array.prototype.map.call(document.documentElement.attributes,function(a){return a.name}).filter(function(a){return!/^(lang|class|style|data-theme)$/.test(a)});
    extShow({"uBlock Origin":blocked?"Possible. Bait elements were hidden, but this page cannot tell uBlock Origin from other blockers":"No trace. Bait elements stayed visible","CanvasBlocker":canvasCheck(),"SponsorBlock":"Cannot be seen from here. It only acts on YouTube and leaves nothing on other sites","Tampermonkey":tmCheck(),"Any ad blocker or content blocker":yn(blocked),"Known extensions detected":found.join(", ")||"none of the ones this page tests for","Extra attributes on <html>":attrs.join(", ")||"none","Elements injected into page":injected.length?injected.join(" | "):"none seen so far","Installed plugins (legacy list)":safe(function(){return Array.prototype.map.call(n.plugins,function(p){return p.name}).join(", ")||"none"}),"Tracking protection (Firefox)":safe(function(){return /Firefox/.test(n.userAgent)?"check about:preferences#privacy":"n/a"})});
  },80);
}
extScan();setInterval(extScan,8000);
safe(function(){new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(nd){if(nd.nodeType===1&&!nd.closest("#main")&&nd.id!=="c_ext"&&!/^(SCRIPT|STYLE)$/.test(nd.tagName)&&!(nd.style&&nd.style.left==="-999px")&&nd.style.visibility!=="hidden"){var d="<"+nd.tagName.toLowerCase()+(nd.id?"#"+nd.id:"")+">";if(injected.indexOf(d)<0)injected.push(d)}})})}).observe(document.body,{childList:true})});

// ---------- Live: selection, clipboard, input ----------
var st={sel:"nothing selected",copied:"nothing yet",cut:"nothing yet",pasted:"nothing yet",paste_from:"",key:"none",keys:0,mx:0,my:0,clicks:0,btn:"none",scroll:"0 / 0",focus:document.hasFocus()?"focused":"not focused",vis:document.visibilityState,wheel:0,drag:"none",ctx:0,idle:"active",last:Date.now(),log:[]};
st.typing=[];st.moves=[];st.scrollSections={};st.hiddenAt=0;st.tabAway=0;st.selectionHistory=[];
function log(s){st.log.unshift(new Date().toLocaleTimeString()+"  "+s);st.log=st.log.slice(0,10)}
function trunc(s){return s.length>50000?s.slice(0,50000)+"... ("+s.length+" chars total)":s}
function updateTyping(){
 var result=document.getElementById("typingResult");
 if(!result)return;
 var values=st.typing.slice(-20);
 result.textContent=values.length?"Intervals: "+values.join(", ")+" ms | Average: "+Math.round(values.reduce(function(a,b){return a+b},0)/values.length)+" ms":"Type in the box above to measure the time between keystrokes.";
}
function live(){
  var s=document.getSelection(),t=s?s.toString():"";
  if(t)st.sel=trunc(t);
  show("live","Selection and clipboard",{"Currently highlighted":t?trunc(t)+"  ["+t.length+" chars, "+(t.trim().split(/\s+/).length)+" words]":"nothing highlighted","Last highlighted":st.sel,"Last copied":st.copied,"Last cut":st.cut,"Last pasted":st.pasted,"Pasted data types":st.paste_from||"n/a","Right clicks":st.ctx,"Last drag":st.drag},true,"Copy events reveal what you copied without any permission. Reading the clipboard at other times needs the button above.");
  show("inp","Mouse, keyboard and attention",{"Mouse position":st.mx+", "+st.my,"Mouse buttons":st.btn,"Clicks":st.clicks,"Last key":st.key,"Keys pressed":st.keys,"Typing intervals":st.typing.slice(-10).join(", ")||"type in the box below","Scroll":st.scroll,"Scroll depth":Math.round((scrollY/(document.documentElement.scrollHeight-innerHeight||1))*100)+"%","Wheel events":st.wheel,"Window focus":st.focus,"Tab visibility":st.vis,"Tab switches":st.tabAway,"Activity":st.idle,"Hovering":st.hover||"n/a","Mouse movement samples":st.moves.length},true);
  show("log","Event log (newest first)",{"Events":st.log.join("\n")||"waiting..."},true);
}
var selectionTimer;
document.addEventListener("selectionchange",function(){clearTimeout(selectionTimer);selectionTimer=setTimeout(function(){var t=document.getSelection().toString();if(t&&(!st.selectionHistory.length||st.selectionHistory[st.selectionHistory.length-1]!==t))st.selectionHistory.push(trunc(t));live()},250)});
document.addEventListener("copy",function(e){var t=document.getSelection().toString();if(!t&&document.activeElement&&document.activeElement.value!==undefined)t=document.activeElement.value.substring(document.activeElement.selectionStart,document.activeElement.selectionEnd);st.copied=trunc(t)||"(empty)";log("COPY "+t.length+" chars");live()});
document.addEventListener("cut",function(){var a=document.activeElement,t=a&&a.value!==undefined?a.value.substring(a.selectionStart,a.selectionEnd):"";st.cut=trunc(t)||"(empty)";log("CUT "+t.length+" chars");live()});
document.addEventListener("paste",function(e){var cd=e.clipboardData,t=cd.getData("text/plain");st.pasted=trunc(t)||"(no text)";st.paste_from=Array.prototype.join.call(cd.types,", ")+(cd.files.length?"  ["+cd.files.length+" file(s)]":"");log("PASTE "+t.length+" chars");live()});
document.addEventListener("mousemove",function(e){var dx=e.clientX-st.mx,dy=e.clientY-st.my,dist=Math.sqrt(dx*dx+dy*dy);st.mx=e.clientX;st.my=e.clientY;st.moves.push(Math.round(dist));if(st.moves.length>100)st.moves.shift();st.idle="active";st.last=Date.now();var t=e.target;st.hover=t.tagName.toLowerCase()+(t.id?"#"+t.id:"");if(!live.p){live.p=1;setTimeout(function(){live.p=0;live()},150)}});
document.addEventListener("mousedown",function(e){st.clicks++;st.btn=["left","middle","right"][e.button]||e.button;log("CLICK "+st.btn+" at "+e.clientX+","+e.clientY);live()});
document.addEventListener("contextmenu",function(){st.ctx++;log("RIGHT CLICK menu");live()});
document.addEventListener("keydown",function(e){var now=Date.now();if(document.activeElement&&document.activeElement.id==="typing"){if(st.lastKey&&st.typing.length<100)st.typing.push(now-st.lastKey);st.lastKey=now;updateTyping()}else st.lastKey=0;st.keys++;st.key=(e.ctrlKey?"Ctrl+":"")+(e.metaKey?"Cmd+":"")+(e.altKey?"Alt+":"")+(e.shiftKey?"Shift+":"")+e.key+" (code "+e.code+")";st.idle="active";st.last=now;live()});
document.addEventListener("wheel",function(){st.wheel++;if(!live.p){live.p=1;setTimeout(function(){live.p=0;live()},150)}},{passive:true});
document.addEventListener("scroll",function(){st.scroll=Math.round(scrollY)+" / "+Math.round(document.documentElement.scrollHeight-innerHeight)+" px";live()},{passive:true});
document.addEventListener("dragstart",function(e){st.drag=e.target.tagName;log("DRAG started");live()});
addEventListener("focus",function(){st.focus="focused";log("Window focused");live()});
addEventListener("blur",function(){st.focus="not focused";log("Window lost focus");live()});
document.addEventListener("visibilitychange",function(){st.vis=document.visibilityState;if(document.hidden){st.hiddenAt=Date.now()}else if(st.hiddenAt){st.tabAway++;st.log.unshift("Tab away for "+Math.round((Date.now()-st.hiddenAt)/1000)+" s")}log("Tab "+st.vis);live()});
addEventListener("beforeprint",function(){log("PRINT started");live()});
setInterval(function(){var s=(Date.now()-st.last)/1000;st.idle=s>10?"idle for "+(s|0)+" s":"active";live()},2000);
live();

(function(){
var el=document.getElementById("sum"),last="";
function selectionOffsets(root){
  var s=document.getSelection();if(!s||s.rangeCount===0||!s.anchorNode||!s.focusNode||!root.contains(s.anchorNode)||!root.contains(s.focusNode))return null;
  function offset(node,position){var r=document.createRange();r.selectNodeContents(root);r.setEnd(node,position);return r.toString().length}
  return {start:offset(s.anchorNode,s.anchorOffset),end:offset(s.focusNode,s.focusOffset)};
}
function restoreSelection(root,selection){
  if(!selection)return;
  var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[],node,total=0;
  while(node=walker.nextNode()){nodes.push({node:node,start:total,end:total+node.nodeValue.length});total+=node.nodeValue.length}
  function point(value){for(var i=0;i<nodes.length;i++)if(value<=nodes[i].end)return[nodes[i].node,Math.max(0,value-nodes[i].start)];return nodes.length?[nodes[nodes.length-1].node,nodes[nodes.length-1].node.nodeValue.length]:[root,0]}
  var start=point(Math.min(selection.start,total)),end=point(Math.min(selection.end,total)),range=document.createRange(),s=document.getSelection();
  range.setStart(start[0],start[1]);range.setEnd(end[0],end[1]);s.removeAllRanges();s.addRange(range);
}
function b(t){return"<b>"+esc(t)+"</b>"}
function J(a){a[0]=a[0].charAt(0).toUpperCase()+a[0].slice(1);return(a.length>2?a.slice(0,-1).join(", ")+", and "+a[a.length-1]:a.join(" and "))+"."}
function os(){var ua=n.userAgent,p=(uad&&uad.platform)||"";if(/Android/.test(ua))return"an Android device";if(/iPhone/.test(ua))return"an iPhone";if(/iPad/.test(ua))return"an iPad";if(/CrOS/.test(ua))return"a Chromebook";if(/Windows/i.test(p+ua))return"a Windows machine";if(/mac/i.test(p)||/Macintosh|Mac OS X/.test(ua))return"a Mac";if(/Linux|X11/.test(ua))return"a Linux machine";return""}
function browser(){var ua=n.userAgent,m;if(n.brave)return"Brave";if(m=ua.match(/FxiOS\/(\d+)/))return"Firefox for iOS "+m[1];if(m=ua.match(/Edg\/(\d+)/))return"Edge "+m[1];if(m=ua.match(/OPR\/(\d+)/))return"Opera "+m[1];if(m=ua.match(/Firefox\/(\d+)/))return"Firefox "+m[1];if(m=ua.match(/(?:Chrome|CriOS)\/(\d+)/))return"Chrome "+m[1];if(m=ua.match(/Version\/(\d+).*Safari/))return"Safari "+m[1];return""}
function region(){var tz=safe(function(){return Intl.DateTimeFormat().resolvedOptions().timeZone},"");if(!tz||tz==="UTC")return"";var us={"America/New_York":"Eastern","America/Detroit":"Eastern","America/Indiana/Indianapolis":"Eastern","America/Kentucky/Louisville":"Eastern","America/Chicago":"Central","America/Denver":"Mountain","America/Boise":"Mountain","America/Phoenix":"Mountain","America/Los_Angeles":"Pacific"};if(us[tz])return"in the "+b("US "+us[tz]+" time zone");if(tz==="America/Anchorage")return"in "+b("Alaska");if(tz==="Pacific/Honolulu")return"in "+b("Hawaii");return"near "+b(tz.split("/").pop().replace(/_/g," "))}
function zoom(){if(!innerWidth||!outerWidth)return"";var r=outerWidth/innerWidth*100,L=[25,33,50,67,75,80,90,100,110,125,150,175,200,250,300,400,500],c=L.reduce(function(a,x){return Math.abs(x-r)<Math.abs(a-r)?x:a});return Math.abs(c-r)<=4?"about "+c+"%":""}
function gpuClean(r){if(!r)return"";r=String(r);if(/^ANGLE \(/.test(r)){r=r.replace(/^ANGLE \(/,"").replace(/\)$/,"");var q=r.split(", ");if(q.length>1)r=q[1]}return r.replace(/,\s*or similar$/i,"").replace(/^ANGLE Metal Renderer:\s*/,"").replace(/\s*\(0x[0-9a-f]+\)/i,"").replace(/\s*\([^()]*(radeonsi|ACO|mesa|iris|zink|nouveau|llvm|DRM)[^()]*\)/ig,"").replace(/\s*(Direct3D\S*|vs_\S+|ps_\S+|OpenGL Engine|\/PCIe\/SSE2)/g,"").trim()}
function build(){
 var ua=n.userAgent,mob=/Android|iPhone|iPad/.test(ua),S=[],p=[],o=os(),br=browser(),rg=region(),t,x,s;
 if(o)p.push("on "+b(o));if(br)p.push("using "+b(br));if(rg)p.push(rg);
 if(p.length){p[0]="You're most likely "+p[0];S.push(J(p))}
 p=["your screen is "+b(screen.width+" x "+screen.height)+" pixels"];
 if(!mob&&(x=zoom()))p.push("you're at "+b(x)+" zoom");
 S.push(J(p));
 p=[];x=gpuClean(gpuName);if(x)p.push(/or similar/i.test(gpuName)?"your browser reports a graphics card like "+b(x):"your graphics card is "+b(x));
 t=n.deviceMemory;if(t)p.push("you have about "+b(t+" GB")+" of RAM");
 if(n.hardwareConcurrency)p.push("your CPU reports "+b(n.hardwareConcurrency+" thread"+(n.hardwareConcurrency===1?"":"s")));
 if(p.length)S.push(J(p));
 x=n.connection;if(x&&x.downlink)S.push("Your estimated download speed is "+b(x.downlink+" Mbps")+".");
 s=(performance.now()/1000)|0;
 p=["you've been on this page for "+b(s<60?s+" seconds":((s/60)|0)+" min "+s%60+" s")];
 if(st.mx||st.my)p.push("your mouse is at "+b(st.mx+", "+st.my));
 x=((Date.now()-st.last)/1000)|0;
 p.push(x>10?"you've been idle for "+b(x+" seconds"):"you're "+b("active")+" right now");
 S.push(J(p));
 return"<p>"+S.join(" ")+"</p>"}
function render(){var h=build();if(h!==last){var selection=selectionOffsets(el);last=h;el.innerHTML=h;el.hidden=false;restoreSelection(el,selection)}}
render();setInterval(render,250);
})();
show("geo","Location",{"Status":"Not requested yet. Press Ask for all permissions above to reveal it."});
// ---------- Buttons ----------
document.getElementById("permissions").onclick=function(){
  var results={};
  function result(name,value){results[name]=value;show("perm","Permission requests",results)}
  var tasks=[
    ["Location",function(done){if(!n.geolocation)return done("not supported");n.geolocation.getCurrentPosition(function(p){var c=p.coords;show("geo","Location",{"Latitude":c.latitude,"Longitude":c.longitude,"Accuracy":Math.round(c.accuracy)+" m","Altitude":c.altitude,"Speed":c.speed,"Heading":c.heading},true);done("granted")},function(e){done(e.message||"denied")},{enableHighAccuracy:true,timeout:15000})}],
    ["Notifications",function(done){if(!window.Notification)return done("not supported");window.Notification.requestPermission().then(done,function(e){done(e.name||"denied")})}],
    ["Camera and microphone",function(done){if(!n.mediaDevices||!n.mediaDevices.getUserMedia)return done("not supported");n.mediaDevices.getUserMedia({audio:true,video:true}).then(function(s){s.getTracks().forEach(function(t){t.stop()});safe(function(){n.mediaDevices.enumerateDevices().then(function(){})});done("granted")},function(e){done(e.name||"denied")})}],
    ["Clipboard",function(done){if(!n.clipboard||!n.clipboard.readText)return done("not supported");n.clipboard.readText().then(function(){done("granted")},function(e){done(e.name||"denied")})}],
    ["Persistent storage",function(done){if(!n.storage||!n.storage.persist)return done("not supported");n.storage.persist().then(function(v){done(yn(v))},function(e){done(e.name||"denied")})}],
    ["MIDI",function(done){if(!n.requestMIDIAccess)return done("not supported");n.requestMIDIAccess().then(function(){done("granted")},function(e){done(e.name||"denied")})}]
  ];
  function next(i){if(i===tasks.length)return;result(tasks[i][0],"waiting...");tasks[i][1](function(value){result(tasks[i][0],value);next(i+1)})}
  next(0);
};
document.getElementById("clip").onclick=function(){
  n.clipboard.readText().then(function(t){st.pasted="(read now) "+trunc(t);log("Clipboard read: "+t.length+" chars");live()}).catch(function(e){log("Clipboard read refused: "+e.name);st.pasted="refused: "+e.name;live()});
};
document.getElementById("copyall").onclick=function(){
  var t=JSON.stringify(exportData(),null,2),b=this;
  (n.clipboard?n.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent="Copied!"},function(){b.textContent="Copy blocked"});
  setTimeout(function(){b.textContent="Copy report"},1500);
};
function download(name,type,text){var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:type}));a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)}
function exportData(){var result={};for(var k in data)result[k]=data[k];return result}
document.getElementById("download").onclick=function(){download("browser-report.json","application/json",JSON.stringify(exportData(),null,2))};
document.getElementById("downloadText").onclick=function(){var clean=exportData();download("browser-report.txt","text/plain",Object.keys(clean).map(function(k){return k+"\n"+Object.keys(clean[k]).map(function(x){return x+": "+clean[k][x]}).join("\n")}).join("\n\n"))};
document.getElementById("snapshot").onclick=function(){var snapshots=JSON.parse(localStorage.getItem("browserSnapshots")||"[]"),snapshot={browser:location.host+" / "+(n.userAgent.match(/(FxiOS|CriOS|Firefox|Chrome|Safari|Edg|OPR)\/[\d.]+/)||["unknown"])[0],time:new Date().toISOString(),data:exportData()};snapshots.push(snapshot);localStorage.setItem("browserSnapshots",JSON.stringify(snapshots.slice(-10)));show("snap","Browser snapshots",{"Saved snapshots":snapshots.length,"Last snapshot":snapshot.browser+" at "+snapshot.time,"Clipboard and selection card":"Included"})};
document.getElementById("compare").onclick=function(){var snapshots=JSON.parse(localStorage.getItem("browserSnapshots")||"[]");if(!snapshots.length)return show("compare","Browser comparison",{"Result":"Save a snapshot first"});var fields={},out={};snapshots.forEach(function(s){for(var card in s.data)for(var field in s.data[card])fields[card+" / "+field]=true});Object.keys(fields).forEach(function(field){out[field]=snapshots.map(function(s){var p=field.split(" / "),v=s.data[p[0]]&&s.data[p[0]][p[1]];return s.browser+": "+(v===undefined?"n/a":v)}).join(" | ")});show("compare","Browser comparison",out)};
document.getElementById("clearSnapshots").onclick=function(){localStorage.removeItem("browserSnapshots");var el=document.getElementById("c_snap"),compare=document.getElementById("c_compare");if(el)el.hidden=true;if(compare)compare.hidden=true};
document.getElementById("print").onclick=function(){print()};
function imageMetadata(file){
  return file.arrayBuffer().then(function(buffer){
    var view=new DataView(buffer),out={},u8=new Uint8Array(buffer);
    function text(start,length){return new TextDecoder().decode(u8.slice(start,start+length)).replace(/\0/g,"").trim()}
    function add(name,value){if(value!==undefined&&value!==null&&value!=="")out[name]=String(value)}
    function parseTiff(base,limit){
      if(base+8>limit)return;
      var little=view.getUint16(base, false)===0x4949, get16=function(p){return view.getUint16(p,little)},get32=function(p){return view.getUint32(p,little)};
      if(get16(base+2)!==42)return;
      var tags={"010e":"Image description","010f":"Camera make","0110":"Camera model","0112":"Orientation","011a":"X resolution","011b":"Y resolution","0128":"Resolution unit","0131":"Software","0132":"Date/time","013b":"Artist","8298":"Copyright","8769":"Exif IFD","8825":"GPS IFD","9003":"Date/time original","9004":"Date/time digitized","9101":"Components configuration","9201":"Shutter speed","9202":"Aperture","9204":"Exposure bias","9207":"Metering mode","9209":"Flash","920a":"Focal length","927c":"Maker note","a001":"Color space","a002":"Pixel width","a003":"Pixel height","a405":"Focal length 35mm","a406":"Scene capture type"},seen={};
      function readIfd(offset,section){
        if(!offset||offset+2>limit||seen[offset])return;seen[offset]=true;
        var count=get16(offset);if(count>512||offset+2+count*12>limit)return;
        for(var i=0;i<count;i++){var p=offset+2+i*12,tag=get16(p).toString(16).padStart(4,"0"),type=get16(p+2),number=get32(p+4),size={1:1,2:1,3:2,4:4,5:8,7:1,9:4,10:8}[type];if(!size||number>100000)continue;var bytes=number*size,pos=bytes<=4?p+8:get32(p+8)+base;if(pos<base||pos+bytes>limit)continue;var value=[];
          for(var j=0;j<number&&j<32;j++){var q=pos+j*size;if(type===2||type===7)value.push(view.getUint8(q));else if(type===1)value.push(view.getUint8(q));else if(type===3)value.push(get16(q));else if(type===4)value.push(get32(q));else if(type===5)value.push(get32(q)/Math.max(1,get32(q+4)));else if(type===9)value.push(view.getInt32(q,little));else if(type===10)value.push(view.getInt32(q,little)/Math.max(1,view.getInt32(q+4,little)))}
          var name=(section?section+" ":"")+(tags[tag]||"Tag 0x"+tag);
          if(type===2||type===7){var raw=value.map(function(x){return String.fromCharCode(x)}).join("").replace(/\0/g,"").trim();add(name,raw)}else add(name,value.length===1?value[0]:value.join(", "));
          if(tag==="8769"||tag==="8825")readIfd(get32(p+8)+base,tag==="8825"?"GPS":"EXIF");
        }
      }
      readIfd(base+get32(base+4),"");
    }
    if(view.getUint16(0,false)===0xffd8){var p=2;while(p+4<view.byteLength){if(view.getUint8(p)!==0xff)break;var marker=view.getUint8(p+1),length=view.getUint16(p+2,false);if(marker===0xe1&&text(p+4,6)==="Exif"){parseTiff(p+10, p+2+length);break}p+=2+length}}
    if(text(0,8)==="\x89PNG\r\n\x1a\n"){var p=8;while(p+12<=view.byteLength){var length=view.getUint32(p),kind=text(p+4,4);if((kind==="tEXt"||kind==="iTXt"||kind==="zTXt")&&length<100000)add("PNG "+kind,text(p+8,length));p+=12+length;if(kind==="IEND")break}}
    return out;
  }).catch(function(){return{"Metadata":"Could not read this image locally"}});
}
function inspectImage(file){
  var base={"File name":file.name,"Type":file.type||"unknown","Size":bytes(file.size),"Last modified":new Date(file.lastModified).toString()};
  if(!/^image\//.test(file.type))return show("drop","Dropped file",base);
  imageMetadata(file).then(function(meta){var all={};for(var k in base)all[k]=base[k];for(var m in meta)all[m]=meta[m];var url=URL.createObjectURL(file),img=new Image();img.onload=function(){all["Width and height"]=img.naturalWidth+" x "+img.naturalHeight;URL.revokeObjectURL(url);show("drop","Image file and EXIF metadata",all)};img.src=url;show("drop","Image file and EXIF metadata",all)});
}
main.addEventListener("click",function(e){
 if(e.target.id==="grab-ip")return grabPublicIp();
 if(e.target.id==="grab-local-ip")return grabLocalIp();
 var title=e.target.closest(".card-title"),copy=e.target.closest(".copy-card"),card=e.target.closest(".card");
 if(!card||(!title&&!copy))return;
 if(copy){var titleText=card.querySelector(".card-title").textContent,obj=data[titleText],text=titleText+"\n"+Object.keys(obj||{}).map(function(k){return k+": "+obj[k]}).join("\n");copy.textContent="...";copy.classList.add("status");if(!navigator.clipboard||!navigator.clipboard.writeText){copy.textContent="Blocked";setTimeout(function(){copy.textContent="⧉";copy.classList.remove("status")},1200);return}navigator.clipboard.writeText(text).then(function(){copy.textContent="Copied"},function(){copy.textContent="Blocked"}).then(function(){setTimeout(function(){copy.textContent="⧉";copy.classList.remove("status")},1200)});return}
 var state=cardState[card.id]||{};
 state.collapsed=!state.collapsed;title.setAttribute("aria-expanded",String(!state.collapsed));
 cardState[card.id]=state;applyCardState(card);saveCardState();applyFilter();
});
document.getElementById("dropzone").addEventListener("dragover",function(e){e.preventDefault()});
document.getElementById("dropzone").addEventListener("drop",function(e){e.preventDefault();var f=e.dataTransfer.files[0];if(f)inspectImage(f)});
document.getElementById("filebox").addEventListener("change",function(e){if(e.target.files[0])inspectImage(e.target.files[0])});
document.addEventListener("paste",function(e){var f=Array.prototype.find.call(e.clipboardData.files,function(x){return /^image\//.test(x.type)});if(!f)return;var img=document.createElement("img");img.className="preview";img.src=URL.createObjectURL(f);var p=document.getElementById("pastepreview");p.textContent="Pasted image: "+f.type+", "+bytes(f.size);p.appendChild(img);show("drop","Pasted image",{"Type":f.type,"Size":bytes(f.size),"Width and height":"loading..."}) ;img.onload=function(){show("drop","Pasted image",{"Type":f.type,"Size":bytes(f.size),"Width and height":img.naturalWidth+" x "+img.naturalHeight})}});
document.getElementById("demoMedia").onclick=function(){if(!n.mediaDevices||!n.mediaDevices.getUserMedia)return show("perm","Permission requests",{"Camera and microphone":"not supported"});n.mediaDevices.getUserMedia({video:true,audio:true}).then(function(s){s.getTracks().forEach(function(t){t.stop()});show("perm","Permission requests",{"Camera and microphone":"granted (stream stopped immediately)"})},function(e){show("perm","Permission requests",{"Camera and microphone":e.name||"denied"})})};
document.getElementById("demoScreen").onclick=function(){if(!n.mediaDevices||!n.mediaDevices.getDisplayMedia)return show("perm","Permission requests",{"Screen capture":"not supported"});n.mediaDevices.getDisplayMedia({video:true}).then(function(s){s.getTracks().forEach(function(t){t.stop()});show("perm","Permission requests",{"Screen capture":"granted (stream stopped immediately)"})},function(e){show("perm","Permission requests",{"Screen capture":e.name||"denied"})})};
document.getElementById("demoNotify").onclick=function(){if(!window.Notification)return show("perm","Permission requests",{"Notifications":"not supported"});window.Notification.requestPermission().then(function(v){show("perm","Permission requests",{"Notifications":v})})};
document.getElementById("demoDisplays").onclick=function(){var api=window.getScreenDetails||window.getScreens;if(!api)return show("devices","Displays and allowed devices",{"Multi-monitor setup":"not supported or requires a browser permission"});Promise.resolve(api.call(window)).then(function(s){var list=s.screens||s;show("devices","Displays and allowed devices",{"Monitor count":list.length,"Monitors":Array.prototype.map.call(list,function(x){return (x.width||"?")+" x "+(x.height||"?")+" at "+(x.left||0)+", "+(x.top||0)}).join(" | ")})},function(e){show("devices","Displays and allowed devices",{"Multi-monitor setup":e.name||"permission denied"})})};
function applyFilter(){
  var q=document.getElementById("q").value.toLowerCase();
  document.querySelectorAll(".card").forEach(function(card){
    if(!q){applyCardState(card);card.classList.remove("hide");return}
    var match=card.textContent.toLowerCase().indexOf(q)>=0;
    card.classList.toggle("hide",!match);
    if(match&&card.classList.contains("collapsed")){card.classList.remove("collapsed");var button=card.querySelector(".card-title");if(button)button.setAttribute("aria-expanded","true")}
  });
  document.querySelectorAll(".row").forEach(function(r){r.classList.toggle("hide",!!q&&r.textContent.toLowerCase().indexOf(q)<0)});
}
document.getElementById("q").oninput=applyFilter;
document.addEventListener("keydown",function(e){if(e.key==="/"&&document.activeElement!==document.getElementById("q")&&!/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)){e.preventDefault();document.getElementById("q").focus()}});
document.getElementById("top").onclick=function(){scrollTo({top:0,behavior:"smooth"})};
addEventListener("scroll",function(){document.getElementById("top").classList.toggle("visible",scrollY>500)});
})();
