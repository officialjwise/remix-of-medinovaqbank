import { Link } from "@tanstack/react-router";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-14 md:grid-cols-5">
        <div className="md:col-span-2">
          <p className="text-lg font-bold tracking-tight">
            Medinova<span className="text-accent">qbank</span>
          </p>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Master Medicine. Ace Every Exam. A professional question bank built for
            Ghanaian and international medical practitioners.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Product</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/login" className="hover:text-foreground">Sign in</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Support</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/help" className="hover:text-foreground">Help center</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Legal</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/terms" className="hover:text-foreground">Terms of service</Link></li>
            <li><Link to="/privacy" className="hover:text-foreground">Privacy policy</Link></li>
            <li><Link to="/refund" className="hover:text-foreground">Refund policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col items-start justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Medinovaqbank. All rights reserved.</p>
          <p>Made with care in Accra, Ghana.</p>
        </div>
      </div>
    </footer>
  );
}
