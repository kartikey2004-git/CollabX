// The shared wrapper around every page inside the (auth) route group (login, signup, forgot-password, etc). Keeps a consistent full-height container.

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
