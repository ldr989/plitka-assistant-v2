/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { propertiesList } from "../../data/propertiesList.js";
import Icon from "../Icon.jsx";
import { getPropertiesFromPage } from "../../utils/page-scripts.js";
import { PropertyValueInput } from "../PropertyComponents.jsx";
import useLocalStorage from "../../hooks/useLocalStorage.js";
import useUndoableState from "../../hooks/useUndoableState.js";

import DimensionsInputs from "./DimensionsInputs.jsx";
import ImportFilterModal from "./ImportFilterModal.jsx";
import SortablePropertyItem from "./SortablePropertyItem.jsx";
import {
    calculatePropertyValue,
    safeParseFloat,
} from "../../utils/template-calculations.js";

function TemplateEditor({ template, onBack, onUpdate, manageStatus }) {
    const [name, setName] = useState(template.name);

    // Достаем undoProperties (4-й аргумент)
    const [properties, setProperties, setUndoableProperties, undoProperties] =
        useUndoableState(`editor-props-${template.id}`, () =>
            JSON.parse(JSON.stringify(template.properties || [])),
        );

    const [length, setLength] = useState(template.length || "");
    const [width, setWidth] = useState(template.width || "");
    const [isAddingProp, setIsAddingProp] = useState(false);
    const [selectedPropId, setSelectedPropId] = useState("");
    const [currentPropValue, setCurrentPropValue] = useState(null);
    const [editingPropId, setEditingPropId] = useState(null);
    const [editingPropValue, setEditingPropValue] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [ignoredImportIds, setIgnoredImportIds] = useLocalStorage(
        "ignored-import-ids",
        [],
    );
    const [tempIgnoredIds, setTempIgnoredIds] = useState([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filterSelectId, setFilterSelectId] = useState("");
    const [filterSearch, setFilterSearch] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    );

    // Обработчик Ctrl+Z для редактора
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.code === "KeyZ") {
                e.preventDefault();
                if (undoProperties()) {
                    manageStatus("Отмена действия", 1000);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undoProperties, manageStatus]);

    const handleImport = (mode) => {
        manageStatus("Импорт...", 2000);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    func: getPropertiesFromPage,
                    world: "MAIN",
                },
                (results) => {
                    const result = results[0]?.result;
                    if (!result || !result.success) return;

                    let pageProps = result.data.properties;
                    const factoryEntry = Object.entries(propertiesList).find(
                        ([, d]) => d.text === "Фабричный цвет",
                    );
                    if (factoryEntry)
                        pageProps = pageProps.map((p) =>
                            p.id === Number(factoryEntry[0])
                                ? { ...p, value: "" }
                                : p,
                        );

                    const knownProps = pageProps
                        .filter(
                            (p) =>
                                propertiesList[p.id] &&
                                !ignoredImportIds.includes(String(p.id)),
                        )
                        .map((p) => ({ ...p, ignored: false }));

                    if (mode === "replace") {
                        setUndoableProperties(knownProps);
                        setLength(result.data.length);
                        setWidth(result.data.width);
                        manageStatus("Данные заменены (Ctrl+Z)", 2000);
                    } else {
                        const existingIds = new Set(
                            properties.map((p) => p.id),
                        );
                        const newProps = knownProps.filter(
                            (p) => !existingIds.has(p.id),
                        );
                        if (newProps.length > 0) {
                            setUndoableProperties([...properties, ...newProps]);
                            manageStatus(
                                `Добавлено ${newProps.length} (Ctrl+Z)`,
                                2000,
                            );
                        } else {
                            manageStatus("Новых свойств не найдено", 1500);
                        }
                    }
                },
            );
        });
    };

    const handleSave = () => {
        const sanitized = properties.map((p) =>
            propertiesList[p.id]?.type === "number" ||
            propertiesList[p.id]?.type === "text"
                ? { ...p, value: String(p.value).replace(",", ".") }
                : p,
        );
        onUpdate({
            ...template,
            name,
            properties: sanitized,
            length: String(length).replace(",", "."),
            width: String(width).replace(",", "."),
        });
        manageStatus(`Шаблон "${name}" сохранен`, 2000);
        onBack();
    };

    const filteredProperties = properties.filter((p) =>
        propertiesList[p.id]?.text
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
    );

    return (
        <div className="template-editor">
            <div className="editor-header">
                <input
                    type="text"
                    className="editor-title-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button className="button" onClick={onBack}>
                    ← Назад
                </button>
            </div>

            <DimensionsInputs
                length={length}
                width={width}
                setLength={setLength}
                setWidth={setWidth}
            />

            <div className="section-header">
                <h3>Свойства в шаблоне:</h3>
                <button
                    className="button small secondary"
                    onClick={() => {
                        setUndoableProperties([]);
                        manageStatus("Список очищен (Ctrl+Z)", 1500);
                    }}
                    disabled={properties.length === 0}
                >
                    Очистить список
                </button>
            </div>

            <div className="search-bar-container">
                <input
                    type="text"
                    className="input-field search-input"
                    placeholder="Поиск по названию..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button
                        className="button stepper-button clear-button"
                        onClick={() => setSearchTerm("")}
                    >
                        C
                    </button>
                )}
            </div>

            <div className="properties-list">
                {properties.length > 0 ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => {
                            if (e.over && e.active.id !== e.over.id) {
                                setProperties((items) =>
                                    arrayMove(
                                        items,
                                        items.findIndex(
                                            (i) => i.id === e.active.id,
                                        ),
                                        items.findIndex(
                                            (i) => i.id === e.over.id,
                                        ),
                                    ),
                                );
                                // Здесь можно не спамить статусом, либо добавить легкий статус
                                // manageStatus("Порядок изменен", 500);
                            }
                        }}
                    >
                        <SortableContext
                            items={properties}
                            strategy={verticalListSortingStrategy}
                        >
                            <ul className="template-list">
                                {filteredProperties.map((prop) =>
                                    editingPropId === prop.id ? (
                                        <li
                                            key={prop.id}
                                            className="editing-item"
                                        >
                                            <div className="prop-details">
                                                <span className="prop-name">
                                                    {
                                                        propertiesList[prop.id]
                                                            ?.text
                                                    }
                                                </span>
                                                <PropertyValueInput
                                                    propId={prop.id}
                                                    value={editingPropValue}
                                                    onChange={
                                                        setEditingPropValue
                                                    }
                                                />
                                            </div>
                                            <div className="template-actions">
                                                <button
                                                    className="button small primary"
                                                    onClick={() => {
                                                        // Здесь используем setUndoableProperties, чтобы можно было откатить изменение значения
                                                        setUndoableProperties(
                                                            (prev) =>
                                                                prev.map((p) =>
                                                                    p.id ===
                                                                    editingPropId
                                                                        ? {
                                                                              ...p,
                                                                              value: editingPropValue,
                                                                          }
                                                                        : p,
                                                                ),
                                                        );
                                                        setEditingPropId(null);
                                                        manageStatus(
                                                            "Значение обновлено (Ctrl+Z)",
                                                            1000,
                                                        );
                                                    }}
                                                >
                                                    Сохранить
                                                </button>
                                                <button
                                                    className="button small secondary"
                                                    onClick={() =>
                                                        setEditingPropId(null)
                                                    }
                                                >
                                                    Отмена
                                                </button>
                                            </div>
                                        </li>
                                    ) : (
                                        <SortablePropertyItem
                                            key={prop.id}
                                            prop={prop}
                                            index={properties.findIndex(
                                                (p) => p.id === prop.id,
                                            )}
                                            onEdit={(p) => {
                                                setEditingPropId(p.id);
                                                setEditingPropValue(p.value);
                                            }}
                                            onClearValue={(id) => {
                                                setUndoableProperties((prev) =>
                                                    prev.map((p) =>
                                                        p.id === id
                                                            ? {
                                                                  ...p,
                                                                  value: "",
                                                              }
                                                            : p,
                                                    ),
                                                );
                                                manageStatus(
                                                    "Значение очищено (Ctrl+Z)",
                                                    1000,
                                                );
                                            }}
                                            onDelete={(id) => {
                                                setUndoableProperties(
                                                    properties.filter(
                                                        (p) => p.id !== id,
                                                    ),
                                                );
                                                manageStatus(
                                                    "Свойство удалено (Ctrl+Z)",
                                                    1000,
                                                );
                                            }}
                                            onCalculate={(id) => {
                                                const val =
                                                    calculatePropertyValue(
                                                        id,
                                                        properties,
                                                        length,
                                                        width,
                                                    );
                                                if (val) {
                                                    setUndoableProperties(
                                                        (prev) =>
                                                            prev.map((p) =>
                                                                p.id === id
                                                                    ? {
                                                                          ...p,
                                                                          value: val,
                                                                      }
                                                                    : p,
                                                            ),
                                                    );
                                                    manageStatus(
                                                        "Рассчитано (Ctrl+Z)",
                                                        1000,
                                                    );
                                                } else {
                                                    manageStatus(
                                                        "Не хватает данных для расчета",
                                                        1500,
                                                    );
                                                }
                                            }}
                                            onRecalculateShape={() => {
                                                const l =
                                                        safeParseFloat(length),
                                                    w = safeParseFloat(width);
                                                const shape =
                                                    l === w ? "6361" : "6360";
                                                setUndoableProperties((prev) =>
                                                    prev.map((p) =>
                                                        p.id === 4287
                                                            ? {
                                                                  ...p,
                                                                  value: shape,
                                                              }
                                                            : p,
                                                    ),
                                                );
                                                manageStatus(
                                                    "Форма обновлена (Ctrl+Z)",
                                                    1000,
                                                );
                                            }}
                                        />
                                    ),
                                )}
                            </ul>
                        </SortableContext>
                    </DndContext>
                ) : (
                    <p className="empty-list-message">
                        В этом шаблоне пока нет свойств.
                    </p>
                )}
            </div>

            {isAddingProp ? (
                <div className="add-prop-form">
                    <select
                        className="select-field"
                        value={selectedPropId}
                        onChange={(e) => {
                            setSelectedPropId(e.target.value);
                            setCurrentPropValue(
                                calculatePropertyValue(
                                    Number(e.target.value),
                                    properties,
                                    length,
                                    width,
                                ),
                            );
                        }}
                    >
                        <option value="">
                            -- Выберите свойство для добавления --
                        </option>
                        {Object.keys(propertiesList)
                            .filter(
                                (id) =>
                                    !properties.some(
                                        (p) => String(p.id) === id,
                                    ),
                            )
                            .map((id) => (
                                <option key={id} value={id}>
                                    {propertiesList[id].text}
                                </option>
                            ))}
                    </select>
                    {selectedPropId && (
                        <PropertyValueInput
                            propId={Number(selectedPropId)}
                            value={currentPropValue}
                            onChange={setCurrentPropValue}
                        />
                    )}
                    <div className="form-actions">
                        <button
                            className="button"
                            onClick={() => {
                                if (!selectedPropId) return;
                                setUndoableProperties((prev) => [
                                    ...prev,
                                    {
                                        id: Number(selectedPropId),
                                        value: currentPropValue,
                                        ignored: false,
                                    },
                                ]);
                                setIsAddingProp(false);
                                setSelectedPropId("");
                                manageStatus(
                                    "Свойство добавлено (Ctrl+Z)",
                                    1000,
                                );
                            }}
                        >
                            Добавить
                        </button>
                        <button
                            className="button secondary"
                            onClick={() => setIsAddingProp(false)}
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    className="button"
                    onClick={() => setIsAddingProp(true)}
                >
                    + Добавить свойство
                </button>
            )}

            <div className="editor-actions">
                <div className="import-actions-row">
                    <button
                        className="button small icon-button secondary"
                        title="Настроить фильтр импорта"
                        onClick={() => {
                            setTempIgnoredIds([...ignoredImportIds]);
                            setIsFilterModalOpen(true);
                        }}
                    >
                        <Icon name="gear" />
                    </button>
                    <button
                        className="button"
                        onClick={() => handleImport("replace")}
                    >
                        Заменить
                    </button>
                    <button
                        className="button"
                        onClick={() => handleImport("merge")}
                    >
                        Добавить
                    </button>
                </div>
                <button className="button primary" onClick={handleSave}>
                    Сохранить и выйти
                </button>
            </div>

            <ImportFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onSave={() => {
                    setIgnoredImportIds(tempIgnoredIds);
                    setIsFilterModalOpen(false);
                    manageStatus("Фильтр импорта обновлен", 1500);
                }}
                tempIgnoredIds={tempIgnoredIds}
                setTempIgnoredIds={setTempIgnoredIds}
                filterSearch={filterSearch}
                setFilterSearch={setFilterSearch}
                filterSelectId={filterSelectId}
                setFilterSelectId={setFilterSelectId}
                onAddIgnore={(id) => {
                    if (id && !tempIgnoredIds.includes(id))
                        setTempIgnoredIds([...tempIgnoredIds, id]);
                    setFilterSelectId("");
                }}
                onRemoveIgnore={(id) =>
                    setTempIgnoredIds(tempIgnoredIds.filter((i) => i !== id))
                }
            />
        </div>
    );
}

export default TemplateEditor;
