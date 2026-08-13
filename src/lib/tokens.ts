/** GhanaPay Sovereign Design Tokens */
const T = {
  navy:         "#020259",
  navyMid:      "#1B1F6B",
  navyLight:    "#3a3f8a",
  gold:         "#cea62c",
  goldDark:     "#755b00",
  surface:      "#f6fafe",
  surfaceLow:   "#f0f4f8",
  white:        "#ffffff",
  sidebarBg:    "#F8F9FE",
  sidebarActive:"#ECEFFE",
  border:       "#E8ECF0",
  borderVar:    "#c7c5d2",
  textPrimary:  "#171c1f",
  textSec:      "#464651",
  textMuted:    "#777682",
  success:      "#1E8449",
  successBg:    "#D5F5E3",
  error:        "#C0392B",
  errorBg:      "#FADBD8",
  warning:      "#D68910",
  warningBg:    "#FDEBD0",
  info:         "#1E7B9E",
  infoBg:       "#D6EAF8",
  adminBg:      "#0D1120",
  adminAccent:  "#4A6CF7",
  tableHover:   "#F5F7FF",
  tableStripe:  "#FAFBFF",
} as const;

export default T;
export type TokenKey = keyof typeof T;
