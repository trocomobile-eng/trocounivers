import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./i18n";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";

import "./index.css";
import "leaflet/dist/leaflet.css";
import "./styles/troco-layout-cohesion.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
