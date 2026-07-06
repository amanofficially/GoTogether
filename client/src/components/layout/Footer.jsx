import { Link } from "react-router-dom";
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from "react-icons/hi";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-line)]/10 bg-[var(--color-ink)] text-[var(--color-paper)]">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2">
            <img src="/logo.png" alt="GoTogether" className="h-9 w-auto brightness-0 invert" />
            <p className="mt-4 max-w-xs text-sm text-[var(--color-mist)]">
              Share the route, split the cost. Built for daily commuters who'd rather travel with company than alone.
            </p>
          </div>

          <div>
            <p className="font-mono-tag text-xs uppercase text-[var(--color-mist)]">Product</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/search-ride" className="text-[var(--color-paper)]/85 hover:text-[var(--color-route)]">Find a ride</Link></li>
              <li><Link to="/offer-ride" className="text-[var(--color-paper)]/85 hover:text-[var(--color-route)]">Offer a ride</Link></li>
              <li><Link to="/features" className="text-[var(--color-paper)]/85 hover:text-[var(--color-route)]">Features</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-mono-tag text-xs uppercase text-[var(--color-mist)]">Company</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/about" className="text-[var(--color-paper)]/85 hover:text-[var(--color-route)]">About us</Link></li>
              <li><Link to="/contact" className="text-[var(--color-paper)]/85 hover:text-[var(--color-route)]">Contact</Link></li>
            </ul>
          </div>
        </div>

        <hr className="route-rule my-10 border-[var(--color-paper)]/30" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--color-mist)]">© {new Date().getFullYear()} GoTogether. All rides shared responsibly.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--color-mist)]">
            <span className="flex items-center gap-1.5"><HiOutlineMail className="h-4 w-4" /> support@gotogether.app</span>
            <span className="flex items-center gap-1.5"><HiOutlinePhone className="h-4 w-4" /> +91 90000 12345</span>
            <span className="flex items-center gap-1.5"><HiOutlineLocationMarker className="h-4 w-4" /> Bhopal, India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
