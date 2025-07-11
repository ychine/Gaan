function setCanvasSize(canvas) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  return dpr;
}
function drawGradient() {
  const bgCanvas = document.getElementById('bg-gradient');
  const dpr = setCanvasSize(bgCanvas);
  const bgCtx = bgCanvas.getContext('2d');
  bgCtx.setTransform(1, 0, 0, 1, 0, 0);
  bgCtx.scale(dpr, dpr);
  const logicalWidth = window.innerWidth;
  const logicalHeight = window.innerHeight;
  const cx = logicalWidth / 2;
  const cy = logicalHeight / 2;
  const radius = Math.max(cx, cy) * 1.1;
  const grad = bgCtx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
  grad.addColorStop(0, '#030617');
  grad.addColorStop(0.7, '#060b23');
  grad.addColorStop(1, '#000');
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
}
drawGradient();
const canvas = document.getElementById('star-canvas');
let ctx = canvas.getContext('2d');
let dpr = setCanvasSize(canvas);
let width = canvas.width / dpr;
let height = canvas.height / dpr;
ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.scale(dpr, dpr);
canvas.width = width * dpr;
canvas.height = height * dpr;


let fireworks = [];
let fireworksActive = false;
let lastFireworkTime = 0;
const fireworkInterval = 1700; 
let songStartTime = null;
let audioElement = null;


function getAudioElement() {
  if (!audioElement) {
    audioElement = document.getElementById('audioSource');
    if (!audioElement) {
   
      try {
        audioElement = window.parent.document.getElementById('audioSource');
      } catch (e) {
        console.log('Audio element not found');
      }
    }
  }
  return audioElement;
}

function resize() {
  dpr = setCanvasSize(canvas);
  width = canvas.width / dpr;
  height = canvas.height / dpr;
  ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  drawGradient();
  createStars(80);
}
window.addEventListener('resize', resize);
const globalStarDriftX = 0.12;
const globalStarDriftY = 0.04;

class Star {
  constructor(x, y, radius, speed, twinkleSpeed) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.baseRadius = radius;
    this.speed = speed;
    this.twinkleSpeed = twinkleSpeed;
    this.angle = Math.random() * Math.PI * 2;
    this.opacity = Math.random() * 0.25 + 0.25;
  }
  update() {
    this.angle += this.twinkleSpeed;
    this.radius = this.baseRadius + Math.sin(this.angle) * 0.5;
    this.opacity = 0.35 + Math.sin(this.angle) * 0.15;
    this.x += this.speed.x + globalStarDriftX;
    this.y += this.speed.y + globalStarDriftY;
    if (this.x < -this.radius) this.x = width + this.radius;
    if (this.x > width + this.radius) this.x = -this.radius;
    if (this.y < -this.radius) this.y = height + this.radius;
    if (this.y > height + this.radius) this.y = -this.radius;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.abs(this.radius), 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 3;
    ctx.fill();
    ctx.restore();
  }
}

class FireworkParticle {
  constructor(x, y, vx, vy, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = 0;
    this.maxLife = Math.random() * 25 + 50;
    this.gravity = 0.15;
    this.friction = 0.98;
    this.size = Math.random() * 1.5 + 0.8;
    this.brightness = 1;
    this.trail = [];
    this.maxTrailLength = 3; 
  }
  
  update() {

    this.trail.push({x: this.x, y: this.y, brightness: this.brightness});
    
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
    
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.life++;
    this.brightness = 1 - (this.life / this.maxLife);
  }
  
  draw(ctx) {
    if (this.brightness <= 0) return;
    
    for (let i = 0; i < this.trail.length; i++) {
      const trailPoint = this.trail[i];
      const trailAlpha = (i / this.trail.length) * this.brightness * 0.6;
      
      ctx.save();
      ctx.globalAlpha = trailAlpha;
      ctx.beginPath();
      ctx.arc(trailPoint.x, trailPoint.y, this.size * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.restore();
    }
    
    ctx.save();
    ctx.globalAlpha = this.brightness;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }
}

class FireworkBurst {
  constructor(x, y) {
    this.x = x;
    this.y = y;
        this.particles = [];
    this.life = 0;
    this.maxLife = 80;
    
    const particleCount = Math.floor(Math.random() * 20) + 30;
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = Math.random() * 3 + 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      this.particles.push(new FireworkParticle(x, y, vx, vy, color));
    }
  }
  
