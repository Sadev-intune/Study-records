// Data Ingestion & Spreadsheet Pipeline Middleware
const AppAPI = {
    registerUserToSheets(email, name, grade, callback) {
        const payload = { action: "registerUser", email: email, name: name, grade: grade };
        fetch(CONFIG.googleAppsScriptUrl, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).then(() => callback());
    },

    logStudySession(subject, date, duration, callback) {
        const user = AppAuth.currentUser;
        if (CONFIG.isDemoMode) {
            let logs = JSON.parse(localStorage.getItem('mock_db_logs') || '[]');
            logs.push({
                timestamp: new Date().toISOString(),
                email: user.email,
                name: user.name,
                grade: user.grade,
                subject: subject,
                date: date,
                duration: Number(duration)
            });
            localStorage.setItem('mock_db_logs', JSON.stringify(logs));
            setTimeout(() => callback(), 600000 / 1000); // 600ms network delay
        } else {
            const payload = {
                action: "logStudy",
                email: user.email,
                name: user.name,
                grade: user.grade,
                subject: subject,
                date: date,
                duration: duration
            };
            fetch(CONFIG.googleAppsScriptUrl, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }).then(() => callback());
        }
    },

    fetchLeaderboardStandings(filterMode, currentGrade, callback) {
        if (CONFIG.isDemoMode) {
            const logs = JSON.parse(localStorage.getItem('mock_db_logs') || '[]');
            const processed = this.mockProcessLeaderboard(logs);
            callback(processed);
        } else {
            fetch(`${CONFIG.googleAppsScriptUrl}?action=getLeaderboard`)
                .then(res => res.json())
                .then(data => callback(data));
        }
    },

    mockProcessLeaderboard(logs) {
        // Mock processing mapping systems matching Monday 00:00 ISO parameters
        const summary = {};
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
        startOfWeek.setHours(0,0,0,0);

        logs.forEach(log => {
            if (new Date(log.timestamp) >= startOfWeek) {
                const g = log.grade;
                const email = log.email;
                if (!summary[g]) summary[g] = {};
                if (!summary[g][email]) summary[g][email] = { name: log.name, totalDuration: 0 };
                summary[g][email].totalDuration += log.duration;
            }
        });

        const leaderboard = {};
        for (const g in summary) {
            const arr = Object.keys(summary[g]).map(e => ({
                email: e,
                name: summary[g][e].name,
                totalDuration: summary[g][e].totalDuration
            })).sort((a,b) => b.totalDuration - a.totalDuration);
            leaderboard[g] = arr.slice(0,3);
        }
        return leaderboard;
    }
};