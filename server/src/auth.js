import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { getStore } from './store/index.js';
import { HttpError } from './rbac.js';

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, zone: user.zone, name: user.name }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Token no proporcionado', 'unauthorized');
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await getStore().findUserById(Number(payload.sub));
    if (!user) throw new HttpError(401, 'Usuario inexistente', 'unauthorized');
    const { passwordHash, ...publicUser } = user;
    req.user = publicUser;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      next(new HttpError(401, 'Sesión inválida o expirada', 'unauthorized'));
    } else {
      next(err);
    }
  }
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
