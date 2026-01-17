/* eslint-disable no-undef */
import React, { useState, useEffect, useCallback } from "react";
// Импорты из dnd-kit
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
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { propertiesList } from "../data/propertiesList.js";
import Icon from "./Icon.jsx";
import { getPropertiesFromPage } from "../utils/page-scripts.js";
import { PropertyValueInput } from "./PropertyComponents.jsx";
import { getDisplayValue } from "./property-helpers.jsx";
import useLocalStorage from "../hooks/useLocalStorage.js";

// --- КОНСТАНТЫ ---
const CALCULABLE_PROP_IDS = [
    4288, 4289, 4357, 4362, 4354, 4355, 4947, 4356, 5277,
];

// Компонент для одного перетаскиваемого элемента списка
function SortablePropertyItem({
    prop,
    index,
    onEdit,
    onDelete,
    onCalculate,
    onRecalculateShape,
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: prop.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <li ref={setNodeRef} style={style} {...attributes}>
            <div className="handle-wrapper" {...listeners}>
                <div className="drag-handle">
                    <span className="prop-number">{index + 1}.</span>
                </div>
                <div className="prop-details">
                    <span className="prop-name">
                        {propertiesList[prop.id]?.text || `ID: ${prop.id}`}
                    </span>
                    <span className="prop-value">
                        {getDisplayValue(prop.id, prop.value)}
                    </span>
                </div>
            </div>

            <div className="template-actions">
                {prop.id === 4287 && (
                    <button
                        className="button small icon-button"
                        title="Пересчитать Форму"
                        onClick={onRecalculateShape}
                    >
                        <Icon name="help" />
                    </button>
                )}
                {CALCULABLE_PROP_IDS.includes(prop.id) && (
                    <button
                        className="button small calc-button"
                        title="Вычислить"
                        onClick={() => onCalculate(prop.id)}
                    >
                        Calc
                    </button>
                )}
                <button
                    className="button small icon-button"
                    title="Редактировать свойство"
                    onClick={() => onEdit(prop)}
                >
                    <Icon name="pencil" />
                </button>
                <button
                    className="button small icon-button danger"
                    title="Удалить свойство"
                    onClick={() => onDelete(prop.id)}
                >
                    <Icon name="trash" />
                </button>
            </div>
        </li>
    );
}

