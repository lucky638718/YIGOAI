import * as THREE from 'three';

const vertexShader = `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime, uAttenuation, uLineThickness;
uniform float uBaseRadius, uRadiusStep, uScaleRate;
uniform float uOpacity, uNoiseAmount, uRotation, uRingGap;
uniform float uFadeIn, uFadeOut;
uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax, uBurst;
uniform vec2 uResolution, uMouse;
uniform vec3 uColor, uColorTwo;
uniform int uRingCount;

const float HP = 1.5707963;
const float CYCLE = 3.45;

float fade(float t) {
  return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);
}

float ring(vec2 p, float ri, float cut, float t0, float px) {
  float t = mod(uTime + t0, CYCLE);
  float r = ri + t / CYCLE * uScaleRate;
  float d = abs(length(p) - r);
  float a = atan(abs(p.y), abs(p.x)) / HP;
  float th = max(1.0 - a, 0.5) * px * uLineThickness;
  float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;
  d += pow(cut * a, 3.0) * r;
  return h * exp(-uAttenuation * d) * fade(t);
}

void main() {
  float px = 1.0 / min(uResolution.x, uResolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;
  float cr = cos(uRotation), sr = sin(uRotation);
  p = mat2(cr, -sr, sr, cr) * p;
  p -= uMouse * uMouseInfluence;
  float sc = mix(1.0, uHoverScale, uHoverAmount) + uBurst * 0.3;
  p /= sc;
  vec3 c = vec3(0.0);
  float rcf = max(float(uRingCount) - 1.0, 1.0);
  for (int i = 0; i < 10; i++) {
    if (i >= uRingCount) break;
    float fi = float(i);
    vec2 pr = p - fi * uParallax * uMouse;
    vec3 rc = mix(uColor, uColorTwo, fi / rcf);
    c = mix(c, rc, vec3(ring(pr, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px)));
  }
  c *= 1.0 + uBurst * 2.0;
  float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) * uNoiseAmount;
  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * uOpacity);
}
`;

export default class MagicRings {
  constructor(mountElement, options = {}) {
    this.mount = mountElement;
    this.props = {
      color: '#fc42ff',
      colorTwo: '#42fcff',
      speed: 1,
      ringCount: 6,
      attenuation: 10,
      lineThickness: 2,
      baseRadius: 0.35,
      radiusStep: 0.1,
      scaleRate: 0.1,
      opacity: 1,
      blur: 0,
      noiseAmount: 0.1,
      rotation: 0,
      ringGap: 1.5,
      fadeIn: 0.7,
      fadeOut: 0.5,
      followMouse: false,
      mouseInfluence: 0.2,
      hoverScale: 1.2,
      parallax: 0.05,
      clickBurst: false,
      ...options,
    };

    this.mouse = [0, 0];
    this.smoothMouse = [0, 0];
    this.hoverAmount = 0;
    this.isHovered = false;
    this.burst = 0;

    this.init();
  }

  init() {
    try {
      this.renderer = new THREE.WebGLRenderer({ alpha: true });
    } catch {
      return;
    }

    if (!this.renderer.capabilities.isWebGL2) {
      this.renderer.dispose();
      return;
    }

    this.renderer.setClearColor(0x000000, 0);
    this.mount.appendChild(this.renderer.domElement);
    
    // Apply blur if set
    if (this.props.blur > 0) {
      this.renderer.domElement.style.filter = `blur(${this.props.blur}px)`;
    }
    
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.zIndex = '-1';
    this.renderer.domElement.style.pointerEvents = 'none'; // Only capturing container events

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    this.camera.position.z = 1;

    this.uniforms = {
      uTime: { value: 0 },
      uAttenuation: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uColor: { value: new THREE.Color() },
      uColorTwo: { value: new THREE.Color() },
      uLineThickness: { value: 0 },
      uBaseRadius: { value: 0 },
      uRadiusStep: { value: 0 },
      uScaleRate: { value: 0 },
      uRingCount: { value: 0 },
      uOpacity: { value: 1 },
      uNoiseAmount: { value: 0 },
      uRotation: { value: 0 },
      uRingGap: { value: 1.6 },
      uFadeIn: { value: 0.5 },
      uFadeOut: { value: 0.75 },
      uMouse: { value: new THREE.Vector2() },
      uMouseInfluence: { value: 0 },
      uHoverAmount: { value: 0 },
      uHoverScale: { value: 1 },
      uParallax: { value: 0 },
      uBurst: { value: 0 },
    };

    this.material = new THREE.ShaderMaterial({ 
      vertexShader, 
      fragmentShader, 
      uniforms: this.uniforms, 
      transparent: true 
    });
    
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material);
    this.scene.add(this.quad);

