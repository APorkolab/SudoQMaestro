import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import connectDB from './config/database.js';
import './config/passport-setup.js'; // This executes the passport config
import sudokuRoutes from './api/sudoku.routes.js';
import authRoutes from './api/auth.routes.js';
import adminRoutesFactory from './api/admin.routes.js';
import puzzleRoutesFactory from './api/puzzle.routes.js';
import User from './models/user.model.js';
import Puzzle from './models/puzzle.model.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_session_secret', // Should be a strong secret in env vars
    resave: false,
    saveUninitialized: false,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(cors());
app.use(express.json());

// API Routes
const adminRoutes = adminRoutesFactory(User, Puzzle);
app.use('/api/auth', authRoutes);
app.use('/api/sudoku', sudokuRoutes);
app.use('/api/admin', adminRoutes);

const puzzleRoutes = puzzleRoutesFactory(Puzzle);
app.use('/api/puzzles', puzzleRoutes);

// Basic Route for checking if the server is running
app.get('/', (req, res) => {
  res.send('SudoQMaestro Backend is running!');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
