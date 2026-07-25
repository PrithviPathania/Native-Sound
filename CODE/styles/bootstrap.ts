// Native Sound — Bootstrap Styles Instance
// Initializes react-native-bootstrap-styles with our dark theme overrides.

import { create } from 'react-native-bootstrap-styles';
import { Colors } from '../constants/theme';

const bootstrapStyleSheet = create({
  // Override Bootstrap's default color palette with our dark theme
  colors: {
    primary: Colors.primary,
    danger: Colors.danger,
    dark: Colors.background,
    light: Colors.textPrimary,
    secondary: Colors.textMuted,
  },
});

export const { s, c } = bootstrapStyleSheet;
export default bootstrapStyleSheet;
