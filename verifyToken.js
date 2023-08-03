const jwt = require('jsonwebtoken');

// Verify Token middleware function
const verifyToken = (req, res, next) => {
  // console.log(req.headers);

  console.log('verifyToken Called')

  // Get auth header value
  const bearerHeader = req.headers['authorization'];

  // Check if bearer is undefined
  if(typeof bearerHeader !== 'undefined') {

    // Split at the space
    const bearer = bearerHeader.split(' ');

    // Get token from array
    const bearerToken = bearer[1];

    // Verify token
    jwt.verify(bearerToken, process.env.TOKEN_KEY, (err, decoded) => {
      if(err){
        /*//Check refresh token
        Somehow get said refresh token
        jwt.verify(bearerToken, process.env.REFRESH_TOKEN_KEY, (err, decoded) => {
          if(err){
          }

          // Stores user in req
          req.user = decoded['user'];

          // Refresh new token
          const new_token = jwt.sign({user: decoded['user']}, process.env.TOKEN_KEY, { expiresIn: process.env.TOKEN_KEY_EXPIRE});
        
          // Stores new token in req
          req.token = new_token;

          next();
        });*/

        return res.sendStatus(403);
        
      } else {
        req.user = decoded['user'];
        req.token = bearerToken;
        next();
      }
    });
    
  } else {
    return res.sendStatus(403);
  }
}

module.exports = verifyToken;