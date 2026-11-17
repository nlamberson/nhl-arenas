import React from 'react';
import { boxStyle } from './styles';

import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import type { LayoutChangeEvent, ViewProps } from 'react-native';

type IBoxProps = React.ComponentPropsWithoutRef<'div'> &
  Pick<ViewProps, 'accessibilityLabel' | 'accessibilityRole' | 'onLayout'> &
  VariantProps<typeof boxStyle> & { className?: string };

const Box = React.forwardRef<HTMLDivElement, IBoxProps>(function Box(
  { className, accessibilityLabel, accessibilityRole, onLayout, ...props },
  ref
) {
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(ref, () => elementRef.current!, []);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element || !onLayout) {
      return;
    }

    const reportLayout = () => {
      const { x, y, width, height } = element.getBoundingClientRect();
      onLayout({
        nativeEvent: { layout: { x, y, width, height } },
      } as LayoutChangeEvent);
    };

    reportLayout();
    const observer = new ResizeObserver(reportLayout);
    observer.observe(element);
    return () => observer.disconnect();
  }, [onLayout]);

  return (
    <div
      ref={elementRef}
      className={boxStyle({ class: className })}
      role={accessibilityRole}
      aria-label={accessibilityLabel}
      {...props}
    />
  );
});

Box.displayName = 'Box';
export { Box };
