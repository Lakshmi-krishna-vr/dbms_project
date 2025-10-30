import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_ # Needed for searching multiple fields

# --- FLASK APP INITIALIZATION ---
app = Flask(__name__, static_folder='dbms_project', static_url_path='')
CORS(app)

# --- DATABASE CONFIGURATION ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://root:0353@localhost/dbms_project_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- DATABASE MODELS (TABLES) ---

class ProjectMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    user = db.relationship('User', back_populates='projects')
    project = db.relationship('Project', back_populates='members')

class ProjectTool(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tool_id = db.Column(db.Integer, db.ForeignKey('tool.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    tool = db.relationship('Tool')
    project = db.relationship('Project', back_populates='tools')

# [UPDATED] User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(120))
    phone = db.Column(db.String(20), unique=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    year = db.Column(db.Integer)
    branch = db.Column(db.String(100)) # [NEW] Branch field
    bio = db.Column(db.Text)
    institute_id = db.Column(db.Integer, db.ForeignKey('institute.id'))
    
    skills = db.relationship('UserSkill', back_populates='user', cascade="all, delete-orphan")
    projects = db.relationship('ProjectMember', back_populates='user')

    def to_dict(self, include_skills=True):
        data = {
            'id': self.id,
            'full_name': self.full_name,
            'phone': self.phone,
            'email': self.email,
            'year': self.year,
            'branch': self.branch, # [NEW] Added branch
            'bio': self.bio,
            'institute_name': self.institute.name if self.institute else None
        }
        # Add placeholder image using ID
        data['image'] = f"https://i.pravatar.cc/100?img={self.id}"
        
        if include_skills:
            data['skills'] = [
                { 'id': us.skill.id, 'name': us.skill.name, 'rating': us.rating } 
                for us in self.skills
            ]
            data['projects'] = [
                { 'id': pm.project.id, 'name': pm.project.name } 
                for pm in self.projects
            ]
        return data

class Institute(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), unique=True, nullable=False)
    users = db.relationship('User', backref='institute', lazy=True)
    def to_dict(self): return {'id': self.id, 'name': self.name}

class Skill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    def to_dict(self): return {'id': self.id, 'name': self.name}

class UserSkill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey('skill.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False, default=1)
    user = db.relationship('User', back_populates='skills')
    skill = db.relationship('Skill')

class Tool(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    def to_dict(self): return {'id': self.id, 'name': self.name}

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    # ... (other project fields)
    description = db.Column(db.Text)
    project_type = db.Column(db.String(50)) # "Software" or "Hardware"
    start_date = db.Column(db.Date)
    status = db.Column(db.String(50)) # e.g., "In Progress", "Completed"
    members = db.relationship('ProjectMember', back_populates='project', cascade="all, delete-orphan")
    tools = db.relationship('ProjectTool', back_populates='project', cascade="all, delete-orphan")

    def to_dict(self):
        # ... (project to_dict implementation)
         return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'project_type': self.project_type,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'status': self.status,
            'tools': [pt.tool.to_dict() for pt in self.tools],
            'members': [member.user.to_dict(include_skills=True) for member in self.members]
        }


# --- API ENDPOINTS ---

# [Login - Unchanged]
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username, password = data.get('username'), data.get('password')
    if not username or not password: return jsonify({'success': False, 'message': 'Username and password required'}), 400
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password):
        return jsonify({'success': True,'message': 'Login successful!', 'user_id': user.id})
    return jsonify({'success': False, 'message': 'Invalid username or password.'}), 401
        
# [Register - Unchanged]
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    required = ['username', 'password', 'email']
    if not all(data.get(field) for field in required):
        return jsonify({'success': False, 'message': 'Username, password, and email are required.'}), 400
    # ... (rest of register function is unchanged)
    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({'success': False, 'message': 'Username already taken.'}), 400
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'success': False, 'message': 'Email already registered.'}), 400
    if data.get('phone') and User.query.filter_by(phone=data.get('phone')).first():
        return jsonify({'success': False, 'message': 'Phone number already registered.'}), 400
    try:
        new_user = User(
            username=data.get('username'),
            password_hash=generate_password_hash(data.get('password'), method='pbkdf2:sha256'),
            full_name=data.get('full_name'), phone=data.get('phone'), email=data.get('email'),
            year=data.get('year'), bio=data.get('bio'), branch=data.get('branch') # Added branch
        )
        institute = Institute.query.filter_by(name=data.get('institute_name')).first()
        if institute: new_user.institute_id = institute.id
        db.session.add(new_user); db.session.commit()
        for skill_item in data.get('skills', []):
            skill = Skill.query.filter_by(name=skill_item.get('name')).first()
            if skill: db.session.add(UserSkill(user_id=new_user.id, skill_id=skill.id, rating=skill_item.get('rating')))
        db.session.commit()
        return jsonify({'success': True, 'message': 'Account created successfully! Please log in.'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'An error occurred: {str(e)}'}), 500

# [UPDATED] Student/User Search with Filters
@app.route('/api/students/search')
def search_students():
    # --- Get search parameters from URL query ---
    search_term = request.args.get('q', '')
    
    # Filters (expecting comma-separated strings or single values)
    institute_names = request.args.getlist('institute') # Use getlist for multiple values
    branches = request.args.getlist('branch')
    years = request.args.getlist('year')
    
    # Skills filter (expecting format like: SkillName:MinLevel,SkillName2:MinLevel2)
    skills_filter_str = request.args.get('skills', '')
    skill_filters = {}
    if skills_filter_str:
        try:
            for item in skills_filter_str.split(','):
                name, level = item.split(':')
                skill_filters[name] = int(level)
        except ValueError:
            return jsonify({"error": "Invalid skills filter format. Use 'SkillName:Level,SkillName2:Level2'"}), 400

    # Get logged-in user ID (assuming it's passed somehow, default to 0 if not)
    # In a real app, you'd get this from a session or token
    logged_in_user_id = request.args.get('exclude_id', 0, type=int)

    # --- Build the database query ---
    query = User.query
    
    # Exclude the logged-in user
    if logged_in_user_id:
       query = query.filter(User.id != logged_in_user_id)

    # Apply search term filter (name or skill)
    if search_term:
        search_like = f"%{search_term}%"
        # Search in user's full name OR if they have a skill with that name
        query = query.outerjoin(UserSkill).outerjoin(Skill).filter(
            or_(
                User.full_name.ilike(search_like),
                Skill.name.ilike(search_like)
            )
        ).distinct(User.id) # Use distinct to avoid duplicates if user matches name AND skill

    # Apply institute filter
    if institute_names:
        # Join with Institute table if not already joined implicitly
        if Institute not in [j.entity for j in query._join_entities]:
             query = query.join(Institute)
        query = query.filter(Institute.name.in_(institute_names))

    # Apply branch filter
    if branches:
        query = query.filter(User.branch.in_(branches))

    # Apply year filter
    if years:
        # Convert years to integers for filtering
        try:
            year_ints = [int(y) for y in years]
            query = query.filter(User.year.in_(year_ints))
        except ValueError:
             return jsonify({"error": "Invalid year format. Use numbers."}), 400

    # Apply skill filters (name and minimum level)
    if skill_filters:
        # We need to join UserSkill and Skill tables
        if UserSkill not in [j.entity for j in query._join_entities]:
            query = query.join(UserSkill)
        if Skill not in [j.entity for j in query._join_entities]:
            query = query.join(Skill)
        
        # Add a filter for each skill requirement
        for skill_name, min_level in skill_filters.items():
            query = query.filter(
                db.and_(
                    Skill.name == skill_name,
                    UserSkill.rating >= min_level
                )
            )

    # --- Execute query and format results ---
    users = query.all()
    
    # Convert users to the dictionary format expected by frontend
    results = [user.to_dict(include_skills=True) for user in users]
    
    return jsonify(results)


# --- PROFILE API ENDPOINTS (Unchanged) ---
# ... (get_profile, update_profile functions remain the same) ...
@app.route('/api/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    user = User.query.get(user_id)
    if not user: return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict(include_skills=True))

@app.route('/api/profile/<int:user_id>', methods=['POST'])
def update_profile(user_id):
    user, data = User.query.get(user_id), request.json
    if not user: return jsonify({'error': 'User not found'}), 404
    user.full_name, user.phone, user.email = data.get('full_name'), data.get('phone'), data.get('email')
    user.year, user.bio, user.branch = data.get('year'), data.get('bio'), data.get('branch') # Added branch
    institute = Institute.query.filter_by(name=data.get('institute_name')).first()
    if institute: user.institute_id = institute.id
    UserSkill.query.filter_by(user_id=user.id).delete()
    for skill_item in data.get('skills', []):
        skill = Skill.query.filter_by(name=skill_item.get('name')).first()
        if skill: db.session.add(UserSkill(user_id=user.id, skill_id=skill.id, rating=skill_item.get('rating')))
    # Add projects logic remains the same
    existing_project_ids = [pm.project_id for pm in user.projects]
    for project_item in data.get('projects', []):
        project = Project.query.filter_by(name=project_item.get('name')).first()
        if project and project.id not in existing_project_ids:
            db.session.add(ProjectMember(user_id=user.id, project_id=project.id))
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': 'Profile successfully saved!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'An error occurred: {str(e)}'}), 500

