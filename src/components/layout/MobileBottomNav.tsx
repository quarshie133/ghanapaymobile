"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaHouse,
  FaClockRotateLeft,
  FaPaperPlane,
  FaChartSimple,
  FaUser,
} from "react-icons/fa6";

const NAV_ITEMS = [
  { href: "/dashboard",  icon: FaHouse,           label: "Home"     },
  { href: "/history",    icon: FaClockRotateLeft,  label: "History"  },
  { href: "/send-money", icon: FaPaperPlane,        label: "Send"     },
  { href: "/analytics",  icon: FaChartSimple,       label: "Insights" },
  { href: "/settings",   icon: FaUser,              label: "Profile"  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Mobile navigation"
      role="navigation"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        const isSend = item.href === "/send-money";

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center no-underline relative"
            style={{ minHeight: 44 }} // minimum touch target
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
          >
            {isSend ? (
              /* ── Send FAB (centre elevated button) ── */
              <div className="flex flex-col items-center gap-1">
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #1b1f6b, #020259)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(2,2,89,0.40)",
                    marginTop: -16,
                    border: "3px solid #fff",
                  }}
                >
                  <Icon size={18} style={{ color: "#fff" }} />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#020259",
                    lineHeight: 1,
                  }}
                >
                  {item.label}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-0.5 py-1 relative w-full items-center justify-center">
                {/* Active indicator dot */}
                {active && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2"
                    style={{
                      width: 20,
                      height: 3,
                      borderRadius: "0 0 4px 4px",
                      background: "#020259",
                    }}
                  />
                )}
                <div
                  style={{
                    width: 40,
                    height: 32,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: active ? "#ECEFFE" : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <Icon
                    size={17}
                    style={{ color: active ? "#020259" : "#8a9299" }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: active ? 700 : 500,
                    color: active ? "#020259" : "#8a9299",
                    lineHeight: 1,
                  }}
                >
                  {item.label}
                </span>
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
