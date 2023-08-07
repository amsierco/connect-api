const express = require('express');
const router = express.Router();
const { body, validationResult } = require("express-validator");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const verifyToken = require('../verifyToken');
const passport = require('passport');

// Google auth
const { OAuth2Client } = require('google-auth-library')
// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage',
  );

// Schema
const User = require('../models/user');

// External login/signup check
async function findOrCreateAccount(user){
    const existing_account = await User.findOne({ email: user.email });
    console.log('existing? '+existing_account);
    // Account exists
    if(existing_account){
        console.log('Existing account');
        return existing_account;
    
    // Create new account
    } else {
        // Create a new database entry
        const new_account = new User({
            username: user.username,
            email: user.email,
            picture: user.picture
        });

        // Save to databse
        await new_account.save();
        console.log('New account Created - Google');
        return new_account;
    }
}

// GET Validate jwt token
router.get('/validate', 
    verifyToken,
    (req, res) => {
        const user = {
            _id: req.user._id,
            username: req.user.username,
            picture: req.user.picture
        };
        res.status(200).json({ access_token: req.token, user: user });
    }
);

// POST Login
router.post('/login', 
    // Form sanitation
    body('username_email').isLength(1).withMessage('Required field').escape(),
    body('password').isLength(1).withMessage('Required field').escape(),
    async(req, res, next) => {
        const errors = validationResult(req);
        // Catch validation errors
        if(!errors.isEmpty()) {
            console.log('Validation Error: ' + errors);
            res.status(500);
        }

        // Validate login info
        try {
            // Users can login in with either username OR email
            const username = await User.findOne({ username: req.body.username_email });
            const email = await User.findOne({ email: req.body.username_email });
            const user = (username !== null) ? username : email;
            if(!user) {
                console.log('User not found');
                res.status(404).json('User not found');
            }

            // Validate password
            bcrypt.compare(req.body.password, user.password, (err, resp) => {
                // Valid password
                if (resp) {
                    // Access token
                    const access_token = jwt.sign({user: user}, process.env.TOKEN_KEY, { expiresIn: process.env.TOKEN_KEY_EXPIRE });
                    // Refresh token
                    const refresh_token = jwt.sign({user: user}, process.env.REFRESH_TOKEN_KEY, { expiresIn: process.env.REFRESH_TOKEN_KEY_EXPIRE });

                    res.status(201).json({
                        access_token: access_token,
                        refresh_token: refresh_token
                    });

                } else {
                    // Invalid password
                    console.log('Incorrect password');
                    res.status(403).json('Incorrect password')
                }
              });

        } catch(err) {
            console.log('Error: '+err);
            return next(err);
        }
    }
);

// POST Signup
router.post('/signup', 
    // Form sanitation
    body('email').isLength(1).withMessage('Required field').escape(),
    body('username').isLength(1).withMessage('Required field').escape(),
    body('password').isLength(1).withMessage('Required field').escape(),
    async(req, res, next) => {
        const errors = validationResult(req);
        // Catch validation errors
        if(!errors.isEmpty()) {
            res.status(500);
        }
        // Add new user to databse
        try {
            // Check for existing email conflicts
            const email = await User.findOne({ email: req.body.username_email });
            if(email !== null) {
                res.status(403).json('Select email already has an account associated with it');
            }

            // Hash the valid password
            bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
                if(err){ throw err; }

                // Create a new database entry
                const user = new User({
                    username: req.body.username,
                    email: req.body.email,
                    password: hashedPassword,
                });

                // Save to databse
                await user.save();

                // Save auth token
                const access_token = jwt.sign({user}, process.env.TOKEN_KEY, { expiresIn: process.env.TOKEN_KEY_EXPIRE });
                // Save refresh token
                const refresh_token = jwt.sign({user: user}, process.env.REFRESH_TOKEN_KEY, { expiresIn: process.env.REFRESH_TOKEN_KEY_EXPIRE });
                res.status(201).json({access_token, refresh_token});
            });

        } catch(err) {
            return next(err);
        }
    }
);

// POST Google Login
router.post('/google',

    async(req, res) => {
        // exchange code for tokens
        const { tokens } = await oAuth2Client.getToken(req.body.code); 
        console.log(tokens);

        const ticket = await oAuth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const { name, email, picture } = ticket.getPayload(); 
        const user = {
            username: name,
            email: email,
            picture: picture,
        }   
        console.log(user);
        const new_account = await findOrCreateAccount(user);

        // Access token
        const access_token = jwt.sign({user: new_account}, process.env.TOKEN_KEY, { expiresIn: process.env.TOKEN_KEY_EXPIRE });
        // Refresh token
        const refresh_token = jwt.sign({user: new_account}, process.env.REFRESH_TOKEN_KEY, { expiresIn: process.env.REFRESH_TOKEN_KEY_EXPIRE });

        console.log('Google Auth Process Completed!');

        res.status(201).json({
            access_token: access_token,
            refresh_token: refresh_token
        });

        // res.status(201).json(user);
    }


    // passport.authenticate("google", {
    //     scope: ["profile", "email"],
    // })
);

// GET Google login callback
router.get("/google/callback",
    passport.authenticate("google", { session: false }),
    async function(req, res){
        const google_user = {
            username: req.user.displayName,
            email: req.user._json.email,
            picture: req.user._json.picture,
            provider: req.user.provider
        };

        try {
            const user = await findOrCreateAccount(google_user);
            // Save current user in token
            jwt.sign({user: user}, process.env.TOKEN_KEY, { expiresIn: process.env.TOKEN_KEY_EXPIRE }, (err, token) => {
                res.token = token;
                res.status(201).json({token});
            });

        } catch (err) {
            res.status(500).json(err);
        }
    }
);

module.exports = router;