// ================= STORAGE =================
const SUBJECTS_KEY = "studenthub_subjects";
const ASSIGNMENTS_KEY = "studenthub_assignments";
const USER_KEY = "studenthub_user";
const THEME_KEY = "studenthub_theme";

let subjects = JSON.parse(localStorage.getItem(SUBJECTS_KEY)) || [];
let assignments = JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY)) || [];
let currentUser = JSON.parse(localStorage.getItem(USER_KEY)) || null;
let currentFilter = "all";
let calendarDate = new Date();

// ================= ELEMENTS =================
const authScreen = document.getElementById("authScreen");
const mainApp = document.getElementById("mainApp");
const loginBox = document.getElementById("loginBox");
const signupBox = document.getElementById("signupBox");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");
const logoutBtn = document.getElementById("logoutBtn");
const themeToggle = document.getElementById("themeToggle");

const subjectInput = document.getElementById("subjectInput");
const addSubjectBtn = document.getElementById("addSubjectBtn");
const subjectList = document.getElementById("subjectList");

const assignmentSubjectSelect = document.getElementById("assignmentSubjectSelect");
const assignmentInput = document.getElementById("assignmentInput");
const assignmentDate = document.getElementById("assignmentDate");
const assignmentPriority = document.getElementById("assignmentPriority");
const addAssignmentBtn = document.getElementById("addAssignmentBtn");
const assignmentList = document.getElementById("assignmentList");

const deadlineList = document.getElementById("deadlineList");
const globalSearch = document.getElementById("globalSearch");
const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.getElementById("sidebar");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

const saveProfileBtn = document.getElementById("saveProfileBtn");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

// ================= AUTH SWITCH =================
showSignup.addEventListener("click", () => {
    loginBox.classList.add("hidden");
    signupBox.classList.remove("hidden");
});

showLogin.addEventListener("click", () => {
    signupBox.classList.add("hidden");
    loginBox.classList.remove("hidden");
});

// ================= SIGNUP =================
signupForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    if (!name || !email || !password) {
        showToast("Please fill all fields");
        return;
    }

    currentUser = { name: name, email: email };
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));

    signupForm.reset();
    showApp();
    showToast("Account created successfully!");
});

// ================= LOGIN =================
loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();

    if (!email) {
        showToast("Enter your email");
        return;
    }

    const savedUser = JSON.parse(localStorage.getItem(USER_KEY));

    if (savedUser && savedUser.email === email) {
        currentUser = savedUser;
    } else {
        const name = email.split("@")[0].replace(/[._-]/g, " ");
        currentUser = { name: capitalizeWords(name), email: email };
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    }

    loginForm.reset();
    showApp();
    showToast("Welcome back!");
});

// ================= LOGOUT =================
logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(USER_KEY);
    currentUser = null;

    mainApp.classList.add("hidden");
    authScreen.classList.remove("hidden");
    loginBox.classList.remove("hidden");
    signupBox.classList.add("hidden");

    showToast("Logged out successfully");
});

// ================= SHOW APP =================
function showApp() {
    if (!currentUser) return;

    authScreen.classList.add("hidden");
    mainApp.classList.remove("hidden");

    updateUserUI();
    renderAll();
    applySavedTheme();
    showSection("dashboard");
}

function updateUserUI() {
    const name = currentUser.name || "Student";
    const email = currentUser.email || "student@example.com";
    const firstLetter = name.charAt(0).toUpperCase();

    document.getElementById("welcomeName").textContent = name;
    document.getElementById("sidebarUserName").textContent = name;
    document.getElementById("sidebarAvatar").textContent = firstLetter;
    document.getElementById("topAvatar").textContent = firstLetter;
    document.getElementById("profileAvatar").textContent = firstLetter;
    document.getElementById("profileName").value = name;
    document.getElementById("profileEmail").value = email;
}

// ================= SUBJECTS =================
addSubjectBtn.addEventListener("click", addSubject);
subjectInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") addSubject();
});

function addSubject() {
    const name = subjectInput.value.trim();

    if (!name) {
        showToast("Enter a subject name");
        return;
    }

    const exists = subjects.some(s => s.toLowerCase() === name.toLowerCase());
    if (exists) {
        showToast("Subject already exists");
        return;
    }

    subjects.push(name);
    saveSubjects();
    subjectInput.value = "";

    renderSubjects();
    updateAssignmentSubjects();
    updateStats();

    showToast("Subject added");
}

function deleteSubject(index) {
    const subject = subjects[index];
    const related = assignments.filter(a => a.subject === subject);

    let message = `Delete "${subject}"?`;
    if (related.length > 0) {
        message += `\n\nIt has ${related.length} related assignment(s).`;
    }

    if (!confirm(message)) return;

    subjects.splice(index, 1);
    saveSubjects();

    renderSubjects();
    updateAssignmentSubjects();
    updateStats();

    showToast("Subject deleted");
}

