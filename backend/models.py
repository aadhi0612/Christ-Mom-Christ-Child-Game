# backend/models.py

from pymongo import MongoClient
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import uuid

class DatabaseManager:
    def __init__(self, config):
        self.client = MongoClient(config.MONGODB_URI)
        self.db = self.client[config.DATABASE_NAME]
        
        # Collections
        self.users_collection = self.db['users']
        self.tasks_collection = self.db['tasks']
        self.pairings_collection = self.db['pairings']
        
        # Create indexes
        self.users_collection.create_index('email', unique=True)
        self.tasks_collection.create_index('assigned_to')

    def create_admin_user(self, full_name, email):
        """
        Create admin user with a generated secure password
        """
        # Generate a secure random password
        import secrets
        password = secrets.token_urlsafe(12)
        
        user_data = {
            '_id': str(uuid.uuid4()),
            'full_name': full_name,
            'email': email,
            'password_hash': generate_password_hash(password),
            'role': 'admin',
            'created_at': datetime.utcnow(),
            'initial_password_set': False
        }
        
        user_id = self.users_collection.insert_one(user_data).inserted_id
        return user_id, password

    def create_participant_user(self, full_name, email):
        """
        Create participant user with email as initial password
        """
        user_data = {
            '_id': str(uuid.uuid4()),
            'full_name': full_name,
            'email': email,
            'password_hash': generate_password_hash(email),  # Using email as initial password
            'role': 'participant',
            'is_paired': False,
            'paired_with': None,
            'created_at': datetime.utcnow(),
            'initial_password_set': False
        }
        
        user_id = self.users_collection.insert_one(user_data).inserted_id
        return user_id

    def verify_user(self, email, password):
        """
        Verify user credentials
        """
        user = self.users_collection.find_one({'email': email})
        if user and check_password_hash(user['password_hash'], password):
            return user
        return None

    def create_pairing(self, santa_id, recipient_id):
        """
        Create a one-to-one Secret Santa pairing
        """
        if santa_id == recipient_id:
            raise Exception("Cannot pair user with themselves")

        pairing_data = {
            '_id': str(uuid.uuid4()),
            'chris_mom_id': santa_id,
            'chris_child_id': recipient_id,
            'created_at': datetime.utcnow()
        }
        
        # Mark both users as paired
        self.users_collection.update_one(
            {'_id': santa_id},
            {'$set': {
                'is_paired': True,
                'paired_with': recipient_id
            }}
        )
        
        self.users_collection.update_one(
            {'_id': recipient_id},
            {'$set': {
                'is_paired': True,
                'paired_with': santa_id
            }}
        )
        
        return self.pairings_collection.insert_one(pairing_data)

    def create_task(self, title, description, penalty='', assign_to=None, scheduled_date=None):
        """
        Create a new task with scheduled date
        """
        assigned_user = self.users_collection.find_one({'_id': assign_to}) if assign_to else None
        
        task_data = {
            '_id': str(uuid.uuid4()),
            'title': title,
            'description': description,
            'penalty': penalty,  # Renamed from Holiday Forfeit
            'assigned_to': assign_to,
            'assigned_to_name': assigned_user['full_name'] if assigned_user else None,
            'status': 'pending',
            'scheduled_date': scheduled_date or datetime.utcnow(),
            'completed': False,
            'completed_at': None,
            'created_at': datetime.utcnow()
        }
        
        return self.tasks_collection.insert_one(task_data)

    def get_all_tasks(self):
        """
        Retrieve all tasks
        """
        return list(self.tasks_collection.find())

    def assign_task(self, task_id, user_id):
        """
        Assign a task to a user
        """
        return self.tasks_collection.update_one(
            {'_id': task_id},
            {'$set': {
                'assigned_to': user_id, 
                'status': 'in-progress',
                'assigned_at': datetime.utcnow()
            }}
        )

    def update_password(self, user_id, new_password):
        """
        Update user's password and mark initial password as set
        """
        return self.users_collection.update_one(
            {'_id': user_id},
            {
                '$set': {
                    'password_hash': generate_password_hash(new_password),
                    'initial_password_set': True
                }
            }
        )

    def get_user_by_id(self, user_id):
        """
        Get user by ID
        """
        return self.users_collection.find_one({'_id': user_id})

    def get_reveal_status(self):
        """
        Check if Secret Santa identities have been revealed
        """
        settings = self.db.settings.find_one({"_id": "reveal_status"})
        return settings.get("revealed", False) if settings else False

    def toggle_reveal_status(self):
        """
        Toggle the reveal status
        """
        current_status = self.get_reveal_status()
        new_status = not current_status
        self.db.settings.update_one(
            {"_id": "reveal_status"},
            {"$set": {"revealed": new_status}},
            upsert=True
        )
        return new_status

    def get_user_santa(self, user_id):
        """
        Get the Secret Santa for a user
        """
        pairing = self.pairings_collection.find_one({"chris_child_id": user_id})
        if pairing:
            return self.users_collection.find_one({"_id": pairing["chris_mom_id"]})
        return None

    def get_user_tasks(self, user_id):
        """
        Get tasks for a specific user
        """
        return list(self.tasks_collection.find({
            'assigned_to': user_id,
            'scheduled_date': {'$lte': datetime.utcnow()}
        }).sort('scheduled_date', -1))

    def mark_task_completed(self, task_id, user_id):
        """
        Mark a task as completed
        """
        return self.tasks_collection.update_one(
            {'_id': task_id, 'assigned_to': user_id},
            {'$set': {
                'completed': True,
                'completed_at': datetime.utcnow(),
                'status': 'completed'
            }}
        )