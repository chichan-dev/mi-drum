import * as React from 'react';

export type IconProps = {
    width?: number;
    height?: number;
    fill?: string;
    accessibilityLabel?: string;
};

export type HeaderOptions = {
    title?: string;
    showBackButton?: boolean;
    headerRight?: () => React.ReactNode;
    headerLeft?: () => React.ReactNode;
};

export default IconProps;