    this.resize = this.resize.bind(this);
    this.resize();
    window.addEventListener('resize', this.resize);

    this.ro = new ResizeObserver(this.resize);
    this.ro.observe(this.mount);

    this.onMouseMove = (e) => {
      const rect = this.mount.getBoundingClientRect();
      this.mouse[0] = (e.clientX - rect.left) / rect.width - 0.5;
      this.mouse[1] = -((e.clientY - rect.top) / rect.height - 0.5);
    };
    this.onMouseEnter = () => { this.isHovered = true; };
    this.onMouseLeave = () => {
      this.isHovered = false;
      this.mouse[0] = 0;
      this.mouse[1] = 0;
    };
    this.onClick = () => { this.burst = 1; };

    this.mount.addEventListener('mousemove', this.onMouseMove);
    this.mount.addEventListener('mouseenter', this.onMouseEnter);
    this.mount.addEventListener('mouseleave', this.onMouseLeave);
    this.mount.addEventListener('click', this.onClick);

    this.animate = this.animate.bind(this);
    this.frameId = requestAnimationFrame(this.animate);
  }

  resize() {
    if (!this.renderer || !this.mount) return;
    const w = this.mount.clientWidth;
    const h = this.mount.clientHeight;
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(dpr);
    this.uniforms.uResolution.value.set(w * dpr, h * dpr);
  }

  animate(t) {
    this.frameId = requestAnimationFrame(this.animate);
    const p = this.props;

    this.smoothMouse[0] += (this.mouse[0] - this.smoothMouse[0]) * 0.08;
    this.smoothMouse[1] += (this.mouse[1] - this.smoothMouse[1]) * 0.08;
    this.hoverAmount += ((this.isHovered ? 1 : 0) - this.hoverAmount) * 0.08;
    this.burst *= 0.95;
    if (this.burst < 0.001) this.burst = 0;

    this.uniforms.uTime.value = t * 0.001 * p.speed;
    this.uniforms.uAttenuation.value = p.attenuation;
    this.uniforms.uColor.value.set(p.color);
    this.uniforms.uColorTwo.value.set(p.colorTwo);
    this.uniforms.uLineThickness.value = p.lineThickness;
    this.uniforms.uBaseRadius.value = p.baseRadius;
    this.uniforms.uRadiusStep.value = p.radiusStep;
    this.uniforms.uScaleRate.value = p.scaleRate;
    this.uniforms.uRingCount.value = p.ringCount;
    this.uniforms.uOpacity.value = p.opacity;
    this.uniforms.uNoiseAmount.value = p.noiseAmount;
    this.uniforms.uRotation.value = (p.rotation * Math.PI) / 180;
    this.uniforms.uRingGap.value = p.ringGap;
    this.uniforms.uFadeIn.value = p.fadeIn;
    this.uniforms.uFadeOut.value = p.fadeOut;
    this.uniforms.uMouse.value.set(this.smoothMouse[0], this.smoothMouse[1]);
    this.uniforms.uMouseInfluence.value = p.followMouse ? p.mouseInfluence : 0;
    this.uniforms.uHoverAmount.value = this.hoverAmount;
    this.uniforms.uHoverScale.value = p.hoverScale;
    this.uniforms.uParallax.value = p.parallax;
    this.uniforms.uBurst.value = p.clickBurst ? this.burst : 0;

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.resize);
    if (this.ro) this.ro.disconnect();
    
    if (this.mount) {
      this.mount.removeEventListener('mousemove', this.onMouseMove);
      this.mount.removeEventListener('mouseenter', this.onMouseEnter);
      this.mount.removeEventListener('mouseleave', this.onMouseLeave);
      this.mount.removeEventListener('click', this.onClick);
      
      if (this.renderer && this.renderer.domElement) {
        if (this.mount.contains(this.renderer.domElement)) {
          this.mount.removeChild(this.renderer.domElement);
        }
      }
    }
    
    if (this.renderer) this.renderer.dispose();
    if (this.material) this.material.dispose();
  }
}
