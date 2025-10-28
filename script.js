/**
 * Renders a star rating (e.g., '★☆☆☆☆') based on a number.
 * @param {number} rating - The numerical rating (1-5).
 * @returns {string} HTML string for the stars.
 */
function renderStars(rating) {
    const fullStar = '★';
    const emptyStar = '☆';
    // Make sure rating is a number
    const numRating = Number(rating) || 0;
    return `<span class="star-rating">${fullStar.repeat(numRating)}${emptyStar.repeat(5 - numRating)}</span>`;
}

/**
 * Creates the HTML string for a single student card.
 * @param {object} student - The student data object.
 * @returns {string} The complete HTML for the card.
 */
/**
 * Creates the HTML string for a single student card.
/**
 * Creates the HTML string for a single student card, wrapped in a link.
 * @param {object} student - The student data object.
 * @returns {string} The complete HTML for the card link.
 */
function createStudentCard(student) {
    // Log the data received for debugging
    console.log("Data for student card:", student);

    const skillItems = (student.skills || []).map(skill => `
        <div class="skill-item">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>${skill.name || 'Unknown Skill'}</strong>
                ${renderStars(skill.rating)}
            </div>
        </div>
    `).join('');

    // Use correct property names and provide defaults
    const studentName = student.full_name || 'Unknown User';
    const studentLocation = student.institute_name || 'Unknown Location';
    const studentImage = student.image || 'placeholder-avatar.png'; // Use a default image path if needed

    // [!] RETURN AN 'a' TAG WRAPPING THE CARD [!]
    return `
        <a href="user-profile.html?id=${student.id}" class="student-card">
            <div class="card-header">
                <img src="${studentImage}" alt="${studentName}" class="profile-pic">
                <h3>${studentName}</h3>
            </div>
            ${skillItems || '<p>No skills listed.</p>'}
            <small style="margin-top: 11px; color: var(--muted);">${studentLocation}</small>
        </a>
    `;
}

// --- The rest of your script.js (renderStars, fetchAndRenderData, etc.) remains the same ---

/**
 * Renders a star rating (e.g., '★☆☆☆☆') based on a number.
 * @param {number} rating - The numerical rating (1-5).
 * @returns {string} HTML string for the stars.
 */
function renderStars(rating) {
    const fullStar = '★';
    const emptyStar = '☆';
    const numRating = Number(rating) || 0;
    return `<span class="star-rating">${fullStar.repeat(numRating)}${emptyStar.repeat(5 - numRating)}</span>`;
}


/**
 * Fetches data from the backend and renders the results.
 * @param {string} endpoint - The API endpoint to fetch data from.
 */
async function fetchAndRenderData(endpoint) {
    const grid = document.getElementById('students-grid');
    grid.innerHTML = '<p class="loading-placeholder">Loading students...</p>'; // Loading state

    try {
        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const studentsData = await response.json();

        // Render the data
        if (studentsData && studentsData.length > 0) {
            // map directly calls the updated createStudentCard which returns the <a> tag
            const cardsHtml = studentsData.map(createStudentCard).join('');
            grid.innerHTML = cardsHtml;
        } else {
            grid.innerHTML = '<p class="loading-placeholder">No other users found in the database.</p>';
        }

    } catch (error) {
        console.error("Failed to fetch student data:", error);
        grid.innerHTML = '<p class="loading-placeholder" style="color: #ff6b6b;">Error loading data. Please try again later.</p>';
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {

    // --- [!] NEW FUNCTION TO LOAD HEADER DATA [!] ---
    async function loadHeaderData() {
        const loggedInUserId = localStorage.getItem('skillLinkUserID');
        const logoSpan = document.getElementById('user-institute-logo');

        if (!loggedInUserId) {
            // Should ideally redirect to login if no ID, but header might still show
            if (logoSpan) logoSpan.textContent = "SkillLink"; // Default text if not logged in
            return;
        }
        if (!logoSpan) return; // Exit if the logo element isn't found

        try {
            // Use the same API endpoint as the profile page
            const response = await fetch(`/api/profile/${loggedInUserId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch profile for header');
            }
            const profileData = await response.json();

            // Update the logo text
            logoSpan.textContent = profileData.institute_name || "SkillLink"; // Show institute or default

        } catch (error) {
            console.error("Failed to load header data:", error);
            logoSpan.textContent = "SkillLink"; // Default text on error
        }
    }
    // --- End of new function ---


    // --- Load student cards (existing code) ---
    // Start the process of connecting to the backend and rendering the UI
    fetchAndRenderData('/api/students/search');


    // --- [!] CALL THE NEW FUNCTION [!] ---
    loadHeaderData();

}); // End DOMContentLoaded