const NAV_SECTIONS = [
    {
        label: "Content",
        items: [
            { title: "Homepage", href: "/admin/homepage" },
        ],
    },
    {
        label: "Catalogue",
        items: [
            { title: "Products", href: "/admin/products" },
            { title: "Add Product", href: "/admin/products/new" },
        ],
    },
    {
        label: "Commerce",
        items: [
            { title: "Orders", href: "/admin/orders" },
            { title: "Abandoned Carts", href: "/admin/abandoned-carts" },
        ],
    },
    {
        label: "Insights",
        items: [
            { title: "Analytics", href: "/admin/analytics" },
            { title: "Reviews", href: "/admin/reviews" },
            { title: "Reliability", href: "/admin/reliability" },
        ],
    },
];

/* Bottom tab bar items — the 4 most used + Menu */
const TAB_ITEMS = [
    {
        title: "Home",
        href: "/admin",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
    },
    {
        title: "Products",
        href: "/admin/products",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" x2="21" y1="6" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
            </svg>
        ),
    },
    {
        title: "Orders",
        href: "/admin/orders",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="18" rx="2" />
                <line x1="8" y1="7" x2="16" y2="7" />
                <line x1="8" y1="11" x2="16" y2="11" />
                <line x1="8" y1="15" x2="12" y2="15" />
            </svg>
        ),
    },
    {
        title: "Analytics",
        href: "/admin/analytics",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
    },
];

export { NAV_SECTIONS, TAB_ITEMS };
