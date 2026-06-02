import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1d5f8f",
      dark: "#123f5f",
      light: "#d6eaf5"
    },
    secondary: {
      main: "#7b5d12"
    },
    success: {
      main: "#26734d"
    },
    warning: {
      main: "#b26a00"
    },
    error: {
      main: "#b42318"
    },
    background: {
      default: "#f6f8fb",
      paper: "#ffffff"
    },
    text: {
      primary: "#172331",
      secondary: "#59677a"
    }
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    h1: {
      fontSize: "2rem",
      fontWeight: 750,
      letterSpacing: 0
    },
    h2: {
      fontSize: "1.25rem",
      fontWeight: 700,
      letterSpacing: 0
    },
    h3: {
      fontSize: "1rem",
      fontWeight: 700,
      letterSpacing: 0
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
      letterSpacing: 0
    }
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: false
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700
        }
      }
    }
  }
});
