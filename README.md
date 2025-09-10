# SudoQMaestro

[![CI/CD Pipeline](https://github.com/yourusername/SudoQMaestro/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/yourusername/SudoQMaestro/actions)
[![codecov](https://codecov.io/gh/yourusername/SudoQMaestro/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/SudoQMaestro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/Angular-20-red.svg)](https://angular.io/)

A modern, intelligent Sudoku application with advanced image processing capabilities. Solve puzzles by uploading images, generate custom puzzles, and enjoy a seamless gaming experience. Built with Angular, Express.js, and MongoDB using modern development practices.

## ✨ Features

- 🔍 **AI-Powered Image Recognition**: Upload Sudoku puzzles from images using advanced OCR
- 🧩 **Intelligent Puzzle Solver**: Automated solving with backtracking algorithms
- 🎲 **Dynamic Puzzle Generation**: Create puzzles with customizable difficulty levels
- 👤 **User Management**: OAuth2 authentication with Google
- 🛡️ **Admin Panel**: Comprehensive user and puzzle management
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🐳 **Production Ready**: Docker containerization and CI/CD pipeline

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher)
- [MongoDB](https://www.mongodb.com/) (v6.0 or higher)
- [Docker](https://www.docker.com/) (optional, for containerized development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/SudoQMaestro.git
   cd SudoQMaestro
   ```

2. **Set up Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Set up Frontend**
   ```bash
   cd frontend
   npm install
   ng serve
   ```

4. **Using Docker (Alternative)**
   ```bash
   docker-compose up --build
   ```

The application will be available at:
- Frontend: http://localhost:4200
- Backend API: http://localhost:5000
- Docker Frontend: http://localhost:8080

### Environment Configuration

Copy `.env.example` to `.env` in the backend directory and configure:

```bash
# Required for OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Required for production
SESSION_SECRET=your-secure-session-secret
JWT_SECRET=your-jwt-secret
MONGODB_URI=mongodb://localhost:27017/sudoqmaestro
```

---

## Application Concept and High-Level Functional Specification

The application is designed around two primary functions.  
The first enables solving Sudoku puzzles by uploading an image or using a mobile camera in real time. The solution is then projected onto the original image, allowing the user to save or display it.  
The second provides Sudoku puzzle generation with varying levels of difficulty. Additionally, the program supports replaying stored puzzles and includes built-in validation and correction tools during puzzle creation.  

The target implementation is a web application built with Angular, JavaScript, Java, and Express.js.

---

## Implementation Plan

### 1. **Feature Set**

#### 1.1. **Sudoku Recognition and Solving**

- **Image Upload / Camera Input**  
  - Upload an image of a Sudoku puzzle or capture one with a camera.  
  - Automatic preprocessing begins immediately after input.  

- **Automatic Image Preprocessing**  
  - **Contrast Enhancement** (OpenCV): Improve grid and number visibility.  
  - **Noise Reduction**: Remove image noise for more accurate OCR results.  
  - **Edge Detection**: Identify the Sudoku grid structure.  

- **Handwritten Sudoku Recognition and Digitalization**  
  - **OCR Processing** (Tesseract.js): Recognize handwritten numbers.  
  - **Puzzle Solving**: Solve the recognized puzzle using algorithms (e.g., backtracking).  

- **Solution Display and Download**  
  - **Overlay on Original Image**: Project solved numbers back onto the input image.  
  - **Web Interface**: Display solution interactively.  
  - **Export Options**: Download as PDF or image.  

#### 1.2. **Sudoku Generation and Validation**

- **Puzzle Generation**  
  - Random puzzle generation across multiple difficulty levels.  

- **Puzzle Storage and Retrieval**  
  - Save puzzles and solutions in MongoDB.  
  - Load previously saved puzzles for replay.  

  **API Endpoints**  
  - `POST /api/puzzles`: Save new puzzle (`puzzleGrid`, `solutionGrid`, `difficulty`).  
  - `GET /api/puzzles`: Retrieve all puzzles saved by the logged-in user.  

- **Validation**  
  - Real-time error checking with visual feedback.  

- **Replay Functionality**  
  - Replay saved puzzles in an interactive interface.  

#### 1.3. **Administration Panel**

- **User Management**  
  - Create, edit, and delete users.  
  - Assign and manage roles (e.g., admin, user).  
  - Track user activity (logins, solved puzzles).  

  **API Endpoints**  
  - `GET /api/admin/users`: List all users.  
  - `PUT /api/admin/users/:id`: Update user role (`admin` or `user`).  
  - `DELETE /api/admin/users/:id`: Remove user.  
  - `GET /api/admin/puzzles`: List all saved puzzles with user details.  
  - `DELETE /api/admin/puzzles/:id`: Delete puzzle by ID.  

- **Puzzle Management**  
  - View, edit, or delete saved puzzles.  
  - Assign puzzles to specific users.  

#### 1.4. **OAuth2 Authentication**

- **Login & Registration**  
  - External provider authentication via OAuth2 (Google, Facebook).  
  - Secure token-based session handling.  

---

### 2. **UI/UX Design**

- **Home Page**: Simple navigation with responsive design.  
- **Upload/Camera Interface**: User-friendly input with clear processing indicators.  
- **Solution Display**: Interactive Sudoku grid with export options.  
- **Puzzle Creation/Replay**: Editable grid with real-time validation.  
- **Administration Panel**: User and puzzle lists with management controls.  
- **OAuth2 Login**: Streamlined, secure external login support.  

---

### 3. **Prototype Development**

- **Frontend**: Angular with interactive Sudoku grid components.  
- **Backend**: Express.js APIs handling image processing, OCR, puzzle solving, and admin features.  
- **Database**: MongoDB schemas for users, puzzles, and roles.  
- **Image Processing**: Tesseract.js integration.  
- **OAuth2 Integration**: Secure login via Passport.js with JWT tokens.  

---

### 4. **Iteration Roadmap**

1. **Iteration 1**: Core puzzle recognition, OCR, basic admin, OAuth2 login.  
2. **Iteration 2**: Interactive web-based solution, role-based access, puzzle assignment.  
3. **Iteration 3**: Security hardening, token handling, UX refinements.  

---

### 5. **Technical Details**

- **Tesseract.js**: OCR for digit recognition.  
- **Angular Components**: Dynamic Sudoku grid, validation feedback.  
- **jsPDF / HTML-to-image**: Export puzzles/solutions.  
- **Express.js + MongoDB**: REST APIs, schemas for persistent storage.  
- **Passport.js + JWT**: OAuth2 token-based authentication.  

---

## 🛠️ Development

### Project Structure

```
SudoQMaestro/
├── frontend/          # Angular application
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── backend/           # Express.js API server
│   ├── api/
│   ├── models/
│   ├── config/
│   ├── Dockerfile
│   └── package.json
├── .github/           # CI/CD workflows
├── docker-compose.yml
└── README.md
```

### Available Scripts

#### Backend
```bash
npm start            # Start production server
npm run dev          # Start development server with hot reload
npm test             # Run test suite
npm run test:watch   # Run tests in watch mode
npm run test:coverage# Generate coverage report
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run seed         # Seed the database with development data
npm run migrate:up    # Apply pending database migrations
npm run migrate:down  # Rollback last migration
npm run migrate:status # Check migration status
```

#### Frontend
```bash
ng serve             # Start development server
ng build             # Build for development
ng build:prod        # Build for production
ng test              # Run unit tests
ng test:ci           # Run tests in CI mode
npm run test:single  # Run a single test file via --include
ng lint              # Run linting
```

### Testing

The project uses comprehensive testing strategies:

- **Backend**: Jest with supertest for API testing
- **Frontend**: Jasmine and Karma for unit testing
- **Coverage**: Minimum 70% coverage required
- **CI Integration**: Automated testing on push/PR

```bash
# Run all tests
npm run test

# Generate coverage reports
npm run test:coverage
```

### Code Quality

Code quality is maintained through:

- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **TypeScript**: Type safety (frontend)
- **lint-staged**: Staged file linting

### Docker Development

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 API Documentation

### Authentication Endpoints

#### Google OAuth
```http
GET /api/auth/google          # Initiate Google OAuth
GET /api/auth/google/callback # OAuth callback
POST /api/auth/logout         # Logout user
```

### Sudoku Endpoints

#### Image Processing
```http
POST /api/sudoku/upload
Content-Type: multipart/form-data

# Upload image file for OCR processing
```

#### Puzzle Operations
```http
GET /api/puzzles              # Get user's puzzles
POST /api/puzzles             # Save new puzzle
DELETE /api/puzzles/:id       # Delete puzzle
```

### Admin Endpoints (Requires Admin Role)

#### User Management
```http
GET /api/admin/users          # List all users
PUT /api/admin/users/:id      # Update user role
DELETE /api/admin/users/:id   # Delete user
```

#### Puzzle Management
```http
GET /api/admin/puzzles        # List all puzzles
DELETE /api/admin/puzzles/:id # Delete puzzle
```

### Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 🔧 Administrator Tools

### Granting Admin Rights

A command-line script is included to assign admin privileges to a user (the user must already exist in the database).

**Usage**:

From the `backend` directory, run:

```bash
node scripts/assign-admin.js <user-email>
```

This script searches for the user based on their email address and sets the `role` field to `'admin'`.

## 🚀 Deployment

### GitHub Pages (Frontend Only)

The frontend is automatically deployed to GitHub Pages on pushes to the `main` branch.

### Docker Production Deployment

1. **Build production images**:
   ```bash
   docker build -t sudoqmaestro-backend:latest ./backend
   docker build -t sudoqmaestro-frontend:latest ./frontend
   ```

2. **Run with production configuration**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Environment Variables for Production

Ensure these are set in your production environment:

- `MONGODB_URI`: Production MongoDB connection string
- `SESSION_SECRET`: Strong session secret
- `JWT_SECRET`: JWT signing secret
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

## 🐛 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages
- Ensure CI passes before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tesseract.js](https://tesseract.projectnaptha.com/) for OCR capabilities
- [Angular](https://angular.io/) for the frontend framework
- [Express.js](https://expressjs.com/) for the backend framework
- [MongoDB](https://www.mongodb.com/) for data persistence

## 📞 Support

If you encounter any issues or have questions, please:

1. Check the [Issues](https://github.com/yourusername/SudoQMaestro/issues) page
2. Create a new issue if your problem isn't listed
3. Provide detailed reproduction steps and error messages
