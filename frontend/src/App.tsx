// Default Import

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layout

import Layout from "@/layouts/root-layout";

// Utility Pages / Components

import ScrollToTop from "./utility/ScrollToTop";
import ScrollToTopFunction from "./utility/ScrollToTopFunction";
import NotFoundPage from "./pages/Utility/NotFound404";

// Pages

import LandingPage from "@/pages/Landing/page";

function App() {

  return (

    // Providers, Router, Scroll to Top Function and Button, and Custom Cursor

    <BrowserRouter>
      <ScrollToTopFunction />
      <ScrollToTop />

          <Routes>

            <Route path="/" element={<Layout />}>
              
                <Route index element={<LandingPage/>} />

            </Route>

            <Route path="*" element={<NotFoundPage />} />

          </Routes>

      <Toaster position="top-center" />

    </BrowserRouter>

  );
}

export default App;