function renderSubjects() {
    if (subjects.length === 0) {
        subjectList.innerHTML = `
            <div class="empty-state">
                <strong>No subjects yet</strong>
                Add your first subject above.
            </div>`;
        return;
    }

    subjectList.innerHTML = subjects.map((subject, index) => {
        const count = assignments.filter(a => a.subject === subject).length;
        return `
            <div class="subject-card">
                <div class="subject-info">
                    <div class="subject-icon">📚</div>
                    <div>
                        <h3>${escapeHTML(subject)}</h3>
                        <p>${count} assignment${count === 1 ? "" : "s"}</p>
                    </div>
                </div>
                <button class="delete-btn" onclick="deleteSubject(${index})" title="Delete subject">×</button>
            </div>`;
    }).join("");
}

function saveSubjects() {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
}

// ================= ASSIGNMENTS =================
addAssignmentBtn.addEventListener("click", addAssignment);

function addAssignment() {
    const subject = assignmentSubjectSelect.value;
    const name = assignmentInput.value.trim();
    const date = assignmentDate.value;
    const priority = assignmentPriority.value;

    if (!subject) { showToast("Select a subject"); return; }
    if (!name) { showToast("Enter assignment name"); return; }
    if (!date) { showToast("Select a deadline"); return; }

    assignments.push({
        id: Date.now(),
        name: name,
        subject: subject,
        date: date,
        priority: priority,
        completed: false
    });

    saveAssignments();

    assignmentInput.value = "";
    assignmentDate.value = "";
    assignmentPriority.value = "Medium";

    renderAssignments();
    renderDeadlines();
    updateStats();
    renderCalendar();

    showToast("Assignment added");
}

function toggleAssignment(id) {
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return;

    assignment.completed = !assignment.completed;
    saveAssignments();

    renderAssignments();
    renderDeadlines();
    updateStats();

    showToast(assignment.completed ? "Assignment completed ✓" : "Assignment marked pending");
}

function deleteAssignment(id) {
    if (!confirm("Delete this assignment?")) return;

    assignments = assignments.filter(a => a.id !== id);
    saveAssignments();

    renderAssignments();
    renderDeadlines();
    updateStats();
    renderCalendar();

    showToast("Assignment deleted");
}

function getFilteredAssignments() {
    let list = [...assignments];

    if (currentFilter === "pending") list = list.filter(a => !a.completed);
    else if (currentFilter === "completed") list = list.filter(a => a.completed);
    else if (currentFilter === "high") list = list.filter(a => a.priority === "High");

    return list.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function renderAssignments() {
    const list = getFilteredAssignments();

    if (list.length === 0) {
        assignmentList.innerHTML = `
            <div class="empty-state">
                <strong>No assignments here</strong>
                Add an assignment above to start tracking your work.
            </div>`;
        return;
    }

    assignmentList.innerHTML = list.map(assignment => {
        const priorityClass = assignment.priority.toLowerCase();
        return `
            <div class="assignment-card">
                <div class="assignment-check ${assignment.completed ? "completed" : ""}" onclick="toggleAssignment(${assignment.id})">
                    ${assignment.completed ? "✓" : ""}
                </div>
                <div class="assignment-main">
                    <h3 style="${assignment.completed ? "text-decoration:line-through;opacity:.55;" : ""}">
                        ${escapeHTML(assignment.name)}
                    </h3>
                    <p>${escapeHTML(assignment.subject)}</p>
                </div>
                <span class="priority priority-${priorityClass}">${escapeHTML(assignment.priority)}</span>
                <span class="assignment-date">${formatDate(assignment.date)}</span>
                <button class="delete-btn" onclick="deleteAssignment(${assignment.id})">×</button>
            </div>`;
    }).join("");
}

function saveAssignments() {
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
}

// FILTER BUTTONS
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", function () {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        currentFilter = this.dataset.filter;
        renderAssignments();
    });
});

// ================= DEADLINES =================
function renderDeadlines() {
    const pending = assignments
        .filter(a => !a.completed)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (pending.length === 0) {
        deadlineList.innerHTML = `
            <div class="empty-state">
                <strong>You're all caught up 🎉</strong>
                No pending deadlines right now.
            </div>`;
    } else {
        deadlineList.innerHTML = pending.map(assignment => {
            const date = new Date(assignment.date);
            const day = String(date.getDate()).padStart(2, "0");
            const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();

            return `
                <div class="deadline-card">
                    <div class="deadline-date">
                        <strong>${day}</strong>
                        <span>${month}</span>
                    </div>
                    <div class="deadline-main">
                        <h3>${escapeHTML(assignment.name)}</h3>
                        <p>${escapeHTML(assignment.subject)} • ${escapeHTML(assignment.priority)} priority</p>
                    </div>
                    <button class="primary-btn" onclick="toggleAssignment(${assignment.id})">Complete</button>
                </div>`;
        }).join("");
    }

    // Dashboard mini deadlines (top 3)
    const dashboardEl = document.getElementById("dashboardDeadlines");
    if (pending.length === 0) {
        dashboardEl.innerHTML = `<p style="color:var(--muted);font-size:13px;">No pending deadlines 🎉</p>`;
    } else {
        dashboardEl.innerHTML = pending.slice(0, 3).map(a => `
            <div class="mini-deadline">
                <div>
                    <h4>${escapeHTML(a.name)}</h4>
                    <p>${escapeHTML(a.subject)}</p>
                </div>
                <span class="assignment-date">${formatDate(a.date)}</span>
            </div>
        `).join("");
    }
}

