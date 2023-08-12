const express = require('express');
const router = express.Router();
const { body, validationResult } = require("express-validator");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const verifyToken = require('../verifyToken');
const passport = require('passport');

// Google auth
const { OAuth2Client } = require('google-auth-library')

const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage',
  );

// Schema
const User = require('../models/user');

// External login/signup check
async function findOrCreateAccount(user){

    const existingAccount = await User
        .findOne({ email: user.email })
        .populate(
            {
                path: 'notifications',
                populate: {
                    path: 'sender'
                }
            }
        )
        .exec();

    // Account exists
    if(existingAccount){
        return existingAccount._id;
    
    // Create new account
    } else {
        // Create a new database entry
        const newAccount = new User({
            username: user.username,
            email: user.email,
            picture: user.picture
        });

        // Save to databse
        await newAccount.save();
        return newAccount._id;
    }
}

// GET Validate jwt token
router.get('/validate', 
    verifyToken,
    async(req, res, next) => {
        try{
            // Fetch updated notifications
            const response = await User
                .findById(req.userId)
                .populate(
                    {
                        path: 'notifications',
                        populate: {
                            path: 'sender'
                        }
                    }
                )
                .exec();
            const updatedNotifications = response.notifications;

            const user = {
                _id: req.userId,
                username: response.username,
                picture: response.picture,
                notifications: updatedNotifications
            };
            res.status(200).json({ 
                accessToken: req.token, 
                user: user 
            });

        } catch (err) {
            next(err)
        }
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
            return res.status(500).json(errors);
        }

        // Validate login info
        try {
            const user = await User
                .findOne({
                    $or: [
                        {
                            username: req.body.username_email 
                        },
                        {
                            email: req.body.username_email 
                        }
                    ]
                })
                .populate(
                    {
                        path: 'notifications',
                        populate: {
                            path: 'sender'
                        }
                    }
                )
                .exec();

            if(!user) {
                return res.status(403).json('User not found');
            }

            // Validate password
            bcrypt.compare(req.body.password, user.password, (err, resp) => {
                if (resp) {
                    const accessToken = jwt.sign({userId: user._id}, process.env.TOKEN_KEY, { expiresIn: process.env.TOKEN_KEY_EXPIRE });
                    const refreshToken = jwt.sign({userId: user._id}, process.env.REFRESH_TOKEN_KEY, { expiresIn: process.env.REFRESH_TOKEN_KEY_EXPIRE });

                    res.status(201).json({
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                    });

                } else {
                    // Invalid password
                    res.status(403).json(err);
                }
              });

        } catch(err) {
            res.status(403).json(err);
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
            return res.status(500);
        }
        // Add new user to databse
        try {
            // Check for existing email conflicts
            const email = await User.findOne({ email: req.body.email });
            if(email !== null) {
                return res.status(403).json('Select email already has an account associated with it');
            }

            // Check for existing username conflicts
            const username = await User.findOne({ username: req.body.username });
            if(username !== null) {
                return res.status(403).json('Select username already has an account associated with it');
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

                const accessToken = jwt.sign({userId: user._id}, process.env.TOKEN_KEY, { expiresIn: process.env.TOKEN_KEY_EXPIRE });
                const refreshToken = jwt.sign({userId: user._id}, process.env.REFRESH_TOKEN_KEY, { expiresIn: process.env.REFRESH_TOKEN_KEY_EXPIRE });
                
                res.status(201).json({
                    accessToken, 
                    refreshToken
                });
            });

        } catch(err) {
            res.status(500).json('Internal error')
        }
    }
);

// POST Google Login
router.post('/google',
    async(req, res) => {
        // exchange code for tokens
        const { tokens } = await oAuth2Client.getToken(req.body.code); 

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
        const newAccountId = await findOrCreateAccount(user);
        const accessToken = jwt.sign({userId: newAccountId.toString()}, process.env.TOKEN_KEY, { expiresIn: process.env.TOKEN_KEY_EXPIRE });
        const refreshToken = jwt.sign({userId: newAccountId.toString()}, process.env.REFRESH_TOKEN_KEY, { expiresIn: process.env.REFRESH_TOKEN_KEY_EXPIRE });

        res.status(201).json({
            accessToken: accessToken,
            refreshToken: refreshToken
        });
    }

    // passport.authenticate("google", {
    //     scope: ["profile", "email"],
    // })
);

// GET Google login callback
// router.get("/google/callback",
//     passport.authenticate("google", { session: false }),
//     async function(req, res){
//         console.log('GOOGLE CALLBACK CALLED!')
//         const google_user = {
//             username: req.user.displayName,
//             email: req.user._json.email,
//             picture: req.user._json.picture,
//             provider: req.user.provider
//         };

//         try {
//             const user = await findOrCreateAccount(google_user);
//             // Save current user in token
//             jwt.sign({userId: user._id.toString()}, process.env.TOKEN_KEY, { expiresIn: process.env.TOKEN_KEY_EXPIRE }, (err, token) => {
//                 res.token = token;
//                 res.status(201).json({token});
//             });

//         } catch (err) {
//             res.status(500).json(err);
//         }
//     }
// );

module.exports = router;