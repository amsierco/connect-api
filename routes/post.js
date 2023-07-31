const express = require('express');
const router = express.Router();
const { body, validationResult } = require("express-validator");
const jwt = require('jsonwebtoken');
const verifyToken = require('../verifyToken');

// Schema
const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');



// GET recent and relevant posts
/**
 * IMPLEMENT ORDERING BY DATE AND USERS THAT ARE BEING FOLLOWED
 */
router.get('/', 
    // Get all posts from database
    async(req, res, next) => {
        try{
            const posts = await Post.find({}).exec();
            res.status(200).json(posts);

        } catch (err) {
            return next(err);
        }
    }
);

// GET post by ID
router.get('/:id',
    verifyToken,
    async(req, res, next) => {
        try{
            const post_id = req.params.id;
            const post = await Post.findById(post_id);

            if(null !== post){
                res.status(200).json(post); 
            } else {
                res.status(404).json('Post not found');
            }

        } catch (err) {
            return next(err);
        }
    }
);

// POST create new post
router.post('/create', 
    verifyToken,
    body('message').isLength(1).withMessage('Required field').escape(),
    async(req, res, next) => {
        const errors = validationResult(req);
        // Catch validation errors
        if(!errors.isEmpty()) {
            res.status(500);
        }

        try{
            const post = new Post({
                user_id: req.user,
                message: req.body.message,
            });

            await post.save();
            res.status(200).json(post);

        } catch (err) {
            return next(err);
        }
    }
);

// POST edit post
router.post('/:id/edit',
    verifyToken,
    body('message').isLength(1).withMessage('Required field').escape(),
    async(req, res, next) => {
        const errors = validationResult(req);
        // Catch validation errors
        if(!errors.isEmpty()) {
            res.status(500);
        }

        try{
            const post_id = req.params.id;
            const old_post = await Post.findById(post_id);

            // Check if post exists
            if(null === old_post){
                return res.status(404).json('Post not found');
            }

            // Check is logged in user created original post
            if(req.user._id == old_post.user_id){
                // Find post and update
                const updated_post = await Post.findOneAndUpdate(
                    { _id: post_id },
                    {
                        message: req.body.message,
                        edited: true
                    },
                    { new: true }
                );
                res.status(200).json(updated_post); 

            } else {
                res.status(403).json('Not the author of the post');
            }

        } catch (err) {
            return next(err);
        }
    }
);

// POST delete new post
router.post('/:id/delete',
    verifyToken,
    async(req, res, next) => {
        try{
            const post_id = req.params.id;
            const old_post = await Post.findById(post_id);

            // Check if post exists
            if(null === old_post){
                return res.status(404).json('Post not found');
            }

            // Check is logged in user created original post
            if(req.user._id == old_post.user_id){
                // Delete post
                await Post.deleteOne({ _id: post_id });
                res.status(200).json('Post deleted'); 

            } else {
                res.status(403).json('Not the author of the post');
            }

        } catch (err) {
            return next(err);
        }
}

);

// POST like a post
/**
 * TRY TO ADD UNLIKE FUNCTIONALITY TO SAME HTTP REQUEST
 */
router.post('/like',

);

/**
 * COMMENTS
 */

module.exports = router;