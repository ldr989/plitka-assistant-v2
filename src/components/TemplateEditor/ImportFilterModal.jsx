import React from "react";
import { propertiesList } from "../../data/propertiesList.js";

function ImportFilterModal({
    isOpen,
    onClose,
    onSave,
    tempIgnoredIds,
    setTempIgnoredIds,
    filterSearch,
    setFilterSearch,
    filterSelectId,
    setFilterSelectId,
    onAddIgnore,
    onRemoveIgnore,
}) {
    if (!isOpen) return null;

    const options = Object.entries(propertiesList)
        .filter(([id, data]) => {
            if (tempIgnoredIds.includes(id)) return false;
            return (
                !filterSearch ||
                data.text.toLowerCase().includes(filterSearch.toLowerCase())
            );
        })
        .map(([id, data]) => ({ id, text: data.text }))
        .sort((a, b) => a.text.localeCompare(b.text));

    return (
        <div className="modal-overlay">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Фильтр импорта</h3>
                <p className="modal-desc">Свойства игнорируемые при импорте</p>

                <div className="filter-controls">
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Поиск..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        style={{ width: "100%", marginBottom: "8px" }}
                    />
                    <div className="filter-list-container">
                        {options.map((opt) => (
                            <div
                                key={opt.id}
                                className={`filter-item ${filterSelectId === opt.id ? "selected" : ""}`}
                                onClick={() => setFilterSelectId(opt.id)}
                                onDoubleClick={() => onAddIgnore(opt.id)}
                            >
                                {opt.text}
                            </div>
                        ))}
                    </div>
                    <button
                        className="button full-width add-btn"
                        onClick={() => onAddIgnore(filterSelectId)}
                        disabled={!filterSelectId}
                    >
                        Добавить в список
                    </button>
                </div>

                <div className="tags-container">
                    {tempIgnoredIds.length === 0 && (
                        <span className="no-tags">Список пуст</span>
                    )}
                    {tempIgnoredIds.map((id) => (
                        <div key={id} className="tag">
                            <span>
                                {propertiesList[id]?.text || `ID: ${id}`}
                            </span>
                            <button onClick={() => onRemoveIgnore(id)}>
                                ×
                            </button>
                        </div>
                    ))}
                </div>

                <div className="modal-actions">
                    <button
                        className="button secondary small"
                        onClick={() => setTempIgnoredIds([])}
                        disabled={tempIgnoredIds.length === 0}
                    >
                        Очистить
                    </button>
                    <div className="modal-actions-right">
                        <button className="button secondary" onClick={onClose}>
                            Отмена
                        </button>
                        <button className="button primary" onClick={onSave}>
                            Готово
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ImportFilterModal;
