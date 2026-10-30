import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    if (window.location.pathname === '/') {
      window.location.replace('/study/batches');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 mb-6">
        <img
          src="/gb-study-logo.png"
          alt="GB STUDY"
          className="w-16 h-16 rounded-2xl shadow-lg border border-emerald-500/30 object-cover"
        />
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
          GB STUDY
        </h1>
      </div>
      <p className="text-slate-400 mb-6 text-center max-w-md">
        Redirecting to batches portal...
      </p>
      <a
        href="/study/batches"
        className="px-6 py-2.5 rounded-xl font-medium bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all duration-200"
      >
        Open Batches Portal
      </a>
    </div>
  );
}
