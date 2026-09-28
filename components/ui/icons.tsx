import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number };

function stroke(children: React.ReactNode, width = 1.9) {
  return function StrokeIcon({ size = 22, ...props }: IconProps) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
        {children}
      </svg>
    );
  };
}

function fill(children: React.ReactNode) {
  return function FillIcon({ size = 22, ...props }: IconProps) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
        {children}
      </svg>
    );
  };
}

const SPARK = "M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z";
const HEART_NAV = "M12 20s-7-4.3-9-8.6C1.7 8.4 3.5 5 6.8 5c1.9 0 3.4 1 4.2 2.5h2C13.8 6 15.3 5 17.2 5c3.3 0 5.1 3.4 3.8 6.4-2 4.3-9 8.6-9 8.6z";
const HEART_LIKE = "M12 21s-7.5-4.6-9.6-9.2C1 8.6 2.9 5 6.4 5c2 0 3.6 1.1 4.4 2.6h2.4C14 6.1 15.6 5 17.6 5 21.1 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z";
const CHAT = "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z";

export const SparkIcon = stroke(<path d={SPARK} />, 1.8);
export const SparkFilledIcon = fill(<path d={SPARK} />);
export const HeartIcon = stroke(<path d={HEART_NAV} />, 1.8);
export const HeartFilledIcon = fill(<path d={HEART_NAV} />);
export const LikeIcon = fill(<path d={HEART_LIKE} />);
export const ChatIcon = stroke(<path d={CHAT} />, 1.8);
export const ChatFilledIcon = fill(<path d={CHAT} />);
export const ProfileIcon = stroke(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>, 1.8);
export const ProfileFilledIcon = fill(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6z" /></>);
export const CloseIcon = stroke(<path d="M6 6l12 12M18 6L6 18" />, 2.2);
export const BackIcon = stroke(<path d="M15 18l-6-6 6-6" />, 2);
export const ChevronRightIcon = stroke(<path d="M9 6l6 6-6 6" />, 2);
export const ArrowRightIcon = stroke(<path d="M5 12h14M13 6l6 6-6 6" />, 2.2);
export const SendIcon = stroke(<path d="M12 19V5M5 12l7-7 7 7" />, 2.4);
export const PlusIcon = stroke(<path d="M12 5v14M5 12h14" />, 2.2);
export const CheckIcon = stroke(<path d="M5 12.5l4.5 4.5L19 7.5" />, 2.2);
export const RetryIcon = stroke(<><path d="M20 12a8 8 0 1 1-2.34-5.66" /><path d="M20 4v4.5h-4.5" /></>, 2);
export const AlertIcon = stroke(<><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.01" /></>, 2);
export const DotsIcon = fill(<><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></>);
export const SlidersIcon = stroke(<><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>);
export const GearIcon = stroke(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </>,
  1.8,
);
export const InstagramIcon = stroke(<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></>);
export const WhatsAppIcon = stroke(<path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12z" />);
export const ExternalIcon = stroke(<path d="M7 17L17 7M9 7h8v8" />, 2);
export const EditIcon = stroke(<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z" /></>, 2);
export const EyeIcon = stroke(<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>, 1.8);
export const EyeOffIcon = stroke(<><path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.6 3.4M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" /></>, 1.8);
export const UnmatchIcon = stroke(<><path d="M12 20s-7-4.3-9-8.6C1.7 8.4 3.5 5 6.8 5c1.9 0 3.4 1 4.2 2.5M13 7.5C13.8 6 15.3 5 17.2 5c3.3 0 5.1 3.4 3.8 6.4" /><path d="M3 3l18 18" /></>);
export const BlockIcon = stroke(<><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></>);
export const FlagIcon = stroke(<path d="M4 21V4h13l-2 4 2 4H4" />);
export const LogoutIcon = stroke(<><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l-5-5 5-5M5 12h11" /></>);
export const StarburstIcon = fill(<path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />);
export const CameraIcon = stroke(<><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>, 1.8);
