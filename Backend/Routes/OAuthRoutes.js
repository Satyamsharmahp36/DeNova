const express=require('express');
const router=express.Router();
const axios = require('axios');
const crypto = require('crypto');
const dotenv = require('dotenv');

const verificationSessions = new Map();
const loginSessions = new Map();

const { OAuth2Client } = require('google-auth-library');
const User = require('../Schema/UserSchema');
dotenv.config();

const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );


router.get('/user/verify-email', (req, res) => {
    const sessionId = crypto.randomBytes(16).toString('hex');
    
    // Store session ID for verification callback
    verificationSessions.set(sessionId, { timestamp: Date.now() });
    
    // Generate OAuth URL with state containing session ID
    const state = sessionId;
    const url = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/calendar'],
      prompt: 'consent',
      state
    });
    
    res.redirect(url);
  });
  
  router.get('/user/google/callback', async (req, res) => {
    const { code, state } = req.query;
    
    // Parse state to determine request type
    let stateData;
    try {
      stateData = JSON.parse(state);
    } catch (e) {
      // Old format - treat as email verification
      stateData = { sessionId: state, type: 'verification' };
    }
    
    const { sessionId, type } = stateData;
    
    // Check which session map to use
    const isLogin = type === 'login';
    const sessionMap = isLogin ? loginSessions : verificationSessions;
    
    // Validate state to prevent CSRF
    if (!sessionMap.has(sessionId)) {
      return res.send(`
        <script>
          window.opener.postMessage(${JSON.stringify({
            success: false,
            message: `Invalid ${isLogin ? 'login' : 'verification'} session`
          })}, "*");
          window.close();
        </script>
      `);
    }
    
    try {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
  
      // Get user info from Google
      const { data: googleUser } = await axios.get(
        `https://www.googleapis.com/oauth2/v2/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        }
      );
      
      // Clean up session
      sessionMap.delete(sessionId);
      
      if (isLogin) {
        // Handle login flow
        let user = await User.findOne({ 'google.id': googleUser.id });
        
        if (!user) {
          // Check if user exists with this email
          user = await User.findOne({ email: googleUser.email });
          
          if (user) {
            // Update existing user with Google OAuth data
            user.google = {
              id: googleUser.id,
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              tokenExpiryDate: tokens.expiry_date || (Date.now() + tokens.expires_in * 1000)
            };
            await user.save();
          } else {
            // Create new user with Google OAuth
            const username = googleUser.email.split('@')[0] + '_' + Math.random().toString(36).substring(7);
            user = new User({
              name: googleUser.name || googleUser.email.split('@')[0],
              email: googleUser.email,
              username: username,
              password: crypto.randomBytes(32).toString('hex'), // Random password since they use OAuth
              mobileNo: 'N/A', // Can be updated later
              google: {
                id: googleUser.id,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                tokenExpiryDate: tokens.expiry_date || (Date.now() + tokens.expires_in * 1000)
              }
            });
            await user.save();
          }
        } else {
          // Update tokens for existing Google user
          user.google.accessToken = tokens.access_token;
          if (tokens.refresh_token) {
            user.google.refreshToken = tokens.refresh_token;
          }
          user.google.tokenExpiryDate = tokens.expiry_date || (Date.now() + tokens.expires_in * 1000);
          await user.save();
        }
        
        // Send user data back to client
        return res.send(`
          <script>
            window.opener.postMessage(${JSON.stringify({
              success: true,
              userData: {
                username: user.username,
                name: user.name,
                email: user.email,
                plan: user.plan
              },
              message: 'Login successful'
            })}, "*");
            window.close();
          </script>
        `);
      } else {
        // Handle email verification flow (original behavior)
        return res.send(`
          <script>
            window.opener.postMessage(${JSON.stringify({
              success: true,
              userData: {
                email: googleUser.email,
                googleId: googleUser.id,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                tokenExpiryDate: tokens.expiry_date || (Date.now() + tokens.expires_in * 1000)
              },
              message: 'Email verification successful'
            })}, "*");
            window.close();
          </script>
        `);
      }
    } catch (error) {
      console.error('Google OAuth Error:', error);
      
      // Clean up session
      const isLogin = stateData.type === 'login';
      const sessionMap = isLogin ? loginSessions : verificationSessions;
      sessionMap.delete(stateData.sessionId);
      
      return res.send(`
        <script>
          window.opener.postMessage(${JSON.stringify({
            success: false,
            message: `${isLogin ? 'Login' : 'Email verification'} failed: ` + error.message
          })}, "*");
          window.close();
        </script>
      `);
    }
  });

// OAuth Login Routes
router.get('/auth/google', (req, res) => {
  const sessionId = crypto.randomBytes(16).toString('hex');
  
  // Store session ID for login callback with a marker
  loginSessions.set(sessionId, { timestamp: Date.now(), type: 'login' });
  
  // Generate OAuth URL with state containing session ID
  const state = JSON.stringify({ sessionId, type: 'login' });
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/calendar'],
    prompt: 'consent',
    state
  });
  
  res.redirect(url);
});

  module.exports=router;