# --- Lookup API Endpoints ---
@app.route('/api/institutes', methods=['GET'])
def get_institutes():
    return jsonify([i.to_dict() for i in Institute.query.all()])
    
@app.route('/api/skills/search', methods=['GET'])
def search_skills():
    query = request.args.get('q', '')
    if not query: return jsonify([])
    search_term = f"%{query}%"
    return jsonify([s.to_dict() for s in Skill.query.filter(Skill.name.ilike(search_term)).limit(10).all()])

# [NEW] Get list of branches (simple list for now)
@app.route('/api/branches', methods=['GET'])
def get_branches():
    # In a real app, this might come from a separate table or distinct values
    branches = db.session.query(User.branch).distinct().filter(User.branch != None).all()
    return jsonify([b[0] for b in branches]) # Extract branch name from tuple


# --- PROJECT API ENDPOINTS (Unchanged) ---
# ... (get_projects, get_project_details, search_tools, search_users, search_projects, create_project functions remain the same) ...
@app.route('/api/projects', methods=['GET'])
def get_projects():
    query = request.args.get('q', '')
    base_query = Project.query
    if query:
        search_term = f"%{query}%"
        base_query = base_query.filter(Project.name.ilike(search_term))
    projects = base_query.order_by(Project.start_date.desc()).all()
    return jsonify([p.to_dict() for p in projects])

