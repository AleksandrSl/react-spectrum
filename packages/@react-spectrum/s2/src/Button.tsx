import {ButtonRenderProps, Button as RACButton, ButtonProps as RACButtonProps, Text, TextContext} from 'react-aria-components';
import {style, baseColor} from '../style-macro/spectrum-theme' with {type: 'macro'};
import {focusRing} from './style-utils' with {type: 'macro'};
import {ReactNode, useRef} from 'react';
import {mergeStyles} from '../style-macro/runtime';
import {pressScale} from './pressScale';

interface ButtonStyleProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'negative',
  style?: 'fill' | 'outline',
  size?: 'S' | 'M' | 'L' | 'XL',
  staticColor?: 'white' | 'black'
}

interface ButtonProps extends Omit<RACButtonProps, 'className' | 'style' | 'children'>, ButtonStyleProps {
  className?: string,
  children: ReactNode
}

const button = style<ButtonRenderProps & ButtonStyleProps>({
  ...focusRing(),
  display: 'flex',
  alignItems: {
    default: 'baseline',
    ':has([slot=icon]:only-child)': 'center'
  },
  justifyContent: 'center',
  textAlign: 'start',
  columnGap: 'text-to-visual',
  fontFamily: 'sans',
  fontWeight: 'bold',
  fontSize: 'control',
  minHeight: 'control',
  borderRadius: 'pill',
  paddingX: {
    default: 'pill',
    ':has([slot=icon]:only-child)': 0
  },
  paddingY: 0,
  aspectRatio: {
    ':has([slot=icon]:only-child)': 'square'
  },
  transition: 'default',
  borderStyle: 'solid',
  borderWidth: {
    style: {
      fill: 0,
      outline: 2
    }
  },
  '--labelPadding': {
    type: 'paddingTop',
    value: '[calc((self(minHeight) - 1lh) / 2 - self(borderWidth))]'
  },
  '--iconMargin': {
    type: 'marginTop',
    value: {
      default: '[calc(-2 / 14 * 1em)]',
      ':has([slot=icon]:only-child)': 0
    }
  },
  borderColor: {
    variant: {
      primary: baseColor('gray-800'),
      secondary: baseColor('gray-300')
    },
    isDisabled: 'disabled',
    staticColor: {
      white: {
        variant: {
          primary: baseColor('transparent-white-800'),
          secondary: baseColor('transparent-white-300')
        },
        isDisabled: 'transparent-white-300'
      },
      black: {
        variant: {
          primary: baseColor('transparent-black-800'),
          secondary: baseColor('transparent-black-300')
        },
        isDisabled: 'transparent-black-300'
      }
    },
    forcedColors: {
      default: 'ButtonBorder',
      isHovered: 'Highlight',
      isDisabled: 'GrayText'
    }
  },
  backgroundColor: {
    style: {
      fill: {
        variant: {
          primary: 'neutral',
          secondary: baseColor('gray-100'),
          accent: 'accent',
          negative: 'negative'
        },
        isDisabled: 'disabled'
      },
      outline: {
        default: 'transparent',
        isHovered: 'gray-100',
        isPressed: 'gray-100'
      }
    },
    staticColor: {
      white: {
        style: {
          fill: {
            variant: {
              primary: baseColor('transparent-white-800'),
              secondary: baseColor('transparent-white-100')
            },
            isDisabled: 'transparent-white-100'
          },
          outline: {
            default: 'transparent',
            isHovered: 'transparent-white-100',
            isPressed: 'transparent-white-100'
          }
        }
      },
      black: {
        style: {
          fill: {
            variant: {
              primary: baseColor('transparent-black-800'),
              secondary: baseColor('transparent-black-100')
            },
            isDisabled: 'transparent-black-100'
          },
          outline: {
            default: 'transparent',
            isHovered: 'transparent-black-100',
            isPressed: 'transparent-black-100'
          }
        }
      }
    },
    forcedColors: {
      style: {
        fill: {
          default: 'ButtonText',
          isHovered: 'Highlight',
          isDisabled: 'GrayText'
        },
        outline: 'ButtonFace'
      }
    }
  },
  color: {
    style: {
      fill: {
        variant: {
          primary: 'gray-25',
          secondary: 'neutral',
          accent: 'white',
          negative: 'white'
        },
        isDisabled: 'disabled'
      },
      outline: 'neutral'
    },
    staticColor: {
      white: {
        style: {
          fill: {
            variant: {
              primary: 'black',
              secondary: baseColor('transparent-white-800')
            }
          },
          outline: baseColor('transparent-white-800')
        },
        isDisabled: 'transparent-white-400'
      },
      black: {
        style: {
          fill: {
            variant: {
              primary: 'white',
              secondary: baseColor('transparent-black-800')
            }
          },
          outline: baseColor('transparent-black-800')
        },
        isDisabled: 'transparent-black-400'
      }
    },
    forcedColors: {
      style: {
        fill: {
          default: 'ButtonFace',
          isDisabled: 'HighlightText'
        },
        outline: {
          default: 'ButtonText',
          isDisabled: 'GrayText'
        }
      }
    }
  },
  outlineColor: {
    default: 'focus-ring',
    staticColor: {
      white: 'white',
      black: 'black'
    },
    forcedColors: 'Highlight'
  },
  forcedColorAdjust: 'none'
});

export function Button(props: ButtonProps) {
  let ref = useRef(null);
  return (
    <RACButton
      {...props}
      ref={ref}
      style={pressScale(ref)}
      className={renderProps => mergeStyles(props.className, button({
        ...renderProps,
        variant: props.variant || 'primary',
        style: props.style || 'fill',
        size: props.size || 'M',
        staticColor: props.staticColor
      }))}>
      <TextContext.Provider value={{className: style({paddingY: '--labelPadding'})()}}>
        {typeof props.children === 'string' ? <Text>{props.children}</Text> : props.children}
      </TextContext.Provider>
    </RACButton>
  );
}