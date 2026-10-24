import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B1220] text-slate-100 font-sans">
      <Navbar />
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0B1220] to-[#111C30] p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
