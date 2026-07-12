class AmbientWaves extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<canvas aria-hidden="true"></canvas>';
    this.canvas = this.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: true, desynchronized: true });
    this.pointer = { x: .76, y: .42, tx: .76, ty: .42, active: 0, targetActive: 0 };
    this.scroll = { value: 0, target: 0 };
    this.visible = true;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.mobile = matchMedia('(max-width: 720px)').matches;
    this.onResize = () => this.resize();
    this.onPointer = (event) => {
      this.pointer.tx = event.clientX / Math.max(1, innerWidth);
      this.pointer.ty = event.clientY / Math.max(1, innerHeight);
      this.pointer.targetActive = this.mobile ? 0 : 1;
    };
    this.onPointerLeave = () => { this.pointer.targetActive = 0; };
    this.onScroll = () => {
      const range = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      this.scroll.target = scrollY / range;
    };
    addEventListener('resize', this.onResize, { passive: true });
    addEventListener('pointermove', this.onPointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', this.onPointerLeave, { passive: true });
    addEventListener('scroll', this.onScroll, { passive: true });
    document.addEventListener('visibilitychange', () => {
      this.visible = !document.hidden;
      if (this.visible && !this.frame) this.draw(performance.now());
    });
    document.addEventListener('themechange', () => { this.colors = this.readColors(); });
    this.resize();
    this.onScroll();
    this.colors = this.readColors();
    this.draw(0);
  }

  disconnectedCallback() {
    removeEventListener('resize', this.onResize);
    removeEventListener('pointermove', this.onPointer);
    document.documentElement.removeEventListener('pointerleave', this.onPointerLeave);
    removeEventListener('scroll', this.onScroll);
    cancelAnimationFrame(this.frame);
  }

  readColors() {
    const style = getComputedStyle(document.documentElement);
    return ['--wave-a', '--wave-b', '--wave-c'].map((name) => style.getPropertyValue(name).trim());
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, this.mobile ? 1 : 1.4);
    this.width = innerWidth;
    this.height = innerHeight;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  wavePoint(x, strand, ribbon, time) {
    const p = x / this.width;
    const home = document.body.dataset.page === 'home';
    const pageBase = home ? .69 : .55;
    const scrollShift = (this.scroll.value - .5) * this.height * .18;
    const ribbonOffset = (ribbon - 1) * this.height * .11;
    const strandOffset = (strand - .5) * (home ? 180 : 125);
    const broad = Math.sin(p * 4.3 + time * .72 + ribbon * 1.85) * (home ? 92 : 62) * (1 + this.scroll.value * .22);
    const fine = Math.sin(p * 10.8 - time * .42 + strand * 5.2) * (12 + ribbon * 3);
    const sweep = Math.pow(p - .54, 2) * this.height * (ribbon === 1 ? .62 : .28);
    const distance = Math.abs(p - this.pointer.x);
    const influence = Math.exp(-distance * distance * 18) * (this.pointer.y - .5) * 78 * this.pointer.active;
    return this.height * pageBase + ribbonOffset + strandOffset + broad + fine + sweep + influence - scrollShift;
  }

  drawPointerGlow(dark) {
    if (this.mobile || this.pointer.active < .01 || document.body.dataset.page !== 'home') return;
    const x = this.pointer.x * this.width;
    const y = this.pointer.y * this.height;
    const radius = Math.min(360, Math.max(220, this.width * .24));
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${this.colors[0]},${(dark ? .11 : .075) * this.pointer.active})`);
    gradient.addColorStop(.42, `rgba(${this.colors[1]},${(dark ? .055 : .035) * this.pointer.active})`);
    gradient.addColorStop(1, `rgba(${this.colors[2]},0)`);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  drawRibbon(time, ribbon, strands, intensity) {
    const ctx = this.ctx;
    for (let index = 0; index < strands; index += 1) {
      const strand = strands === 1 ? .5 : index / (strands - 1);
      ctx.beginPath();
      for (let x = -40; x <= this.width + 40; x += this.mobile ? 30 : 22) {
        const y = this.wavePoint(x, strand, ribbon, time);
        if (x === -40) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      const edge = Math.sin(strand * Math.PI);
      const alpha = (.014 + edge * .038) * intensity;
      ctx.strokeStyle = `rgba(${this.colors[(ribbon + index) % 3]},${alpha})`;
      ctx.lineWidth = .55 + edge * 1.05;
      ctx.stroke();
    }
  }

  drawParticles(time, count, intensity) {
    const ctx = this.ctx;
    for (let i = 0; i < count; i += 1) {
      const seed = (i * .61803398875) % 1;
      const p = (seed + time * (.018 + (i % 7) * .0018)) % 1;
      const ribbon = i % 3;
      const strand = ((i * 37) % 101) / 100;
      const x = p * (this.width + 100) - 50;
      const y = this.wavePoint(x, strand, ribbon, time) + Math.sin(i * 4.1) * 4;
      const pulse = .45 + .55 * Math.sin(time * 2 + i * 1.7);
      const radius = (i % 11 === 0 ? 1.8 : .75) * (this.mobile ? .75 : 1);
      ctx.fillStyle = `rgba(${this.colors[i % 3]},${(.10 + pulse * .32) * intensity})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  draw(ms) {
    if (!this.visible) { this.frame = null; return; }
    const home = document.body.dataset.page === 'home';
    const dark = document.documentElement.dataset.theme === 'dark';
    const intensity = (home ? 1 : .58) * (dark ? 1 : .62);
    const time = this.reduced ? 1.8 : ms * .00016;
    this.pointer.x += (this.pointer.tx - this.pointer.x) * .018;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * .018;
    this.pointer.active += (this.pointer.targetActive - this.pointer.active) * .045;
    this.scroll.value += (this.scroll.target - this.scroll.value) * .035;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.save();
    this.ctx.globalCompositeOperation = dark ? 'screen' : 'source-over';
    this.drawPointerGlow(dark);
    const strands = this.mobile ? 18 : (home ? 48 : 30);
    this.drawRibbon(time, 0, strands, intensity * .7);
    this.drawRibbon(time, 1, strands + 8, intensity);
    this.drawRibbon(time, 2, strands, intensity * .62);
    this.drawParticles(time, this.mobile ? 62 : (home ? 190 : 110), intensity);
    this.ctx.restore();
    if (!this.reduced) this.frame = requestAnimationFrame((next) => this.draw(next));
    else this.frame = null;
  }
}

customElements.define('ambient-waves', AmbientWaves);
