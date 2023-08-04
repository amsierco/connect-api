const jwt = require('jsonwebtoken');

// Verify Token middleware function
const verifyToken = (req, res, next) => {

  // Get auth header value
  const bearerHeader = req.headers['authorization'].split(',')[0];

  // Check if bearer is undefined
  if(typeof bearerHeader !== 'undefined') {

    // Split at the space
    const bearer = bearerHeader.split(' ');

    // Get token from array
    const bearerToken = bearer[1];

    // Verify token
    jwt.verify(bearerToken, process.env.TOKEN_KEY, (err, decoded) => {
      if(err){
        //Check refresh token
        const refreshHeader = req.headers['authorization'].split(',')[1];
        // Get token from array
        const refreshToken = refreshHeader.split(' ')[1];
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY, (err, decoded) => {
          if(err){
            res.sendStatus(403);
          } else {

            // Refresh new token
            const new_token = jwt.sign({user: decoded['user']}, process.env.TOKEN_KEY, { expiresIn: process.env.TOKEN_KEY_EXPIRE});
          
            req.user = decoded['user'];
            req.token = new_token;
            next();
          }
        });

      } else {
        req.user = decoded['user'];
        req.token = bearerToken;
        next();
      }
    });
    
  } else {
    res.sendStatus(403);
  }
}

module.exports = verifyToken;