// src/pages/Home.tsx
import React from "react";

const Home: React.FC = () => {
  return (
    <div style={{ padding: "1rem" }}>
      <h1>Welcome to the Sui Swap Demo</h1>
      <p>
        This demo showcases a Vite + React + TypeScript app with Redux Toolkit,
        React Router, and Sui Wallet integration.
      </p>
      <p>Use the navigation above to try the token swap interface.</p>
    </div>
  );
};

export default Home;
