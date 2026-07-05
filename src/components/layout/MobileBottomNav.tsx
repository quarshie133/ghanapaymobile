"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import T from "@/lib/tokens";
import {
  FaHouse,
  FaClockRotateLeft,
  FaPaperPlane,
  FaChartSimple,
  FaUser,
} from "react-icons/fa6";

const NAV_ITEMS = [
  { href: "/dashboard",  icon: FaHouse,            label: "Home"     },
  { href: "/history",    icon: FaClockRotateLeft,   label: "History"  },
  { href: "/send-money", icon: FaPaperPlane,         label: "Send"     },
  { href: "/analytics",  icon: FaChartSimple,        label: "Insights" },
  { href: "/settings",   icon: FaUser,               label: "Profile"  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        const isSend = item.href === "/send-money";

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{ textDecoration: "none", flex: 1 }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                padding: isSend ? "0" : "8px 4px",
                position: "relative",
              }}
            >
              {isSend ? (
                /* ── Send FAB (centre) ── */
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${T.navyMid}, ${T.navy})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 4px 16px ${T.navyMid}60`,
                    marginBottom: 2,
                    marginTop: -12,
                    border: "3px solid #fff",
                  }}
                >
                  <Icon size={20} style={{ color: "#fff" }} />
                </div>
              ) : (
                <>
                  {/* Active indicator dot */}
                  {active && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: T.navyMid,
                      }}
                    />
                  )}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: active ? T.sidebarActive : "transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    <Icon
                      size={18}
                      style={{ color: active ? T.navyMid : T.textMuted }}
                    />
                  </div>
                </>
              )}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 500,
                  color: active ? T.navyMid : T.textMuted,
                  lineHeight: 1,
                }}
              >
                {item.label}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
