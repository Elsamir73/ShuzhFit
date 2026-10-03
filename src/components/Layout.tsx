import type { PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";
import { HomeHeader } from "./HomeHeader";
import { Header } from "./Header";
import { HomeFooter } from "./HomeFooter";
import { Footer } from "./Footer";
import { AppShell } from "./AppShell";
import { isAppRoute } from "../lib/appShell";

type LayoutProps = PropsWithChildren<{
  variant?: "home" | "app";
}>;

export function Layout({ children, variant = "app" }: LayoutProps) {
  const location = useLocation();

  if (variant === "app" && isAppRoute(location.pathname)) {
    return <AppShell>{children}</AppShell>;
  }

  return (
    <>
      {variant === "home" ? <HomeHeader /> : <Header />}
      <main>{children}</main>
      {variant === "home" ? <HomeFooter /> : <Footer />}
    </>
  );
}
