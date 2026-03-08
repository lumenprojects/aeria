import { Outlet } from "react-router-dom";
import { Typography } from "@/components/ui";
import Navbar from "./Navbar";
import TapEffectLayer from "./TapEffectLayer";

export default function Layout() {
  return (
    <div className="layout-shell min-h-screen bg-background text-text">
      <TapEffectLayer />
      <Navbar />
      <main className="width-wide layout-main">
        <Outlet />
      </main>
      <footer className="width-wide layout-footer">
        <Typography variant="ui" fontRole="ui" as="p" className="tone-tertiary layout-footer-label">
          amenori
        </Typography>
      </footer>
    </div>
  );
}
