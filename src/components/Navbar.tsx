// src/components/Navbar.tsx
import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ConnectButton } from "@mysten/dapp-kit";
import type { RootState } from "../redux/store";
import { toggleDarkMode } from "../redux/themeSlice";

const Navbar: React.FC = () => {
  const dispatch = useDispatch();
  const darkMode = useSelector((state: RootState) => state.theme.darkMode);

  // Side effect to apply or remove the 'dark' class on body based on darkMode state
  useEffect(() => {
    const body = document.body;
    if (darkMode) {
      body.classList.add("dark");
    } else {
      body.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <nav className={`navbar ${darkMode ? "dark" : ""}`}>
      <div className="nav-links">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/swap">Swap</NavLink>
      </div>
      {/* Dark mode toggle button */}
      <button onClick={() => dispatch(toggleDarkMode())}>
        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>
      {/* Sui Wallet connect button (handled by dApp kit) */}
      <ConnectButton />
    </nav>
  );
};

export default Navbar;
