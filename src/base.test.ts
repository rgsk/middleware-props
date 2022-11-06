import { addProps, getAllProps, getProps } from './lib/methods';

type User = {
  name: string;
  id: number;
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
describe('method addProps and getProps', () => {
  test('one middleware', () => {
    const req = {
      body: {},
    };

    const props: Middlewares.AuthenticateUser = {
      user: {
        name: 'dummy',
        id: 1,
      },
    };
    // inside middleware
    addProps(req, props, 'authenticateUser');

    // inside route
    const { user } = getProps<Middlewares.AuthenticateUser>(
      req,
      'authenticateUser'
    );

    expect(user).toEqual(props.user);
  });
  test('two middlewares', () => {
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

    // inside second middlware user can be used
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

    // inside route
    const { user } = getProps<Middlewares.AuthenticateUser>(
      req,
      'authenticateUser'
    );
    const { role } = getProps<Middlewares.AttachRole>(req, 'attachRole');

    expect(user).toEqual({
      name: 'dummy',
      id: 1,
    });

    expect(role).toBe('admin');
  });

  test('same middlware used twice in the same request-response cycle should raise error', () => {
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

    // inside second middlware user can be used
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

    // after attaching role, we used the authenticateUser middleware again
    expect(() => {
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
    }).toThrow();
  });
});

describe('getAllProps', () => {
  test('basic', () => {
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
    expect(result).toEqual({
      authenticateUser: { user: { name: 'dummy', id: 1 } },
      attachRole: { role: 'admin' },
    });
  });
});
