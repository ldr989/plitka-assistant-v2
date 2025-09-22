/* eslint-disable no-undef */
import React, { useState, useEffect, useCallback } from "react";
import { propertiesList } from "../data/propertiesList.js";
import Icon from "./Icon.jsx";

// --- Вспомогательные компоненты и функции ---

// Компонент для отображения правильного поля ввода
const PropertyValueInput = ({ propId, value, onChange }) => {
    const prop = propertiesList[propId];
    if (!prop) return null;

    switch (prop.type) {
        case "boolean":
            return (
                <div className="radio-group">
                    <label>
                        <input
                            type="radio"
                            value="true"
                            checked={value === true}
                            onChange={() => onChange(true)}
                        />{" "}
                        Да
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="false"
                            checked={value === false}
                            onChange={() => onChange(false)}
                        />{" "}
                        Нет
                    </label>
                </div>
            );
        case "select":
            return (
                <select
                    className="select-field"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <option value="">-- Выберите --</option>
                    {prop.options.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.text}
                        </option>
                    ))}
                </select>
            );
        case "checkbox": {
            const currentValues = Array.isArray(value) ? value : [];
            const handleCheckboxChange = (optionId) => {
                const newValues = currentValues.includes(optionId)
                    ? currentValues.filter((v) => v !== optionId)
                    : [...currentValues, optionId];
                onChange(newValues);
            };
            return (
                <div className="checkbox-group">
                    {prop.options.map((option) => (
                        <label key={option.id}>
                            <input
                                type="checkbox"
                                checked={currentValues.includes(option.id)}
                                onChange={() => handleCheckboxChange(option.id)}
                            />
                            {option.text}
                        </label>
                    ))}
                </div>
            );
        }
        case "text":
            return (
                <input
                    type="text"
                    className="input-field"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                />
            );
        case "number":
        default:
            return (
                <input
                    type="text"
                    inputMode="decimal"
                    className="input-field"
                    value={value || ""}
                    onChange={(e) => {
                        const sanitizedValue = e.target.value.replace(
                            /[^0-9,.]/g,
                            ""
                        );
                        onChange(sanitizedValue);
                    }}
                />
            );
    }
};

// Функция для красивого отображения сохраненного значения
const getDisplayValue = (propId, value) => {
    const propInfo = propertiesList[propId];

    if (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
    ) {
        return <span className="value-empty">пусто</span>;
    }

    if (!propInfo) return String(value);

    switch (propInfo.type) {
        case "boolean":
            return value ? "Да" : "Нет";
        case "select":
            return (
                propInfo.options.find((opt) => opt.id === value)?.text ||
                String(value)
            );
        case "checkbox":
            if (Array.isArray(value)) {
                return value
                    .map(
                        (val) =>
                            propInfo.options.find((opt) => opt.id === val)
                                ?.text || val
                    )
                    .join(", ");
            }
            return String(value);
        default:
            return String(value);
    }
};

// Эта функция будет запущена на странице для сбора свойств
const getPropertiesFromPage = () => {
    const props = [];
    try {
        const lengthInput = document.querySelector("#id_length");
        const widthInput = document.querySelector("#id_width");
        const lengthValue = lengthInput ? lengthInput.value : "";
        const widthValue = widthInput ? widthInput.value : "";

        const getScrapedValue = (element) => {
            if (!element) return null;
            if (
                element.tagName === "SELECT" ||
                (element.tagName === "INPUT" && element.type === "text")
            )
                return element.value;
            const checkedRadios = element.querySelectorAll(
                'input[type="radio"]:checked'
            );
            if (checkedRadios.length > 0) {
                const val = checkedRadios[0].value;
                if (val === "True") return true;
                if (val === "False") return false;
                return val;
            }
            const checkedCheckboxes = element.querySelectorAll(
                'input[type="checkbox"]:checked'
            );
            if (checkedCheckboxes.length > 0)
                return Array.from(checkedCheckboxes).map((cb) => cb.value);
            return null;
        };
        const propSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])'
        );
        const valueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])'
        );
        if (propSelects.length !== valueElements.length)
            return {
                success: false,
                message: "Ошибка: несоответствие свойств и значений.",
            };

        propSelects.forEach((propSelect, index) => {
            const propId = propSelect.value;
            if (!propId) return;
            const value = getScrapedValue(valueElements[index]);
            if (value !== null) props.push({ id: propId, value: value });
        });

        return {
            success: true,
            data: { properties: props, length: lengthValue, width: widthValue },
        };
    } catch (e) {
        return { success: false, message: `Произошла ошибка: ${e.message}` };
    }
};

