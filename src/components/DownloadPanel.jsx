import { useState } from "react";
import { resetDownloadedFilesSet } from "../utils/downloadWorkingPDFlinks";

export function DownloadPanel({
  checkResults,
  downloadingZip,
  downloadProgress,
  zipDownloaded,
  onDownloadZip,
  onDownloadExcel,
  estimateDownloadTime,
  estimateZipTimeRemaining,
  data,
  columns,
  detectUrlColumns
}) {
  const [showExcelButton, setShowExcelButton] = useState(false);
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
    setShowExcelButton(false);
    setResetCount(c => c + 1);
    window.alert("Download reset! You can now download all working links again.");
  };

  const handleDownloadZipAndExcel = async () => {
    if (onDownloadZip) await onDownloadZip();
    setShowExcelButton(true);
  };

  const showSpans = resetCount === 0 || showExcelButton;

  return (
    <>
      {checkResults.length > 0 && (
        <>
          <button onClick={handleDownloadZipAndExcel} disabled={downloadingZip}>
            Download PDF files (ZIP)
            {showSpans && (
              <>
                <span className="span-message">
                  ({count} link{count === 1 ? "" : "s"} available)
                </span>
                <span className="span-message">
                  (Est. download time: {estimateDownloadTime({ data, columns, checkResults, detectUrlColumns })})
                </span>
              </>
            )}
          </button>
          <button onClick={handleResetDownload} disabled={downloadingZip} style={{ marginLeft: 12 }}>
            Reset Download
          </button>
          {showExcelButton && (
            <button onClick={onDownloadExcel} disabled={downloadingZip} style={{ marginLeft: 12 }}>
              Download a Excel File with PDF link status
            </button>
          )}
        </>
      )}
      {downloadingZip && (
        <div className="loading-message">
          Preparing ZIP file, please wait...<br />
          Downloaded: {downloadProgress.completed} / {downloadProgress.total}
          <br />
          Estimated time left: {estimateZipTimeRemaining(downloadProgress)}
        </div>
      )}
      {zipDownloaded && !downloadingZip && (
        <div className="success-message">
          ZIP download completed!
        </div>
      )}
    </>
  );
}
