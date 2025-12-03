import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import Header from "@/react-app/components/Header";
import Hero from "@/react-app/components/Hero";
import HowItWorks from "@/react-app/components/HowItWorks";
import Product from "@/react-app/components/Product";
import Testimonials from "@/react-app/components/Testimonials";
import FAQ from "@/react-app/components/FAQ";
import Footer from "@/react-app/components/Footer";
// Modais antigos removidos; direcionamos para página de login

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header 
        onLoginClick={() => (window.location.href = "/login")}
        onRegisterClick={() => (window.location.href = "/cadastro")}
        isLoggedIn={loggedIn}
      />
      <Hero 
        onLoginClick={() => (window.location.href = "/login")}
        onRegisterClick={() => (window.location.href = "/cadastro")}
        isLoggedIn={loggedIn}
      />
      <HowItWorks />
      <Product isLoggedIn={loggedIn} />
      <Testimonials />
      <FAQ />
      <Footer />
      {/* Login/Register modals removidos; fluxo via página /admin/login */}
    </div>
  );
}
