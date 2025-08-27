# SudoQMaestro
A bold and intelligent Sudoku application. Solve or generate puzzles with ease using advanced image processing and custom algorithms. Built with Angular, Express.js, and MongoDB, it is designed for both enthusiasts and casual players to master Sudoku.

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

## Administrator Tools

### Granting Admin Rights

A command-line script is included to assign admin privileges to a user (the user must already exist in the database).

**Usage**:

From the `backend` directory, run:

```bash
node scripts/assign-admin.js <user-email>
```

This script searches for the user based on their email address and sets the `role` field to `'admin'`.
