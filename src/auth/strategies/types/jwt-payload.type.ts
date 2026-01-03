export type JwtPayloadType = {
  id: number | string; // Support both for backward compatibility
  email: string;
  iat?: number;
  exp?: number;
};
