import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  mode: 'dark' | 'light';
}

export const Layout: React.FC<LayoutProps> = ({ children, mode }) => {
  const isDark = mode === 'dark';

  return (
    <div className={`min-h-screen font-body transition-colors duration-700 flex flex-col items-center 
      ${isDark ? 'bg-darkBg text-parchment selection:bg-accent selection:text-white' : 'bg-parchment text-ink selection:bg-accent selection:text-white'}`}>
      
      {/* Texture Overlay - Subtle Noise */}
      <div className={`fixed inset-0 pointer-events-none opacity-[0.04] z-50 mix-blend-overlay
        ${isDark ? "bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" : "bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')]"} 
      `}></div>
      
      {/* Main Content Area */}
      <main className="w-full max-w-5xl px-6 py-12 flex-grow flex flex-col relative z-10">
        <div className="w-full h-full flex flex-col">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className={`w-full text-center py-6 text-xs font-display tracking-widest uppercase z-10 
        ${isDark ? 'text-parchment/30' : 'text-subtext/40'}`}>
        BACKBENCHERS KNOWLEDGE ENGINE v2.1
      </footer>
    </div>
  );
};