// ==========================================
// 🚀 SPA Core Orchestrator Module (AppRouter)
// ==========================================
const AppRouter = {
    views: ['auth-view', 'dashboard-view', 'logger-view'],

    init() {
        AppAuth.init();
        AppUI.initEffects();
        this.bindEvents();
    },

    switchView(targetId) {
        this.views.forEach(v => {
            const el = document.getElementById(v);
            if (el) el.style.display = (v === targetId) ? 'block' : 'none';
        });
    },

    loadDashboard(user) {
        this.switchView('dashboard-view');
        document.getElementById('nav-profile').style.display = 'flex';
        document.getElementById('user-display-name').innerText = user.name;
        document.getElementById('user-display-grade').innerText = `Grade ${user.grade}`;
        
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
            let pool = [];

            if (mode === 'my') {
                pool = standings[currentGrade] || [];
            } else {
                Object.keys(standings).forEach(g => {
                    pool = pool.concat(standings[g]);
                });
                pool.sort((a,b) => b.totalDuration - a.totalDuration);
            }

            for(let r=1; r<=3; r++) {
                const el = document.getElementById(`podium-rank-${r}`);
                if (el) {
                    const data = pool[r-1];
                    el.querySelector('.podium-student-name').innerText = data ? data.name : '--';
                    el.querySelector('.podium-student-time').innerText = data ? `${data.totalDuration}m` : '0m';
                }
            }
        });
    },

    bindEvents() {
        // Email/Password Access Form Submission
        document.getElementById('auth-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const pass = document.getElementById('auth-password').value;
            AppAuth.submitAuthForm(email, pass);
        });

        // 🌟 GOOGLE SIGN-IN BUTTON BINDING FIXED
        const googleBtn = document.getElementById('google-auth-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                AppAuth.handleGoogleLogin();
            });
        }

        // 🌟 GRADE MODAL SELECTION (With Custom Student Name Check)
        document.querySelectorAll('.grade-select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const studentName = document.getElementById('student-register-name').value.trim();
                if (!studentName) {
                    alert("කරුණාකර ඔබගේ නම ඇතුළත් කරන්න!");
                    return;
                }
                AppAuth.setGradeAndName(btn.getAttribute('data-grade'), studentName);
            });
        });

        // Toggle Settings Filtering Updates
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.refreshLeaderboard(btn.getAttribute('data-filter'), AppAuth.currentUser.grade);
            });
        });

        // Navigation Back Handlers
        document.getElementById('back-to-dash-btn').addEventListener('click', () => {
            this.loadDashboard(AppAuth.currentUser);
        });

        // Logger Form Actions Sequence
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


// ==========================================
// 🔐 Auth Module Orchestrator (AppAuth)
// ==========================================
const AppAuth = {
    currentUser: null,

    init() {
        // Firebase Auth State Listener - Persistent Session Handler
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.checkUserRegistration(user);
            } else {
                AppRouter.switchView('auth-view');
            }
        });
    },

    // Email & Password Handling Framework
    async submitAuthForm(email, password) {
        const rememberCheck = document.getElementById('remember-me');
        const rememberMe = rememberCheck ? rememberCheck.checked : false;
        const persistence = rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
        
        try {
            await firebase.auth().setPersistence(persistence);
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            this.checkUserRegistration(userCredential.user);
        } catch (error) {
            // Setup seamless registration fallback layer if credentials not matching
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                try {
                    const newUserCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                    this.showGradeModal(newUserCredential.user);
                } catch (signUpError) {
                    alert("Sign up configuration error: " + signUpError.message);
                }
            } else {
                alert("Login core exception sequence: " + error.message);
            }
        }
    },

    // Google Authentication Module 
    async handleGoogleLogin() {
        const rememberCheck = document.getElementById('remember-me');
        const rememberMe = rememberCheck ? rememberCheck.checked : false;
        const persistence = rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
        const provider = new firebase.auth.GoogleAuthProvider();
        
        try {
            await firebase.auth().setPersistence(persistence);
            const result = await firebase.auth().signInWithPopup(provider);
            this.checkUserRegistration(result.user);
        } catch (error) {
            alert("Google Sign-In dynamic block: " + error.message);
        }
    },

    // Verify User Records on Cloud Google Sheets Engine
    async checkUserRegistration(user) {
        try {
            const response = await fetch(`${CONFIG.googleAppsScriptUrl}?action=getUserGrade&email=${encodeURIComponent(user.email)}`);
            const result = await response.json();
            
            if (result.status === "found") {
                this.currentUser = { email: user.email, name: result.name, grade: result.grade };
                AppRouter.loadDashboard(this.currentUser);
            } else {
                this.showGradeModal(user);
            }
        } catch (e) {
            console.error("System sheet synchronization pipeline fault:", e);
            this.showGradeModal(user);
        }
    },

    showGradeModal(user) {
        this.currentUser = user; 
        document.getElementById('grade-modal').style.display = 'flex';
    },

    // Commit Custom Metadata to Remote Sheets App Pipeline
    async setGradeAndName(selectedGrade, studentName) {
        const payload = {
            action: "registerUser",
            email: this.currentUser.email,
            name: studentName, 
            grade: selectedGrade
        };

        try {
            const response = await fetch(CONFIG.googleAppsScriptUrl, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            if (result.status === "success") {
                document.getElementById('grade-modal').style.display = 'none';
                this.currentUser = { email: this.currentUser.email, name: studentName, grade: selectedGrade };
                AppRouter.loadDashboard(this.currentUser);
            }
        } catch (e) {
            alert("Sheet Registry Engine Pipeline Interrupted: " + e.message);
        }
    },

    async logout() {
        await firebase.auth().signOut();
        this.currentUser = null;
        document.getElementById('nav-profile').style.display = 'none';
        AppRouter.switchView('auth-view');
    }
};

// DOM Core Loader Execution
window.addEventListener('DOMContentLoaded', () => AppRouter.init());