export async function urlChecker({
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
}) {
  if (!data.length || !columns.length) return;
  const urlCols = detectUrlColumns(data, columns);
  if (!urlCols.length) {
    setError("No URL column detected in the uploaded CSV.");
    return;
  }
  setChecking(true);
  setCheckResults([]);
  setCheckTiming({ start: new Date(), end: null });

  // const rowsToCheck = data;
  const rowsToCheck = data.slice(0, 50);

  const tasks = rowsToCheck.map((row, i) => async () => {
    let foundWorking = false;
    let checkedUrl = null;
    for (const col of urlCols) {
      const url = row[col];
      if (typeof url === "string" && url.startsWith("http")) {
        checkedUrl = url;
        try {
          const ok = await checkUrlWithTimeout(checkUrl, url, 10000);
          setCheckResults(prev => [...prev, { url, working: ok }]);

          console.log(
            `Row ${i + 1}, Column "${col}": Checked URL: ${url} - ${ok ? "WORKING" : "NOT WORKING"}`
          );
          if (ok) {
            foundWorking = true;
            break;
          }
        } catch {
          setCheckResults(prev => [...prev, { url, working: false }]);
          console.log(
            `Row ${i + 1}, Column "${col}": Checked URL: ${url} - NOT WORKING`
          );
        }
      }
    }
    if (!checkedUrl) {
      setCheckResults(prev => [...prev, { url: null, working: false }]);
    }
  });

  await asyncPool(10, tasks, task => task());

  setCheckTiming(t => ({ ...t, end: new Date() }));
  setChecking(false);
}
