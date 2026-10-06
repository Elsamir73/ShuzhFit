import type { PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AppShell } from "./AppShell";
import { isAppRoute } from "../lib/appShell";
import { AdminLayout } from "./AdminLayout";
import { Helmet } from "react-helmet-async";

type LayoutProps = PropsWithChildren;

export function PublicLayout({ children }: LayoutProps) {
  const location = useLocation();
  const pageTitle = location.pathname === "/" ? "ShuzhFit | Train Smart. Stay Consistent." : `${location.pathname.split("/").filter(Boolean).at(-1)?.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? "ShuzhFit"} | ShuzhFit`;
  const canonical = `https://shuzh-fit.vercel.app${location.pathname}`;
  return (
    <>
      <Helmet><title>{pageTitle}</title><link rel="canonical" href={canonical} /><meta property="og:type" content="website" /><meta property="og:site_name" content="ShuzhFit" /><meta property="og:title" content={pageTitle} /><meta property="og:description" content="Train smart, stay consistent and track your fitness progress with ShuzhFit." /><meta property="og:url" content={canonical} /><meta property="og:image" content="https://shuzh-fit.vercel.app/images/og.jpg" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content={pageTitle} /><meta name="twitter:image" content="https://shuzh-fit.vercel.app/images/og.jpg" /></Helmet>
      <Header />
      <main className="public-main">{children}</main>
      <Footer />
    </>
  );
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  if (location.pathname.startsWith("/admin")) return <AdminLayout>{children}</AdminLayout>;
  if (isAppRoute(location.pathname)) return <AppShell>{children}</AppShell>;
  return <PublicLayout>{children}</PublicLayout>;
}
