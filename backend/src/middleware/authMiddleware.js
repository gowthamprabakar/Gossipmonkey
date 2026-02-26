import { authFromHeader } from '../services/authService.js';

export const requireAuth = (req, res, next) => {
  const persona = authFromHeader(req.headers.authorization || '');
  if (!persona) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  req.persona = persona;
  next();
};
