import React, { useState, useEffect } from 'react';
import './AddEditSongModal.css';

const ipcRenderer = window.require ? window.require('electron').ipcRenderer : null;
const path = window.require ? window.require('path') : null;

function AddEditSongModal({ song, onClose, onSave }) {
  const [songData, setSongData] = useState({
    name: '',
    group: '',
    filePath: '',
    fileName: '',
  });

  useEffect(() => {
    if (song) {
      setSongData({ ...song, group: song.group || '', fileName: song.filePath ? path.basename(song.filePath) : '' });
    } else {
      setSongData({
        name: '',
        group: '',
        filePath: '',
        fileName: '',
      });
    }
  }, [song]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSongData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSelectFile = async () => {
    console.log('handleSelectFile called');
    if (ipcRenderer) {
      const result = await ipcRenderer.invoke('select-song-file');
      console.log('Result from select-song-file:', result);
      if (result.success) {
        const originalPath = result.filePath;
        console.log('Original file path:', originalPath);
        const copyResult = await ipcRenderer.invoke('copy-song-file', originalPath);
        console.log('Result from copy-song-file:', copyResult);
        if (copyResult.success) {
          const newFilePath = copyResult.newPath;
          console.log('New file path:', newFilePath);
          setSongData(prevData => {
            const newName = prevData.name || (path ? path.basename(newFilePath, path.extname(newFilePath)) : '');
            const newState = { ...prevData, filePath: newFilePath, name: newName, fileName: path.basename(newFilePath) };
            console.log('New songData state:', newState);
            return newState;
          });
        } else {
          console.error('Error copying file:', copyResult.error);
        }
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('handleSubmit called with songData:', songData);
    onSave(songData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{song ? 'Editar Canción' : 'Añadir Canción'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={songData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="group">Grupo:</label>
            <input
              type="text"
              id="group"
              name="group"
              value={songData.group}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Archivo MP3:</label>
            <button type="button" onClick={handleSelectFile}>
              Seleccionar Archivo
            </button>
            {songData.fileName && <p>Archivo seleccionado: {songData.fileName}</p>}
          </div>
          <div className="modal-actions">
            <button type="submit">Guardar</button>
            <button type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEditSongModal;
