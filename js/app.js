// Auth Module Orchestrator for ICT WITH SARANGA
const AppAuth = {
    currentUser: null,

    init() {
        // Firebase Auth Listener - Handles "Remember Me" sessions automatically
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.checkUserRegistration(user);
            } else {
                AppRouter.switchView('auth-view');
            }
        });
        
        // Setup Google Login Button Event directly
        const googleBtn = document.getElementById('google-auth-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleGoogleLogin());
        }
    },

    // Email & Password Authentication (Handles Sign-in / Sign-up fallbacks)
    async submitAuthForm(email, password) {
        const rememberMe = document.getElementById('remember-me').checked;
        const persistence = rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
        
        try {
            await firebase.auth().setPersistence(persistence);
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            this.checkUserRegistration(userCredential.user);
        } catch (error) {
            // Account එකක් නැත්නම් auto-create කරයි
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                try {
                    const newUserCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                    this.showGradeModal(newUserCredential.user);
                } catch (signUpError) {
                    alert("Sign up error: " + signUpError.message);
                }
            } else {
                alert("Login dynamic fail: " + error.message);
            }
        }
    },

    // Google Sign-In with fixed dynamic persistence wrapper
    async handleGoogleLogin() {
        const rememberMe = document.getElementById('remember-me').checked;
        const persistence = rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
        const provider = new firebase.auth.GoogleAuthProvider();
        
        try {
            await firebase.auth().setPersistence(persistence);
            const result = await firebase.auth().signInWithPopup(provider);
            this.checkUserRegistration(result.user);
        } catch (error) {
            alert("Google Sign-In failed: " + error.message);
        }
    },

    // Google Sheet එකෙන් ළමයාගේ විස්තර පරීක්ෂා කිරීම
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
            console.error("System sync registry hold:", e);
            // Fallback for safety
            this.showGradeModal(user);
        }
    },

    showGradeModal(user) {
        this.currentUser = user; // Backup reference
        document.getElementById('grade-modal').style.display = 'flex';
    },

    // ළමයා කැමති නම සහ පන්තිය තෝරා Sheet එකට සේව් කරන කොටස
    async setGradeAndName(selectedGrade, studentName) {
        const payload = {
            action: "registerUser",
            email: this.currentUser.email,
            name: studentName, // Gmail එකේ නම වෙනුවට ළමයා Type කරපු නම ගනී
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
            alert("Sheet Registry Pipeline Error: " + e.message);
        }
    },

    async logout() {
        await firebase.auth().signOut();
        this.currentUser = null;
        document.getElementById('nav-profile').style.display = 'none';
        AppRouter.switchView('auth-view');
    }
};