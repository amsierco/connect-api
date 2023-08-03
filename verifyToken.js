const jwt = require('jsonwebtoken');

// Verify Token middleware function
const verifyToken = (req, res, next) => {

  console.log(req.headers);

  // Get auth header value
  const bearerHeader = req.headers['authorization'];
  // console.log(bearerHeader);
  // Check if bearer is undefined
  if(typeof bearerHeader !== 'undefined') {
    console.log('TOKEN  #1!')
    // Split at the space
    const bearer = bearerHeader.split(' ');

    // Get token from array
    const bearerToken = bearer[1];

    console.log(bearerToken);

    // Set the token in req
    // req.token = bearerToken;
    
    const decoded_user = jwt.verify(bearerToken, process.env.TOKEN_KEY);/*, (err, decoded) => {
      if(err){
        console.log(err);
      }
      console.log(decoded);
    });*/
    
    console.log('a');

    // if(!decoded_user){
    //   // Forbidden
    //   console.log('NO DECODED USER!')
    //   return res.sendStatus(403).json('VerifyToken authentication failed');
    // }

    // console.log('Decoded user: ' + decoded_user);

    // Stores user in req
    req.user = decoded_user['user'];
    console.log('TOKEN VALID #2!')
    // Next middleware
    next();

  } else {

    // Forbidden
    console.log('NO BearerHeader')
    return res.sendStatus(403).json('VerifyToken authentication failed');
  }
}

module.exports = verifyToken;