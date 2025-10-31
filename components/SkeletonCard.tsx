/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="relative group aspect-square bg-stone-200 dark:bg-stone-800 rounded-lg animate-pulse" />
  );
};

export default SkeletonCard;