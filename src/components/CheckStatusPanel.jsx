import { useState } from "react";

export function CheckStatusPanel({
  data,
  checking,
  checkResults,
  checkTiming,
  onCheck,
  formatDuration,
  estimateTimeRemaining
}) {
  const [showStatus, setShowStatus] = useState(false);

  const handleCheckClick = async () => {
    setShowStatus(true);
    await onCheck();
  };

  return (
    <div>
      <button onClick={handleCheckClick} disabled={checking || checkTiming.end}>
        {checking ? "Checking PDF URLs..." : "Check PDF URL's working status"}
      </button>
      {showStatus && (
        <>
          {checkTiming.end && !checking && <div className="success-message">Checking Completed</div>}
          {checking && <div className="checking-urls-status">Checking PDF URLs, please wait...</div>}
          <div>
            <strong>Total rows:</strong> {data.length}
            <br />
            <strong>URL link's being checked:</strong> {checking ? Math.min(checkResults.length, data.length) : checkResults.length}
            <br />
            <strong>Link's left to check:</strong> {checking ? Math.max(data.length - checkResults.length, 0) : 0}
            <br />
            {checkTiming.start && (
              <>
                <div>Start: {checkTiming.start.toLocaleTimeString()}</div>
                {checkTiming.end && <div>End: {checkTiming.end.toLocaleTimeString()}</div>}
              </>
            )}
            {checkTiming.end && (
              <div>
                Duration: {formatDuration(checkTiming.start, checkTiming.end)}
              </div>
            )}
            <br />
            {checking && checkResults.length > 0 && (
              <span>
                <strong>Estimated remaining time to finish checking:</strong> {estimateTimeRemaining({ checkTiming, checking, checkResults, data })}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
