/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// Custom React hooks placeholder
export const useMount = (callback: () => void) => {
  React.useEffect(() => {
    callback();
  }, []);
};

