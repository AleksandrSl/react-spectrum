import React from 'react';

export default function colorAvatar(props) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" {...props}>
        <rect width="16" height="15.999" fill="url(#pattern0)"/>
        <defs>
        <pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1">
        <use xlinkHref="#image0_19100_305" transform="scale(0.0078125)"/>
        </pattern>
        <image id="image0_19100_305" width="128" height="128" xlinkHref="data:image/png;base64,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"/>
        </defs>
      </svg>
    );
}