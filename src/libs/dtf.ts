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

import { add } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const timeZoneCambodia = 'Asia/Phnom_Penh';
const today = new Date();

export function futureDateTimeFormater(durationString: string) {
  const parts = durationString.match(/(\d+)([smhdw])/);
  if (!parts) {
    throw new Error('Invalid duration string format.');
  }

  const value = parseInt(parts[1], 10);
  const unit = parts[2];
  let duration = {} as {
    seconds: number;
    minutes: number;
    hours: number;
    days: number;
    weeks: number;
  };

  switch (unit) {
    case 's':
      duration.seconds = value;
      break;
    case 'm':
      duration.minutes = value;
      break;
    case 'h':
      duration.hours = value;
      break;
    case 'd':
      duration.days = value;
      break;
    case 'w':
      duration.weeks = value;
      break;
    default:
      throw new Error('Unsupported duration unit.');
  }
  const futureDate = add(today, duration);

  // return formatInTimeZone(
  //   futureDate,
  //   timeZoneCambodia,
  //   'yyyy-MM-dd HH:mm:ss.SSSSSS',
  // );
  return formatInTimeZone(
    futureDate,
    timeZoneCambodia,
    'yyyy-MM-dd HH:mm:ss zzz',
  );
}

export function cambodidaTimeFormater(date?: Date) {
  return formatInTimeZone(
    date ?? new Date(),
    timeZoneCambodia,
    'yyyy-MM-dd HH:mm:ss zzz',
  );
}
