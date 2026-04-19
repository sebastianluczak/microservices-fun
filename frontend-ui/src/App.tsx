import { useState } from 'react'
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
  const { socket: wsConnection } = useWsConnection();
  const { user, resetSession } = useUser();

  wsConnection.on('events', (data) => {
    console.log('Received from server:', data);
  });

  wsConnection.on('connect', () => {
    console.log('Connected to WebSocket server');
  });

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
    <section id="center">
      <p>
        {user 
          ? `Hello, ${user.displayName}!`
          : 'Loading user information...'
        }
        <button onClick={resetSession} style={{ marginLeft: '1rem' }}>Reset Session</button>
      </p>
      <div>
        <p>{typeof uploadStatus === 'string' ? uploadStatus : (
          <button onClick={() => window.open(uploadStatus.publicDownloadUrl, '_blank')}>Download {uploadStatus.fileInStorage}</button>
        )}</p>
      </div>
      <div>
        <h1>Upload a file to the server</h1>
        <input type="file" onChange={handleFileChange} accept='application/json'/>
        <button onClick={handleFileUpload}>Upload</button>
      </div>
    </section>
  )
}

export default App
