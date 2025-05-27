import React, { forwardRef, useRef, useImperativeHandle } from "react";
import Papa from "papaparse";

export const CsvUpload = forwardRef(({ onData, onError }, ref) => {
  const inputRef = useRef();

  useImperativeHandle(ref, () => ({
    clear: () => {
      if (inputRef.current) inputRef.current.value = "";
    }
  }));

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
      <input ref={inputRef} type="file" accept=".csv" onChange={handleFileChange} />
    </label>
  );
});
