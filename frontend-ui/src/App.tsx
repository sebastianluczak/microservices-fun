import { useState, useEffect } from 'react'
import './App.css'
import { useWsConnection } from './context/WsConnectionContext';
import { useUser } from './context/UserContext';

type UploadStatus = {
  filenameInTemporaryDirectory: string;
  fileInStorage: string;
  publicDownloadUrl: string;
  eTag: string;
} | string;

function App() {
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('');
  const [lastValidation, setLastValidation] = useState<unknown>(null);
  const { socket: wsConnection } = useWsConnection();
  const { user, resetSession } = useUser();

  type ValidationPayload = {
    message: string;
    userId: string;
    corelationId: string;
    result: string;
    boolResult: boolean;
  };

  const validationPayload =
    typeof lastValidation === 'object' && lastValidation !== null &&
    'result' in lastValidation &&
    'boolResult' in lastValidation
      ? (lastValidation as ValidationPayload)
      : null;

  const validationStatus = validationPayload
    ? validationPayload.boolResult
      ? 'success'
      : 'error'
    : 'idle';

  useEffect(() => {
    const onEvents = (data: unknown) => {
      console.log('Received from server:', data);
    };

    const onConnect = () => {
      console.log('Connected to WebSocket server');
    };

    const onValidation = (data: unknown) => {
      console.log('Received validation payload!', data);
      setLastValidation(data);
    };

    wsConnection.on('events', onEvents);
    wsConnection.on('connect', onConnect);
    wsConnection.on('validation', onValidation);

    return () => {
      wsConnection.off('events', onEvents);
      wsConnection.off('connect', onConnect);
      wsConnection.off('validation', onValidation);
    };
  }, [wsConnection]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFileToUpload(event.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!fileToUpload) {
      alert('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const response = await fetch('http://localhost:8080/upload', {
        method: 'POST',
        body: formData,
        headers: {
          "X-Ephemeral-Id": user?.uuid || 'unknown'
        }
      });

      if (response.ok) {
        const result = await response.text();
        const uploadStatusReal = JSON.parse(result) as { filenameInTemporaryDirectory: string; fileInStorage: string; publicDownloadUrl: string; eTag: string };
        setUploadStatus(uploadStatusReal);
      } else {
        setUploadStatus('Failed to upload file.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('Error uploading file.');
    }
  };

  return (
    <div className="app-shell">
      <div className="hero-bg"></div>
      <header className="hero-panel">
        <div className="hero-copy">
          <h1>JSON validation with instant websocket notifications.</h1>
          <p>Upload any JSON file and receive live validation updates across all clients. Fast, flashy, and built for modern workflows.</p>
          <div className="hero-kpis">
            <div>
              <strong>0.2s</strong>
              <span>Average feedback</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Live event delivery</span>
            </div>
            <div>
              <strong>Instant</strong>
              <span>Websocket stream</span>
            </div>
          </div>
        </div>

        <aside className="hero-card">
          <div className="card-top">
            <div>
              <p className="card-subtitle">Upload & monitor</p>
              <h2>Drop your file and get feedback.</h2>
            </div>
          </div>

          <div className="upload-form">
            <label className="file-upload">
              <span>{fileToUpload ? fileToUpload.name : 'Choose a JSON file'}</span>
              <input type="file" onChange={handleFileChange} accept="application/json" />
            </label>

            <button className="btn-primary" onClick={handleFileUpload}>Upload file</button>

              {typeof uploadStatus !== 'string' && uploadStatus.publicDownloadUrl ? (
                <div className="result-card">
                  <p className="result-label">Now with new feature!</p>
                  <button className="btn-primary" onClick={() => window.open(uploadStatus.publicDownloadUrl, '_blank')}>
                    🐱 Download same file ❤️
                  </button>
                </div>
              ) : null}
          </div>
        </aside>
      </header>

      <section className="live-board">
        <div className="board-head">
          <div>
            <h2>Live validation feed</h2>
            <p>Websocket channel: <code>validation</code></p>
          </div>
          <span className="status-pill">Live</span>
        </div>

        <div className="board-grid">
          <article className="info-card validation-card">
            <div className="validation-card-header">
              <div>
                <h3>Validation result</h3>
                <p className="validation-card-copy">Latest JSON validation event received over websocket.</p>
              </div>
              <span className="validation-pill">Realtime</span>
            </div>
            <div className={`validation-banner ${validationStatus}`}>
              <span className="validation-dot" />
              <div>
                {validationPayload ? (
                  <>
                    <div className="validation-banner-title">{validationPayload.boolResult ? 'Validation passed' : 'Validation failed'}</div>
                    <div className="validation-banner-text">{validationPayload.result}</div>
                  </>
                ) : (
                  <div className="validation-banner-text">Waiting for the first validation event...</div>
                )}
              </div>
            </div>
          </article>
          <article className="info-card accent-card">
            <h3>Session</h3>
            <p>{user ? `Hello, ${user.displayName}` : 'Loading user...'}</p>
            <button className="btn-secondary" onClick={resetSession}>Reset Session</button>
          </article>
        </div>
      </section>
    </div>
  )
}

export default App
