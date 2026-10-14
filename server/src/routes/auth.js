import { Router } from 'express';
import { getStore } from '../store/index.js';
import { signToken, asyncHandler, requireAuth } from '../auth.js';
import { HttpError } from '../rbac.js';

export const authRouter = Router();

authRouter.get('/me', requireAuth, (req, res) => res.json(req.user));

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) throw new HttpError(400, 'Correo y contraseña son obligatorios', 'validation');
    const store = getStore();
    const user = await store.findUserByEmail(email);
    if (!user || !(await store.verifyPassword(user, password))) {
      throw new HttpError(401, 'Credenciales incorrectas', 'invalid_credentials');
    }
    const { passwordHash, ...publicUser } = user;
    res.json({ token: signToken(publicUser), user: publicUser });
  }),
);
