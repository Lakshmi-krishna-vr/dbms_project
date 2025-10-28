document.getElementById('loginForm').addEventListener('submit', async function(event) {
    // Stop the form from submitting normally
    event.preventDefault();

    // Get the values entered by the user
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
    const messageElement = document.getElementById('message');

    try {
        // Send the data to our new Flask backend endpoint
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: usernameInput,
                password: passwordInput
            }),
        });

        // Get the JSON response from the server
        const data = await response.json();

        if (response.ok) { // Server responded with success (e.g., status 200)
            // Success: Change the message and redirect
            messageElement.style.color = 'green';
            messageElement.textContent = data.message;
            
            // Redirect to the index.html file
            window.location.href = 'index.html';

        } else { // Server responded with an error (e.g., status 401)
            // Failure: Display the error message from the server
            messageElement.style.color = 'red';
            messageElement.textContent = data.message;
        }

    } catch (error) {
        // Network error or other fetch-related problem
        console.error('Login failed:', error);
        messageElement.style.color = 'red';
        messageElement.textContent = 'An error occurred. Please try again.';
    }
});