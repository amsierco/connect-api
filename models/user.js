const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: false },
    email: { type: String, required: true },
    picture: { type: String, required: false },
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }]
});
  
// Export model
module.exports = mongoose.model("User", UserSchema);