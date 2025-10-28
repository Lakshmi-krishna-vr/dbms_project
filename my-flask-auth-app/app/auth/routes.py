from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from app.models import User
from app import db
from app.auth.forms import RegistrationForm, LoginForm

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/register', methods=['POST'])
def register():
    form = RegistrationForm()
    if form.validate_on_submit():
        username = form.username.data
        password = generate_password_hash(form.password.data)
        full_name = form.full_name.data
        phone = form.phone.data
        email = form.email.data
        year = form.year.data
        bio = form.bio.data
        institute_id = form.institute_id.data

        if User.query.filter_by(username=username).first():
            return jsonify({'message': 'Username already exists.'}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({'message': 'Email already exists.'}), 400

        new_user = User(username=username, password_hash=password, full_name=full_name,
                        phone=phone, email=email, year=year, bio=bio, institute_id=institute_id)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User registered successfully.'}), 201

    return jsonify({'message': 'Invalid input.', 'errors': form.errors}), 400

@auth_bp.route('/api/login', methods=['POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and check_password_hash(user.password_hash, form.password.data):
            return jsonify({'user_id': user.id}), 200
        return jsonify({'message': 'Invalid username or password.'}), 401

    return jsonify({'message': 'Invalid input.', 'errors': form.errors}), 400