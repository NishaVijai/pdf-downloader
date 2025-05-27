import { useState } from "react";
import { resetDownloadedFilesSet } from "../utils/downloadWorkingPDFlinks";

export function DownloadPanel({
  checkResults,
  downloadingZip,
  downloadProgress,
  zipDownloaded,
  currentDownloading,
  onDownloadZip,
  data,
  columns,
  detectUrlColumns,
  checkTiming,
  checking,
  setError
}) {
  const [resetCount, setResetCount] = useState(0);

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
  const count = workingLinks.length;

  const totalToShow =
    downloadProgress && downloadProgress.total
      ? downloadProgress.total
      : count;
  const completedToShow =
    downloadProgress && typeof downloadProgress.completed === "number"
      ? downloadProgress.completed
      : 0;

  const handleResetDownload = () => {
    resetDownloadedFilesSet();
    setResetCount(c => c + 1);
    if (setError) setError("");
    window.alert("Download reset! You can now download all working links again.");
  };

  const handleDownloadZip = async () => {
    if (onDownloadZip) await onDownloadZip();
    setResetCount(0);
  };

  const showSpans = resetCount === 0;

  const checkingCompleted = checkTiming && checkTiming.end && !checking;

  return (
    <>
      {checkResults.length > 0 && checkingCompleted && (
        <div className="download-panel">
          <button onClick={handleDownloadZip} disabled={downloadingZip}>
            Download PDF files (ZIP)
            {showSpans && (
              <>
                <span className="span-message">
                  ({count} link{count === 1 ? "" : "s"} available)
                </span>
              </>
            )}
          </button>
          <button onClick={handleResetDownload} disabled={downloadingZip}>
            Reset Download
          </button>
        </div>
      )}

      {downloadingZip && (
        <div className="loading-message">
          <p>Preparing ZIP file, please wait...</p>
          <p>
            Downloaded: {completedToShow} / {totalToShow}
          </p>
          {currentDownloading && (
            <p>
              Downloading: <span style={{ wordBreak: "break-all" }}>{currentDownloading}</span>
            </p>
          )}
        </div>
      )}

      <div className="zip-download-status">
        {zipDownloaded && !downloadingZip && resetCount === 0 && (
          <p className="success-message">ZIP download completed!</p>
        )}
        {resetCount > 0 && (
          <p className="success-message">Reset button pressed</p>
        )}
      </div>
    </>
  );
}
