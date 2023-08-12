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

    // Verify access token
    jwt.verify(bearerToken, process.env.TOKEN_KEY, (err, decoded) => {
      if(err){
        //Check refresh token
        const refreshToken = req.headers['refresh_token'];

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY, (err, decoded) => {
          if(err){
            res.sendStatus(403);
          } else {

            // Refresh new token
            const new_token = jwt.sign({user: decoded['user']}, process.env.TOKEN_KEY, { expiresIn: process.env.TOKEN_KEY_EXPIRE});
          
            // const user = decoded['userId'];
            // Removes password field
            // delete user.password;
            req.userId = decoded['userId'];
            req.token = new_token;
            next();
          }
        });

      } else {
        // const user = decoded['user'];
        // Removes password field
        // delete user.password;
        // req.user = user;
        req.userId = decoded['userId'];
        req.token = bearerToken;
        next();
      }
    });
    
  } else {
    res.sendStatus(403);
  }
}

module.exports = verifyToken;