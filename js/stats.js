const extpay = ExtPay('focus-timer-ext');

async function checkStatus() {
    const user = await extpay.getUser();
    
    if (user.paid) {
        return 1;
    } else {
        return 0;
    }
}

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
        let roundedTime = time / 7;
        return Number(roundedTime.toFixed(2))
    } else {
        let time = await getTotalTime();
        let roundedTime = time / 30;
        return Number(roundedTime.toFixed(2))
    }
}

function fillMissingDays(grouped, days){
    for (let i = days - 1; i >= 0; i--) {
        let currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - i);
        let dateString = currentDate.toISOString().split('T')[0];
        if (!grouped[dateString]) {
            grouped[dateString] = 0;
        }    
    }
    return grouped;
}

async function groupSessions() {
    let sessions = await filterLast7Days();
    let grouped = {};

    for(let session of sessions){
        let fullDate = session.sessionDate.split('T')[0];

        if (grouped[fullDate]) {
            grouped[fullDate] += session.sessionMin;
        } else {
            grouped[fullDate] = session.sessionMin;
        }
    }
    grouped = fillMissingDays(grouped, 7);
    return grouped;
}

function getDayName(dateStr) {  
    let date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: 'short'});
}


async function createDiagram() {
    let chart = document.getElementById('week-chart')
    let groupedDays = await groupSessions();
    let allDates = Object.keys(groupedDays).sort(); 

    chart.innerHTML = '';


    for(let day of allDates){
        let minutes = groupedDays[day];

        let wrapper = document.createElement('div');
        wrapper.classList.add('chart-day');

        let bar = document.createElement('div');
        if (minutes == 0) {
            bar.classList.add('chart-bar0');  
        } else {
            bar.classList.add('chart-bar');  
        }
        bar.style.height = minutes * 10 + "px";
        bar.setAttribute('data-minutes', minutes);

        let label = document.createElement('span');
        label.classList.add('chart-label');
        label.textContent = getDayName(day);

        wrapper.appendChild(bar);
        wrapper.appendChild(label);
        chart.appendChild(wrapper);
    }
}

async function maxMinutes(){
    let groupedDays = await groupSessions();
    let nums = Object.values(groupedDays);

    return Math.max(...nums);   
}

document.addEventListener("DOMContentLoaded", async () => {
    // ==================== VIEW TOGGLE LOGIC ====================
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const weekView = document.querySelector('.week-view');
    const monthView = document.querySelector('.month-view');
    document.querySelector('.streak-card').style.display = 'none';
    document.querySelector('.month-view').style.display = 'none';
    document.querySelector('.best-day-card').style.display = 'none';
    let view = 'week';

    renderSite(1);

    toggleButtons.forEach(button => {
        button.addEventListener('click', async () => {
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            view = button.dataset.view;
            
            if (view == 'week') {
                // ==================== Weekly View ====================
                weekView.classList.add('active');
                monthView.classList.remove('active');
                await renderSite(1);
                
                
            } else {
                // ==================== Monthly View ====================
                if (checkStatus) {
                    weekView.classList.remove('active');
                    monthView.classList.add('active');
                    await renderSite();
                }else{
                    monthView.innerHTML = "You can only see it when on a paid plan.";
                }
            }
        });
    });
});


async function renderSite(days = null){

    let totalTime = await getTotalTime(days);
    let totalSessions = await getTotalSessions(days);
    let averageTime = await getAverageTime(days);
    await createDiagram();
    await maxMinutes();
    
    
    document.getElementById('total-time').innerHTML = totalTime;
    document.getElementById('total-sessions').innerHTML = totalSessions;
    document.getElementById('avg-per-day').innerHTML = averageTime + "m";
}