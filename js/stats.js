async function filterLast7Days() {
    let { session = [] } = await chrome.storage.local.get(["session"]);
    let lastDate = new Date();
    lastDate.setDate(lastDate.getDate() - 7);
    return session.filter(item => item.sessionDate >= lastDate.toISOString());
}

async function getTotalSessions(days = null) {
    let totalSessions = 0;
    if (days) {
        let last7Days = await filterLast7Days();
        totalSessions = last7Days.length;
    } else {
        let { session = [] } = await chrome.storage.local.get(["session"]);
        totalSessions = session.length;
    }
    return totalSessions;
}

async function getTotalTime(days = null) {
    let totalTime = 0;
    if (days) {
        let last7Days = await filterLast7Days();
        for(const s of last7Days) {
            totalTime += s.sessionMin;
        }
    } else {
        let { session = [] } = await chrome.storage.local.get(["session"]);
        for(const s of session) {
            totalTime += s.sessionMin;
        }
    }
    return totalTime;
}

async function getAverageTime(days) {
    if (days) {
        let time = await getTotalTime(1);
        return time / 7;
    } else {
        let time = await getTotalTime();
        return time / 30;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    // ==================== VIEW TOGGLE LOGIC ====================
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const weekView = document.querySelector('.week-view');
    const monthView = document.querySelector('.month-view');
    let view = 'week';

    toggleButtons.forEach(button => {
        button.addEventListener('click', async () => {
            // Entferne 'active' von allen Buttons
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            
            // Füge 'active' zum geklickten Button hinzu
            button.classList.add('active');
            
            // Zeige die richtige View
            view = button.dataset.view;
            
            if (view === 'week') {
                weekView.classList.add('active');
                monthView.classList.remove('active');
            } else if (view === 'month') {
                weekView.classList.remove('active');
                monthView.classList.add('active');
            }

            if (view == 'week') {
                // ==================== Weekly View ====================
                //Total Time
                let totalTime = await getTotalTime(1);
                document.getElementById('total-time').innerHTML = totalTime;

                //Total Sessions
                let totalSessions = await getTotalSessions(1);
                document.getElementById('total-sessions').innerHTML = totalSessions ;

                //Average min per day
                let averageTime = await getAverageTime(1);
                document.getElementById('avg-per-day').innerHTML = averageTime + "m";
                
            } else {
                // ==================== Monthly View ====================
                //Total Time
                let totalTime = await getTotalTime();
                document.getElementById('total-time').innerHTML = totalTime;

                //Total Sessions
                let totalSessions = await getTotalSessions();
                document.getElementById('total-sessions').innerHTML = totalSessions;

                //Average min per day
                let averageTime = await getAverageTime();
                document.getElementById('avg-per-day').innerHTML = averageTime + "m";
            }
        });
    });
});