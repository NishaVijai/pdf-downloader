import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export async function exportToExcel({ data, columns, checkResults, detectUrlColumns }) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("CSV Converted To Excel Sheet");

  const outputColumns = [...columns, "Working/Downloaded URL", "Not working/not downloaded URL"];
  worksheet.addRow(outputColumns);

  let statusMap = {};
  if (checkResults && checkResults.length > 0) {
    checkResults.forEach(r => {
      statusMap[r.url] = r.working ? "Working/Downloaded" : "Not working/not downloaded";
    });
  }

  const urlCols = detectUrlColumns(data, columns);

  data.forEach(row => {
    const rowData = columns.map(col => row[col]);
    let workingUrl = "";
    let notWorkingUrl = "";

    for (const col of urlCols) {
      const url = row[col];
      if (typeof url === "string" && url.startsWith("http")) {
        if (statusMap[url] === "Working/Downloaded" && !workingUrl) {
          workingUrl = url;
        } else if (statusMap[url] === "Not working/not downloaded" && !notWorkingUrl) {
          notWorkingUrl = url;
        }

        if (workingUrl && notWorkingUrl) break;
      }
    }

    rowData.push(workingUrl, notWorkingUrl);
    worksheet.addRow(rowData);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), "converted_to_excel_sheet.xlsx");
}
