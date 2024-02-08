import React from 'react';
                    
export default function paintBucketAvatar(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" {...props}>
      <rect width="16" height="16" fill="url(#pattern0)"/>
      <rect width="16" height="15.999" fill="url(#pattern1)"/>
      <defs>
        <pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1">
          <use xlinkHref="#image0_19100_320" transform="scale(0.0078125)"/>
        </pattern>
        <pattern id="pattern1" patternContentUnits="objectBoundingBox" width="1" height="1">
          <use xlinkHref="#image0_19100_320" transform="scale(0.0078125)"/>
        </pattern>
        <image id="image0_19100_320" width="128" height="128" xlinkHref="data:image/png;base64,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"/>
      </defs>
    </svg>
  );
}