import { useState } from "react";
import { isWorkingPdfUrl } from "../utils/isWorkingPdfUrl";
import {
  detectUrlColumns,
  formatDuration,
  estimateTimeRemaining,
  estimateDownloadTime,
  estimateZipTimeRemaining,
  checkUrlWithTimeout,
  asyncPool
} from "../utils/csvUtils";
import { exportToExcel } from "../utils/exportToExcel";
import { downloadWorkingPDFlinks } from "../utils/downloadWorkingPDFlinks";
import { urlChecker } from "../utils/urlChecker";

import { CsvUpload } from "./CsvUpload";
import { CheckStatusPanel } from "./CheckStatusPanel";
import { DownloadPanel } from "./DownloadPanel";

export function CsvToExcel() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkResults, setCheckResults] = useState([]);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipDownloaded, setZipDownloaded] = useState(false);
  const [checkTiming, setCheckTiming] = useState({ start: null, end: null });
  const [downloadProgress, setDownloadProgress] = useState({ completed: 0, total: 0, start: null });

  const [status, checkUrl] = isWorkingPdfUrl();

  const checkUrlLink = async () => {
    await urlChecker({
      data,
      columns,
      detectUrlColumns,
      setError,
      setChecking,
      setCheckResults,
      setCheckTiming,
      checkUrlWithTimeout,
      asyncPool,
      checkUrl,
    });
  };

  const handleDownloadExcel = async () => {
    await exportToExcel({
      data,
      columns,
      checkResults,
      detectUrlColumns
    });
  };

  const handleDownloadWorkingLinks = async () => {
    await downloadWorkingPDFlinks({
      data,
      columns,
      checkResults,
      detectUrlColumns,
      setError,
      setDownloadingZip,
      setZipDownloaded,
      setDownloadProgress,
    });
  };

  return (
    <div className="csv-to-excel">
      <CsvUpload
        onData={(rows, cols) => { setData(rows); setColumns(cols); }}
        onError={setError}
      />
      {error && <div className="error-message">{error}</div>}
      {data.length !== 0 && (
        <>
          <CheckStatusPanel
            data={data}
            checking={checking}
            checkResults={checkResults}
            checkTiming={checkTiming}
            onCheck={checkUrlLink}
            formatDuration={formatDuration}
            estimateTimeRemaining={estimateTimeRemaining}
          />
          <DownloadPanel
            checkResults={checkResults}
            downloadingZip={downloadingZip}
            downloadProgress={downloadProgress}
            zipDownloaded={zipDownloaded}
            onDownloadZip={handleDownloadWorkingLinks}
            onDownloadExcel={handleDownloadExcel}
            estimateDownloadTime={estimateDownloadTime}
            estimateZipTimeRemaining={estimateZipTimeRemaining}
            data={data}
            columns={columns}
            detectUrlColumns={detectUrlColumns}
          />
        </>
      )}
    </div>
  );
}
