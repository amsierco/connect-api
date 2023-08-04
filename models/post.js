const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: "User" },
    message: { type: String, max: 500 },
    likes: { 
        count: { type: Number, default: 0 },
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }], 
    },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    date: { type: Date, default: Date.now },
    edited: { type: Boolean, default: false }
});
  
// Export model
module.exports = mongoose.model("Post", PostSchema);