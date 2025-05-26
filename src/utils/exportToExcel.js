import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export async function exportToExcel({ data, columns, checkResults, detectUrlColumns }) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("CSV Converted To Excel Sheet");

  const hasCheckResults = checkResults.length > 0;
  const outputColumns = hasCheckResults ? [...columns, "Status"] : columns;

  worksheet.addRow(outputColumns);

  let statusMap = {};
  if (hasCheckResults) {
    checkResults.forEach(r => {
      statusMap[r.url] = r.working ? "Working" : "Not Working";
    });
  }

  const urlCols = detectUrlColumns(data, columns);

  data.forEach(row => {
    const rowData = columns.map(col => row[col]);
    if (hasCheckResults && urlCols.length) {
      let url = null;
      for (const col of urlCols) {
        if (typeof row[col] === "string" && row[col].startsWith("http")) {
          url = row[col];
          if (statusMap[url] === "Working") break;
        }
      }
      rowData.push(url ? statusMap[url] || "" : "");
    }
    worksheet.addRow(rowData);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), "converted_to_excel_sheet.xlsx");
}
