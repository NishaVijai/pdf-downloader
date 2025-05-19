import { useState } from "react";
import { downloadPdf } from "./utils/downloadPdf";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { MainComponent } from "./components/MainComponent";

function App() {
  const [pdfUrl, setPdfUrl] = useState("");

  const handleDownload = () => {
    const urlPattern = /^(https?:\/\/)[^\s/$.?#].[^\s]*\.pdf$/i;
    if (!pdfUrl || !urlPattern.test(pdfUrl)) {
      alert("Please enter a valid PDF URL.");
      return;
    }

    downloadPdf(pdfUrl);
  };

  const handleOnChange = (e) => {
    const { value } = e.target;
    setPdfUrl(value);
  }

  return (
    <div className="main-container">
      <Header />
      <MainComponent pdfUrl={pdfUrl} onChange={handleOnChange} onClick={handleDownload} />
      <Footer />
    </div>
  );
}

export default App;
