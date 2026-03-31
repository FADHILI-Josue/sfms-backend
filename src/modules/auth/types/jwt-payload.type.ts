export type JwtPayload = {
  sub: string;
  email: string;
  fullName: string;
  roles: string[];
  perms: string[];
};

