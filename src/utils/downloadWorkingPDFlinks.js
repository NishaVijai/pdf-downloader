import JSZip from "jszip";
import { saveAs } from "file-saver";
import { asyncPool } from "./csvUtils";

export async function downloadWorkingPDFlinks({
  data,
  columns,
  checkResults,
  detectUrlColumns,
  setError,
  setDownloadingZip,
  setZipDownloaded,
  setDownloadProgress,
}) {
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
  const total = workingLinks.length;
  const startTime = Date.now();
  setDownloadProgress({ completed: 0, total, start: startTime });

  await asyncPool(8, workingLinks, async ({ url, id }) => {
    try {
      const response = await fetch(`http://localhost:4000/download-pdf?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        failedDownloads.push({ url, id });
        setDownloadProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
        return;
      }
      const blob = await response.blob();
      let base = url.split("/").pop() || `file${++count}.pdf`;
      base = base.replace(/\(\d+\)/, "").replace(/\.pdf$/i, "");
      const filename = `id-${id}-${base}.pdf`;
      zip.file(filename, blob);
    } catch (err) {
      failedDownloads.push({ url, id });
    }
    setDownloadProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
  });

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
  saveAs(zipBlob, `working_pdfs_${workingLinks.length}.zip`);
  setDownloadingZip(false);
  setZipDownloaded(true);
  setDownloadProgress({ completed: total, total, start: startTime });
}
