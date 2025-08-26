import express from 'express';
import passport from 'passport';

const router = express.Router();

// @route   GET /api/auth/google
// @desc    Authenticate with Google
// @access  Public
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// @route   GET /api/auth/google/callback
// @desc    Callback for Google to redirect to
// @access  Public
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login-failed' }), (req, res) => {
  // Successful authentication, redirect to a success page on the frontend.
  // In a real app, you might redirect to a dashboard or profile page.
  res.redirect('/?login=success');
});

// @route   GET /api/auth/logout
// @desc    Logout user
// @access  Private
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    // Successful logout, redirect to homepage.
    res.redirect('/');
  });
});

// @route   GET /api/auth/current-user
// @desc    Return current user data
// @access  Private
router.get('/current-user', (req, res) => {
  if (req.user) {
    res.send(req.user);
  } else {
    res.status(401).send({ msg: 'Not authenticated' });
  }
});

export default router;