// --- Основной компонент Редактора ---
function TemplateEditor({
    template,
    onBack,
    onUpdate,
    manageStatus,
    manageError,
}) {
    const [name, setName] = useState(template.name);
    const [properties, setProperties] = useState(() =>
        JSON.parse(JSON.stringify(template.properties || []))
    );
    const [length, setLength] = useState(template.length || "");
    const [width, setWidth] = useState(template.width || "");

    const [isAddingProp, setIsAddingProp] = useState(false);
    const [selectedPropId, setSelectedPropId] = useState("");
    const [currentPropValue, setCurrentPropValue] = useState(null);

    const [editingPropId, setEditingPropId] = useState(null);
    const [editingPropValue, setEditingPropValue] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");

    // --- ЛОГИКА ФИЛЬТРА (Черный список) ---
    const [ignoredImportIds, setIgnoredImportIds] = useLocalStorage(
        "ignored-import-ids",
        []
    );

    // Временное состояние для модального окна (чтобы работала кнопка Отмена)
    const [tempIgnoredIds, setTempIgnoredIds] = useState([]);

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filterSelectId, setFilterSelectId] = useState("");
    const [filterSearch, setFilterSearch] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // --- Блокировка скролла body при открытой модалке ---
    useEffect(() => {
        if (isFilterModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isFilterModalOpen]);

    // --- ФУНКЦИИ УПРАВЛЕНИЯ МОДАЛКОЙ ---

    const handleOpenFilterModal = () => {
        // Копируем текущие настройки во временное состояние
        setTempIgnoredIds([...ignoredImportIds]);
        setFilterSearch("");
        setFilterSelectId("");
        setIsFilterModalOpen(true);
    };

    const handleSaveFilter = () => {
        // Сохраняем временное состояние в реальное
        setIgnoredImportIds(tempIgnoredIds);
        setIsFilterModalOpen(false);
        // Добавлено уведомление о сохранении
        manageStatus("Фильтр импорта обновлен", 1500);
    };

    const handleCancelFilter = useCallback(() => {
        // Просто закрываем, не сохраняя tempIgnoredIds
        setIsFilterModalOpen(false);
    }, []);

    const handleAddToIgnore = useCallback(() => {
        if (!filterSelectId) return;
        if (!tempIgnoredIds.includes(filterSelectId)) {
            setTempIgnoredIds((prev) => [...prev, filterSelectId]);
        }
        setFilterSelectId("");
        // Поиск не сбрасываем, как просили
    }, [filterSelectId, tempIgnoredIds]);

    const handleAddDirectly = (idToAdd) => {
        if (!tempIgnoredIds.includes(idToAdd)) {
            setTempIgnoredIds((prev) => [...prev, idToAdd]);
        }
        setFilterSelectId("");
        // Поиск не сбрасываем
    };

    const handleRemoveFromIgnore = (idToRemove) => {
        setTempIgnoredIds((prev) => prev.filter((id) => id !== idToRemove));
    };

    // --- ОСНОВНЫЕ ФУНКЦИИ РЕДАКТОРА ---

    const handleUpdateProperty = useCallback(() => {
        setProperties((prev) =>
            prev.map((p) =>
                p.id === editingPropId ? { ...p, value: editingPropValue } : p
            )
        );
        setEditingPropId(null);
        setEditingPropValue(null);
    }, [editingPropId, editingPropValue]);

    const handleAddProperty = useCallback(() => {
        if (!selectedPropId) {
            alert("Пожалуйста, выберите свойство.");
            return;
        }
        setProperties((prev) => [
            ...prev,
            {
                id: Number(selectedPropId),
                value: currentPropValue,
                ignored: false,
            },
        ]);
        setIsAddingProp(false);
        setSelectedPropId("");
        setCurrentPropValue(null);
    }, [selectedPropId, currentPropValue]);

    const handleCancelEdit = useCallback(() => {
        setEditingPropId(null);
        setEditingPropValue(null);
    }, []);

    // --- ГЛОБАЛЬНЫЙ ОБРАБОТЧИК КЛАВИШ ---
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                if (isFilterModalOpen) {
                    handleCancelFilter(); // Отмена/Esc закрывает без сохранения
                    return;
                }
                event.preventDefault();
                if (isAddingProp) setIsAddingProp(false);
                else if (editingPropId) handleCancelEdit();
                else onBack();
            }
            if (event.key === "Enter") {
                event.preventDefault();
                if (isFilterModalOpen) {
                    handleAddToIgnore();
                    return;
                }
                if (isAddingProp) handleAddProperty();
                if (editingPropId) handleUpdateProperty();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        isAddingProp,
        editingPropId,
        isFilterModalOpen,
        onBack,
        handleAddProperty,
        handleUpdateProperty,
        handleCancelEdit,
        handleAddToIgnore,
        handleCancelFilter,
    ]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setProperties((items) => {
                const oldIndex = items.findIndex(
                    (item) => item.id === active.id
                );
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const calculatePropertyValue = useCallback(
        (propIdToCalc) => {
            const truncateToTwoDecimals = (num) => {
                if (isNaN(num) || !isFinite(num)) return "";
                return Math.floor(num * 100) / 100;
            };
            const safeParseFloat = (str) =>
                parseFloat(String(str).replace(",", "."));
            const findPropValue = (id) => {
                const prop = properties.find((p) => p.id === id);
                return prop ? safeParseFloat(prop.value) : NaN;
            };

            switch (propIdToCalc) {
                case 4362: {
                    const l = safeParseFloat(length);
                    const w = safeParseFloat(width);
                    if (!isNaN(l) && !isNaN(w) && l > 0 && w > 0)
                        return truncateToTwoDecimals((l / 100) * (w / 100));
                    break;
                }
                case 4354: {
                    const boxWeight = findPropValue(4357);
                    const amountInBox = findPropValue(4288);
                    if (
                        !isNaN(boxWeight) &&
                        !isNaN(amountInBox) &&
                        amountInBox > 0
                    )
                        return truncateToTwoDecimals(boxWeight / amountInBox);
                    break;
                }
                case 4355: {
                    const boxWeight = findPropValue(4357);
                    const m2InBox = findPropValue(4289);
                    if (!isNaN(boxWeight) && !isNaN(m2InBox) && m2InBox > 0)
                        return truncateToTwoDecimals(boxWeight / m2InBox);
                    break;
                }
                case 4357: {
                    const m2Weight = findPropValue(4355);
                    const m2InBox = findPropValue(4289);
                    if (!isNaN(m2Weight) && !isNaN(m2InBox))
                        return truncateToTwoDecimals(m2Weight * m2InBox);
                    const palletWeight = findPropValue(5277);
                    const boxesInPallet = findPropValue(4947);
                    if (
                        !isNaN(palletWeight) &&
                        !isNaN(boxesInPallet) &&
                        boxesInPallet > 0
                    )
                        return truncateToTwoDecimals(
                            palletWeight / boxesInPallet
                        );
                    break;
                }
                case 4289: {
                    const amountInBox = findPropValue(4288);
                    const tileArea = findPropValue(4362);
                    if (!isNaN(amountInBox) && !isNaN(tileArea))
                        return truncateToTwoDecimals(amountInBox * tileArea);
                    break;
                }
                case 4356: {
                    const boxesInPallet = findPropValue(4947);
                    const m2InBox = findPropValue(4289);
                    if (!isNaN(boxesInPallet) && !isNaN(m2InBox))
                        return truncateToTwoDecimals(boxesInPallet * m2InBox);
                    break;
                }
                case 4947: {
                    const m2InPallet = findPropValue(4356);
                    const m2InBox = findPropValue(4289);
                    if (!isNaN(m2InPallet) && !isNaN(m2InBox) && m2InBox > 0)
                        return truncateToTwoDecimals(m2InPallet / m2InBox);
                    break;
                }
                case 5277: {
                    const boxWeight = findPropValue(4357);
                    const boxesInPallet = findPropValue(4947);
                    if (!isNaN(boxWeight) && !isNaN(boxesInPallet))
                        return truncateToTwoDecimals(boxWeight * boxesInPallet);
                    break;
                }
                default:
                    return null;
            }
        },
        [properties, length, width]
    );

    const handleSave = useCallback(() => {
        if (!name.trim()) {
            alert("Название шаблона не может быть пустым.");
            return;
        }
        const sanitizedProperties = properties.map((p) => {
            const propInfo = propertiesList[p.id];
            if (
                propInfo &&
                (propInfo.type === "number" || propInfo.type === "text") &&
                typeof p.value === "string"
            ) {
                return { ...p, value: p.value.replace(",", ".") };
            }
            return p;
        });
        const sanitizedLength =
            typeof length === "string" ? length.replace(",", ".") : length;
        const sanitizedWidth =
            typeof width === "string" ? width.replace(",", ".") : width;
        const updatedTemplate = {
            ...template,
            name: name.trim(),
            properties: sanitizedProperties,
            length: sanitizedLength,
            width: sanitizedWidth,
        };
        onUpdate(updatedTemplate);
        onBack();
    }, [name, properties, length, width, template, onUpdate, onBack]);

    const handleDeleteProperty = (propId) => {
        setProperties(properties.filter((p) => p.id !== propId));
        manageStatus("Свойство удалено", 1500);
    };

    const handleClearProperties = () => {
        if (
            confirm(
                "Вы уверены, что хотите удалить все свойства из этого шаблона?"
            )
        ) {
            setProperties([]);
            manageStatus("Список свойств очищен", 1500);
        }
    };

    const handleEditClick = (prop) => {
        setEditingPropId(prop.id);
        setEditingPropValue(prop.value);
    };

    // --- ФУНКЦИЯ ИМПОРТА ---
    const handleImport = (mode) => {
        const confirmationMessage =
            mode === "replace"
                ? "Это действие заменит все текущие данные в шаблоне данными со страницы (с учетом фильтра). Продолжить?"
                : "Это действие добавит недостающие свойства со страницы в ваш шаблон (с учетом фильтра). Продолжить?";
        if (!confirm(confirmationMessage)) return;

        manageStatus("Импортирую данные со страницы...", 2000);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                manageError("Ошибка: активная вкладка не найдена");
                return;
            }
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    func: getPropertiesFromPage,
                    world: "MAIN",
                },
                (injectionResults) => {
                    if (chrome.runtime.lastError) {
                        manageError(
                            "Ошибка: " + chrome.runtime.lastError.message
                        );
                        return;
                    }
                    if (
                        !injectionResults ||
                        !injectionResults[0] ||
                        !injectionResults[0].result
                    ) {
                        manageError("Скрипт не вернул результат.");
                        return;
                    }
                    const result = injectionResults[0].result;
                    if (result.success) {
                        let pageProperties = result.data.properties;

                        // 1. ФИЛЬТРАЦИЯ
                        const totalFound = pageProperties.length;
                        pageProperties = pageProperties.filter(
                            (p) =>
                                !ignoredImportIds.includes(String(p.id)) &&
                                !ignoredImportIds.includes(p.id)
                        );
                        const filteredCount =
                            totalFound - pageProperties.length;

                        // 2. РАСПОЗНАВАНИЕ
                        const knownProperties = pageProperties
                            .filter((p) =>
                                Object.prototype.hasOwnProperty.call(
                                    propertiesList,
                                    p.id
                                )
                            )
                            .map((p) => ({ ...p, ignored: false }));

                        const unknownCount =
                            pageProperties.length - knownProperties.length;

                        if (unknownCount > 0 || filteredCount > 0) {
                            let msg = "Импорт: ";
                            if (filteredCount > 0)
                                msg += `скрыто ${filteredCount}; `;
                            if (unknownCount > 0)
                                msg += `неизвестных ${unknownCount};`;
                            manageStatus(msg, 3000);
                        }

                        if (mode === "replace") {
                            setProperties(knownProperties);
                            setLength(result.data.length);
                            setWidth(result.data.width);
                            manageStatus("Данные заменены", 1500);
                        } else {
                            const existingPropIds = new Set(
                                properties.map((p) => p.id)
                            );
                            const newProperties = knownProperties.filter(
                                (p) => !existingPropIds.has(p.id)
                            );

                            if (newProperties.length > 0) {
                                setProperties((prev) => [
                                    ...prev,
                                    ...newProperties,
                                ]);
                                manageStatus(
                                    `Добавлено ${newProperties.length}`,
                                    1500
                                );
                            } else {
                                manageStatus("Новых свойств не найдено", 1500);
                            }
                        }
                    } else {
                        manageError(result.message || "Ошибка скрипта.");
                    }
                }
            );
        });
    };

    const handleSelectProperty = useCallback(
        (event) => {
            const newPropId = event.target.value;
            setSelectedPropId(newPropId);
            const calculatedValue = calculatePropertyValue(Number(newPropId));
            setCurrentPropValue(calculatedValue);
        },
        [calculatePropertyValue]
    );

    const handleCalculateProperty = (propId) => {
        const calculatedValue = calculatePropertyValue(propId);
        if (calculatedValue !== null && calculatedValue !== "") {
            setProperties((prev) =>
                prev.map((p) =>
                    p.id === propId ? { ...p, value: calculatedValue } : p
                )
            );
            manageStatus("Свойство вычислено.", 1500);
        } else {
            manageError("Недостаточно данных.");
        }
    };

    const handleRecalculateShape = () => {
        const safeParseFloat = (str) =>
            parseFloat(String(str).replace(",", "."));
        const l = safeParseFloat(length);
        const w = safeParseFloat(width);
        if (isNaN(l) || isNaN(w) || l <= 0 || w <= 0) {
            manageError("Заполните Длину и Ширину.");
            return;
        }
        const shapeValue = l === w ? "6361" : "6360";
        setProperties((prev) =>
            // ID 4287 - "Форма"
            prev.map((p) => (p.id === 4287 ? { ...p, value: shapeValue } : p))
        );
        manageStatus("Форма пересчитана.", 1500);
    };

    // eslint-disable-next-line no-unused-vars
    const runInternalCalculation = (propId) => {
        alert(
            "В этом режиме калькулятор пока недоступен. Используйте вкладку 'Свойства' -> 'Вычисление параметров'."
        );
    };

    const filteredProperties = properties.filter((prop) => {
        const propInfo = propertiesList[prop.id];
        if (!propInfo) return false;
        return propInfo.text.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const availableProperties = Object.keys(propertiesList).filter(
        (id) => !properties.some((p) => String(p.id) === id)
    );

    // --- ДАННЫЕ ДЛЯ МОДАЛКИ ---
    // Фильтруем свойства, чтобы не показывать те, что уже есть во ВРЕМЕННОМ списке
    const availableFilterOptions = Object.entries(propertiesList)
        .filter(([id, data]) => {
            if (tempIgnoredIds.includes(id)) return false;
            if (filterSearch) {
                return data.text
                    .toLowerCase()
                    .includes(filterSearch.toLowerCase());
            }
            return true;
        })
        .map(([id, data]) => ({ id, text: data.text }))
        .sort((a, b) => a.text.localeCompare(b.text));

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
                    &larr; Назад к списку
                </button>
            </div>
            <div className="dimensions-inputs">
                <div className="dimension-group">
                    <label>Длина, см:</label>
                    <input
                        type="text"
                        inputMode="decimal"
                        className="input-field"
                        value={length}
                        onChange={(e) =>
                            setLength(e.target.value.replace(/[^0-9,.]/g, ""))
                        }
                    />
                </div>
                <div className="dimension-group">
                    <label>Ширина, см:</label>
                    <input
                        type="text"
                        inputMode="decimal"
                        className="input-field"
                        value={width}
                        onChange={(e) =>
                            setWidth(e.target.value.replace(/[^0-9,.]/g, ""))
                        }
                    />
                </div>
            </div>
            <div className="properties-header">
                <h3>Свойства в шаблоне:</h3>
                <button
                    className="button small secondary"
                    onClick={handleClearProperties}
                    disabled={properties.length === 0}
                >
                    Очистить список
                </button>
            </div>
            <div className="search-bar-container">
                <input
                    type="text"
                    placeholder="Поиск по названию..."
                    className="input-field search-input"
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
                        onDragEnd={handleDragEnd}
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
                                                    onClick={
                                                        handleUpdateProperty
                                                    }
                                                >
                                                    Сохранить
                                                </button>
                                                <button
                                                    className="button small secondary"
                                                    onClick={handleCancelEdit}
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
                                                (p) => p.id === prop.id
                                            )}
                                            onEdit={() => handleEditClick(prop)}
                                            onDelete={() =>
                                                handleDeleteProperty(prop.id)
                                            }
                                            onCalculate={
                                                handleCalculateProperty
                                            }
                                            onRecalculateShape={
                                                handleRecalculateShape
                                            }
                                        />
                                    )
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
                        onChange={handleSelectProperty}
                    >
                        <option value="">
                            -- Выберите свойство для добавления --
                        </option>
                        {availableProperties.map((id) => (
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
                        <button className="button" onClick={handleAddProperty}>
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
                        onClick={handleOpenFilterModal}
                        style={{ marginRight: "8px" }}
                    >
                        <Icon name="gear" />
                    </button>
                    <button
                        className="button"
                        onClick={() => handleImport("replace")}
                    >
                        Импорт/Замена
                    </button>
                    <button
                        className="button"
                        onClick={() => handleImport("merge")}
                    >
                        Импорт/Добавление
                    </button>
                </div>
                <button className="button primary" onClick={handleSave}>
                    Сохранить и выйти
                </button>
            </div>

            {/* --- МОДАЛЬНОЕ ОКНО ФИЛЬТРА --- */}
            {isFilterModalOpen && (
                // Убрали onClick={...} с оверлея
                <div className="modal-overlay">
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>Фильтр импорта</h3>
                        <p className="modal-desc">
                            Свойства которые будут игнорироваться при импорте
                        </p>

                        <div className="filter-controls">
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Найти свойство..."
                                value={filterSearch}
                                onChange={(e) =>
                                    setFilterSearch(e.target.value)
                                }
                                style={{ width: "100%", marginBottom: "8px" }}
                            />

                            <div className="filter-list-container">
                                {availableFilterOptions.length > 0 ? (
                                    availableFilterOptions.map((opt) => (
                                        <div
                                            key={opt.id}
                                            className={`filter-item ${
                                                filterSelectId === opt.id
                                                    ? "selected"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                setFilterSelectId(opt.id)
                                            }
                                            onDoubleClick={() =>
                                                handleAddDirectly(opt.id)
                                            }
                                        >
                                            {opt.text}
                                        </div>
                                    ))
                                ) : (
                                    <div
                                        style={{
                                            padding: "8px",
                                            color: "#999",
                                            fontSize: "13px",
                                        }}
                                    >
                                        Ничего не найдено
                                    </div>
                                )}
                            </div>

                            <button
                                className="button full-width add-btn"
                                onClick={handleAddToIgnore}
                                disabled={!filterSelectId}
                                style={{ marginTop: "8px" }}
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
                                        {propertiesList[id]?.text ||
                                            `ID: ${id}`}
                                    </span>
                                    <button
                                        onClick={() =>
                                            handleRemoveFromIgnore(id)
                                        }
                                    >
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
                                Очистить список
                            </button>
                            <div className="modal-actions-right">
                                <button
                                    className="button secondary"
                                    onClick={handleCancelFilter}
                                    style={{ marginRight: "8px" }}
                                >
                                    Отмена
                                </button>
                                <button
                                    className="button primary"
                                    onClick={handleSaveFilter}
                                >
                                    Готово
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TemplateEditor;
