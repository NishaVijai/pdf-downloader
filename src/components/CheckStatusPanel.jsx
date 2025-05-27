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
    <div className="check-status-panel">
      <button
        className="check-status-button"
        onClick={handleCheckClick}
        disabled={checking || checkTiming.end}
      >
        {checking
          ? "Checking PDF URLs..."
          : checkTiming.end && showStatus
            ? "Choose a file to check PDF URL's again"
            : "Check working PDF URL's"}
      </button>
      {showStatus && (
        <>
          <div className="check-status-panel-message">
            {checkTiming.end && !checking && <p className="success-message">Checking Completed</p>}
            {checking && <div className="checking-urls-status">Checking PDF URLs, please wait...</div>}
          </div>
          <div className="check-status-panel-process-message">
            <strong>Total rows:</strong> {data.length}
            <br />
            <strong>URL link's being checked:</strong> {checking ? Math.min(checkResults.length, data.length) : checkResults.length}
            <br />
            <strong>Link's left to check:</strong> {checking ? Math.max(data.length - checkResults.length, 0) : 0}
            <br />
            {checkTiming.start && (
              <>
                <strong>Start: </strong> {checkTiming.start.toLocaleTimeString()}
                {checkTiming.end && (
                  <>
                    <strong>End: </strong>{checkTiming.end.toLocaleTimeString()}
                  </>
                )}
              </>
            )}
            {checkTiming.end && (
              <>
                <strong>
                  Duration: </strong> {formatDuration(checkTiming.start, checkTiming.end)}
              </>
            )}
            <br />
            {checking && checkResults.length > 0 && (
              <>
                <strong>Estimated remaining time to finish checking:</strong> {estimateTimeRemaining({ checkTiming, checking, checkResults, data })}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
