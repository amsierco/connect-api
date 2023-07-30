const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    post_id: { type: Schema.Type.ObjectId, ref: "Post" },
    user_id: { type: Schema.Type.ObjectId, ref: "User" },
    message: { type: String, max: 500 },
    likes: { type: Number, default: 0 },
    date: { type: Date, default: Date.now }
});
  
// Export model
module.exports = mongoose.model("Comment", CommentSchema);