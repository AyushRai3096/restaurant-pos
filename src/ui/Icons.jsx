/**
 * Nav icons. Petpooja's toolbar uses Lucide, so these follow Lucide's geometry:
 * 24x24 grid, 2px stroke, round caps and joins.
 * Kept inline so no icon package is needed and the strict CSP is satisfied.
 */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.55,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/* Item On/Off — Petpooja's item_on_off_icon(): two stacked toggle switches,
   the upper one off (knob left), the lower one on (knob right). */
export const IconToggle = (p) => (
  <svg viewBox="0 0 40 40" fill="none" {...p}>
    <path d="M12.8274 13.2455C14.4 13.2455 15.6749 11.9388 15.6749 10.3268C15.6749 8.71483 14.4 7.40808 12.8274 7.40808C11.2547 7.40808 9.97986 8.71483 9.97986 10.3268C9.97986 11.9388 11.2547 13.2455 12.8274 13.2455Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M27.5059 3.51648H12.8109C9.14138 3.51648 6.16666 6.56557 6.16666 10.3268C6.16666 14.088 9.14138 17.1371 12.8109 17.1371H27.5059C31.1754 17.1371 34.1501 14.088 34.1501 10.3268C34.1501 6.56557 31.1754 3.51648 27.5059 3.51648Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M26.5225 31.9253C28.0951 31.9253 29.37 30.6186 29.37 29.0066C29.37 27.3946 28.0951 26.0879 26.5225 26.0879C24.9498 26.0879 23.6749 27.3946 23.6749 29.0066C23.6749 30.6186 24.9498 31.9253 26.5225 31.9253Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M27.0224 22.1962H12.3273C8.65782 22.1962 5.68311 25.2453 5.68311 29.0066C5.68311 32.7678 8.65782 35.8169 12.3273 35.8169H27.0224C30.6919 35.8169 33.6666 32.7678 33.6666 29.0066C33.6666 25.2453 30.6919 22.1962 27.0224 22.1962Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Store — Petpooja's store_on_off_icon(): shop front with a scalloped awning */
export const IconStore = (p) => (
  <svg viewBox="0 0 26 27" fill="none" {...p}>
    <path d="M16.25 23.25V17.8333C16.25 17.546 16.1359 17.2705 15.9327 17.0673C15.7295 16.8641 15.454 16.75 15.1667 16.75H10.8333C10.546 16.75 10.2705 16.8641 10.0673 17.0673C9.86414 17.2705 9.75 17.546 9.75 17.8333V23.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.2552 11.6691C19.0293 11.4529 18.7287 11.3323 18.4161 11.3323C18.1035 11.3323 17.8029 11.4529 17.5771 11.6691C17.0733 12.1496 16.4039 12.4177 15.7078 12.4177C15.0116 12.4177 14.3422 12.1496 13.8385 11.6691C13.6127 11.4533 13.3124 11.3328 13 11.3328C12.6876 11.3328 12.3873 11.4533 12.1615 11.6691C11.6577 12.1499 10.9881 12.4182 10.2917 12.4182C9.59525 12.4182 8.92562 12.1499 8.42182 11.6691C8.19599 11.4529 7.89542 11.3323 7.58278 11.3323C7.27014 11.3323 6.96957 11.4529 6.74374 11.6691C6.25715 12.1335 5.6152 12.4001 4.94283 12.4172C4.27047 12.4343 3.61579 12.2006 3.10624 11.7616C2.59668 11.3226 2.2687 10.7097 2.18614 10.0422C2.10358 9.37472 2.27234 8.70039 2.65957 8.15046L5.78932 3.61779C5.9879 3.32476 6.25526 3.08485 6.568 2.91904C6.88074 2.75322 7.22934 2.66656 7.58332 2.66663H18.4167C18.7696 2.66649 19.1172 2.75258 19.4293 2.9174C19.7414 3.08223 20.0085 3.3208 20.2074 3.61238L23.3437 8.15371C23.731 8.70407 23.8995 9.37892 23.8164 10.0468C23.7334 10.7146 23.4046 11.3276 22.8943 11.7663C22.3839 12.205 21.7285 12.4379 21.0557 12.4198C20.383 12.4016 19.7411 12.1336 19.2552 11.668" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.33334 12.3625V21.0834C4.33334 21.658 4.56162 22.2091 4.96795 22.6154C5.37427 23.0218 5.92537 23.25 6.50001 23.25H19.5C20.0746 23.25 20.6257 23.0218 21.0321 22.6154C21.4384 22.2091 21.6667 21.658 21.6667 21.0834V12.3625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Live View — lucide "radio" */
export const IconLive = (p) => (
  <svg {...base} {...p}>
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
    <circle cx="12" cy="12" r="2" />
    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
    <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
  </svg>
);

/* Orders — Petpooja's show_online_orders_icon(): a monitor on a stand with a
   serving cloche on the screen, not a parcel box. */
export const IconOrders = (p) => (
  <svg viewBox="0 0 40 40" fill="none" {...p}>
    <path d="M33 5H6.33333C4.49238 5 3 6.49238 3 8.33333V25C3 26.841 4.49238 28.3333 6.33333 28.3333H33C34.8409 28.3333 36.3333 26.841 36.3333 25V8.33333C36.3333 6.49238 34.8409 5 33 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.3333 35H26.6666" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 28.3334V35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 12V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 21H30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 21C12 18.8783 12.8429 16.8434 14.3431 15.3431C15.8434 13.8429 17.8783 13 20 13C22.1217 13 24.1566 13.8429 25.6569 15.3431C27.1571 16.8434 28 18.8783 28 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Recent — Petpooja's own path: a receipt with a zig-zag torn edge */
export const IconRecent = (p) => (
  <svg viewBox="0 0 28 27" fill="none" {...p}>
    <path d="M5 24.3333V2.66663H23V24.3333L20.75 23.25L18.5 24.3333L16.25 23.25L14 24.3333L11.75 23.25L9.5 24.3333L7.25 23.25L5 24.3333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.5 8.7334H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.5 13.0667H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.275 17.4H18.275" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Hold — Petpooja's own path: a clock with two bars at the lower right */
export const IconHold = (p) => (
  <svg viewBox="0 0 26 26" fill="none" {...p}>
    <path d="M13 6.5V13L14.69 13.845" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.3292 23.7521C12.131 24.024 9.9023 23.6155 7.94338 22.5817C5.98446 21.5479 4.3895 19.9385 3.37342 17.9703C2.35734 16.0022 1.96896 13.7698 2.26063 11.5742C2.5523 9.37848 3.50999 7.32496 5.00466 5.69032C6.49933 4.05568 8.45914 2.91847 10.62 2.43194C12.7809 1.94541 15.039 2.13293 17.09 2.96924C19.141 3.80555 20.8864 5.25046 22.0909 7.10925C23.2955 8.96805 23.9013 11.1514 23.8268 13.3651" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.4167 23.8334V17.3334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22.75 23.8334V17.3334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Alerts — lucide "bell" */
export const IconAlerts = (p) => (
  <svg {...base} {...p}>
    <path d="M10.268 21a2 2 0 0 0 3.464 0" />
    <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
  </svg>
);

/* Zomato Help — Petpooja's own headset path */
export const IconHeadset = (p) => (
  <svg viewBox="0 0 26 27" fill="none" {...p}>
    <path d="M3.25 12.4166H6.5C7.07464 12.4166 7.62574 12.6449 8.03206 13.0512C8.43839 13.4576 8.66667 14.0087 8.66667 14.5833V17.8333C8.66667 18.4079 8.43839 18.959 8.03206 19.3654C7.62574 19.7717 7.07464 20 6.5 20H5.41667C4.84203 20 4.29093 19.7717 3.8846 19.3654C3.47827 18.959 3.25 18.4079 3.25 17.8333V12.4166ZM3.25 12.4166C3.25 11.1362 3.50219 9.86839 3.99217 8.68546C4.48216 7.50254 5.20034 6.42771 6.10571 5.52234C7.01108 4.61696 8.08591 3.89878 9.26884 3.4088C10.4518 2.91882 11.7196 2.66663 13 2.66663C14.2804 2.66663 15.5482 2.91882 16.7312 3.4088C17.9141 3.89878 18.9889 4.61696 19.8943 5.52234C20.7997 6.42771 21.5178 7.50254 22.0078 8.68546C22.4978 9.86839 22.75 11.1362 22.75 12.4166M22.75 12.4166V17.8333C22.75 18.4079 22.5217 18.959 22.1154 19.3654C21.7091 19.7717 21.158 20 20.5833 20H19.5C18.9254 20 18.3743 19.7717 17.9679 19.3654C17.5616 18.959 17.3333 18.4079 17.3333 17.8333V14.5833C17.3333 14.0087 17.5616 13.4576 17.9679 13.0512C18.3743 12.6449 18.9254 12.4166 19.5 12.4166H22.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Logout — Petpooja's own path */
export const IconLogout = (p) => (
  <svg viewBox="0 0 26 27" fill="none" {...p}>
    <path d="M17.3333 18.9167L22.75 13.5L17.3333 8.08337" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22.75 13.5H9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.75 23.25H5.41667C4.84203 23.25 4.29093 23.0217 3.8846 22.6154C3.47827 22.2091 3.25 21.658 3.25 21.0833V5.91667C3.25 5.34203 3.47827 4.79093 3.8846 4.3846C4.29093 3.97827 4.84203 3.75 5.41667 3.75H9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Search — Petpooja's magnifier sits higher-left with a short handle, unlike
   Lucide's longer diagonal. Drawn to match. Sized by .search-box svg in CSS. */
export const IconSearch = (p) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.4 15.4 4 4" />
  </svg>
);

/* Card action icons carry a heavier stroke than the nav set, matching the
   bolder glyphs Petpooja draws inside the white plates on each table card. */
const bold = { ...base, strokeWidth: 2.1 };

/* Printer — shown on occupied table cards */
export const IconPrint = (p) => (
  <svg {...bold} {...p}>
    <path d="M6 9V3h12v6" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" rx="1" />
  </svg>
);

/* Eye — view/preview the running order */
export const IconEye = (p) => (
  <svg {...bold} {...p}>
    <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/* Refresh — Petpooja's poss_icon_check_for_update: two opposing arcs, each
   ending in a short arrow tail. This is the glyph used on the table view. */
export const IconRefresh = (p) => (
  <svg viewBox="0 0 20 20" fill="none" {...p}>
    <path
      d="M17.0441 10.7442C16.8126 12.9191 15.5802 14.9572 13.5411 16.1345C10.1532 18.0905 5.82108 16.9298 3.86507 13.5419L3.65674 13.181M2.95503 9.25584C3.18653 7.08092 4.41885 5.04282 6.45801 3.86551C9.84591 1.90951 14.178 3.07029 16.134 6.45819L16.3424 6.81904M2.91089 15.055L3.52093 12.7783L5.79764 13.3884M14.2019 6.61167L16.4786 7.22172L17.0887 4.94501"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ---- order screen ---- */

/* Dine In - Petpooja's dinein_icon() */
export const IconDineIn = (p) => (
  <svg viewBox="0 0 40 40" fill="none" {...p}>
    <path d="M5 3.33337V15C5 16.8334 6.5 18.3334 8.33333 18.3334H15C15.8841 18.3334 16.7319 17.9822 17.357 17.3571C17.9821 16.7319 18.3333 15.8841 18.3333 15V3.33337" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.6667 3.33337V36.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M35 25V3.33337C32.7899 3.33337 30.6702 4.21135 29.1074 5.77415C27.5446 7.33695 26.6667 9.45657 26.6667 11.6667V21.6667C26.6667 23.5 28.1667 25 30 25H35ZM35 25V36.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Delivery - Petpooja's scooter_delivery_icon() */
export const IconDelivery = (p) => (
  <svg viewBox="0 0 40 40" fill="none" {...p}>
    <path d="M30.8333 35C34.055 35 36.6667 32.3884 36.6667 29.1667C36.6667 25.945 34.055 23.3334 30.8333 23.3334C27.6117 23.3334 25 25.945 25 29.1667C25 32.3884 27.6117 35 30.8333 35Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.16667 35C12.3883 35 15 32.3884 15 29.1667C15 25.945 12.3883 23.3334 9.16667 23.3334C5.94501 23.3334 3.33334 25.945 3.33334 29.1667C3.33334 32.3884 5.94501 35 9.16667 35Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M25 11C26.6569 11 28 9.65685 28 8C28 6.34315 26.6569 5 25 5C23.3431 5 22 6.34315 22 8C22 9.65685 23.3431 11 25 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 29.1667V23.3334L15 18.3334L21.6667 13.3334L25 18.3334H28.3333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.5714 8H3.42857C2.63959 8 2 8.63959 2 9.42857V16.5714C2 17.3604 2.63959 18 3.42857 18H10.5714C11.3604 18 12 17.3604 12 16.5714V9.42857C12 8.63959 11.3604 8 10.5714 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 12L11 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Pick Up - Petpooja's pikup_icon() */
export const IconPickUp = (p) => (
  <svg viewBox="0 0 40 40" fill="none" {...p}>
    <path d="M36.1093 29.8921C36.1093 30.5235 35.9761 31.1474 35.7189 31.7207C35.4617 32.2941 35.0866 32.8033 34.6195 33.2132L30.304 37.0001H8.3571C6.01112 37.0001 4.10931 35.0451 4.10931 32.6335V24.9193C4.10931 16.1133 7.49438 10.0001 7.49438 10.0001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M30.1093 36.0001V26.9806C30.1093 21.8266 31.2721 17.1256 32.2896 13.9986C33.4237 10.5131 33.5886 6.80307 32.7206 3.24852C32.7004 3.16566 33.5207 3.08274 33.5 3C33.5 3 36.1093 12.5207 36.1093 19.9654V29.4431" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.1093 10.0001H28.5932C29.8342 7.31989 30.776 5.03012 33.1093 3.00012" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M33.1093 3.00012H7.46767C5.21411 5.22577 3.94757 7.52688 3.10931 10.0001H12.7703" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M23.1093 3.00012C23.1093 3.00012 17.8515 7.73755 17.6439 15.0001H12.1093C12.5244 6.86604 17.298 3.00012 17.298 3.00012" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Table marker used in the icon bar */
export const IconTableNo = (p) => (
  <svg {...base} {...p}>
    <path d="M4 5h16" />
    <path d="M12 5v14" />
    <path d="M7.5 19h9" />
  </svg>
);

/* Single customer */
export const IconPerson = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);

/* Group of customers */
export const IconPeople = (p) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8.5" r="3.1" />
    <path d="M3 19a6 6 0 0 1 12 0" />
    <path d="M16 6.2a3.1 3.1 0 0 1 0 5.9" />
    <path d="M17.5 14.4A6 6 0 0 1 21 19" />
  </svg>
);

/* Note / comment bubble */
export const IconNote = (p) => (
  <svg {...base} {...p}>
    <path d="M20.5 15.2a2 2 0 0 1-2 2H8l-4.5 3.4V5.8a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
  </svg>
);

/* Empty-plate illustration for the "No Item Selected" state */
export const IconPlate = (p) => (
  <svg {...base} strokeWidth={1.3} {...p}>
    <circle cx="12" cy="12" r="7.2" />
    <circle cx="12" cy="12" r="4" />
    <path d="M4.4 3.2v5.4a2 2 0 0 0 2 2 2 2 0 0 0 2-2V3.2" />
    <path d="M6.4 10.6V21" />
    <path d="M19 3.2c-1.5 0-2.4 1.6-2.4 4s.9 3.4 2.4 3.4z" />
    <path d="M19 10.6V21" />
  </svg>
);

/* Cash - Petpooja's bank_note() */
export const IconCash = (p) => (
  <svg viewBox="0 0 23 23" fill="none" {...p}>
    <path d="M6.00065 10.5837V14.2503M17.0007 8.75032V12.417M16.084 4.16699C18.3286 4.16699 19.5427 4.51052 20.1468 4.77698C20.2272 4.81247 20.2674 4.83021 20.3835 4.941C20.4531 5.00741 20.5801 5.20227 20.6128 5.29274C20.6673 5.44367 20.6673 5.52617 20.6673 5.69117V15.5439C20.6673 16.3769 20.6673 16.7934 20.5424 17.0075C20.4153 17.2253 20.2928 17.3266 20.0549 17.4102C19.8211 17.4925 19.3491 17.4018 18.4051 17.2205C17.7444 17.0935 16.9608 17.0003 16.084 17.0003C13.334 17.0003 10.584 18.8337 6.91732 18.8337C4.67267 18.8337 3.45861 18.4901 2.85454 18.2237C2.7741 18.1882 2.73387 18.1704 2.61778 18.0597C2.5482 17.9932 2.42118 17.7984 2.3885 17.7079C2.33398 17.557 2.33398 17.4745 2.33398 17.3095L2.33398 7.45677C2.33398 6.62374 2.33398 6.20722 2.45891 5.99312C2.58598 5.77534 2.70853 5.6741 2.94637 5.5904C3.18019 5.50812 3.65218 5.59881 4.59616 5.78019C5.25688 5.90714 6.04051 6.00032 6.91732 6.00032C9.66732 6.00032 12.4173 4.16699 16.084 4.16699ZM13.7923 11.5003C13.7923 12.766 12.7663 13.792 11.5007 13.792C10.235 13.792 9.20898 12.766 9.20898 11.5003C9.20898 10.2347 10.235 9.20866 11.5007 9.20866C12.7663 9.20866 13.7923 10.2347 13.7923 11.5003Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
/* Card - Petpooja's card_icon() */
export const IconCard = (p) => (
  <svg viewBox="0 0 23 23" fill="none" {...p}>
    <path d="M20.6673 9.66634H2.33398M2.33398 8.01634L2.33398 14.983C2.33398 16.0098 2.33398 16.5232 2.53381 16.9153C2.70957 17.2603 2.99004 17.5408 3.335 17.7165C3.72717 17.9163 4.24055 17.9163 5.26732 17.9163L17.734 17.9163C18.7607 17.9163 19.2741 17.9163 19.6663 17.7165C20.0113 17.5408 20.2917 17.2603 20.4675 16.9153C20.6673 16.5232 20.6673 16.0098 20.6673 14.983V8.01634C20.6673 6.98958 20.6673 6.4762 20.4675 6.08403C20.2917 5.73906 20.0113 5.4586 19.6663 5.28283C19.2741 5.08301 18.7607 5.08301 17.734 5.08301L5.26732 5.08301C4.24056 5.08301 3.72717 5.08301 3.335 5.28283C2.99004 5.4586 2.70957 5.73906 2.53381 6.08402C2.33398 6.4762 2.33398 6.98958 2.33398 8.01634Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
/* Due - Petpooja's currency_exchange_note() */
export const IconDue = (p) => (
  <svg viewBox="0 0 22 23" fill="none" {...p}>
    <path d="M8.39013 11.777C8.39013 10.8858 7.66902 10.1647 6.77788 10.1647M17.9337 11.777C17.9337 10.8858 18.6548 10.1647 19.5459 10.1647M17.9337 4.9666C17.9337 5.85774 18.6548 6.57885 19.5459 6.57885M13.1619 4.94141H18.9665C19.3004 4.94141 19.5711 5.21209 19.5711 5.546V11.1975C19.5711 11.5315 19.3004 11.8021 18.9665 11.8021H14.8387L11.4851 11.8022H7.35727C7.02339 11.8022 6.75268 11.5315 6.75268 11.1976V7.96188M11.5577 7.52678C11.862 6.95189 12.4662 6.56018 13.1619 6.56018C14.1636 6.56018 14.9757 7.37225 14.9757 8.37395C14.9757 9.37569 14.1636 10.1878 13.1619 10.1878C12.3936 10.1878 11.7369 9.71009 11.4725 9.03552M5.11312 2.92921H10.5165C11.0471 2.92921 11.5628 3.10494 11.983 3.42898L13.9444 4.94141H9.89242C9.4652 4.94141 9.11888 5.28773 9.11888 5.71495C9.11888 5.9964 9.27177 6.25563 9.51804 6.39183L11.4351 7.45211C11.8326 7.67192 12.0093 8.14963 11.8506 8.57521C11.6963 8.9889 11.2691 9.23391 10.8342 9.1583L9.48811 8.92425C8.23452 8.70626 7.04538 8.21126 6.00743 7.47528H5.11312M16.8854 20.2192H9.58519C8.2941 20.2192 7.0559 19.7063 6.14296 18.7934L4.11857 16.769C3.75619 16.4066 3.75757 15.8186 4.12167 15.4579C4.48338 15.0995 5.06673 15.1009 5.42673 15.461L7.23815 17.273C7.84523 17.8802 8.66867 18.2214 9.52732 18.2214H11.5403M13.7401 18.2214H9.68252C9.1731 18.2214 8.76011 17.8084 8.76011 17.2989C8.76011 16.7895 9.1731 16.3765 9.68252 16.3765H12.0352L12.5219 15.7988C13.1274 15.08 14.0194 14.6651 14.9594 14.6651C15.6318 14.6651 16.287 14.8778 16.8312 15.2727L16.8854 15.312M5.11312 8.29507H1.83398V2.33301H5.11312V8.29507ZM20.1673 20.6663H16.8882V14.7043H20.1673V20.6663Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
/* Other - Petpooja's other_card_icon() */
export const IconOther = (p) => (
  <svg viewBox="0 0 22 22" fill="none" {...p}>
    <path d="M20.1663 9.16634H1.83301M1.83301 7.51634L1.83301 14.483C1.83301 15.5098 1.83301 16.0232 2.03283 16.4153C2.2086 16.7603 2.48906 17.0408 2.83403 17.2165C3.2262 17.4163 3.73958 17.4163 4.76634 17.4163L17.233 17.4163C18.2598 17.4163 18.7732 17.4163 19.1653 17.2165C19.5103 17.0408 19.7908 16.7603 19.9665 16.4153C20.1663 16.0232 20.1663 15.5098 20.1663 14.483V7.51634C20.1663 6.48958 20.1663 5.9762 19.9665 5.58403C19.7908 5.23906 19.5103 4.9586 19.1653 4.78283C18.7732 4.58301 18.2598 4.58301 17.233 4.58301L4.76634 4.58301C3.73958 4.58301 3.2262 4.58301 2.83403 4.78283C2.48906 4.9586 2.2086 5.23906 2.03283 5.58402C1.83301 5.9762 1.83301 6.48958 1.83301 7.51634Z" stroke="currentColor" strokeWidth="1.375" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.49805 12.9121C8.49805 13.3867 8.11326 13.7715 7.63867 13.7715C7.16404 13.7715 6.7793 13.3867 6.7793 12.9121C6.7793 12.4375 7.16404 12.0527 7.63867 12.0527C8.11326 12.0527 8.49805 12.4375 8.49805 12.9121Z" fill="currentColor" />
    <path d="M11.9355 12.9121C11.9355 13.3867 11.5508 13.7715 11.0762 13.7715C10.6015 13.7715 10.2168 13.3867 10.2168 12.9121C10.2168 12.4375 10.6015 12.0527 11.0762 12.0527C11.5508 12.0527 11.9355 12.4375 11.9355 12.9121Z" fill="currentColor" />
    <path d="M15.373 12.9121C15.373 13.3867 14.9883 13.7715 14.5137 13.7715C14.039 13.7715 13.6543 13.3867 13.6543 12.9121C13.6543 12.4375 14.039 12.0527 14.5137 12.0527C14.9883 12.0527 15.373 12.4375 15.373 12.9121Z" fill="currentColor" />
  </svg>
);
export const IconChevronUp = (p) => (
  <svg {...base} {...p}>
    <path d="m6 14.5 6-6 6 6" />
  </svg>
);
