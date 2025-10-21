const requireSession = (req, res, next) => {
    if (req.session?.userId) return next();
    return res.status(401).json({ message: 'Login required (session)' });
  };
  
  module.exports = requireSession;
  