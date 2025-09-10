import express from 'express';
import passport from 'passport';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and session management
 */

/**
 * @swagger
 * components:
 *   responses:
 *     AuthRedirect:
 *       description: Redirect response for OAuth flow
 *       headers:
 *         Location:
 *           schema:
 *             type: string
 *             example: /api/auth/google/callback
 *     AuthSuccess:
 *       description: Successful authentication response
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/Success'
 *               - type: object
 *                 properties:
 *                   data:
 *                     $ref: '#/components/schemas/User'
 *     Unauthorized:
 *       description: Authentication required
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/Error'
 *               - type: object
 *                 properties:
 *                   error:
 *                     example: "Not authenticated"
 */

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth authentication
 *     description: Redirects user to Google OAuth consent screen for authentication
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         $ref: '#/components/responses/AuthRedirect'
 *         description: Redirects to Google OAuth consent screen
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *         description: Internal server error during OAuth initiation
 */
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: Handles the callback from Google after user authentication
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter for security
 *     responses:
 *       302:
 *         description: Redirects to frontend with login success
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *               example: /?login=success
 *       302:
 *         description: Redirects to login failed page on error
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *               example: /login-failed
 */
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login-failed' }), (req, res) => {
  // Successful authentication, redirect to a success page on the frontend.
  // In a real app, you might redirect to a dashboard or profile page.
  res.redirect('/?login=success');
});

/**
 * @swagger
 * /api/auth/logout:
 *   get:
 *     summary: Logout current user
 *     description: Logs out the currently authenticated user and destroys their session
 *     tags: [Authentication]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       302:
 *         description: Redirects to homepage after logout
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *               example: /
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    // Successful logout, redirect to homepage.
    res.redirect('/');
  });
});

/**
 * @swagger
 * /api/auth/current-user:
 *   get:
 *     summary: Get current user information
 *     description: Returns the currently authenticated user's information
 *     tags: [Authentication]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *         description: User not authenticated
 */
router.get('/current-user', (req, res) => {
  if (req.user) {
    res.send(req.user);
  } else {
    res.status(401).send({ msg: 'Not authenticated' });
  }
});

export default router;
