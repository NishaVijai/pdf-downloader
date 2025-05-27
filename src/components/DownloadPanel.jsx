import { useState } from "react";
import { resetDownloadedFilesSet } from "../utils/downloadWorkingPDFlinks";

export function DownloadPanel({
  checkResults,
  downloadingZip,
  downloadProgress,
  zipDownloaded,
  onDownloadZip,
  data,
  columns,
  detectUrlColumns
}) {
  const [resetCount, setResetCount] = useState(0);

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

  const handleResetDownload = () => {
    resetDownloadedFilesSet();
    setResetCount(c => c + 1);
    window.alert("Download reset! You can now download all working links again.");
  };

  const handleDownloadZip = async () => {
    if (onDownloadZip) await onDownloadZip();
    setResetCount(0);
  };

  const showSpans = resetCount === 0;

  return (
    <>
      {checkResults.length > 0 && (
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
          <p>Downloaded: {downloadProgress.completed} / {downloadProgress.total}</p>
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
