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
  const rowsToCheck = data.slice(150, 200);
  // const rowsToCheck = data.slice(150, 250);

  const tasks = rowsToCheck.map((row, i) => async () => {
    let foundWorking = false;
    let foundUrl = null;
    let foundNonWorkingUrl = null;

    for (const col of urlCols) {
      const url = row[col];
      if (typeof url === "string" && url.startsWith("http")) {
        foundUrl = url;
        try {
          const ok = await checkUrlWithTimeout(checkUrl, url, 10000);
          if (ok) {
            setCheckResults(prev => [...prev, { url, working: true }]);
            console.log(
              `Row ${i + 1}, Column "${col}": Checked URL: ${url} - WORKING`
            );
            foundWorking = true;
            break;
          } else {
            if (!foundNonWorkingUrl) foundNonWorkingUrl = url;
            console.log(
              `Row ${i + 1}, Column "${col}": Checked URL: ${url} - NOT WORKING`
            );
          }
        } catch {
          if (!foundNonWorkingUrl) foundNonWorkingUrl = url;
          console.log(
            `Row ${i + 1}, Column "${col}": Checked URL: ${url} - NOT WORKING`
          );
        }
      }
    }

    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    if (!foundWorking) {
      setCheckResults(prev => [
        ...prev,
        { url: foundNonWorkingUrl || null, working: false }
      ]);
    }
  });

  await asyncPool(10, tasks, task => task());

  setCheckTiming(t => ({ ...t, end: new Date() }));
  setChecking(false);
}
