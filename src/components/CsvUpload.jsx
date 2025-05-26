import Papa from "papaparse";

export function CsvUpload({ onData, onError }) {
  const sanitizeRow = (row) => {
    const clean = {};
    for (const key in row) {
      if (
        Object.prototype.hasOwnProperty.call(row, key) &&
        key !== "__proto__" &&
        key !== "constructor"
      ) {
        clean[key] = row[key];
      }
    }
    return clean;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          onError("No data found in CSV.");
          onData([], []);
          return;
        }
        const columns = Object.keys(results.data[0] || {});

        const sanitizedData = results.data.map(sanitizeRow);
        onData(sanitizedData, columns);
      },
      error: (err) => {
        onError("Failed to parse CSV: " + err.message);
        onData([], []);
      }
    });
  };

  return (
    <label>
      Upload CSV file:
      <input type="file" accept=".csv" onChange={handleFileChange} />
    </label>
  );
}
