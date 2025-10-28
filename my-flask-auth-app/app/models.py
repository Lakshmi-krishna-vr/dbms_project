from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    full_name = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(15), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    year = db.Column(db.String(10), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    institute_id = db.Column(db.Integer, nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'full_name': self.full_name,
            'phone': self.phone,
            'email': self.email,
            'year': self.year,
            'bio': self.bio,
            'institute_id': self.institute_id
        }