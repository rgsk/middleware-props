# middleware-props

elegant way to consume middleware props in your routes

## Problem

usually for express applications we attach some properties to req in middleware like `req.user = user`

```typescript
// below middleware attaches user property to req
const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    const cookie = req.headers.cookie ?? '';
    const user = getCurrentUser(cookie);
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// in subsequent middlewares and routes we can use req.user
app.get('/', authenticateUser, (req, res, next) => {
  try {
    const user = req.user;
    res.json(user);
  } catch (err) {
    next(err);
  }
});
```

### but above method becomes complicated once we start having middleware chain and it becomes hard to track which middleware attached which properties

this package solves this problem

## Usage

### addProps and getProps methods

#### basic

```typescript
import express, { NextFunction, Request, Response } from 'express';

import { addProps, getProps } from '../lib/methods';

namespace Middlewares {
  export type AuthenticateUser = {
    user: User;
  };
}

type User = {
  id: number;
  name: string;
};

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

const app = express();
app.use(express.json());
app.get('/', authenticateUser, (req, res, next) => {
  try {
    const { user } = getProps<Middlewares.AuthenticateUser>(
      req,
      'authenticateUser'
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
});

const PORT = 8000;

app.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
});
```

#### using multiple middlewares

```typescript
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

/**
 *
 * dependencies: authenticateUser
 */
const attachRole = (req: Request, res: Response, next: NextFunction) => {
  try {
    // since attachRole middleware is used after authenticateUser middleware
    // we can use properties attached by authenticateUser middleware
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
```

### getAllProps method

```typescript
const req = {
  body: {},
};

// inside first middleware
addProps<Middlewares.AuthenticateUser>(
  req,
  {
    user: {
      name: 'dummy',
      id: 1,
    },
  },
  'authenticateUser'
);

// inside second middlware
const { user: authenticatedUser } = getProps<Middlewares.AuthenticateUser>(
  req,
  'authenticateUser'
);
const getRole = (user: User): Role => {
  return 'admin';
};

addProps<Middlewares.AttachRole>(
  req,
  {
    role: getRole(authenticatedUser),
  },
  'attachRole'
);

const result = getAllProps(req);
/*
    {
      authenticateUser: { user: { name: 'dummy', id: 1 } },
      attachRole: { role: 'admin' },
    }
*/
```

## More

visit samples directory [https://github.com/rgsk/middleware-props/tree/main/src/samples](https://github.com/rgsk/middleware-props/tree/main/src/samples)

visit base.test.ts file to see advanced use-cases supported [https://github.com/rgsk/middleware-props/blob/main/src/base.test.ts](https://github.com/rgsk/middleware-props/blob/main/src/base.test.ts)
