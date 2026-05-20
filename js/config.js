// Runtime Global Configurations Wrapper for ICT WITH SARANGA
const CONFIG = {
    // Live Firebase Credentials injected successfully
    firebaseConfig: {
        apiKey: "AIzaSyBGVcTxJEAl97SEItMqT2AL_Cqlp-j_8L8",
        authDomain: "study-tracker-ictssr.firebaseapp.com",
        projectId: "study-tracker-ictssr",
        storageBucket: "study-tracker-ictssr.firebasestorage.app",
        messagingSenderId: "177642086441",
        appId: "1:177642086441:web:a9c13d91247b3ad8467c38",
        measurementId: "G-K2747TW9TT"
    },
    
    // TODO: Paste your Web App deployment URL from Google Apps Script below inside the quotes
    googleAppsScriptUrl: "https://script.google.com/macros/s/AKfycbx9jKs30JQ-6HVoTjkLciw1ozDpHqUrNH-8dSSdPqHjd61YbCeLBvsqxJ8HSRfCZM_U/exec",
    
    // Auto dynamic detection switch for live deployment
    get isDemoMode() {
        return this.googleAppsScriptUrl.includes("YOUR_GOOGLE_APPS_SCRIPT") || this.googleAppsScriptUrl === "";
    }
};