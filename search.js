document.addEventListener('DOMContentLoaded', function () {
  const filterBtn = document.getElementById('filter-btn');
  const dropdown = document.getElementById('filter-dropdown');
  const applyBtn = document.getElementById('apply-filters');
  const clearBtn = document.getElementById('clear-filters');
  const doSearch = document.getElementById('do-search');
  const mainSearch = document.getElementById('main-search');
  const results = document.getElementById('results');

  // open/close dropdown
  filterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dropdown.classList.toggle('open');
    filterBtn.setAttribute('aria-expanded', String(open));
    dropdown.setAttribute('aria-hidden', String(!open));
  });

  // click outside closes dropdown
  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
    filterBtn.setAttribute('aria-expanded', 'false');
    dropdown.setAttribute('aria-hidden', 'true');
  });

  dropdown.addEventListener('click', (e) => e.stopPropagation());

  function getSelectedFilters() {
    const checks = dropdown.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checks).map(c => c.value);
  }

  applyBtn.addEventListener('click', () => {
    const filters = getSelectedFilters();
    showResults(filters, mainSearch.value);
    dropdown.classList.remove('open');
  });

  clearBtn.addEventListener('click', () => {
    const checks = dropdown.querySelectorAll('input[type="checkbox"]');
    checks.forEach(c => c.checked = false);
  });

  doSearch.addEventListener('click', () => {
    const filters = getSelectedFilters();
    showResults(filters, mainSearch.value);
  });

  // if index forwarded a query: fill the input
  const params = new URLSearchParams(window.location.search);
  if (params.has('q')) mainSearch.value = params.get('q');

  function showResults(filters, query) {
    // Placeholder: replace with real search call
    results.innerHTML = '';
    const heading = document.createElement('div');
    heading.innerHTML = '<strong>Search:</strong> ' + (query ? escapeHtml(query) : '<em>none</em>');
    const list = document.createElement('div');
    list.style.marginTop = '8px';
    list.innerHTML = '<strong>Filters:</strong> ' + (filters.length ? filters.join(', ') : '<em>none</em>');
    results.appendChild(heading);
    results.appendChild(list);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
  }
});