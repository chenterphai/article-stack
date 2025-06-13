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

import { rateLimit } from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60000, // 1-minute time window for request limiting
  limit: 60, // Allow maximum of 60 requests per window per IP
  standardHeaders: 'draft-8', // Use the latest standard rate-limit headers
  legacyHeaders: false,
  message: {
    status: {
      code: 1,
      status: 'failed',
      msg: 'You have sent too many requests in a given amount of time. Please try againlater.',
    },
  },
});

export default limiter;
