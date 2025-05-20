import { useState, useRef } from "react";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { isWorkingPdfUrl } from "../utils/isWorkingPdfUrl";

export function CsvToExcel() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [error, setError] = useState("");
  const [excelUrl, setExcelUrl] = useState("");

  const [checking, setChecking] = useState(false);
  const [checkResults, setCheckResults] = useState([]);
  const [checkTiming, setCheckTiming] = useState({ start: null, end: null });

  const [status, checkUrl] = isWorkingPdfUrl();

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
    setError("");
    setExcelUrl("");
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setError("No data found in CSV.");
          setData([]);
          setColumns([]);
          return;
        }
        const firstRow = results.data[0];
        const detectedColumns = firstRow ? Object.keys(firstRow) : [];
        setColumns(detectedColumns);

        const sanitizedData = results.data.map(sanitizeRow);
        setData(sanitizedData);
      },
      error: (err) => {
        setError("Failed to parse CSV: " + err.message);
        setData([]);
        setColumns([]);
      }
    });
  };

  const handleDownloadExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("CSV Converted To Excel Sheet");

    const hasCheckResults = checkResults.length > 0;
    const outputColumns = hasCheckResults ? [...columns, "Status"] : columns;

    worksheet.addRow(outputColumns);

    let statusMap = {};
    if (hasCheckResults) {
      checkResults.forEach(r => {
        statusMap[r.url] = r.working ? "Working" : "Not Working";
      });
    }

    data.forEach(row => {
      const rowData = columns.map(col => row[col]);
      if (hasCheckResults) {
        const url = row[columns[1]];
        rowData.push(statusMap[url] || "");
      }
      worksheet.addRow(rowData);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "converted_to_excel_sheet.xlsx");
  };

  const checkSecondColumnUrls = async () => {
    if (columns.length < 2 || !data.length) return;
    const urlCol = columns[1];
    const results = [];
    setChecking(true);
    setCheckResults([]);
    setCheckTiming({ start: new Date(), end: null });

    console.log("Checking URLs in column:", urlCol);
    console.log("Data length:", data.length);

    const rowsToCheck = data;
    // const rowsToCheck = data.slice(0, 10);
    // const rowsToCheck = data.slice(0, 150);

    const checkUrlWithTimeout = (url, ms = 10000) => {
      return Promise.race([
        checkUrl(url),
        new Promise(resolve => setTimeout(() => resolve(false), ms))
      ]);
    };
    for (let i = 0; i < rowsToCheck.length; i++) {
      const row = rowsToCheck[i];
      const url = row[urlCol];

      console.log(`Checking (${i + 1}/${rowsToCheck.length}): ${url}`);

      if (typeof url === "string" && url.startsWith("http")) {
        try {
          const ok = await checkUrlWithTimeout(url, 10000);
          results.push({ url, working: ok });
        } catch {
          results.push({ url, working: false });
        }
      } else {
        results.push({ url, working: false });
      }
    }

    setCheckResults(results);
    setCheckTiming(t => ({ ...t, end: new Date() }));
    setChecking(false);
  };


  return (
    <div className="csv-to-excel">
      <label>
        Upload CSV file:
        <input type="file" accept=".csv" onChange={handleFileChange} />
      </label>
      {error && <div className="error-message">{error}</div>}
      <div className="check-results">
        {data.length !== 0 && (
          <>
            <button onClick={checkSecondColumnUrls} disabled={checking}>
              {checking ? "Checking PDF URLs..." : "Check PDF URL's working status (Second Column)"}
            </button>

            {checking && (
              <div className="checking-urls-status">Checking PDF URLs, please wait...</div>
            )}

            <div>
              {checkTiming.start && (
                <>
                  <div>Start: {checkTiming.start.toLocaleTimeString()}</div>
                  {checkTiming.end && <div>End: {checkTiming.end.toLocaleTimeString()}</div>}
                  {checkTiming.end && (
                    <div>
                      Duration: {((checkTiming.end - checkTiming.start) / 1000).toFixed(2)} seconds
                    </div>
                  )}
                </>
              )}

              {checkTiming.end && (
                <button onClick={handleDownloadExcel}>Download Excel with PDF file URL's status</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
