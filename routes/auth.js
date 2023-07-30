const express = require('express');
const router = express.Router();
const { body, validationResult } = require("express-validator");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

// POST Login
router.post('/login', 
    // Form sanitation
    body('username_email').isLength(1).withMessage('Required field').escape(),
    body('password').isLength(1).withMessage('Required field').escape(),
    async(req, res, next) => {
        const errors = validationResult(req);
        // Catch validation errors
        if(!errors.isEmpty()) {
            res.status(500);
        }

        // Validate login info
        try {
            // Users can login in with either username OR email
            const username = await User.findOne({ username: req.body.username_email });
            const email = await User.findOne({ email: req.body.username_email });
            const user = (username !== null) ? username : email;
            if(!user) {
                res.status(404).json('User not found');
            }

            // Validate password
            bcrypt.compare(req.body.password, user.password, (err, res) => {
                if (res) {
                  // Valid password
                  // Save current user in token
                  jwt.sign({user}, process.env.TOKEN_KEY, { expiresIn: process.env.TOKEN_KEY_EXPIRE }, (err, token) => {
                    res.status(200).json(token);
                  });

                } else {
                  // Invalid password
                  res.status(403).json('Incorrect password')
                }
              });

        } catch(err) {
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

                // Save current user in token
                jwt.sign({user}, process.env.TOKEN_KEY, { expiresIn: process.env.TOKEN_KEY_EXPIRE }, (err, token) => {
                    res.status(200).json({
                        token: token,
                        user: user
                    });
                });
            });

        } catch(err) {
            return next(err);
        }
    }
);

module.exports = router;
