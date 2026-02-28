import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-text">
      <Navbar />
      <main className="container py-10 pb-24 md:pb-10">
        <Outlet />
      </main>
    </div>
  );
}
