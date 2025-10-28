document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const openFilterBtn = document.getElementById('open-filter-btn');
    const closeFilterBtn = document.getElementById('close-filter-btn');
    const filterPanel = document.getElementById('filter-panel');
    const mainSearchInput = document.getElementById('main-search-input');
    const resultsArea = document.getElementById('results-area');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');

    // Filter elements
    const instituteFilterOptions = document.getElementById('institute-filter-options');
    const instituteFilterSearch = document.getElementById('institute-filter-search');
    const branchFilterOptions = document.getElementById('branch-filter-options');
    const branchFilterSearch = document.getElementById('branch-filter-search');
    const yearFilterOptions = document.getElementById('year-filter-options');
    const skillFilterSearch = document.getElementById('skill-filter-search');
    const skillFilterOptions = document.getElementById('skill-filter-options');
    const selectedSkillsFilterDiv = document.getElementById('selected-skills-filter');

    // Modal elements
    const skillLevelModal = document.getElementById('skill-level-modal');
    const modalSkillName = document.getElementById('modal-skill-name');
    const modalRatingDots = document.getElementById('modal-rating-dots');
    const modalRatingMessage = document.getElementById('modal-rating-message');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    // --- State ---
    let currentFilters = {
        institute: ['all'],
        branch: ['all'],
        year: ['all'],
        skills: {} // { SkillName: minLevel, ... }
    };
    let mainSearchTerm = '';
    let searchTimeout;
    let skillToRate = null; // {name: string}
    let selectedModalRating = 0;
    const ratingMessages = { 0: '', 1: 'Beginner', 2: 'Have experience', 3: 'Intermediate', 4: 'Well experienced', 5: 'Expert' };
    const loggedInUserId = localStorage.getItem('skillLinkUserID'); // Get logged-in user ID


    // --- API Helper ---
    async function apiFetch(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API Fetch Error:', error);
            resultsArea.innerHTML = '<p class="empty-state" style="color: #ff6b6b;">Error communicating with server.</p>';
            return null;
        }
    }

    // --- Filter Panel Logic ---
    openFilterBtn.addEventListener('click', () => {
        filterPanel.classList.add('open');
        document.body.classList.add('filter-panel-open');
    });
    closeFilterBtn.addEventListener('click', () => {
        filterPanel.classList.remove('open');
        document.body.classList.remove('filter-panel-open');
    });

    // --- Accordion Logic ---
    document.querySelectorAll('.accordion-header').forEach(button => {
        button.addEventListener('click', () => {
            const content = button.nextElementSibling;
            const isExpanded = button.getAttribute('aria-expanded') === 'true';

            button.setAttribute('aria-expanded', !isExpanded);
            content.classList.toggle('open');
            content.style.maxHeight = content.classList.contains('open') ? content.scrollHeight + "px" : null;
        });
    });

    // --- Load Dynamic Filter Options ---
    async function loadFilterOptions() {
        const institutes = await apiFetch('/api/institutes');
        if (institutes) populateCheckboxOptions(instituteFilterOptions, institutes, 'institute');

        const branches = await apiFetch('/api/branches');
        if (branches) populateCheckboxOptions(branchFilterOptions, branches.map(b => ({name: b})), 'branch');
    }

    function populateCheckboxOptions(container, items, filterName) {
        container.querySelectorAll('label:not(:first-child)').forEach(el => el.remove());
        items.forEach(item => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" name="${filterName}" value="${item.name}"> ${item.name}`;
            container.appendChild(label);
        });
        addCheckboxListeners(container, filterName);
    }

    // --- Filter Input Handling ---
    function addCheckboxListeners(container, filterName) {
        const checkboxes = container.querySelectorAll(`input[type="checkbox"][name="${filterName}"]`);
        const allCheckbox = container.querySelector(`input[type="checkbox"][value="all"]`);

        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const selectedValues = Array.from(checkboxes)
                    .filter(c => c.checked && c.value !== 'all')
                    .map(c => c.value);

                if (cb.value === 'all' && cb.checked) {
                    checkboxes.forEach(otherCb => { if (otherCb !== allCheckbox) otherCb.checked = false; });
                    currentFilters[filterName] = ['all'];
                } else if (cb.value !== 'all') {
                    if (allCheckbox) allCheckbox.checked = false;
                    currentFilters[filterName] = selectedValues.length > 0 ? selectedValues : ['all'];
                } else {
                     if(selectedValues.length === 0 && allCheckbox) {
                         allCheckbox.checked = true;
                         currentFilters[filterName] = ['all'];
                     }
                }
                 console.log("Updated Filters:", currentFilters);
            });
        });
    }
    addCheckboxListeners(yearFilterOptions, 'year'); // Initial listeners for Year

    function setupFilterSearch(searchInput, optionsContainer) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            optionsContainer.querySelectorAll('label').forEach(label => {
                const text = label.textContent.toLowerCase();
                label.style.display = (label.querySelector('input[value="all"]') || !text.includes(searchTerm)) ? 'none' : 'flex';
            });
        });
    }
    setupFilterSearch(instituteFilterSearch, instituteFilterOptions);
    setupFilterSearch(branchFilterSearch, branchFilterOptions);


    // --- Skill Filter Specific Logic ---
    skillFilterSearch.addEventListener('input', async (e) => {
        const query = e.target.value;
        skillFilterOptions.innerHTML = '';
        if (query.length < 1) return;

        const skills = await apiFetch(`/api/skills/search?q=${query}`);
        if (skills) {
            skills.forEach(skill => {
                if (currentFilters.skills[skill.name] === undefined) {
                    const label = document.createElement('label');
                    // Style as button, check accessibility needs later
                    label.innerHTML = `<button type="button" class="skill-select-btn" style="all: unset; cursor: pointer; color: var(--muted); text-align: left; width: 100%;" data-skill-name="${skill.name}">${skill.name}</button>`;
                    label.querySelector('button').addEventListener('click', () => {
                        openSkillLevelModal(skill);
                    });
                     // Add hover effect via JS or dedicated class if needed
                    label.addEventListener('mouseover', () => label.style.color = 'var(--text)');
                    label.addEventListener('mouseout', () => label.style.color = 'var(--muted)');

                    skillFilterOptions.appendChild(label);
                }
            });
        }
    });

    function openSkillLevelModal(skill) {
        skillToRate = skill;
        selectedModalRating = 0;
        modalSkillName.textContent = skill.name;
        modalRatingDots.className = 'rating-dots modal-rating';
        modalRatingMessage.textContent = '';
        skillLevelModal.setAttribute('aria-hidden', 'false');
    }
    function closeSkillLevelModal() {
        skillLevelModal.setAttribute('aria-hidden', 'true');
        skillToRate = null;
    }
    modalRatingDots.addEventListener('click', (e) => {
      if (e.target.classList.contains('dot')) {
        selectedModalRating = parseInt(e.target.dataset.value);
        modalRatingDots.className = `rating-dots modal-rating rating-${selectedModalRating}`;
        modalRatingMessage.textContent = `Minimum Level: ${ratingMessages[selectedModalRating]}`;
      }
    });
    modalConfirmBtn.addEventListener('click', () => {
        if (skillToRate && selectedModalRating > 0) {
            currentFilters.skills[skillToRate.name] = selectedModalRating;
            renderSelectedSkills();
            closeSkillLevelModal();
            skillFilterSearch.value = '';
            skillFilterOptions.innerHTML = '';
        } else { alert("Please select a minimum skill level (1-5)."); }
    });
    modalCancelBtn.addEventListener('click', closeSkillLevelModal);
    skillLevelModal.addEventListener('click', (e) => { if (e.target === skillLevelModal) closeSkillLevelModal(); });

    function renderSelectedSkills() {
        selectedSkillsFilterDiv.innerHTML = '<h4 style="margin-bottom: 8px;">Applied Skill Filters:</h4>'; // Added margin
        if (Object.keys(currentFilters.skills).length === 0) {
             selectedSkillsFilterDiv.innerHTML += '<p style="font-size: 0.9em; color: var(--muted);">None</p>'; // Styled 'None' text
             return;
        }
        for (const skillName in currentFilters.skills) {
            const level = currentFilters.skills[skillName];
            const item = document.createElement('div');
            item.className = 'selected-skill-item';
            item.innerHTML = `
                <span class="skill-name">${skillName}</span>
                <span class="skill-level">(${ratingMessages[level]}+)</span>
                <button type="button" class="remove-skill-filter" data-skill-name="${skillName}">&times;</button>
            `;
            item.querySelector('.remove-skill-filter').addEventListener('click', (e) => {
                delete currentFilters.skills[e.currentTarget.dataset.skillName];
                renderSelectedSkills();
            });
            selectedSkillsFilterDiv.appendChild(item);
        }
    }


    // --- Apply & Clear Filters ---
    applyFiltersBtn.addEventListener('click', () => {
        performSearch();
        closeFilterBtn.click();
    });
    clearFiltersBtn.addEventListener('click', () => {
        currentFilters = { institute: ['all'], branch: ['all'], year: ['all'], skills: {} };
        filterPanel.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = (cb.value === 'all'));
        filterPanel.querySelectorAll('.filter-search').forEach(input => input.value = '');
        skillFilterOptions.innerHTML = '';
        renderSelectedSkills();
        performSearch();
    });

    // --- Main Search Input ---
    mainSearchInput.addEventListener('input', (e) => {
        mainSearchTerm = e.target.value;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => { performSearch(); }, 300);
    });

    // --- Perform Search Function ---
    async function performSearch() {
        resultsArea.innerHTML = '<p class="empty-state">Searching...</p>';
        const params = new URLSearchParams();
        params.set('q', mainSearchTerm);
        if(loggedInUserId) params.set('exclude_id', loggedInUserId);

        if (currentFilters.institute[0] !== 'all') currentFilters.institute.forEach(val => params.append('institute', val));
        if (currentFilters.branch[0] !== 'all') currentFilters.branch.forEach(val => params.append('branch', val));
        if (currentFilters.year[0] !== 'all') currentFilters.year.forEach(val => params.append('year', val));

        const skillFilterParts = Object.entries(currentFilters.skills).map(([name, level]) => `${name}:${level}`);
        if (skillFilterParts.length > 0) params.set('skills', skillFilterParts.join(','));

        const endpoint = `/api/students/search?${params.toString()}`;
        console.log("Fetching:", endpoint); // Debug log for fetch URL
        const users = await apiFetch(endpoint);
        renderResults(users);
    }

    // --- Render Results ---
    function renderResults(users) {
        resultsArea.innerHTML = '';
        if (!users || users.length === 0) {
            resultsArea.innerHTML = '<p class="empty-state">No users found matching your criteria.</p>';
            return;
        }
        users.forEach(user => {
            const cardHTML = createStudentCard(user); // Generate card HTML
            const link = document.createElement('a');
            link.href = `user-profile.html?id=${user.id}`;
            link.innerHTML = cardHTML;
            link.style.textDecoration = 'none';
            link.style.color = 'inherit';
            // Find the card element *within* the link to add cursor style
            const cardElement = link.querySelector('.student-card');
            if (cardElement) cardElement.style.cursor = 'pointer';
            resultsArea.appendChild(link);
        });
    }

    // --- Card Generation & Star Rating (Corrected) ---
    function renderStars(rating) {
        const fullStar = '★'; const emptyStar = '☆';
        const numRating = Number(rating) || 0;
        return `<span class="star-rating">${fullStar.repeat(numRating)}${emptyStar.repeat(5 - numRating)}</span>`;
    }
    // [!] THIS FUNCTION IS CORRECTED [!]
    function createStudentCard(student) {
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
        const studentImage = student.image || 'placeholder-avatar.png'; // Make sure you have a placeholder image or remove if not needed

        return `
            <div class="student-card">
                <div class="card-header">
                    <img src="${studentImage}" alt="${studentName}" class="profile-pic">
                    <h3>${studentName}</h3>
                </div>
                ${skillItems || '<p style="font-size: 0.9em; color: var(--muted);">No skills listed.</p>'}
                <small style="margin-top: 11px; color: var(--muted);">${studentLocation}</small>
            </div>
        `;
    }

    // --- Initial Load ---
    loadFilterOptions();
    performSearch(); // Initial search

}); // End DOMContentLoaded