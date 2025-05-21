import { useState, useRef } from "react";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { isWorkingPdfUrl } from "../utils/isWorkingPdfUrl";

export function CsvToExcel() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [error, setError] = useState("");
  const [excelUrl, setExcelUrl] = useState("");

  const [checking, setChecking] = useState(false);
  const [checkResults, setCheckResults] = useState([]);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipDownloaded, setZipDownloaded] = useState(false);

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

  const detectUrlColumns = (data, columns) => {
    if (!data.length || !columns.length) return [];
    const firstRow = data[0];
    return columns.filter(col => {
      const value = firstRow[col];
      return typeof value === "string" && value.trim().startsWith("http");
    });
  };

  const checkUrlLink = async () => {
    if (!data.length || !columns.length) return;
    const urlCols = detectUrlColumns(data, columns);
    if (!urlCols.length) {
      setError("No URL column detected in the uploaded CSV.");
      return;
    }
    const results = [];
    setChecking(true);
    setCheckResults([]);
    setCheckTiming({ start: new Date(), end: null });

    console.log("Checking URLs in columns:", urlCols);
    console.log("Data length:", data.length);

    const rowsToCheck = data;
    // const rowsToCheck = data.slice(0, 10);
    // const rowsToCheck = data.slice(0, 50);

    const checkUrlWithTimeout = (url, ms = 10000) => {
      return Promise.race([
        checkUrl(url),
        new Promise(resolve => setTimeout(() => resolve(false), ms))
      ]);
    };

    for (let i = 0; i < rowsToCheck.length; i++) {
      const row = rowsToCheck[i];
      let foundWorking = false;
      let checkedUrl = null;

      for (const col of urlCols) {
        const url = row[col];
        if (typeof url === "string" && url.startsWith("http")) {
          checkedUrl = url;
          try {
            const ok = await checkUrlWithTimeout(url, 10000);
            results.push({ url, working: ok });
            setCheckResults([...results]);

            console.log(
              `Row ${i + 1}, Column "${col}": Checked URL: ${url} - ${ok ? "WORKING" : "NOT WORKING"}`
            );
            if (ok) {
              foundWorking = true;
              break;
            }
          } catch {
            results.push({ url, working: false });
            setCheckResults([...results]);

            console.log(
              `Row ${i + 1}, Column "${col}": Checked URL: ${url} - NOT WORKING`
            );
          }
        }
      }
      if (!checkedUrl) {
        results.push({ url: null, working: false });
        setCheckResults([...results]);
      }
    }

    setCheckResults(results);
    setCheckTiming(t => ({ ...t, end: new Date() }));
    setChecking(false);
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

    const urlCols = detectUrlColumns(data, columns);

    data.forEach(row => {
      const rowData = columns.map(col => row[col]);
      if (hasCheckResults && urlCols.length) {
        let url = null;
        for (const col of urlCols) {
          if (typeof row[col] === "string" && row[col].startsWith("http")) {
            url = row[col];
            if (statusMap[url] === "Working") break;
          }
        }
        rowData.push(url ? statusMap[url] || "" : "");
      }
      worksheet.addRow(rowData);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "converted_to_excel_sheet.xlsx");
  };

  const handleDownloadWorkingLinks = async () => {
    if (!checkResults.length) {
      setError("No check results available. Please check URLs first.");
      return;
    }
    setDownloadingZip(true);
    setZipDownloaded(false);
    setError("");
    const urlCols = detectUrlColumns(data, columns);
    const workingLinks = [];
    data.forEach((row, idx) => {
      for (const col of urlCols) {
        const url = row[col];
        if (
          typeof url === "string" &&
          url.startsWith("http") &&
          checkResults.find(r => r.url === url && r.working)
        ) {
          workingLinks.push({ url, id: idx + 1 });
          break;
        }
      }
    });

    if (workingLinks.length === 0) {
      setError("No working links found.");
      setDownloadingZip(false);
      return;
    }

    const zip = new JSZip();
    let count = 0;
    let failedDownloads = [];
    for (const { url, id } of workingLinks) {
      try {
        const response = await fetch(`http://localhost:4000/download-pdf?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
          failedDownloads.push({ url, id });
          continue;
        }
        const blob = await response.blob();
        let base = url.split("/").pop() || `file${++count}.pdf`;
        base = base.replace(/\(\d+\)/, "").replace(/\.pdf$/i, "");
        const filename = `id-${id}-${base}.pdf`;
        // const filename = `${base}(${id}).pdf`;

        // let base = url.split("/").pop() || `file${++count}.pdf`;
        // base = base.replace(/(\(\d+\))?(?=\.pdf$)/i, "");
        // const filename = `${base.replace(/\.pdf$/i, "")}(${id}).pdf`;

        zip.file(filename, blob);
      } catch (err) {
        failedDownloads.push({ url, id });
      }
    }

    if (failedDownloads.length === workingLinks.length) {
      setError("Failed to download all working links. Please try again.");
      setDownloadingZip(false);
      return;
    } else if (failedDownloads.length > 0) {
      setError(
        `Some files could not be downloaded (${failedDownloads.length} of ${workingLinks.length}). The rest will be in the ZIP.`
      );
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "working_pdfs.zip");
    setDownloadingZip(false);
    setZipDownloaded(true);
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return "";
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = ((durationMs % 60000) / 1000).toFixed(2);
    return `${minutes > 0 ? `${minutes} min ` : ""}${seconds} sec`;
  };

  const estimateTimeRemaining = () => {
    if (!checkTiming.start || !checking) return "";
    const checkedCount = checkResults.length;
    if (checkedCount === 0) return "";
    const elapsedMs = new Date() - checkTiming.start;
    const avgMsPerRow = elapsedMs / checkedCount;
    const rowsLeft = data.length - checkedCount;
    const estMsLeft = avgMsPerRow * rowsLeft;
    const minutes = Math.floor(estMsLeft / 60000);
    const seconds = ((estMsLeft % 60000) / 1000).toFixed(2);
    return `${minutes > 0 ? `${minutes} min ` : ""}${seconds} sec`;
  };

  const estimateDownloadTime = () => {
    const urlCols = detectUrlColumns(data, columns);
    let count = 0;
    data.forEach(row => {
      for (const col of urlCols) {
        const url = row[col];
        if (
          typeof url === "string" &&
          url.startsWith("http") &&
          checkResults.find(r => r.url === url && r.working)
        ) {
          count++;
          break;
        }
      }
    });

    const totalSeconds = count * 2;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(0);
    return `${minutes > 0 ? `${minutes} min ` : ""}${seconds} sec`;
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
            {/* <button onClick={checkUrlLink} disabled={checking || checkTiming.end}>
              {checking
                ? "Checking PDF URLs..."
                : checkTiming.end
                  ? "Checking Completed"
                  : "Check PDF URL's working status"}
            </button> */}

            <button onClick={checkUrlLink} disabled={checking || checkTiming.end}>
              {checking
                ? "Checking PDF URLs..."
                : "Check PDF URL's working status"}
            </button>

            {checkTiming.end && !checking && (
              <div className="success-message">
                Checking Completed
              </div>
            )}

            {checking && (
              <div className="checking-urls-status">Checking PDF URLs, please wait...</div>
            )}

            <div>
              <strong>Total rows:</strong> {data.length}
              <br />
              <strong>Files being checked:</strong>{" "}
              {checking
                ? Math.min(checkResults.length, data.length)
                : checkResults.length}
              <br />
              <strong>Rows left to check:</strong>{" "}
              {checking
                ? Math.max(data.length - checkResults.length, 0)
                : 0}
              <br />

              {checkTiming.start && (
                <>
                  <div>Start: {checkTiming.start.toLocaleTimeString()}</div>
                  {checkTiming.end && <div>End: {checkTiming.end.toLocaleTimeString()}</div>}
                  {checkTiming.end && (
                    <div>
                      Duration: {formatDuration(checkTiming.start, checkTiming.end)}
                    </div>
                  )}
                </>
              )}

              <br />

              {checking && checkResults.length > 0 && (
                <span>
                  <strong>Estimated remaining time to finish checking:</strong> {estimateTimeRemaining()}
                </span>
              )}

              {checkResults.length > 0 && (
                <button onClick={handleDownloadWorkingLinks} disabled={downloadingZip}>
                  Download PDF files (ZIP)
                  <span className="span-message">
                    (
                    {
                      (() => {
                        const urlCols = detectUrlColumns(data, columns);
                        let count = 0;
                        data.forEach(row => {
                          for (const col of urlCols) {
                            const url = row[col];
                            if (
                              typeof url === "string" &&
                              url.startsWith("http") &&
                              checkResults.find(r => r.url === url && r.working)
                            ) {
                              count++;
                              break;
                            }
                          }
                        });
                        return `${count} link${count === 1 ? "" : "s"} available`;
                      })()
                    }
                    )
                  </span>
                  <span className="span-message">
                    (Est. download time: {estimateDownloadTime()})
                  </span>
                </button>
              )}

              {downloadingZip && (
                <div className="loading-message">
                  Preparing ZIP file, please wait... (This may take up to {estimateDownloadTime()})
                </div>
              )}

              {zipDownloaded && !downloadingZip && (
                <div className="success-message">
                  ZIP download completed!
                </div>
              )}

              {checkTiming.end && (
                <button onClick={handleDownloadExcel}>Download as a Excel File with PDF link status</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
