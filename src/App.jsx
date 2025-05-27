import React from 'react';
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { MainComponent } from "./components/MainComponent";

function App() {
  return (
    <div className="main-container">
      <Header />
      <MainComponent columns={["url", "status"]} />
      <Footer />
    </div>
  );
}

export default App;
