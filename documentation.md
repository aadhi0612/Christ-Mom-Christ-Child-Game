# Project Documentation

## Overview
This document provides comprehensive documentation for both the backend (Python) and frontend (React) components of the application.

## Table of Contents
1. [Backend Documentation](#backend-documentation)
2. [Frontend Documentation](#frontend-documentation)

## Backend Documentation

### API Endpoints

#### Authentication and User Management
- POST `/api/register` - Register new users
- POST `/api/login` - User login
- GET `/api/check-password` - Check password status
- POST `/api/change-password` - Change user password
- POST `/api/init-admin` - Initialize admin user
- GET `/api/users` - Get all users (admin only)

#### Secret Santa Functionality
- POST `/api/create-pairings` - Create Secret Santa pairings
- GET `/api/paired-info` - Get paired user information
- GET `/api/pairings` - Get all pairings (admin only)
- GET `/api/my-santa` - Get your Secret Santa
- GET `/api/check-reveal` - Check if pairings are revealed
- POST `/api/toggle-reveal` - Toggle reveal status

#### Task Management
- POST `/api/tasks/create` - Create new task
- GET `/api/tasks` - Get user tasks
- POST `/api/tasks/{task_id}/complete` - Mark task as completed
- GET `/api/tasks/all` - Get all tasks
- POST `/api/tasks/{task_id}/assign` - Assign task to user

### Database Models

The application uses MongoDB through a DatabaseManager class that manages the following collections:

#### Users Collection
- **Fields:**
  - `_id` (UUID): Unique identifier
  - `full_name` (str): User's full name
  - `email` (str): User's email address
  - `password_hash` (str): Hashed password
  - `role` (str): Either 'admin' or 'participant'
  - `created_at` (datetime): Account creation timestamp
  - `is_paired` (bool): Secret Santa pairing status
  - `paired_with` (UUID): Reference to paired user
  - `initial_password_set` (bool): Password change status

#### Pairings Collection
- **Fields:**
  - `_id` (ObjectId): Unique identifier
  - `chris_mom_id` (UUID): Secret Santa ID
  - `chris_child_id` (UUID): Gift recipient ID
  - `created_at` (datetime): Pairing creation timestamp

#### Tasks Collection
- **Fields:**
  - `_id` (ObjectId): Unique identifier
  - `title` (str): Task title
  - `description` (str): Task description
  - `penalty` (str): Penalty for incomplete task
  - `assigned_to` (UUID): Assigned user ID
  - `status` (str): Task status ('pending'/'completed')
  - `completed` (bool): Completion status
  - `scheduled_date` (datetime): Task due date

### Database Methods

#### User Management
- `create_admin_user(full_name, email)`: Create admin user
- `create_participant_user(full_name, email)`: Create regular user
- `verify_user(email, password)`: Authenticate user
- `update_password(user_id, new_password)`: Update user password
- `get_user_by_id(user_id)`: Retrieve user by ID

#### Secret Santa Management
- `create_pairing(santa_id, recipient_id)`: Create Santa pairing
- `get_reveal_status()`: Check pairing reveal status
- `toggle_reveal_status()`: Toggle reveal status
- `get_user_santa(user_id)`: Get user's Secret Santa

#### Task Management
- `create_task(title, description, penalty, assign_to, scheduled_date)`: Create task
- `get_all_tasks()`: Retrieve all tasks
- `assign_task(task_id, user_id)`: Assign task to user
- `get_user_tasks(user_id)`: Get user's tasks
- `mark_task_completed(task_id, user_id)`: Complete task

## Frontend Documentation

### Component Architecture

#### Core Application
The application follows a component-based architecture using React 17+ with functional components and hooks.

#### App Component (`App.js`)
- **Purpose:** Main application container and routing hub
- **Features:**
  - Route management with React Router
  - Authentication state handling with JWT
  - Protected route implementation
  - Global context providers
- **Key Dependencies:**
  - React Router v6
  - JWT for authentication
  - Context API for state management

#### Component Categories
#### Authentication Components
- **LoginForm (`LoginForm.js`)**
  - User credential validation
  - JWT token management
  - Error handling and feedback
  - Initial password change detection

- **ChangePasswordModal (`ChangePasswordModal.js`)**
  - Password update interface
  - Validation rules enforcement
  - Success/error feedback

#### Dashboard Components
- **UserDashboard (`UserDashboard.js`)**
  - Personal task list management
  - Secret Santa pairing information
  - Task completion tracking
  - Real-time status updates

- **AdminDashboard (`AdminDashboard.js`)**
  - User management interface
  - Task creation and assignment
  - Secret Santa pairing generation
  - System monitoring tools

#### Task Management
- **TasksPage (`TasksPage.js`)**
  - Task list display with filters
  - Status update interface
  - Assignment management
  - Progress tracking

#### Interactive Elements
#### Visual Components
- **GiftBox (`GiftBox.jsx`)**
  - Interactive gift animation
  - CSS keyframe animations
  - Hover and click effects
  - Customizable appearance

- **SpinWheel (`SpinWheel.js`)**
  - Randomized selection animation
  - Configurable segments
  - Custom speed controls
  - Winner highlight effects

- **SantaReveal (`SantaReveal.js`)**
  - Animated reveal sequence
  - Sound effect integration
  - Conditional content display
  - Progressive animation states

### Technical Implementation
#### State Management
- JWT-based authentication flow
- Context API for global state
- Component-level state with hooks
- Optimized re-rendering

#### Styling Architecture
- Tailwind CSS framework
- Custom animations and transitions
- Responsive design patterns
- Holiday-themed components

#### Security Implementation
- Protected route guards
- Token-based authentication
- XSS prevention measures
- CSRF protection

#### Performance Features
- Component code splitting
- Dynamic imports
- Image optimization
- Cache management

#### Error Handling
- Global error boundary
- Form validation
- API error handling
- User feedback system


