import React from 'react';

import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { Platform, Text as RNText } from 'react-native';
import { textStyle } from './styles';

type ITextProps = React.ComponentProps<typeof RNText> &
  VariantProps<typeof textStyle>;

const Text = React.forwardRef<React.ComponentRef<typeof RNText>, ITextProps>(
  function Text(
    {
      className,
      isTruncated,
      bold,
      underline,
      strikeThrough,
      size = 'md',
      sub,
      italic,
      highlight,
      numberOfLines,
      ...props
    },
    ref
  ) {
    return (
      <RNText
        className={textStyle({
          isTruncated: (isTruncated ?? numberOfLines === 1) as boolean,
          bold: bold as boolean,
          underline: underline as boolean,
          strikeThrough: strikeThrough as boolean,
          size,
          sub: sub as boolean,
          italic: italic as boolean,
          highlight: highlight as boolean,
          class: className,
        })}
        {...props}
        {...(Platform.OS === 'web' ? {} : { numberOfLines })}
        ref={ref}
      />
    );
  }
);

Text.displayName = 'Text';

export { Text };