@app.route('/api/project/<int:project_id>', methods=['GET'])
def get_project_details(project_id):
    project = Project.query.get(project_id)
    if not project: return jsonify({'error': 'Project not found'}), 404
    return jsonify(project.to_dict())
    
@app.route('/api/tools/search', methods=['GET'])
def search_tools():
    query = request.args.get('q', '')
    if not query: return jsonify([])
    search_term = f"%{query}%"
    return jsonify([t.to_dict() for t in Tool.query.filter(Tool.name.ilike(search_term)).limit(10).all()])

@app.route('/api/users/search', methods=['GET'])
def search_users():
    query = request.args.get('q', '')
    if not query: return jsonify([])
    search_term = f"%{query}%"
    # Get logged-in user ID to exclude (replace with real auth later)
    logged_in_user_id = request.args.get('exclude_id', 0, type=int) 
    users = User.query.filter(User.id != logged_in_user_id, (User.full_name.ilike(search_term) | User.email.ilike(search_term))).limit(10).all()
    return jsonify([u.to_dict(include_skills=False) for u in users])

@app.route('/api/projects/search', methods=['GET'])
def search_projects():
    query = request.args.get('q', '')
    if not query: return jsonify([])
    search_term = f"%{query}%"
    return jsonify([{'id': p.id, 'name': p.name} for p in Project.query.filter(Project.name.ilike(search_term)).limit(10).all()])

@app.route('/api/projects/create', methods=['POST'])
def create_project():
    data = request.json
    try:
        new_project = Project(
            name=data.get('name'), description=data.get('description'),
            project_type=data.get('project_type'), status=data.get('status'),
            start_date=datetime.fromisoformat(data.get('start_date')).date() if data.get('start_date') else None
        )
        db.session.add(new_project)
        for tool_name in data.get('tools', []):
            tool = Tool.query.filter_by(name=tool_name).first() or Tool(name=tool_name)
            new_project.tools.append(ProjectTool(tool=tool))
        creator_id = data.get('creator_id') 
        creator = User.query.get(creator_id)
        if creator: new_project.members.append(ProjectMember(user=creator))
        for member_id in data.get('members', []):
            user = User.query.get(member_id)
            if user: new_project.members.append(ProjectMember(user=user))
        db.session.commit()
        return jsonify({'success': True, 'message': 'Project created!', 'project_id': new_project.id})
    except Exception as e:
        db.session.rollback()
        print(f"Error creating project: {e}") # Added print for debugging
        return jsonify({'success': False, 'message': f'An error occurred: {str(e)}'}), 500


