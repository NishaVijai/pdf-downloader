export const PreviewTableNewTab = ({ data, columns }) => {
  const handlePreview = () => {
    const tableHtml = `
    <html>
      <head>
        <title>CSV Preview</title>
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #333; padding: 8px; }
        </style>
      </head>
      <body>
        <h2>CSV Data Preview</h2>
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${columns.map(col => {
      const cell = row[col];
      if (col.toLowerCase().includes("url") && typeof cell === "string" && cell.startsWith("http")) {
        return `<td><a href="${cell}" target="_blank" rel="noopener noreferrer">${cell}</a></td>`;
      }
      return `<td>${cell ?? ""}</td>`;
    }).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

    const win = window.open();

    if (win) {
      win.document.documentElement.innerHTML = tableHtml;
    }
  };

  return (
    <button onClick={handlePreview} style={{ marginLeft: 10 }}>
      Preview Excel
    </button>
  );
}
