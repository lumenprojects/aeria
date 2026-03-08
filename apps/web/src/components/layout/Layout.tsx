import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import TapEffectLayer from "./TapEffectLayer";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-text">
      <TapEffectLayer />
      <Navbar />
      <main className="width-wide layout-main">
        <Outlet />
      </main>
    </div>
  );
}
