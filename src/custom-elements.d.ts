import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        'ios-src'?: string;
        alt?: string;
        ar?: boolean | string;
        'ar-modes'?: string;
        'ar-scale'?: string;
        'camera-controls'?: boolean | string;
        'auto-rotate'?: boolean | string;
        'rotation-per-second'?: string;
        'shadow-intensity'?: string | number;
        'shadow-softness'?: string | number;
        'environment-image'?: string;
        exposure?: string | number;
        'touch-action'?: string;
        'interaction-prompt'?: string;
        onLoad?: () => void;
        slot?: string;
        style?: React.CSSProperties;
        ref?: any;
      };
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}
