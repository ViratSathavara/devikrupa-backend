export type PageSettingSeed = {
  path: string;
  label: string;
};

export const WEB_PAGE_PRESETS: PageSettingSeed[] = [
  { path: "/", label: "Home" },
  { path: "/login", label: "Login" },
  { path: "/signup", label: "Signup" },
  { path: "/dashboard", label: "Dashboard" },
  { path: "/products", label: "Products" },
  { path: "/products/[slug]", label: "Product Details" },
  { path: "/favorites", label: "Favorites" },
  { path: "/inquiries", label: "My Inquiries" },
  { path: "/service-inquiry", label: "Service Inquiry" },
];

export const WEB_SECTION_PRESETS: PageSettingSeed[] = [
  { path: "/_section/home", label: "Landing: Hero" },
  { path: "/_section/services", label: "Landing: Services" },
  { path: "/_section/gallery", label: "Landing: Gallery" },
  { path: "/_section/trust", label: "Landing: Trust" },
  { path: "/_section/business-timing", label: "Landing: Business Timing" },
  { path: "/_section/testimonials", label: "Landing: Testimonials" },
  { path: "/_section/faq", label: "Landing: FAQ" },
  { path: "/_section/contact", label: "Landing: Contact" },
  { path: "/_section/map", label: "Landing: Map" },
];

export const ADMIN_PAGE_PRESETS: PageSettingSeed[] = [
  { path: "/_admin", label: "Admin Root" },
  { path: "/_admin/login", label: "Admin Login" },
  { path: "/_admin/dashboard", label: "Admin Dashboard" },
  { path: "/_admin/categories", label: "Admin Categories" },
  { path: "/_admin/products", label: "Admin Products" },
  { path: "/_admin/inquiries", label: "Admin Inquiries" },
  { path: "/_admin/testimonials", label: "Admin Testimonials" },
  { path: "/_admin/users", label: "Admin Users" },
  { path: "/_admin/settings", label: "Admin Settings" },
  { path: "/_admin/settings/admin-users", label: "Admin Settings: Admin Users" },
  { path: "/_admin/settings/system", label: "Admin Settings: System" },
];

export const DEFAULT_PAGE_SETTING_PRESETS: PageSettingSeed[] = [
  ...WEB_PAGE_PRESETS,
  ...WEB_SECTION_PRESETS,
  ...ADMIN_PAGE_PRESETS,
];
