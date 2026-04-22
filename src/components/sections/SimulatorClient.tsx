"use client";

import Simulator from "./Simulator";

export default function SimulatorClient() {
  const scrollToContact = () => {
    document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
  };

  return <Simulator onContactClick={scrollToContact} />;
}
