export function DownloadPanel({
  checkResults,
  downloadingZip,
  downloadProgress,
  zipDownloaded,
  onDownloadZip,
  estimateDownloadTime,
  estimateZipTimeRemaining,
  data,
  columns,
  detectUrlColumns
}) {
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

  return (
    <>
      {checkResults.length > 0 && (
        <button onClick={onDownloadZip} disabled={downloadingZip}>
          Download PDF files (ZIP)
          <span className="span-message">
            ({count} link{count === 1 ? "" : "s"} available)
          </span>
          <span className="span-message">
            (Est. download time: {estimateDownloadTime({ data, columns, checkResults, detectUrlColumns })})
          </span>
        </button>
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
