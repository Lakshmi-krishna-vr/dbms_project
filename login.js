document.getElementById('loginForm').addEventListener('submit', function(event) {
    // Stop the form from submitting normally (which would cause a page reload)
    event.preventDefault();

    // Get the values entered by the user
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
    const messageElement = document.getElementById('message');

    // Define the required hardcoded credentials
    const correctUsername = "lakshmi";
    const correctPassword = "123";

    // Check if the credentials match
    if (usernameInput === correctUsername && passwordInput === correctPassword) {
        // Success: Change the message and redirect the user
        messageElement.style.color = 'green';
        messageElement.textContent = 'Login successful! Redirecting...';
        
        // Redirect to the index.html file
        // window.location.href changes the browser's current page
        window.location.href = 'index.html';

    } else {
        // Failure: Display an error message
        messageElement.style.color = 'red';
        messageElement.textContent = 'Invalid username or password. (Hint: lakshmi/123)';
    }
});