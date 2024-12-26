# backend/routes.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import DatabaseManager
from config import Config
import random
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from datetime import datetime

routes = Blueprint('routes', __name__)
db_manager = DatabaseManager(Config)

@routes.route('/admin/register-users', methods=['POST'])
@jwt_required()  # Only admin can access
def register_users():
    """
    Admin endpoint to register multiple users
    """
    users_data = request.json.get('users', [])
    registered_users = []
    errors = []

    for index, user in enumerate(users_data):
        full_name = user.get('full_name', '').strip()
        email = user.get('email', '').strip()
        
        # Validate data
        if not full_name or not email:
            errors.append(f"Row {index + 1}: Full name and email are required")
            continue
            
        try:
            user_id = db_manager.create_participant_user(full_name, email)
            registered_users.append({
                'id': str(user_id),
                'full_name': full_name,
                'email': email,
                'note': 'Initial password is the email address'
            })
        except Exception as e:
            errors.append(f"Row {index + 1}: {str(e)}")

    if errors:
        return jsonify({
            "error": "Some users could not be registered",
            "details": errors,
            "registered_users": registered_users
        }), 400

    return jsonify({
        "message": "Users registered successfully. Initial password for each user is their email address.", 
        "users": registered_users
    }), 201

@routes.route('/admin/create-pairings', methods=['POST'])
@jwt_required()
def create_pairings():
    """
    Create one-to-one Secret Santa pairings, ensuring no self-assignments
    and each person is both a Santa and a recipient exactly once
    """
    try:
        # First, clear all existing pairings and reset user pairing status
        db_manager.pairings_collection.delete_many({})
        db_manager.users_collection.update_many(
            {'role': 'participant'},
            {'$set': {
                'is_paired': False,
                'paired_with': None
            }}
        )

        # Get all participants after resetting their status
        participants = list(db_manager.users_collection.find({
            'role': 'participant'
        }))

        if len(participants) < 2:
            return jsonify({"error": "Need at least 2 participants to create pairs"}), 400

        # Create a circular pairing to ensure everyone is both a Santa and a recipient
        random.shuffle(participants)
        pairs = []
        
        for i in range(len(participants)):
            santa = participants[i]
            # Last person gives to first person to complete the circle
            recipient = participants[(i + 1) % len(participants)]
            
            pairs.append({
                'santa': santa,
                'recipient': recipient
            })

        # Create the new pairings in the database
        created_pairs = []
        for pair in pairs:
            try:
                pairing = db_manager.create_pairing(
                    pair['santa']['_id'],
                    pair['recipient']['_id']
                )
                created_pairs.append({
                    'santa_name': pair['santa']['full_name'],
                    'recipient_name': pair['recipient']['full_name']
                })
            except Exception as e:
                # If any pairing fails, roll back all pairings
                db_manager.pairings_collection.delete_many({})
                db_manager.users_collection.update_many(
                    {'role': 'participant'},
                    {'$set': {
                        'is_paired': False,
                        'paired_with': None
                    }}
                )
                raise Exception(f"Error creating pairing: {str(e)}")

        return jsonify({
            "message": "Secret Santa pairings created successfully! 🎄",
            "pairs": created_pairs
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@routes.route('/tasks/create', methods=['POST'])
@jwt_required()
def create_task():
    """
    Create a new task
    """
    data = request.json
    try:
        scheduled_date = datetime.strptime(data.get('scheduledDate'), '%Y-%m-%d') if data.get('scheduledDate') else None
        
        task = db_manager.create_task(
            title=data['title'],
            description=data['description'],
            penalty=data.get('penalty', ''),
            assign_to=data.get('assignTo'),
            scheduled_date=scheduled_date
        )

        return jsonify({
            "message": "Task created successfully",
            "task_id": str(task.inserted_id)
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@routes.route('/tasks/user', methods=['GET'])
@jwt_required()
def get_user_tasks():
    """
    Get tasks for the current user
    """
    current_user_id = get_jwt_identity()
    try:
        tasks = db_manager.get_user_tasks(current_user_id)
        return jsonify({
            "tasks": [{
                "id": str(task['_id']),
                "title": task['title'],
                "description": task.get('description', ''),
                "penalty": task.get('penalty', ''),
                "status": task.get('status', 'pending'),
                "completed": task.get('completed', False),
                "scheduled_date": task.get('scheduled_date').strftime('%Y-%m-%d') if task.get('scheduled_date') else None
            } for task in tasks]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@routes.route('/tasks/<task_id>/complete', methods=['POST'])
@jwt_required()
def complete_task(task_id):
    """
    Mark a task as completed
    """
    current_user_id = get_jwt_identity()
    try:
        db_manager.mark_task_completed(task_id, current_user_id)
        return jsonify({"message": "Task marked as completed"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@routes.route('/tasks/all', methods=['GET'])
def get_all_tasks():
    """
    Get all tasks with user names
    """
    try:
        tasks = db_manager.get_all_tasks()
        return jsonify({
            "tasks": [{
                "id": str(task['_id']),
                "title": task['title'],
                "description": task.get('description', ''),
                "penalty": task.get('penalty', ''),
                "status": task.get('status', 'pending'),
                "assigned_to_name": task.get('assigned_to_name'),
                "completed": task.get('completed', False),
                "scheduled_date": task.get('scheduled_date').strftime('%Y-%m-%d') if task.get('scheduled_date') else None
            } for task in tasks]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@routes.route('/user/paired-info', methods=['GET'])
@jwt_required()
def get_paired_info():
    """
    Get user's paired information
    """
    current_user_id = get_jwt_identity()
    user = db_manager.users_collection.find_one({'_id': current_user_id})

    if not user or not user.get('paired_with'):
        return jsonify({"error": "Not paired yet"}), 404

    paired_user = db_manager.users_collection.find_one({'_id': user['paired_with']})

    return jsonify({
        "paired_name": paired_user['full_name'] if paired_user else None
    }), 200

@routes.route('/tasks/<task_id>/assign', methods=['POST'])
@jwt_required()
def assign_task(task_id):
    """
    Assign a task to the current user
    """
    current_user_id = get_jwt_identity()
    
    try:
        db_manager.assign_task(task_id, current_user_id)
        return jsonify({"message": "Task assigned successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@routes.route('/init-admin', methods=['GET'])
def init_admin():
    """
    Initialize admin account if it doesn't exist
    """
    admin = db_manager.users_collection.find_one({'email': Config.ADMIN_EMAIL})
    if not admin:
        admin_data = {
            '_id': str(uuid.uuid4()),
            'full_name': 'Admin',
            'email': Config.ADMIN_EMAIL,
            'password_hash': generate_password_hash(Config.ADMIN_PASSWORD),
            'role': 'admin',
            'created_at': datetime.utcnow()
        }
        db_manager.users_collection.insert_one(admin_data)
        return jsonify({"message": "Admin account created successfully"}), 201
    return jsonify({"message": "Admin account already exists"}), 200

@routes.route('/login', methods=['POST'])
def login():
    """
    Handle user login
    """
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = db_manager.users_collection.find_one({'email': email})

    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not check_password_hash(user['password_hash'], password):
        return jsonify({"error": "Invalid email or password"}), 401

    # Create access token
    access_token = create_access_token(identity=user['_id'])

    return jsonify({
        "access_token": access_token,
        "role": user['role'],
        "user_id": user['_id']
    }), 200

@routes.route('/user/check-password-status', methods=['GET'])
@jwt_required()
def check_password_status():
    """
    Check if user needs to change their password
    """
    current_user_id = get_jwt_identity()
    user = db_manager.get_user_by_id(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({
        "needs_password_change": not user.get('initial_password_set', True)
    }), 200

@routes.route('/user/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    Change user's password
    """
    current_user_id = get_jwt_identity()
    new_password = request.json.get('new_password')
    
    if not new_password:
        return jsonify({"error": "New password is required"}), 400
        
    try:
        db_manager.update_password(current_user_id, new_password)
        return jsonify({"message": "Password updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@routes.route('/admin/clear-data', methods=['POST'])
@jwt_required()
def clear_data():
    """
    Clear all user data except admin
    """
    try:
        # Keep admin account
        admin = db_manager.users_collection.find_one({'role': 'admin'})
        
        # Clear collections
        db_manager.users_collection.delete_many({'role': 'participant'})
        db_manager.tasks_collection.delete_many({})
        db_manager.pairings_collection.delete_many({})
        
        return jsonify({"message": "All data cleared successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@routes.route('/admin/users', methods=['GET'])
@jwt_required()
def get_users():
    """
    Get all users (for admin task assignment)
    """
    try:
        users = list(db_manager.users_collection.find({'role': 'participant'}))
        return jsonify({
            "users": [{
                "_id": user["_id"],
                "full_name": user["full_name"]
            } for user in users]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@routes.route('/admin/pairings', methods=['GET'])
@jwt_required()
def get_all_pairings():
    """
    Get all pairings (for Christmas Day reveal)
    """
    try:
        pairings = list(db_manager.pairings_collection.find())
        formatted_pairings = []
        
        for pair in pairings:
            santa = db_manager.users_collection.find_one({'_id': pair['chris_mom_id']})
            recipient = db_manager.users_collection.find_one({'_id': pair['chris_child_id']})
            
            if santa and recipient:
                formatted_pairings.append({
                    'santa_name': santa['full_name'],
                    'recipient_name': recipient['full_name']
                })
        
        return jsonify({
            "message": "Merry Christmas! Here are all the Secret Santa pairings!",
            "pairings": formatted_pairings
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@routes.route('/pairings/revealed', methods=['GET'])
def check_pairings_revealed():
    """
    Check if pairings have been revealed by admin
    """
    revealed = db_manager.get_reveal_status()
    return jsonify({"revealed": revealed}), 200

@routes.route('/admin/toggle-reveal', methods=['POST'])
@jwt_required()
def toggle_reveal():
    """
    Toggle the reveal status of Secret Santa pairings
    """
    try:
        revealed = db_manager.toggle_reveal_status()
        return jsonify({
            "message": "Reveal status updated",
            "revealed": revealed
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@routes.route('/user/my-santa', methods=['GET'])
@jwt_required()
def get_my_santa():
    """
    Get user's Secret Santa (only if revealed)
    """
    if not db_manager.get_reveal_status():
        return jsonify({"error": "Secret Santa identities haven't been revealed yet!"}), 403

    current_user_id = get_jwt_identity()
    santa = db_manager.get_user_santa(current_user_id)
    
    if santa:
        return jsonify({
            "santa_name": santa['full_name']
        }), 200
    return jsonify({"error": "No Secret Santa found"}), 404