// --- Основной компонент Редактора ---
function TemplateEditor({
    template,
    onBack,
    onUpdate,
    manageStatus,
    manageError,
}) {
    const [name, setName] = useState(template.name);
    const [properties, setProperties] = useState(template.properties || []);
    const [length, setLength] = useState(template.length || "");
    const [width, setWidth] = useState(template.width || "");

    const [isAddingProp, setIsAddingProp] = useState(false);
    const [selectedPropId, setSelectedPropId] = useState("");
    const [currentPropValue, setCurrentPropValue] = useState(null);

    const [editingPropId, setEditingPropId] = useState(null);
    const [editingPropValue, setEditingPropValue] = useState(null);

    // --- ЛОГИКА ВЫЧИСЛЕНИЙ ---
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
                case "4362": {
                    // Площадь плитки
                    const l = safeParseFloat(length);
                    const w = safeParseFloat(width);
                    if (!isNaN(l) && !isNaN(w) && l > 0 && w > 0)
                        return truncateToTwoDecimals((l / 100) * (w / 100));
                    break;
                }
                case "4354": {
                    // Вес 1 шт. плитки
                    const boxWeight = findPropValue("4357");
                    const amountInBox = findPropValue("4288");
                    if (
                        !isNaN(boxWeight) &&
                        !isNaN(amountInBox) &&
                        amountInBox > 0
                    )
                        return truncateToTwoDecimals(boxWeight / amountInBox);
                    break;
                }
                case "4355": {
                    // Вес 1 кв.м.
                    const boxWeight = findPropValue("4357");
                    const m2InBox = findPropValue("4289");
                    if (!isNaN(boxWeight) && !isNaN(m2InBox) && m2InBox > 0)
                        return truncateToTwoDecimals(boxWeight / m2InBox);
                    break;
                }
                case "4357": {
                    // Вес упаковки
                    const m2Weight = findPropValue("4355");
                    const m2InBox = findPropValue("4289");
                    if (!isNaN(m2Weight) && !isNaN(m2InBox))
                        return truncateToTwoDecimals(m2Weight * m2InBox);

                    const palletWeight = findPropValue("5277");
                    const boxesInPallet = findPropValue("4947");
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
                case "4289": {
                    // м2 в упаковке
                    const amountInBox = findPropValue("4288");
                    const tileArea = findPropValue("4362");
                    if (!isNaN(amountInBox) && !isNaN(tileArea))
                        return truncateToTwoDecimals(amountInBox * tileArea);
                    break;
                }
                case "4356": {
                    // м2 в палетте
                    const boxesInPallet = findPropValue("4947");
                    const m2InBox = findPropValue("4289");
                    if (!isNaN(boxesInPallet) && !isNaN(m2InBox))
                        return truncateToTwoDecimals(boxesInPallet * m2InBox);
                    break;
                }
                case "4947": {
                    // Коробок на палетте
                    const m2InPallet = findPropValue("4356");
                    const m2InBox = findPropValue("4289");
                    if (!isNaN(m2InPallet) && !isNaN(m2InBox) && m2InBox > 0)
                        return truncateToTwoDecimals(m2InPallet / m2InBox);
                    break;
                }
                case "5277": {
                    // Вес палетты
                    const boxWeight = findPropValue("4357");
                    const boxesInPallet = findPropValue("4947");
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

    // --- ОБРАБОТЧИКИ ДЕЙСТВИЙ ---
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

    const handleAddProperty = useCallback(() => {
        if (!selectedPropId) {
            alert("Пожалуйста, выберите свойство.");
            return;
        }
        setProperties((prev) => [
            ...prev,
            { id: selectedPropId, value: currentPropValue },
        ]);
        setIsAddingProp(false);
        setSelectedPropId("");
        setCurrentPropValue(null);
    }, [selectedPropId, currentPropValue]);

    const handleDeleteProperty = (propId) => {
        setProperties((prev) => prev.filter((p) => p.id !== propId));
    };

    const handleEditClick = (prop) => {
        setEditingPropId(prop.id);
        setEditingPropValue(prop.value);
    };

    const handleCancelEdit = useCallback(() => {
        setEditingPropId(null);
        setEditingPropValue(null);
    }, []);

    const handleUpdateProperty = useCallback(() => {
        setProperties((prev) =>
            prev.map((p) =>
                p.id === editingPropId ? { ...p, value: editingPropValue } : p
            )
        );
        setEditingPropId(null);
        setEditingPropValue(null);
    }, [editingPropId, editingPropValue]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                if (isAddingProp) setIsAddingProp(false);
                if (editingPropId) handleCancelEdit();
            }
            if (event.key === "Enter") {
                event.preventDefault();
                if (isAddingProp) handleAddProperty();
                if (editingPropId) handleUpdateProperty();
            }
        };

        if (isAddingProp || editingPropId) {
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [
        isAddingProp,
        editingPropId,
        handleAddProperty,
        handleUpdateProperty,
        handleCancelEdit,
    ]);

    const handleImport = (mode) => {
        const confirmationMessage =
            mode === "replace"
                ? "Это действие заменит все текущие данные в шаблоне данными со страницы. Продолжить?"
                : "Это действие добавит недостающие свойства со страницы в ваш шаблон. Продолжить?";

        if (!confirm(confirmationMessage)) {
            return;
        }
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
                    if (
                        !injectionResults ||
                        !injectionResults[0] ||
                        chrome.runtime.lastError
                    ) {
                        manageError(
                            "Ошибка: не удалось выполнить скрипт импорта"
                        );
                        return;
                    }
                    const result = injectionResults[0].result;
                    if (result.success) {
                        if (mode === "replace") {
                            setProperties(result.data.properties);
                            setLength(result.data.length);
                            setWidth(result.data.width);
                            manageStatus("Данные успешно заменены", 1500);
                        } else {
                            // mode === 'merge'
                            const existingPropIds = new Set(
                                properties.map((p) => p.id)
                            );
                            const newProperties = result.data.properties.filter(
                                (p) => !existingPropIds.has(p.id)
                            );

                            if (newProperties.length > 0) {
                                setProperties((prev) => [
                                    ...prev,
                                    ...newProperties,
                                ]);
                                manageStatus(
                                    `${newProperties.length} новых свойств добавлено`,
                                    1500
                                );
                            } else {
                                manageStatus(
                                    "Новых свойств на странице не найдено",
                                    1500
                                );
                            }
                        }
                    } else {
                        manageError(result.message);
                    }
                }
            );
        });
    };

    const handleSelectProperty = useCallback(
        (event) => {
            const newPropId = event.target.value;
            setSelectedPropId(newPropId);
            const calculatedValue = calculatePropertyValue(newPropId);
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
            manageStatus(
                `Свойство "${propertiesList[propId].text}" вычислено.`,
                1500
            );
        } else {
            manageError("Недостаточно данных для вычисления.");
        }
    };

    const handleRecalculateShape = () => {
        const safeParseFloat = (str) =>
            parseFloat(String(str).replace(",", "."));
        const l = safeParseFloat(length);
        const w = safeParseFloat(width);

        if (isNaN(l) || isNaN(w) || l <= 0 || w <= 0) {
            manageError("Заполните Длину и Ширину для расчета.");
            return;
        }

        const shapeValue = l === w ? "6361" : "6360";
        setProperties((prev) =>
            prev.map((p) => (p.id === "4287" ? { ...p, value: shapeValue } : p))
        );
        manageStatus('Свойство "Форма" пересчитано.', 1500);
    };

    const availableProperties = Object.keys(propertiesList).filter(
        (id) => !properties.some((p) => p.id === id)
    );
    const calculablePropIds = [
        "4288",
        "4289",
        "4357",
        "4362",
        "4354",
        "4355",
        "4947",
        "4356",
        "5277",
    ];

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

            <h3>Свойства в шаблоне:</h3>
            <div className="properties-list">
                {properties.length > 0 ? (
                    <ul className="template-list">
                        {properties.map((prop) =>
                            editingPropId === prop.id ? (
                                <li key={prop.id} className="editing-item">
                                    <div className="prop-details">
                                        <span className="prop-name">
                                            {propertiesList[prop.id]?.text}
                                        </span>
                                        <PropertyValueInput
                                            propId={prop.id}
                                            value={editingPropValue}
                                            onChange={setEditingPropValue}
                                        />
                                    </div>
                                    <div className="template-actions">
                                        <button
                                            className="button small primary"
                                            onClick={handleUpdateProperty}
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
                                <li key={prop.id}>
                                    <div className="prop-details">
                                        <span className="prop-name">
                                            {propertiesList[prop.id]?.text}
                                        </span>
                                        <span className="prop-value">
                                            {getDisplayValue(
                                                prop.id,
                                                prop.value
                                            )}
                                        </span>
                                    </div>
                                    <div className="template-actions">
                                        {prop.id === "4287" && (
                                            <button
                                                className="button small icon-button"
                                                title="Пересчитать Форму"
                                                onClick={handleRecalculateShape}
                                            >
                                                <Icon name="help" />
                                            </button>
                                        )}
                                        {calculablePropIds.includes(
                                            prop.id
                                        ) && (
                                            <button
                                                className="button small calc-button"
                                                title="Вычислить"
                                                onClick={() =>
                                                    handleCalculateProperty(
                                                        prop.id
                                                    )
                                                }
                                            >
                                                Calc
                                            </button>
                                        )}
                                        <button
                                            className="button small icon-button"
                                            title="Редактировать свойство"
                                            onClick={() =>
                                                handleEditClick(prop)
                                            }
                                        >
                                            <Icon name="pencil" />
                                        </button>
                                        <button
                                            className="button small icon-button danger"
                                            title="Удалить свойство"
                                            onClick={() =>
                                                handleDeleteProperty(prop.id)
                                            }
                                        >
                                            <Icon name="trash" />
                                        </button>
                                    </div>
                                </li>
                            )
                        )}
                    </ul>
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
                            propId={selectedPropId}
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
                <button className="button primary" onClick={handleSave}>
                    Сохранить и выйти
                </button>
            </div>
        </div>
    );
}

export default TemplateEditor;
