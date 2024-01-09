/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/// <reference types="css-module-types" />

import dark from '@adobe/spectrum-css-temp/vars/s2-dark.css';
import global from '@adobe/spectrum-css-temp/vars/spectrum-global.css';
import large from '@adobe/spectrum-css-temp/vars/spectrum-large.css';
import light from '@adobe/spectrum-css-temp/vars/s2-light.css';
import medium from '@adobe/spectrum-css-temp/vars/spectrum-medium.css';
import s2 from '@adobe/spectrum-css-temp/vars/s2.css';
import {Theme} from '@react-types/provider';

export let theme: Theme = {
  enablePressScale: true,
  global: {
    ...global,
    s2: s2.s2
  },
  light,
  dark,
  medium: {
    ...medium,
    express: s2.medium
  },
  large: {
    ...large,
    express: s2.large
  }
};
