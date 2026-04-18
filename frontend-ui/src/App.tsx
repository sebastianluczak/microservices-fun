import { useState } from 'react'
import './App.css'
import { io } from 'socket.io-client'

type UploadStatus = {
  filenameInTemporaryDirectory: string;
  fileInStorage: string;
  publicDownloadUrl: string;
  eTag: string;
} | string;

function App() {
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('');

  const socket = io('http://localhost:3422');

  socket.on('connect', () => {
    console.log('Socket.IO connection established');
    socket.emit('events', 'Hello from the frontend!');
  });

  socket.on('disconnect', () => {
    console.log('Socket.IO connection closed');
  });

  socket.on('events', (data: string) => {
    console.log('Received message from server:', data);
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      console.log(`Selected file: ${event.target.files[0]}`);
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
