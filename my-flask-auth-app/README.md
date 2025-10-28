# My Flask Authentication App

This project is a Flask web application that implements user authentication features, including registration and login functionalities. It utilizes password hashing for secure storage of user passwords and provides a modular structure for easy maintenance and scalability.

## Project Structure

```
my-flask-auth-app
├── app
│   ├── __init__.py          # Initializes the Flask application and sets up the database
│   ├── models.py            # Contains database models, including the User model
│   ├── auth
│   │   ├── __init__.py      # Initializes the authentication blueprint
│   │   ├── routes.py        # Defines API endpoints for registration and login
│   │   └── forms.py         # Contains form classes for user registration and login
│   ├── templates
│   │   ├── base.html        # Base template for other HTML files
│   │   ├── login.html       # Login page template
│   │   └── register.html    # Registration page template
│   └── static
│       ├── css
│       │   └── styles.css   # CSS styles for the application
│       └── js
│           └── scripts.js    # JavaScript for handling user interactions
├── config.py                # Configuration settings for the Flask application
├── run.py                   # Entry point for running the Flask application
├── requirements.txt         # Lists dependencies required for the project
└── README.md                # Documentation for the project
```

## Features

- User registration with validation for unique usernames and emails.
- Secure password storage using hashing.
- User login with password verification.
- Modular design separating models, routes, templates, and static files.

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd my-flask-auth-app
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

4. Configure the database URI in `config.py`.

5. Run the application:
   ```
   python run.py
   ```

6. Access the application in your web browser at `http://127.0.0.1:5000`.

## Usage

- Navigate to the registration page to create a new account.
- Use the login page to access your account.

## Dependencies

- Flask
- Flask-SQLAlchemy
- Flask-CORS
- Werkzeug (for password hashing)

This README provides an overview of the project, its structure, features, setup instructions, and dependencies. For further details, refer to the individual files and their respective documentation.