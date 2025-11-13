export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  id: string;
  username: string;
  iat: number;
  exp: number;
}
