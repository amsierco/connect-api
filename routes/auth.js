const express = require('express');
const router = express.Router();
const { body, validationResult } = require("express-validator");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const verifyToken = require('../verifyToken');
const passport = require('passport');

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
        });

        // Save to databse
        await new_account.save();
        console.log('New account');
        return new_account;
    }
}

// GET Validate jwt token
router.get('/validate', verifyToken, (req, res) => {
    console.log('/validate ->')
    res.status(200).json('Valid Token')
});

// GET Refresh jwt token
router.get('/refresh',
    verifyToken,
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
            console.log('Val Error: ' + errors);
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
                if (resp) {
                    // Valid password
                    // Save auth token
                    const access_token = jwt.sign({user: user}, 'secretkey', { expiresIn: 60*60 });
                    // Save refresh token
                    const refresh_token = jwt.sign({user: user}, 'eeeeee', { expiresIn: 60*60*60 });

                    // res.json({access_token});
                    console.log(access_token);
                    console.log('LOGIN COMPLETE');
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

// GET Google OAuth screen
router.get('/google',
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })
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

// POST Logout
/**
 * NOT IMPLEMENTED
 */
router.post('/logout', function(req, res){
    res.send('LOGOUT FUNCTIONALITY NOT IMPLEMENTED!')
});

module.exports = router;