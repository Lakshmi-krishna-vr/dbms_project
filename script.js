
const mockBackendData = [
    {
        name: "Alice Smith",
        skills: [
            { name: "Python", percentage: 90, rating: 5 },
            { name: "Truidnity", percentage: 30, rating: 3 }
        ],
        location: "Stujors Selvilles",
        image: "placeholder-1.jpg" // Placeholder for an actual image URL
    },
    {
        name: "Name",
        skills: [
            { name: "Python UX Design", percentage: 85, rating: 4 },
            { name: "Truidnity", percentage: 70, rating: 5 }
        ],
        location: "My College",
        image: "placeholder-2.jpg"
    },
    {
        name: "Sturils",
        skills: [
            { name: "Public Speaking", percentage: 70, rating: 4 }
        ],
        location: "Cross-Campus",
        image: "placeholder-3.jpg"
    }
    // ... more data
];

/**
 * Renders a star rating (e.g., '⭐⭐⭐⭐⭐') based on a number.
 * @param {number} rating - The numerical rating (1-5).
 * @returns {string} HTML string for the stars.
 */
function renderStars(rating) {
    const fullStar = '★';
    const emptyStar = '☆';
    return `<span class="star-rating">${fullStar.repeat(rating)}${emptyStar.repeat(5 - rating)}</span>`;
}

/**
 * Creates the HTML string for a single student card.
 * @param {object} student - The student data object.
 * @returns {string} The complete HTML for the card.
 */
function createStudentCard(student) {
    const skillItems = student.skills.map(skill => `
        <div class="skill-item">
            <strong>${skill.name} (${skill.percentage}%)</strong>
            <div class="skill-progress">
                <div class="progress-bar" style="width: ${skill.percentage}%;"></div>
            </div>
            ${renderStars(skill.rating)}
        </div>
    `).join('');

    return `
        <div class="student-card">
            <div class="card-header">
                <img src="${student.image}" alt="${student.name}" class="profile-pic">
                <h3>${student.name}</h3>
            </div>
            ${skillItems}
            <small style="margin-top: 11px; color: #aaa;">${student.location}</small>
        </div>
    `;
}

/**
 * Fetches data from a simulated backend and renders the results.
 * @param {string} endpoint - The API endpoint to fetch data from.
 */
async function fetchAndRenderData(endpoint) {
    const grid = document.getElementById('students-grid');
    grid.innerHTML = '<h2>Loading students...</h2>'; // Loading state

    try {
        // --- THIS IS THE CORE FRONT-END/BACK-END CONNECTION ---

        // 1. Fetching Data: In a real app, you'd use the 'fetch' API to contact your backend:
        // const response = await fetch(endpoint);
        // const studentsData = await response.json();

        // 1. SIMULATION: Using the mock data instead of a real HTTP call:
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        const studentsData = mockBackendData;

        // 2. Rendering Data:
        if (studentsData && studentsData.length > 0) {
            const cardsHtml = studentsData.map(createStudentCard).join('');
            grid.innerHTML = cardsHtml; // Insert all generated HTML cards
        } else {
            grid.innerHTML = '<h2>No students found.</h2>';
        }

    } catch (error) {
        console.error("Failed to fetch student data:", error);
        grid.innerHTML = '<h2>Error loading data. Please try again later.</h2>';
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Start the process of connecting to the 'backend' and rendering the UI
    fetchAndRenderData('/api/students/search'); // The endpoint is conceptual
});

