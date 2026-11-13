(function(){
  var main=document.querySelector("main"),stage=document.getElementById("stage"),world=document.getElementById("world"),mask=document.getElementById("mask"),
  caps=[].slice.call(document.querySelectorAll(".cap")),dots=document.getElementById("dots"),
  names=["概览","参考图","提示词","生成","结果","下载"],ran=false,last=-1,raf=0;
  /* 镜头路点：坐标取自 canvas-overview.png (1920×953) 的真实区域 */
  var R=[{x:725,y:118,w:600,h:240},{x:680,y:615,w:500,h:580},{x:1084,y:464,w:300,h:290},{x:1513,y:482,w:580,h:290}];
  names.forEach(function(n,i){var b=document.createElement("button");b.type="button";b.textContent=n;
    b.onclick=function(){window.scrollTo({top:main.offsetTop+i*innerHeight})};dots.appendChild(b)});
  var db=[].slice.call(dots.children);
  function wps(){
    var vw=innerWidth,vh=innerHeight,m=vw<760,
    T=vh*.52,os=Math.min(vw*.86/1920,(vh-T-24)/953),ov={x:960,y:476,s:m?vw*1.5/1920:os,ax:.5,ay:m?.72:(T+476*os)/vh},list=[ov];
    if(m)ov.x=700;
    R.forEach(function(r){list.push(m?{x:r.x,y:r.y,s:Math.min(1.6,vw*.92/r.w,vh*.4/r.h),ax:.5,ay:.7}
      :{x:r.x,y:r.y,s:Math.min(1.6,vw*.56/r.w,vh*.78/r.h),ax:.65,ay:.52})});
    var e=Object.assign({},ov);list.push(e);return list;
  }
  var W=wps();
  function ease(t){return t*t*(3-2*t)}function lerp(a,b,t){return a+(b-a)*t}
  function run(){mask.classList.add("on");void mask.offsetWidth;requestAnimationFrame(function(){requestAnimationFrame(function(){mask.classList.remove("on")})})}
  document.getElementById("again").onclick=run;
  function frame(){
    raf=0;var vh=innerHeight,p=Math.max(0,Math.min(5,(scrollY-main.offsetTop)/vh)),i=Math.min(4,Math.floor(p)),f=p-i,
    t=ease(Math.max(0,Math.min(1,(f-.5)/.5))),a=W[i],b=W[i+1],
    s=Math.exp(lerp(Math.log(a.s),Math.log(b.s),t)),x=lerp(a.x,b.x,t),y=lerp(a.y,b.y,t),
    tx=lerp(a.ax,b.ax,t)*innerWidth-x*s,ty=lerp(a.ay,b.ay,t)*vh-y*s;
    world.style.transform="translate("+tx+"px,"+ty+"px) scale("+s+")";
    stage.style.backgroundPosition=tx+"px "+ty+"px";var g=40*s;while(g<30)g*=2;stage.style.backgroundSize=g+"px "+g+"px";
    var k=Math.round(p);
    if(k!==last){last=k;caps.forEach(function(c){c.classList.toggle("on",+c.dataset.i===k)});db.forEach(function(d,j){d.classList.toggle("on",j===k)});
      if(k===4&&!ran){ran=true;run()}}
  }
  function req(){if(!raf)raf=requestAnimationFrame(frame)}
  addEventListener("scroll",req,{passive:true});addEventListener("resize",function(){W=wps();req()});frame();
})();
