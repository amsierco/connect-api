const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: "User" },
    message: { type: String, max: 500 },
    likes: { type: Number, default: 0 },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    date: { type: Date, default: Date.now }
});
  
// Export model
module.exports = mongoose.model("Post", PostSchema);