const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String },
    email: { type: String, required: true },
    picture: { type: String },
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    notifications: [{
        notification_type: { type: String },
        sender: { type: Schema.Types.ObjectId, ref: "User" }
    }],
    description: { type: String }
});
  
// Export model
module.exports = mongoose.model("User", UserSchema);