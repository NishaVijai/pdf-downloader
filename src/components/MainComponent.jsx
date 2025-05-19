export const MainComponent = ({ pdfUrl, onChange, onClick }) => {
  return (
    <main className="main-container">
      <input
        type="text"
        placeholder="Enter PDF URL"
        value={pdfUrl}
        onChange={onChange}
      />
      <button onClick={onClick}>
        Download PDF
      </button>
    </main>
  );
};