// ================= STATS =================
function updateStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completed = assignments.filter(a => a.completed).length;

    const upcoming = assignments.filter(a => {
        if (a.completed) return false;
        const date = new Date(a.date);
        date.setHours(0, 0, 0, 0);
        return date >= today;
    }).length;

    document.getElementById("subjectCount").textContent = subjects.length;
    document.getElementById("assignmentCount").textContent = assignments.length;
    document.getElementById("completedCount").textContent = completed;
    document.getElementById("upcomingCount").textContent = upcoming;

    const total = assignments.length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    document.getElementById("progressPercent").textContent = `${percent}%`;
    document.getElementById("circlePercent").textContent = `${percent}%`;
    document.getElementById("progressCircle").style.setProperty("--p", percent);
    document.getElementById("progressText").textContent = `${completed} of ${total} assignments completed`;
}

// ================= SUBJECT DROPDOWN =================
function updateAssignmentSubjects() {
    const currentValue = assignmentSubjectSelect.value;

    assignmentSubjectSelect.innerHTML = `<option value="">Select Subject</option>`;

    subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        assignmentSubjectSelect.appendChild(option);
    });

    if (subjects.includes(currentValue)) {
        assignmentSubjectSelect.value = currentValue;
    }
}

// ================= SEARCH =================
globalSearch.addEventListener("input", function () {
    const query = this.value.toLowerCase().trim();

    if (query) {
        showSection("subjects");
    }

    document.querySelectorAll(".subject-card").forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(query) ? "" : "none";
    });
});

// ================= NAVIGATION =================
document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", function (e) {
        e.preventDefault();
        showSection(this.dataset.section);
        sidebar.classList.remove("open");
    });
});

document.querySelectorAll(".quick-card, .white-btn").forEach(link => {
    link.addEventListener("click", function (e) {
        e.preventDefault();
        const href = this.getAttribute("href");
        if (!href) return;
        showSection(href.replace("#", ""));
    });
});

document.querySelectorAll('a[href="#deadlines"]').forEach(link => {
    link.addEventListener("click", function (e) {
        e.preventDefault();
        showSection("deadlines");
    });
});

function showSection(sectionId) {
    document.querySelectorAll(".app-section").forEach(section => {
        section.classList.remove("active-section");
    });

    const section = document.getElementById(sectionId);
    if (section) section.classList.add("active-section");

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle("active", link.dataset.section === sectionId);
    });

    const titles = {
        dashboard: "Dashboard",
        subjects: "Subjects",
        assignments: "Assignments",
        deadlines: "Deadlines",
        calendar: "Calendar",
        profile: "Profile"
    };

    document.getElementById("pageTitle").textContent = titles[sectionId] || "Dashboard";

    if (sectionId === "calendar") renderCalendar();
}

// ================= MOBILE MENU =================
mobileMenu.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});

// ================= DARK MODE =================
themeToggle.addEventListener("click", toggleTheme);

function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");

    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    themeToggle.innerHTML = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
}

function applySavedTheme() {
    const theme = localStorage.getItem(THEME_KEY);

    if (theme === "dark") {
        document.body.classList.add("dark");
        themeToggle.innerHTML = "☀️ Light Mode";
    } else {
        document.body.classList.remove("dark");
        themeToggle.innerHTML = "🌙 Dark Mode";
    }
}

// ================= PROFILE =================
saveProfileBtn.addEventListener("click", function () {
    const name = document.getElementById("profileName").value.trim();
    const email = document.getElementById("profileEmail").value.trim();

    if (!name || !email) {
        showToast("Please fill all fields");
        return;
    }

    currentUser = { name: name, email: email };
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));

    updateUserUI();
    showToast("Profile updated");
});

// ================= CALENDAR =================
function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    document.getElementById("calendarTitle").textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    const eventDates = new Set(assignments.map(a => a.date));

    let html = "";

    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const isToday = isCurrentMonth && today.getDate() === day;
        const hasEvent = eventDates.has(dateStr);

        html += `<div class="calendar-day ${isToday ? "today" : ""} ${hasEvent ? "has-event" : ""}">${day}</div>`;
    }

    document.getElementById("calendarGrid").innerHTML = html;
}

prevMonthBtn.addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
});

// ================= TOAST =================
let toastTimer;

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// ================= HELPERS =================
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function capitalizeWords(text) {
    return text.split(" ").filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ================= RENDER ALL =================
function renderAll() {
    renderSubjects();
    updateAssignmentSubjects();
    renderAssignments();
    renderDeadlines();
    updateStats();
    renderCalendar();
}

// ================= AUTO LOGIN =================
if (currentUser) {
    showApp();
} else {
    authScreen.classList.remove("hidden");
    mainApp.classList.add("hidden");
}

console.log("StudentHub loaded successfully 🚀");