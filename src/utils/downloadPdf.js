export function downloadPdf(url) {
  const link = document.createElement("a");
  link.href = url;
  link.download = "downloaded.pdf";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
