// Authentication Handling Subsystem Layer
const AppAuth = {
    currentUser: null,

    init() {
        if (CONFIG.isDemoMode) {
            console.warn("[Auth API] Running configuration under localized mock engines.");
            this.checkMockSession();
        } else {
            firebase.initializeApp(CONFIG.firebaseConfig);
            firebase.auth().onAuthStateChanged(user => this.handleStateChange(user));
        }
        // App එක Initialize වෙන තැනට මේක දාන්න (e.g., inside constructor or init)
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // ළමයා දැනටමත් ලොග් වෙලා ඉන්නවා නම් කෙලින්ම Google Sheet එකෙන් Grade එක චෙක් කරනවා
                this.checkUserRegistration(user);
            } else {
                this.switchView('auth-view');
            }
        });
    },

    handleStateChange(user) {
        if (user) {
            this.currentUser = {
                email: user.email,
                name: user.displayName || user.email.split('@')[0]
            };
            this.fetchUserGradeLive(user.email);
        } else {
            this.currentUser = null;
            AppRouter.switchView('auth-view');
        }
    },

    submitAuthForm(email, password) {
        if (CONFIG.isDemoMode) {
            // Local fallback simulation entries
            this.currentUser = { email: email, name: email.split('@')[0] };
            localStorage.setItem('mock_user', JSON.stringify(this.currentUser));
            this.checkMockSession();
        } else {
            // Fire firebase engine references live
            firebase.auth().signInWithEmailAndPassword(email, password)
                .catch(() => {
                    return firebase.auth().createUserWithEmailAndPassword(email, password);
                });
        }
    },

    checkMockSession() {
        const stored = localStorage.getItem('mock_user');
        if (stored) {
            this.currentUser = JSON.parse(stored);
            const grade = localStorage.getItem(`mock_grade_${this.currentUser.email}`);
            if (grade) {
                this.currentUser.grade = grade;
                AppRouter.loadDashboard(this.currentUser);
            } else {
                document.getElementById('grade-modal').style.display = 'flex';
            }
        } else {
            AppRouter.switchView('auth-view');
        }
    },

    setGrade(grade) {
        this.currentUser.grade = grade;
        if (CONFIG.isDemoMode) {
            localStorage.setItem(`mock_grade_${this.currentUser.email}`, grade);
            // Append student metadata tracking schemas localized
            let users = JSON.parse(localStorage.getItem('mock_db_users') || '[]');
            users.push({ email: this.currentUser.email, name: this.currentUser.name, grade: grade });
            localStorage.setItem('mock_db_users', JSON.stringify(users));

            document.getElementById('grade-modal').style.display = 'none';
            AppRouter.loadDashboard(this.currentUser);
        } else {
            // Push registration schema to Sheet via api pipeline wrapper
            AppAPI.registerUserToSheets(this.currentUser.email, this.currentUser.name, grade, () => {
                document.getElementById('grade-modal').style.display = 'none';
                AppRouter.loadDashboard(this.currentUser);
            });
        }
    },

    fetchUserGradeLive(email) {
        fetch(`${CONFIG.googleAppsScriptUrl}?action=getUserGrade&email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(res => {
                if (res.status === "found") {
                    this.currentUser.grade = res.grade;
                    this.currentUser.name = res.name;
                    AppRouter.loadDashboard(this.currentUser);
                } else {
                    document.getElementById('grade-modal').style.display = 'flex';
                }
            });
    },

    logout() {
        if (CONFIG.isDemoMode) {
            localStorage.removeItem('mock_user');
            location.reload();
        } else {
            firebase.auth().signOut();
        }
    }
};