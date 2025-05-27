import JSZip from "jszip";
import { saveAs } from "file-saver";
import { asyncPool } from "./csvUtils";
import ExcelJS from "exceljs";

const downloadedFilesSet = new Set();

export async function downloadWorkingPDFlinks({
  data,
  columns,
  checkResults,
  detectUrlColumns,
  setError,
  setDownloadingZip,
  setZipDownloaded,
  setDownloadProgress,
  setCurrentDownloading
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
        if (!downloadedFilesSet.has(url)) {
          workingLinks.push({ url, id: idx + 1 });
        }
        break;
      }
    }
  });

  if (workingLinks.length === 0) {
    setError("No new working links found to download.");
    setDownloadingZip(false);
    setDownloadProgress({ completed: 0, total: 0, start: null });
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
      if (setCurrentDownloading) setCurrentDownloading(url);

      console.log(`Downloading file: id-${id} url: ${url}`);
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

      downloadedFilesSet.add(url);
    } catch (err) {
      failedDownloads.push({ url, id });
    }
    setDownloadProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
  });

  if (setCurrentDownloading) setCurrentDownloading("");

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Status Sheet");
  worksheet.addRow(["id", "Status"]);

  let statusMap = {};
  if (checkResults && checkResults.length > 0) {
    checkResults.forEach(r => {
      statusMap[r.url] = r.working ? "Working" : "Not working";
    });
  }

  data.forEach(row => {
    const id = row["id"];
    let status = "Not working";
    for (const col of urlCols) {
      const url = row[col];
      if (typeof url === "string" && url.startsWith("http")) {
        if (statusMap[url] === "Working") {
          status = "Working";
          break;
        }
      }
    }
    worksheet.addRow([id, status]);
  });

  const excelBuffer = await workbook.xlsx.writeBuffer();
  zip.file("status_sheet.xlsx", excelBuffer);

  if (failedDownloads.length === workingLinks.length) {
    setError("Failed to download all working links. Please try again.");
    setDownloadingZip(false);
    setDownloadProgress({ completed: total, total, start: startTime });
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

export function resetDownloadedFilesSet() {
  downloadedFilesSet.clear();
}
