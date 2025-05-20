import { useState } from "react";

export const isWorkingPdfUrl = () => {
  const [status, setStatus] = useState(null);

  const checkUrl = async (url) => {
    try {
      const response = await fetch(`http://localhost:4000/check-pdf?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      setStatus(data.ok);
      return data.ok;
    } catch (error) {
      setStatus(false);
      return false;
    }
  };

  return [status, checkUrl];
}