  update() {
    this.life++;
    for (let particle of this.particles) {
      particle.update();
    }
  }
  
  draw(ctx) {
    for (let particle of this.particles) {
      particle.draw(ctx);
    }
  }
  
  isDead() {
    return this.life >= this.maxLife;
  }
}

let stars = [];
function createStars(num) {
  stars = [];
  for (let i = 0; i < num; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 0.7 + 0.15;
    const speed = {
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.02
    };
    const twinkleSpeed = Math.random() * 0.03 + 0.01;
    stars.push(new Star(x, y, radius, speed, twinkleSpeed));
  }
}
createStars(80);

let meteors = [];
let nextMeteorTime = Date.now() + Math.random() * 5000 + 3000;

function spawnMeteor() {
  const fromTop = Math.random() > 0.5;
  let x, y, vx, vy;
  if (fromTop) {
    x = Math.random() * width * 0.7 + width * 0.15;
    y = -40;
    const angle = Math.random() * Math.PI / 6 + Math.PI / 4;
    const speed = Math.random() * 10 + 12;
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
  } else {
    x = -40;
    y = Math.random() * height * 0.5;
    const angle = Math.random() * Math.PI / 6 - Math.PI / 12;
    const speed = Math.random() * 10 + 12;
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
  }
  meteors.push({x, y, vx, vy, life: 0, maxLife: Math.random() * 20 + 40});
  nextMeteorTime = Date.now() + Math.random() * 5000 + 3000;
}

function drawMeteor(meteor) {
  const len = 80;
  const tail = 0.7;
  ctx.save();
  ctx.globalAlpha = 0.7 * (1 - meteor.life / meteor.maxLife);
  ctx.strokeStyle = '#fff';
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(meteor.x, meteor.y);
  ctx.lineTo(meteor.x - meteor.vx * tail, meteor.y - meteor.vy * tail);
  ctx.stroke();
  ctx.restore();
}

function checkFireworksTime() {
  const audio = getAudioElement();
  if (!audio || audio.paused) return false;
  
  const currentTime = audio.currentTime;
  const startTime = 77;
  const endTime = 106; 
  
  return currentTime >= startTime && currentTime <= endTime;
}

function spawnFirework() {
  const x = Math.random() * width * 0.8 + width * 0.1; 
  const y = Math.random() * height * 0.6 + height * 0.1; 
  fireworks.push(new FireworkBurst(x, y));
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  for (let star of stars) {
    star.update();
    star.draw(ctx);
  }
  
  if (Date.now() > nextMeteorTime) {
    spawnMeteor();
  }
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    drawMeteor(m);
    m.x += m.vx;
    m.y += m.vy;
    m.life++;
    if (m.life > m.maxLife || m.x > width + 100 || m.y > height + 100) {
      meteors.splice(i, 1);
    }
  }
  
  const shouldFireworksBeActive = checkFireworksTime();
  
  if (shouldFireworksBeActive && !fireworksActive) {
    fireworksActive = true;
    lastFireworkTime = Date.now();
  } else if (!shouldFireworksBeActive && fireworksActive) {
    fireworksActive = false;
    fireworks = []; 
  }
  
  if (fireworksActive && Date.now() - lastFireworkTime > fireworkInterval) {
    spawnFirework();
    lastFireworkTime = Date.now();
  }
  
  for (let i = fireworks.length - 1; i >= 0; i--) {
    const firework = fireworks[i];
    firework.update();
    firework.draw(ctx);
    
    if (firework.isDead()) {
      fireworks.splice(i, 1);
    }
  }
  
  requestAnimationFrame(animate);
}
animate();

canvas.addEventListener('click', function(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  burst(x, y);
}); 