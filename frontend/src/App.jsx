import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const services = [
  { value: 'tts', label: 'Text to Speech' },
  { value: 'stt', label: 'Speech to Text' },
  { value: 'translate', label: 'Translate' },
  { value: 'vision', label: 'Vision' },
  { value: 'video', label: 'Video Intelligence' },
  { value: 'gemini', label: 'Gemini Pro' },
  { value: 'imagen', label: 'Imagen' },
  { value: 'veo', label: 'Veo' },
];

export default function App() {
  const [service, setService] = useState('tts');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [target, setTarget] = useState('en');
  const [result, setResult] = useState(null);

  const handleRun = async () => {
    try {
      let res;
      if (['stt', 'vision', 'video'].includes(service)) {
        const formData = new FormData();
        formData.append('file', file);
        res = await axios.post(`${API_BASE_URL}/api/${service}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else if (service === 'tts') {
        res = await axios.post(`${API_BASE_URL}/api/tts`, { text }, { responseType: 'arraybuffer' });
        const blob = new Blob([res.data], { type: 'audio/mpeg' });
        setResult({ audio: URL.createObjectURL(blob) });
        return;
      } else if (service === 'translate') {
        res = await axios.post(`${API_BASE_URL}/api/translate`, { text, target });
      } else {
        res = await axios.post(`${API_BASE_URL}/api/${service}`, { prompt: text });
      }
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.message });
    }
  };

  const renderOutput = () => {
    if (!result) return null;
    if (result.audio) return <audio controls src={result.audio}></audio>;
    if (result.image) return <img src={`data:image/png;base64,${result.image}`} className="max-w-sm" />;
    if (result.video) return <video controls src={`data:video/mp4;base64,${result.video}`}></video>;
    return <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>;
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">GCP API Cockpit</h1>
      <select value={service} onChange={e => setService(e.target.value)} className="border p-2 w-full">
        {services.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      {service === 'translate' && (
        <input value={target} onChange={e => setTarget(e.target.value)} placeholder="Target language" className="border p-2 w-full" />
      )}
      {['stt', 'vision', 'video'].includes(service) ? (
        <input type="file" onChange={e => setFile(e.target.files[0])} className="border p-2 w-full" />
      ) : (
        <textarea value={text} onChange={e => setText(e.target.value)} className="border p-2 w-full" rows="4"></textarea>
      )}
      <button onClick={handleRun} className="bg-blue-500 text-white px-4 py-2 rounded">Run</button>
      <div>{renderOutput()}</div>
    </div>
  );
}
