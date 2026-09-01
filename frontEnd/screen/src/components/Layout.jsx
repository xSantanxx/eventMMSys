function Layout({ children, className = '' }) {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-8">
        {children}
      </main>
    </div>
  );
}

export default Layout;
