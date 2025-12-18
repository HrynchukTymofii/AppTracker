// declare module 'react-native-math-view' { import { ComponentProps } from 'react'; import { ViewStyle } from 'react-native'; import React from 'react'; type MathViewProps = { math: string; style?: ViewStyle; resizeMode?: 'cover' | 'contain' | 'stretch'; }; const MathView: React.FC<MathViewProps>; export default MathView; }

declare module "react-native-math-view"