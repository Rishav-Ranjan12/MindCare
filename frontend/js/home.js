/* Landing page: split-text hero, scroll nav, and a real-time 3D orb (three.js) */
(function () {
  'use strict';
  MC.ready(function () {
    const { $, $$ } = MC;
    $('#nav-logo').innerHTML = MC.logo; $('#foot-logo').innerHTML = MC.logo;
    $('#yr').textContent = new Date().getFullYear();
    MC.icons();

    // theme button
    const tb = $('#theme-btn');
    const syncIcon = () => { tb.innerHTML = MC.icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon'); MC.icons(tb); };
    tb.addEventListener('click', () => MC.setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
    document.addEventListener('mc:theme', syncIcon); syncIcon();

    // landing faces + mini face
    $('#landing-faces').innerHTML = [1, 2, 3, 4, 5].map((v, i) => `<div style="--n:${i}">${MC.face(v)}</div>`).join('');
    $('.mini-face').innerHTML = MC.face(4);

    // split headline into words
    const h = $('#hero-title');
    const frag = [];
    let i = 0;
    h.childNodes.forEach((n) => {
      const em = n.nodeType === 1 && n.tagName === 'EM';
      const words = (n.textContent || '').split(/(\s+)/);
      words.forEach((w) => {
        if (!w.trim()) { frag.push(w); return; }
        const inner = `<span style="--i:${i++}">${MC.esc(w)}</span>`;
        frag.push(`<span class="w">${em ? '<em>' + inner + '</em>' : inner}</span>`);
      });
    });
    h.innerHTML = frag.join('');

    // nav scroll state
    const nav = $('#nav');
    const onScroll = () => nav.classList.toggle('scrolled', scrollY > 30);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    // smooth anchors (core intercepts only non-hash links)
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const t = $(a.getAttribute('href')); if (!t) return;
      e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' });
    }));

    initOrb();
  });

  function initOrb() {
    const hero = MC.$('.hero'), canvas = MC.$('#orb');
    if (!window.THREE || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return; }
    hero.classList.add('webgl');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    /* --- the orb: noise-displaced sphere with a fresnel rim, "breathing" slowly --- */
    const uniforms = {
      uTime: { value: 0 }, uBreath: { value: 0 },
      uA: { value: new THREE.Color('#f2c27b') }, uB: { value: new THREE.Color('#cf6f45') }, uC: { value: new THREE.Color('#5a8f78') }
    };
    const vert = `
      uniform float uTime; uniform float uBreath;
      varying vec3 vN; varying vec3 vP; varying float vD;
      // simplex-ish noise
      vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;} vec4 m289(vec4 x){return x-floor(x*(1./289.))*289.;}
      vec4 perm(vec4 x){return m289(((x*34.)+1.)*x);} vec4 tis(vec4 r){return 1.79284291400159-0.85373472095314*r;}
      float snoise(vec3 v){
        const vec2 C=vec2(1./6.,1./3.); const vec4 D=vec4(0.,.5,1.,2.);
        vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
        vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
        vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
        i=mod(i,289.);
        vec4 p=perm(perm(perm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
        float n_=.142857142857; vec3 ns=n_*D.wyz-D.xzx;
        vec4 j=p-49.*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.*x_);
        vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.-abs(x)-abs(y);
        vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
        vec4 s0=floor(b0)*2.+1.; vec4 s1=floor(b1)*2.+1.; vec4 sh=-step(h,vec4(0.));
        vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
        vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
        vec4 nr=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0*=nr.x; p1*=nr.y; p2*=nr.z; p3*=nr.w;
        vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.); m=m*m;
        return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
      }
      void main(){
        float n = snoise(normal*1.25 + vec3(0., uTime*.22, uTime*.1));
        float n2 = snoise(normal*2.6 - vec3(uTime*.15));
        float d = n*.2 + n2*.05;
        vD = d;
        vec3 pos = position * (1. + uBreath*.07) + normal * d;
        vN = normalize(normalMatrix * normal); vP = (modelViewMatrix*vec4(pos,1.)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.);
      }`;
    const frag = `
      uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform float uTime;
      varying vec3 vN; varying vec3 vP; varying float vD;
      void main(){
        vec3 V = normalize(-vP); vec3 N = normalize(vN);
        float fres = pow(1. - max(dot(N,V),0.), 2.4);
        float lit = dot(N, normalize(vec3(-.5,.7,.6)))*.5+.5;
        vec3 col = mix(uB, uA, smoothstep(.2,1.,lit));
        col = mix(col, uC, smoothstep(.1,.5,-vD*2.2+.15) * .55);
        col += fres * vec3(1.,.82,.62) * .8;
        float spec = pow(max(dot(reflect(-normalize(vec3(-.5,.7,.6)),N),V),0.),38.);
        col += spec * .55;
        gl_FragColor = vec4(col, 1.);
      }`;
    const orbMat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag });
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 48), orbMat);
    const group = new THREE.Group(); group.add(orb); scene.add(group);

    /* orbiting rings + particles */
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x3d6252, transparent: true, opacity: 0.35 });
    const rings = [2.5, 3.1].map((r, i) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 8, 200), ringMat.clone());
      m.rotation.x = Math.PI / 2.4 + i * 0.5; m.rotation.y = i * 0.8; group.add(m); return m;
    });
    const N = 420, pos = new Float32Array(N * 3), seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const r = 2.7 + Math.random() * 2.6, t = Math.random() * 6.283, p = Math.acos(2 * Math.random() - 1);
      pos.set([r * Math.sin(p) * Math.cos(t), r * Math.sin(p) * Math.sin(t), r * Math.cos(p)], i * 3); seed[i] = Math.random();
    }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pm = new THREE.PointsMaterial({ size: 0.045, color: 0xcf6f45, transparent: true, opacity: 0.8, depthWrite: false });
    const pts = new THREE.Points(pg, pm); group.add(pts);

    function tintForTheme() {
      const dark = document.documentElement.dataset.theme === 'dark';
      rings.forEach((r) => r.material.color.set(dark ? 0xa9ccb0 : 0x3d6252));
      pm.color.set(dark ? 0xf2c27b : 0xcf6f45);
    }
    tintForTheme(); document.addEventListener('mc:theme', tintForTheme);

    /* sizing: orb sits to the right on wide screens, behind text on mobile */
    function resize() {
      const w = hero.clientWidth, h = hero.clientHeight;
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      const wide = w > 960;
      const halfW = 9 * Math.tan(19 * Math.PI / 180) * (w / h);
      group.position.set(wide ? halfW * 0.55 : 0, wide ? 0 : -3, 0);
      group.scale.setScalar(wide ? Math.min(0.95, w / 1700 + 0.2) : 0.7);
    }
    resize(); addEventListener('resize', resize);

    /* interaction: eased pointer parallax */
    const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    addEventListener('pointermove', (e) => { target.x = (e.clientX / innerWidth - 0.5) * 2; target.y = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });

    let visible = true;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero);

    const clock = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      if (!visible) return;
      const t = clock.getElapsedTime();
      uniforms.uTime.value = t;
      uniforms.uBreath.value = Math.sin(t * 0.78);           // ~8 s breathing cycle
      cur.x += (target.x - cur.x) * 0.045; cur.y += (target.y - cur.y) * 0.045;
      group.rotation.y = t * 0.12 + cur.x * 0.5;
      group.rotation.x = cur.y * 0.25;
      rings[0].rotation.z = t * 0.16; rings[1].rotation.z = -t * 0.1;
      pts.rotation.y = -t * 0.03; pts.rotation.x = t * 0.015;
      const scroll = Math.min(1, scrollY / innerHeight);
      canvas.style.opacity = String(1 - scroll * 0.9);
      renderer.render(scene, camera);
    })();
  }
})();