# --- STATIC FILE SERVER ---
@app.route('/')
def serve_login_page():
    return send_from_directory('dbms_project', 'login.html')

@app.route('/<path:filename>')
def serve_static_files(filename):
    return send_from_directory('dbms_project', filename)


# --- DATABASE SETUP ---
# --- DATABASE SETUP ---
def setup_database(app):
    with app.app_context():
        # db.drop_all() # Uncomment this to force table recreation if needed
        db.create_all()

        # [!] FULL SEEDING LOGIC BELOW [!]

        if Institute.query.count() == 0:
            print("Seeding Institutes...")
            institutes_to_add = [
                Institute(name='Saintgits College of Engineering'),
                Institute(name='IIT Bombay'),
                Institute(name='NIT Calicut'),
                Institute(name='College of Engineering, Trivandrum (CET)')
            ]
            db.session.add_all(institutes_to_add)
            db.session.commit()

        if Skill.query.count() == 0:
            print("Seeding Skills...")
            skills_to_add = [
                Skill(name='Python'), Skill(name='JavaScript'), Skill(name='Java'),
                Skill(name='C++'), Skill(name='HTML'), Skill(name='CSS'),
                Skill(name='React'), Skill(name='Node.js'), Skill(name='Flask'),
                Skill(name='Django'), Skill(name='MySQL'), Skill(name='MongoDB'),
                Skill(name='Data Analysis'), Skill(name='Machine Learning'),
                Skill(name='Graphic Design'), Skill(name='UI/UX Design')
            ]
            db.session.add_all(skills_to_add)
            db.session.commit()

        if Tool.query.count() == 0:
            print("Seeding Tools...")
            tools_to_add = [
                Tool(name='Git'), Tool(name='VS Code'), Tool(name='Docker'),
                Tool(name='Figma'), Tool(name='Adobe XD'), Tool(name='Jira'),
                Tool(name='Blender'), Tool(name='Arduino'), Tool(name='Raspberry Pi')
            ]
            db.session.add_all(tools_to_add)
            db.session.commit()

        if User.query.count() == 0:
            print("Creating users with password '123'...")
            default_institute = Institute.query.first()
            hashed_pw = generate_password_hash('123', method='pbkdf2:sha256')
            # Added branch data
            users_to_add = [
                User(username='lakshmi', password_hash=hashed_pw, full_name='Lakshmi Priya', email='lakshmi@example.com', year=2, branch='Computer Science', bio='Student passionate about coding.', institute_id=default_institute.id if default_institute else None),
                User(username='miza', password_hash=hashed_pw, full_name='Miza Harris', phone='+919999999991', email='miza@example.com', year=2, branch='Electronics', bio='Bio for Miza.', institute_id=1),
                User(username='faiz', password_hash=hashed_pw, full_name='Mohammed Faiz', phone='+919999999992', email='faiz@example.com', year=3, branch='Computer Science', bio='Bio for Faiz.', institute_id=1),
                User(username='nandana', password_hash=hashed_pw, full_name='Nandana Mukund', phone='+919999999993', email='nandana@example.com', year=1, branch='Mechanical', bio='Bio for Nandana.', institute_id=1)
            ]
            db.session.add_all(users_to_add)
            db.session.commit()

            # Add skills to lakshmi
            user_lakshmi = User.query.filter_by(username='lakshmi').first()
            skill_python = Skill.query.filter_by(name='Python').first()
            skill_html = Skill.query.filter_by(name='HTML').first()
            if user_lakshmi and skill_python:
                db.session.add(UserSkill(user_id=user_lakshmi.id, skill_id=skill_python.id, rating=4))
            if user_lakshmi and skill_html:
                db.session.add(UserSkill(user_id=user_lakshmi.id, skill_id=skill_html.id, rating=3))

            db.session.commit()

        print("Database is ready!")


# --- RUN THE APP ---
if __name__ == '__main__':
    setup_database(app)
    app.run(debug=True, port=5000)