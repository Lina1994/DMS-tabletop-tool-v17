import React, { useState, useEffect, useCallback } from 'react';
import AddEditItemModal from './AddEditItemModal';
import AddEditSectionModal from './AddEditSectionModal'; // New import
import ConfirmModal from '../Maps/ConfirmModal';
import './Shops.css';
import API_BASE_URL from '../../apiConfig';

let ipcRenderer = null;
if (window.require) {
  try {
    const electron = window.require('electron');
    if (electron && electron.ipcRenderer) {
      ipcRenderer = electron.ipcRenderer;
    }
  } catch (e) {
    console.warn("Could not load electron.ipcRenderer:", e);
  }
}

const generateUniqueId = () => {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

function Shops() {
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // For items
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // New state for search term
  const [showControls, setShowControls] = useState(false); // New state for showing/hiding controls
  const [collapsedSections, setCollapsedSections] = useState({}); // New state for collapsed sections

  // State for Shop CRUD
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [isConfirmDeleteShopModalOpen, setIsConfirmDeleteShopModalOpen] = useState(false);
  const [shopToDeleteId, setShopToDeleteId] = useState(null);
  const [shopToDeleteName, setShopToDeleteName] = useState('');

  // State for Section CRUD (New)
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [isConfirmDeleteSectionModalOpen, setIsConfirmDeleteSectionModalOpen] = useState(false);
  const [sectionToDeleteId, setSectionToDeleteId] = useState(null);
  const [sectionToDeleteName, setSectionToDeleteName] = useState('');

  const fetchShops = useCallback(async () => {
    try {
      console.log('Fetching shops...');
      const response = await fetch(`${API_BASE_URL}/shops`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Shops fetched successfully (raw):', data); // Log raw data

      // Process fetched data to parse 'data' field in items
      const processedData = data.map(shop => ({
        ...shop,
        categories: shop.categories.map(category => ({
          ...category,
          items: category.items.map(item => {
            try {
              // Parse the 'data' field if it's a string
              const parsedData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
              return {
                ...item,
                ...parsedData // Spread the parsed data into the item object
              };
            } catch (e) {
              console.error('Error parsing item data:', item.data, e);
              return item; // Return original item if parsing fails
            }
          })
        }))
      }));

      console.log('Shops fetched successfully (processed):', processedData); // Log processed data
      setShops(processedData);
      if (processedData.length > 0 && !selectedShopId) {
        setSelectedShopId(processedData[0].id);
      } else if (processedData.length === 0) {
        setSelectedShopId(null);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  }, [selectedShopId]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  useEffect(() => {
    if (!ipcRenderer) return;

    const handleImportResult = (event, { success, items, categoryType, error }) => {
      setIsImporting(false);
      if (success) {
        fetchShops();
      } else {
        console.error(`Error al importar items: ${error}`);
      }
    };

    const handleExportResult = (event, { success, error }) => {
      setIsExporting(false);
      if (!success) {
        console.error(`Error al exportar items: ${error}`);
      }
    };

    ipcRenderer.on('imported-items', handleImportResult);
    ipcRenderer.on('export-items-result', handleExportResult);

    return () => {
      ipcRenderer.removeListener('imported-items', handleImportResult);
      ipcRenderer.removeListener('export-items-result', handleExportResult);
    };
  }, [fetchShops]);

  const handleOpenModal = (item = null, category) => {
    setEditingItem(item);
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setSelectedCategory(null);
  };

  const handleSaveItem = async (itemData) => {
    console.log('Saving item:', itemData);
    try {
      let response;
      if (editingItem) {
        response = await fetch(`${API_BASE_URL}/items/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...itemData, category_id: selectedCategory.id }),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...itemData, category_id: selectedCategory.id }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      fetchShops();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleDeleteItem = async (itemToDelete, category) => {
    console.log('Deleting item:', itemToDelete);
    try {
      const response = await fetch(`${API_BASE_URL}/items/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchShops();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleImportItems = (categoryType) => {
    console.log('[Shops.js] handleImportItems called with categoryType:', categoryType);
    if (!ipcRenderer) {
      alert("La importación de Excel solo está disponible en la aplicación de escritorio.");
      return;
    }
    setIsImporting(true);
    ipcRenderer.send('import-items-from-excel', { categoryType });
  };

  const handleExportItems = (category) => {
    if (!ipcRenderer) {
      alert("La exportación a Excel solo está disponible en la aplicación de escritorio.");
      return;
    }
    setIsExporting(true);
    ipcRenderer.send('export-items-to-excel', { items: category.items, categoryName: category.name });
  };

  // Shop CRUD functions
  const handleOpenShopModal = (shop = null) => {
    setEditingShop(shop);
    setIsShopModalOpen(true);
  };

  const handleCloseShopModal = () => {
    setIsShopModalOpen(false);
    setEditingShop(null);
  };

  const handleSaveShop = async (shopName) => {
    try {
      let response;
      const shopData = { name: shopName };
      console.log('Attempting to save shop with data:', shopData); // Added log
      if (editingShop) {
        console.log(`Sending PUT request to ${API_BASE_URL}/shops/${editingShop.id}`); // Added log
        response = await fetch(`${API_BASE_URL}/shops/${editingShop.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shopData),
        });
      } else {
        console.log(`Sending POST request to ${API_BASE_URL}/shops`); // Added log
        response = await fetch(`${API_BASE_URL}/shops`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shopData),
        });
      }

      if (!response.ok) {
        const errorBody = await response.text(); // Try to read error body
        console.error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}, body: ${errorBody}`); // Modified log
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchShops();
      handleCloseShopModal();
    } catch (error) {
      console.error('Error saving shop:', error);
      console.error('Full error object:', error); // Added log
    }
  };

  const handleDeleteShopRequest = (shopId, shopName) => {
    setShopToDeleteId(shopId);
    setShopToDeleteName(shopName);
    setIsConfirmDeleteShopModalOpen(true);
  };

  const confirmDeleteShop = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shops/${shopToDeleteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchShops();
      setIsConfirmDeleteShopModalOpen(false);
      setShopToDeleteId(null);
      setShopToDeleteName('');
    } catch (error) {
      console.error('Error deleting shop:', error);
    }
  };

  const cancelDeleteShop = () => {
    setIsConfirmDeleteShopModalOpen(false);
    setShopToDeleteId(null);
    setShopToDeleteName('');
  };

  // Section CRUD functions (New)
  const handleOpenSectionModal = (section = null) => {
    setEditingSection(section);
    setIsSectionModalOpen(true);
  };

  const handleCloseSectionModal = () => {
    setIsSectionModalOpen(false);
    setEditingSection(null);
  };

  const handleSaveSection = async (sectionData) => {
    console.log('Saving section:', sectionData);
    try {
      let response;
      if (sectionData.id) { // Editing existing section
        response = await fetch(`${API_BASE_URL}/sections/${sectionData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...sectionData, shop_id: selectedShopId }),
        });
      } else { // Adding new section
        response = await fetch(`${API_BASE_URL}/shops/${selectedShopId}/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...sectionData, shop_id: selectedShopId }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchShops(); // Re-fetch all shops to update UI
      handleCloseSectionModal();
    } catch (error) {
      console.error('Error saving section:', error);
    }
  };

  const handleDeleteSectionRequest = (sectionId, sectionName) => {
    setSectionToDeleteId(sectionId);
    setSectionToDeleteName(sectionName);
    setIsConfirmDeleteSectionModalOpen(true);
  };

  const confirmDeleteSection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sections/${sectionToDeleteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchShops();
      setIsConfirmDeleteSectionModalOpen(false);
      setSectionToDeleteId(null);
      setSectionToDeleteName('');
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  };

  const cancelDeleteSection = () => {
    setIsConfirmDeleteSectionModalOpen(false);
    setSectionToDeleteId(null);
    setSectionToDeleteName('');
  };

  const selectedShop = shops.find(shop => shop.id === selectedShopId);

  // New filteredItems logic
  const filteredItems = selectedShop
    ? selectedShop.categories.map(category => ({
        ...category,
        items: category.items.filter(item =>
          Object.values(item).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      }))
    : [];

  const toggleSection = (categoryId) => {
    setCollapsedSections(prevState => ({
      ...prevState,
      [categoryId]: !prevState[categoryId]
    }));
  };

  return (
    <div className="shops-container">
      <div className="shops-header">
        <h2>Tiendas</h2>
        <button className="toggle-controls-btn" onClick={() => setShowControls(!showControls)}>
          {showControls ? 'Ocultar Controles' : 'Mostrar Controles'}
        </button>
      </div>

      <div className="shops-controls">
        <select onChange={(e) => setSelectedShopId(e.target.value)} value={selectedShopId || ''}>
          {shops.map(shop => (
            <option key={shop.id} value={shop.id}>{shop.name}</option>
          ))}
        </select>
        {showControls && (
          <>
            <button onClick={() => handleOpenShopModal()}>Añadir Tienda</button>
            <button onClick={() => handleOpenShopModal(selectedShop)} disabled={!selectedShopId}>Editar Tienda</button>
            <button onClick={() => handleDeleteShopRequest(selectedShopId, selectedShop?.name)} disabled={!selectedShopId}>Eliminar Tienda</button>
          </>
        )}
      </div>

      {/* New Search Input */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {selectedShop && (
        <div className="shop-details">
          <h3>{selectedShop.name}</h3>
          {showControls && (
            <button onClick={() => handleOpenSectionModal()} disabled={!selectedShopId}>Añadir Sección</button>
          )}
          {filteredItems.map(category => (
            <div key={category.id} className="category-section">
              <h4>
                {category.name}
                <button 
                  className="toggle-section-btn"
                  onClick={() => toggleSection(category.id)}
                >
                  {collapsedSections[category.id] ? '\u25BC' : '\u25B2'}
                </button>
                {showControls && (
                  <>
                    <button onClick={() => handleOpenSectionModal(category)}>Editar</button>
                    <button onClick={() => handleDeleteSectionRequest(category.id, category.name)}>Eliminar</button>
                  </>
                )}
              </h4>
              {!collapsedSections[category.id] && (
                <>
                  {showControls && (
                    <div className="category-controls">
                      <button onClick={() => handleImportItems(category.id)} disabled={isImporting}>
                        {isImporting ? 'Importando...' : `Importar ${category.name}`}
                      </button>
                      <button onClick={() => handleExportItems(category)} disabled={isExporting}>
                        {isExporting ? 'Exportando...' : `Exportar ${category.name}`}
                      </button>
                    </div>
                  )}
                  <table className="item-table">
                    <thead>
                      <tr>
                        {category.columns && category.columns.map(col => (
                          <th key={col.name}>{col.name}</th>
                        ))}
                        {showControls && <th>Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {category.items.map(item => (
                        <tr key={item.id}>
                          {category.columns && category.columns.map(col => (
                            <td key={col.name}>{item[col.name]}</td>
                          ))}
                          {showControls && (
                            <td>
                              <button onClick={() => handleOpenModal(item, category)}>Editar</button>
                              <button onClick={() => handleDeleteItem(item, category)}>Eliminar</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {showControls && (
                    <button className="add-item-btn" onClick={() => handleOpenModal(null, category)}>Añadir {category.name.slice(0, -1)}</button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {isModalOpen && (
        <AddEditItemModal
          item={editingItem}
          category={selectedCategory}
          onClose={handleCloseModal}
          onSave={handleSaveItem}
        />
      )}

      {/* Shop Add/Edit Modal */}
      {isShopModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingShop ? 'Editar Tienda' : 'Añadir Nueva Tienda'}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveShop(e.target.shopName.value);
            }}>
              <div className="form-group">
                <label htmlFor="shopName">Nombre de la Tienda:</label>
                <input
                  type="text"
                  id="shopName"
                  name="shopName"
                  defaultValue={editingShop ? editingShop.name : ''}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit">Guardar</button>
                <button type="button" onClick={handleCloseShopModal}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shop Delete Confirmation Modal */}
      {isConfirmDeleteShopModalOpen && (
        <ConfirmModal
          message={`¿Estás seguro de que quieres eliminar la tienda "${shopToDeleteName}"? Esto eliminará también todas sus secciones y elementos.`}
          onConfirm={confirmDeleteShop}
          onCancel={cancelDeleteShop}
        />
      )}

      {/* Section Add/Edit Modal (New) */}
      {isSectionModalOpen && (
        <AddEditSectionModal
          section={editingSection}
          onClose={handleCloseSectionModal}
          onSave={handleSaveSection}
        />
      )}

      {/* Section Delete Confirmation Modal (New) */}
      {isConfirmDeleteSectionModalOpen && (
        <ConfirmModal
          message={`¿Estás seguro de que quieres eliminar la sección "${sectionToDeleteName}"? Esto eliminará también todos sus elementos.`}
          onConfirm={confirmDeleteSection}
          onCancel={cancelDeleteSection}
        />
      )}
    </div>
  );
}

export default Shops;