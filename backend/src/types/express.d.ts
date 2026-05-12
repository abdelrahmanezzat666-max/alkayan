declare namespace Express {
  export interface UserContext {
    id: string;
    name: string;
    email: string;
    permissions: string[];
    roles: string[];
  }

  export interface Request {
    user?: UserContext;
  }
}
