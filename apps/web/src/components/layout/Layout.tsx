import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import TapEffectLayer from "./TapEffectLayer";

export default function Layout() {
  const { pathname } = useLocation();
  const isLandingRoute = pathname === "/";

  return (
    <div className="min-h-screen bg-background text-text">
      <TapEffectLayer />
      <Navbar />
      <main className={`width-wide layout-main${isLandingRoute ? " layout-main-landing" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
