// src/App.tsx
import React, { useEffect } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ConnectButton } from "@mysten/dapp-kit";
import { RootState } from "./redux/store";
import { toggleDarkMode } from "./redux/themeSlice";
import Home from "./pages/Home";
import Swap from "./pages/Swap";

const App: React.FC = () => {
  const dispatch = useDispatch();
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", isDarkMode);
  }, [isDarkMode]);

  return (
    <div>
      <header className="p-4 bg-gray-200 dark:bg-gray-800 flex justify-between items-center">
        <div>
          <Link to="/" className="mr-4 font-bold">
            Cerebra
          </Link>
          <Link to="/swap" className="mr-4">
            Swap
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => dispatch(toggleDarkMode())}
            className="px-2 py-1 border rounded"
          >
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <ConnectButton />
        </div>
      </header>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/swap" element={<Swap />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="p-4 text-center text-sm">
        &copy; 2025 Cerebra. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
