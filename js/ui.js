// Visual Graphics Engine Subsystem
const AppUI = {
    initEffects() {
        this.runCursorTracking();
        this.runParticleEngine();
    },

    runCursorTracking() {
        const cursor = document.getElementById('custom-cursor');
        window.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });

        document.querySelectorAll('button, input, select, .portal-card').forEach(item => {
            item.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
            item.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
        });
    },

    runParticleEngine() {
        const canvas = document.getElementById('particle-canvas');
        const ctx = canvas.getContext('2d');
        let particles = [];
        const glyphs = ['∑', '∫', 'π', 'x', 'Δ', '0', '1', '√', 'log'];

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        class MathParticle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height + canvas.height;
                this.speed = Math.random() * 1 + 0.5;
                this.text = glyphs[Math.floor(Math.random() * glyphs.length)];
                this.size = Math.random() * 14 + 10;
                this.opacity = Math.random() * 0.5 + 0.2;
            }
            draw() {
                ctx.fillStyle = `rgba(6, 182, 212, ${this.opacity})`;
                ctx.font = `${this.size}px Orbitron`;
                ctx.fillText(this.text, this.x, this.y);
            }
            update() {
                this.y -= this.speed;
                if (this.y < -20) {
                    this.y = canvas.height + 20;
                    this.x = Math.random() * canvas.width;
                }
            }
        }

        for (let i = 0; i < 40; i++) particles.push(new MathParticle());

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animate);
        }
        animate();
    },

    apply3DTilt(element) {
        element.addEventListener('mousemove', (e) => {
            const box = element.getBoundingClientRect();
            const x = e.clientX - box.left - (box.width / 2);
            const y = e.clientY - box.top - (box.height / 2);
            element.style.transform = `rotateX(${-y / 10}deg) rotateY(${x / 10}deg) translateY(-5px)`;
        });
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    },

    triggerConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        let bits = [];

        for(let i=0; i<100; i++) {
            bits.push({
                x: canvas.width/2,
                y: canvas.height/2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                color: Math.random() > 0.5 ? '#06b6d4' : '#6d28d9',
                size: Math.random() * 6 + 4,
                alpha: 1
            });
        }

        function render() {
            ctx.clearRect(0,0, canvas.width, canvas.height);
            bits.forEach((b, idx) => {
                b.x += b.vx; b.y += b.vy; b.vy += 0.1; b.alpha -= 0.01;
                ctx.fillStyle = b.color;
                ctx.globalAlpha = b.alpha;
                ctx.fillRect(b.x, b.y, b.size, b.size);
                if(b.alpha <= 0) bits.splice(idx, 1);
            });
            if(bits.length > 0) requestAnimationFrame(render);
            else ctx.clearRect(0,0, canvas.width, canvas.height);
        }
        render();
    }
};