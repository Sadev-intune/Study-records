// SPA Core Orchestrator Module
const AppRouter = {
    views: ['auth-view', 'dashboard-view', 'logger-view'],

    init() {
        AppAuth.init();
        AppUI.initEffects();
        this.bindEvents();
    },

    switchView(targetId) {
        this.views.forEach(v => {
            document.getElementById(v).style.display = (v === targetId) ? 'block' : 'none';
        });
    },

    loadDashboard(user) {
        this.switchView('dashboard-view');
        document.getElementById('nav-profile').style.display = 'flex';
        document.getElementById('user-display-name').innerText = user.name;
        document.getElementById('user-display-grade').innerText = `Grade ${user.grade}`;

        // Demo reference removed - sets live active tag
        document.getElementById('status-text').innerText = CONFIG.isDemoMode ? "Database Localized" : "Cloud Sheets Live";

        this.renderGradePortals(user.grade);
        this.refreshLeaderboard('all', user.grade);
    },

    renderGradePortals(studentGrade) {
        const grid = document.getElementById('portals-grid');
        grid.innerHTML = '';

        for (let g = 6; g <= 11; g++) {
            const card = document.createElement('div');
            const isLocked = (g !== Number(studentGrade));
            card.className = `portal-card glass-card ${isLocked ? 'portal-locked' : 'portal-unlocked'}`;

            if (isLocked) {
                card.innerHTML = `
                    <div class="lock-overlay">
                        <i class="fa-solid fa-user-lock"></i>
                        <span>PORTAL BLOCKED</span>
                    </div>
                    <h3>Grade ${g}</h3>
                    <div class="portal-card-footer"><span>Classification Restrict</span></div>
                `;
            } else {
                card.innerHTML = `
                    <h3>Grade ${g}</h3>
                    <p class="text-glow-cyan"><i class="fa-solid fa-door-open"></i> Portal Active</p>
                    <div class="portal-card-footer">
                        <span>Click to log hours</span>
                        <i class="fa-solid fa-chevron-right"></i>
                    </div>
                `;
                card.addEventListener('click', () => this.zoomIntoLogger(g));
                AppUI.apply3DTilt(card);
            }
            grid.appendChild(card);
        }
    },

    zoomIntoLogger(grade) {
        const dashboard = document.getElementById('dashboard-view');
        dashboard.classList.add('scale-exit');

        setTimeout(() => {
            dashboard.classList.remove('scale-exit');
            this.switchView('logger-view');
            document.getElementById('logger-grade-title').innerText = `GRADE ${grade} PORTAL CAPTURE`;
            document.getElementById('log-date').valueAsDate = new Date();
        }, 350);
    },

    refreshLeaderboard(mode, currentGrade) {
        AppAPI.fetchLeaderboardStandings(mode, currentGrade, (standings) => {
            const targets = [currentGrade, '6', '7', '8', '9', '10', '11'];
            let pool = [];

            if (mode === 'my') {
                pool = standings[currentGrade] || [];
            } else {
                // Aggregate rankings for global overview pipelines
                Object.keys(standings).forEach(g => {
                    pool = pool.concat(standings[g]);
                });
                pool.sort((a, b) => b.totalDuration - a.totalDuration);
            }

            for (let r = 1; r <= 3; r++) {
                const el = document.getElementById(`podium-rank-${r}`);
                const data = pool[r - 1];
                el.querySelector('.podium-student-name').innerText = data ? data.name : '--';
                el.querySelector('.podium-student-time').innerText = data ? `${data.totalDuration}m` : '0m';
            }
        });
    },

    bindEvents() {
        // Authentications forms bindings
        document.getElementById('auth-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const pass = document.getElementById('auth-password').value;
            AppAuth.submitAuthForm(email, pass);
        });

        // Grade modal option configurations
        document.querySelectorAll('.grade-select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                AppAuth.setGrade(btn.getAttribute('data-grade'));
            });
        });

        // Toggle settings updates
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.refreshLeaderboard(btn.getAttribute('data-filter'), AppAuth.currentUser.grade);
            });
        });

        // Back navigations handlers
        document.getElementById('back-to-dash-btn').addEventListener('click', () => {
            this.loadDashboard(AppAuth.currentUser);
        });

        // Logger form data submission sequences
        document.getElementById('study-logger-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const subject = document.getElementById('log-subject').value;
            const date = document.getElementById('log-date').value;
            const duration = document.getElementById('log-duration').value;

            AppAPI.logStudySession(subject, date, duration, () => {
                AppUI.triggerConfetti();
                document.getElementById('log-duration').value = '';
                this.loadDashboard(AppAuth.currentUser);
            });
        });

        document.getElementById('logout-btn').addEventListener('click', () => AppAuth.logout());
    }
};

window.addEventListener('DOMContentLoaded', () => AppRouter.init());