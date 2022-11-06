import express, { NextFunction, Request, Response } from 'express';

import { addProps, getProps } from '../lib/methods';

type User = {
  id: number;
  name: string;
};
type Role = 'guest' | 'user' | 'admin';

namespace Middlewares {
  export type AuthenticateUser = {
    user: User;
  };
  export type AttachRole = {
    role: Role;
  };
}

const getCurrentUser = (cookie: string): User => {
  // some logic to get the user based on cookie
  const user = {
    name: 'Dummy',
    id: 12,
  };
  return user;
};

const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    const cookie = req.headers.cookie ?? '';
    const user = getCurrentUser(cookie);
    const props: Middlewares.AuthenticateUser = { user };
    addProps(req, props, 'authenticateUser');
    next();
  } catch (err) {
    next(err);
  }
};

const getRole = (user: User): Role => {
  return 'admin';
};

const attachRole = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = getProps<Middlewares.AuthenticateUser>(
      req,
      'authenticateUser'
    );
    addProps<Middlewares.AttachRole>(
      req,
      {
        role: getRole(user),
      },
      'attachRole'
    );
    next();
  } catch (err) {
    next(err);
  }
};

const app = express();
app.use(express.json());
app.get('/', authenticateUser, attachRole, (req, res, next) => {
  try {
    const { user } = getProps<Middlewares.AuthenticateUser>(
      req,
      'authenticateUser'
    );
    const { role } = getProps<Middlewares.AttachRole>(req, 'attachRole');
    res.json({ user, role });
  } catch (err) {
    next(err);
  }
});

const PORT = 8000;

app.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
});
