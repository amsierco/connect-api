const jwt = require('jsonwebtoken');

// Verify Token middleware function
const verifyToken = (req, res, next) => {

  // Get auth header value
  const bearerHeader = req.headers['authorization'];

  // Check if bearer is undefined
  if(typeof bearerHeader !== 'undefined') {

    // Split at the space
    const bearer = bearerHeader.split(' ');

    // Get token from array
    const bearerToken = bearer[1];

    // Set the token in req
    req.token = bearerToken;
    
    const decoded_user = jwt.verify(bearerToken, process.env.TOKEN_KEY);

    // Format {user, iat, exp}
    // Stores user in req
    req.user = decoded_user['user'];

    // Next middleware
    next();

  } else {
    
    // Forbidden
    res.sendStatus(403);
  }
}

module.exports = verifyToken;