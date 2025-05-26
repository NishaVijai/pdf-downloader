import React from 'react';
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { CsvToExcel } from "./components/CsvToExcel";

function App() {
  return (
    <div className="main-container">
      <Header />
      <CsvToExcel columns={["url", "status"]} />
      <Footer />
    </div>
  );
}

export default App;
