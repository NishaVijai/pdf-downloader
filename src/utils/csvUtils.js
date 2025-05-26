export function detectUrlColumns(data, columns) {
  if (!data.length || !columns.length) return [];
  const firstRow = data[0];
  return columns.filter(col => {
    const value = firstRow[col];
    return typeof value === "string" && value.trim().startsWith("http");
  });
}

export function formatDuration(start, end) {
  if (!start || !end) return "";
  const durationMs = end - start;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = ((durationMs % 60000) / 1000).toFixed(2);
  return `${minutes > 0 ? `${minutes} min ` : ""}${seconds} sec`;
}

export function estimateTimeRemaining({ checkTiming, checking, checkResults, data }) {
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
}

export function estimateDownloadTime({ data, columns, checkResults, detectUrlColumns }) {
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
}

export function estimateZipTimeRemaining(progress) {
  if (!progress.start || progress.completed === 0) return "";
  const elapsedMs = Date.now() - progress.start;
  const avgMsPerFile = elapsedMs / progress.completed;
  const filesLeft = progress.total - progress.completed;
  const estMsLeft = avgMsPerFile * filesLeft;
  const minutes = Math.floor(estMsLeft / 60000);
  const seconds = ((estMsLeft % 60000) / 1000).toFixed(0);
  return `${minutes > 0 ? `${minutes} min ` : ""}${seconds} sec`;
}

export function checkUrlWithTimeout(checkUrl, url, ms = 10000) {
  return Promise.race([
    checkUrl(url),
    new Promise(resolve => setTimeout(() => resolve(false), ms))
  ]);
}

export async function asyncPool(poolLimit, array, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);

    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}
