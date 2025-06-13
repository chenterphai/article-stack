// Copyright 2025 chenterphai
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import config from '@/config';
import jwt from 'jsonwebtoken';

export const generateAccessToken = (
  userId: string,
  username: string,
): string => {
  return jwt.sign({ userId, username }, config.JWT_SECRET_KEY, {
    expiresIn: config.ACCESS_TOKEN_EXPIRY,
    subject: 'AccessApi',
  });
};

export const generateRefreshToken = (
  userId: string,
  username: string,
): string => {
  return jwt.sign({ userId, username }, config.JWT_REFRESH_KEY, {
    expiresIn: config.REFRESH_TOKEN_EXPIRY,
    subject: 'RefreshTOken',
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, config.JWT_SECRET_KEY);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, config.JWT_REFRESH_KEY);
};
