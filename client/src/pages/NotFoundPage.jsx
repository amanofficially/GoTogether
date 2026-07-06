import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import RouteLine from "../components/ui/RouteLine";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-5 text-center">
      <p className="font-mono-tag text-xs uppercase text-[var(--color-route)]">Route not found</p>
      <h1 className="mt-3 font-display text-5xl font-semibold text-[var(--color-ink)]">404</h1>
      <p className="mt-3 text-[var(--color-line)]">This page took a wrong turn and isn't on our map.</p>
      <div className="my-8 w-full">
        <RouteLine stops={[{ label: "You" }, { label: "???" }, { label: "Home" }]} />
      </div>
      <Button as={Link} to="/">Back to home</Button>
    </div>
  );
}
