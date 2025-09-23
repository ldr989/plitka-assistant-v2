/* eslint-disable no-undef */
import React, { useState, useEffect, useCallback } from "react";
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

import useUndoableState from "../hooks/useUndoableState.js";
import TemplateEditor from "./TemplateEditor.jsx";
import { PropertyValueInput } from "./PropertyComponents.jsx";
import { getDisplayValue } from "./property-helpers.jsx";
import Icon from "./Icon.jsx";
import Calculator from "./Calculator.jsx";
import {
    getPropertiesFromPage,
    addPropertyFormsOnPage,
    fillPropertyFormsOnPage,
    deleteEmptyProperties, // --- НОВЫЙ ИМПОРТ ---
} from "../utils/page-scripts.js";
import { propertiesList } from "../data/propertiesList.js";

function SortableTemplateItem({
    template,
    index,
    onEdit,
    onDuplicate,
    onDelete,
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: template.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <li ref={setNodeRef} style={style} {...attributes}>
            <div className="drag-handle" {...listeners}>
                <span className="prop-number">{index + 1}.</span>
            </div>
            <div className="template-info">
                <span className="template-name">{template.name}</span>
                <span className="template-prop-count">
                    Свойств: {template.properties.length}
                </span>
            </div>
            <div className="template-actions">
                <button
                    className="button small icon-button"
                    title="Редактировать"
                    onClick={onEdit}
                >
                    <Icon name="pencil" />
                </button>
                <button
                    className="button small icon-button"
                    title="Дублировать"
                    onClick={onDuplicate}
                >
                    <Icon name="copy" />
                </button>
                <button
                    className="button small icon-button danger"
                    title="Удалить"
                    onClick={onDelete}
                >
                    <Icon name="trash" />
                </button>
            </div>
        </li>
    );
}

function InlinePropertyItem({
    prop,
    index,
    isEditing,
    editingValue,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onToggleIgnore,
    onValueChange,
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: prop.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={
                isEditing ? "editing-item" : prop.ignored ? "ignored-item" : ""
            }
        >
            <div className="handle-wrapper" {...listeners}>
                <div className="drag-handle">
                    <span className="prop-number">{index + 1}.</span>
                </div>
                <div className="prop-details">
                    <span className="prop-name">
                        {propertiesList[prop.id]?.text}
                    </span>
                    {isEditing ? (
                        <PropertyValueInput
                            propId={prop.id}
                            value={editingValue}
                            onChange={onValueChange}
                        />
                    ) : (
                        <span className="prop-value">
                            {getDisplayValue(prop.id, prop.value)}
                        </span>
                    )}
                </div>
            </div>

            <div className="template-actions">
                {isEditing ? (
                    <>
                        <button
                            className="button small primary"
                            onClick={onSaveEdit}
                        >
                            Сохранить
                        </button>
                        <button
                            className="button small secondary"
                            onClick={onCancelEdit}
                        >
                            Отмена
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className="button small icon-button"
                            title={
                                prop.ignored
                                    ? "Включить свойство"
                                    : "Игнорировать свойство"
                            }
                            onClick={onToggleIgnore}
                        >
                            <Icon name={prop.ignored ? "eye-off" : "eye"} />
                        </button>
                        <button
                            className="button small icon-button"
                            title="Редактировать"
                            onClick={onStartEdit}
                        >
                            <Icon name="pencil" />
                        </button>
                    </>
                )}
            </div>
        </li>
    );
}

function PropertiesTab({ manageStatus, manageError }) {
    const [templates, setTemplates, setUndoableTemplates, undoTemplates] =
        useUndoableState("prop-templates", []);
    const [activeTemplateId, setActiveTemplateId] = useUndoableState(
        "prop-active-template-id",
        null
    );
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState("");
    const [missingProperties, setMissingProperties] = useState(null);

    const [showTemplateList, setShowTemplateList] = useState(false);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [showTemplateProperties, setShowTemplateProperties] = useState(false);
    const [inlineEditingPropId, setInlineEditingPropId] = useState(null);
    const [inlineEditingPropValue, setInlineEditingPropValue] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [localProperties, setLocalProperties] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleTemplateDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setTemplates((items) => {
                const oldIndex = items.findIndex(
                    (item) => item.id === active.id
                );
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const activeTemplate = templates.find(
        (t) => String(t.id) === activeTemplateId
    );

    useEffect(() => {
        setMissingProperties(null);
        setShowTemplateProperties(false);
        setSearchTerm("");
        if (activeTemplate) {
            setLocalProperties(
                JSON.parse(JSON.stringify(activeTemplate.properties))
            );
        } else {
            setLocalProperties(null);
        }
    }, [activeTemplate]);

    const handleUpdateTemplate = (updatedTemplate) => {
        if (!updatedTemplate.name.trim()) {
            manageError("Название шаблона не может быть пустым");
            return;
        }
        setTemplates((prevTemplates) =>
            prevTemplates.map((t) =>
                t.id === updatedTemplate.id ? updatedTemplate : t
            )
        );
        manageStatus(`Шаблон "${updatedTemplate.name}" обновлен`, 1500);
    };

    const handleInlinePropertiesDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = localProperties.findIndex(
                (p) => p.id === active.id
            );
            const newIndex = localProperties.findIndex((p) => p.id === over.id);
            setLocalProperties(arrayMove(localProperties, oldIndex, newIndex));
        }
    };

    const handleToggleIgnoreProperty = (propId) => {
        const newProperties = localProperties.map((p) =>
            p.id === propId ? { ...p, ignored: !p.ignored } : p
        );
        setLocalProperties(newProperties);
    };

    const handleSaveInlineProperty = () => {
        const newProperties = localProperties.map((p) =>
            p.id === inlineEditingPropId
                ? { ...p, value: inlineEditingPropValue }
                : p
        );
        setLocalProperties(newProperties);
        setInlineEditingPropId(null);
        setInlineEditingPropValue(null);
    };

    const handleResetLocalChanges = () => {
        if (!activeTemplate) return;
        if (
            confirm(
                "Вы уверены, что хотите сбросить все локальные изменения для этого шаблона?"
            )
        ) {
            setLocalProperties(
                JSON.parse(JSON.stringify(activeTemplate.properties))
            );
            manageStatus("Изменения сброшены", 1500);
        }
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey && event.code === "KeyZ" && !editingTemplateId) {
                event.preventDefault();
                if (undoTemplates()) {
                    manageStatus("Удаление шаблона отменено", 1500);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undoTemplates, manageStatus, editingTemplateId]);

    useEffect(() => {
        if (showTemplateList) {
            const handleKeyDown = (event) => {
                if (event.key === "Escape") {
                    setShowTemplateList(false);
                }
            };
            window.addEventListener("keydown", handleKeyDown);

            return () => window.removeEventListener("keydown", handleKeyDown);
        }
    }, [showTemplateList]);

    const handleAddTemplate = useCallback(() => {
        if (!newTemplateName.trim()) {
            manageError("Название шаблона не может быть пустым");
            return;
        }
        const newTemplate = {
            id: Date.now(),
            name: newTemplateName.trim(),
            properties: [],
            length: "",
            width: "",
        };
        setTemplates((prevTemplates) => [...prevTemplates, newTemplate]);
        setNewTemplateName("");
        setIsAdding(false);
        manageStatus(`Шаблон "${newTemplate.name}" создан`, 1000);
    }, [newTemplateName, setTemplates, manageStatus, manageError]);

    const handleDeleteTemplate = (templateId, templateName) => {
        if (
            confirm(`Вы уверены, что хотите удалить шаблон "${templateName}"?`)
        ) {
            if (String(templateId) === activeTemplateId) {
                setActiveTemplateId(null);
            }
            const newTemplates = templates.filter((t) => t.id !== templateId);
            setUndoableTemplates(newTemplates);
            manageStatus("Шаблон удален (Ctrl+Z для отмены)", 3000);
        }
    };

    const handleDuplicateTemplate = (templateId) => {
        const templateToDuplicate = templates.find((t) => t.id === templateId);
        if (!templateToDuplicate) return;

        const newTemplate = JSON.parse(JSON.stringify(templateToDuplicate));

        newTemplate.id = Date.now();
        newTemplate.name = `${templateToDuplicate.name} (Копия)`;

        const originalIndex = templates.findIndex((t) => t.id === templateId);

        const newTemplates = [...templates];
        newTemplates.splice(originalIndex + 1, 0, newTemplate);

        setTemplates(newTemplates);
        manageStatus(`Шаблон "${templateToDuplicate.name}" скопирован`, 1500);
    };

    const handleFindMissingProperties = () => {
        if (!activeTemplate || !localProperties) return;
        manageStatus("Ищу свойства на странице...", 2000);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) return;
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    func: getPropertiesFromPage,
                    world: "MAIN",
                },
                (injectionResults) => {
                    if (!injectionResults || !injectionResults[0]) return;
                    const result = injectionResults[0].result;
                    if (result && result.success) {
                        const pagePropIds = new Set(
                            result.data.properties.map((p) => p.id)
                        );
                        const templateProps = localProperties.filter(
                            (p) => !p.ignored
                        );
                        const missing = templateProps.filter(
                            (p) => !pagePropIds.has(p.id)
                        );
                        setMissingProperties(missing);
                        manageStatus(
                            missing.length > 0
                                ? `Найдено отсутствующих свойств: ${missing.length}`
                                : "Все свойства из шаблона уже есть на странице.",
                            4000
                        );
                    } else {
                        manageError(
                            result
                                ? result.message
                                : "Скрипт не вернул результат."
                        );
                    }
                }
            );
        });
    };

    const handleAddMissingForms = () => {
        if (!missingProperties || missingProperties.length === 0) return;
        const missingPropIds = missingProperties.map((p) => p.id);
        manageStatus(
            `Добавляю ${missingPropIds.length} форм(у)...`,
            500 + missingPropIds.length * 350
        );
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) return;
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: addPropertyFormsOnPage,
                args: [missingPropIds],
                world: "MAIN",
            });
        });
    };

    const handleFillMissingForms = () => {
        if (!missingProperties || missingProperties.length === 0) return;
        manageStatus(
            `Заполняю ${missingProperties.length} форм(у)...`,
            500 + missingProperties.length * 150
        );
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) return;
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: fillPropertyFormsOnPage,
                args: [missingProperties],
                world: "MAIN",
            });
        });
    };

    const handleReplaceAllValues = () => {
        if (!activeTemplate || !localProperties) return;
        const propsToFill = localProperties.filter((p) => !p.ignored);
        if (propsToFill.length === 0) {
            manageError(
                "В шаблоне нет свойств для замены (с учетом игнорируемых)."
            );
            return;
        }
        manageStatus(
            `Заменяю значения для ${propsToFill.length} свойств...`,
            500 + propsToFill.length * 150
        );
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) return;
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: fillPropertyFormsOnPage,
                args: [propsToFill],
                world: "MAIN",
            });
        });
    };

    // --- НОВЫЙ ОБРАБОТЧИК ---
    const handleDeleteEmptyProperties = () => {
        manageStatus("Удаляю пустые свойства со страницы...", 2000);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                manageError("Активная вкладка не найдена.");
                return;
            }
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    func: deleteEmptyProperties,
                    world: "MAIN",
                },
                (injectionResults) => {
                    if (!injectionResults || !injectionResults[0]) return;
                    const result = injectionResults[0].result;
                    if (result && result.message) {
                        manageStatus(result.message, 3000);
                    }
                }
            );
        });
    };

    const filteredInlineProperties = localProperties
        ? localProperties.filter((prop) => {
              const propInfo = propertiesList[prop.id];
              if (!propInfo) return false;
              return propInfo.text
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase());
          })
        : [];

    const editingTemplate = templates.find((t) => t.id === editingTemplateId);
    if (editingTemplate) {
        return (
            <TemplateEditor
                template={editingTemplate}
                onBack={() => setEditingTemplateId(null)}
                onUpdate={handleUpdateTemplate}
                manageStatus={manageStatus}
                manageError={manageError}
            />
        );
    }

    if (showTemplateList) {
        return (
            <div className="section">
                <div className="template-list-header">
                    <h2>Список шаблонов:</h2>
                    <button
                        className="button icon-button"
                        onClick={() => setShowTemplateList(false)}
                        title="Закрыть"
                    >
                        <Icon name="close" />
                    </button>
                </div>
                {isAdding ? (
                    <div className="add-template-form">
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Название нового шаблона"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            autoFocus
                        />
                        <button className="button" onClick={handleAddTemplate}>
                            Добавить
                        </button>
                        <button
                            className="button secondary"
                            onClick={() => setIsAdding(false)}
                        >
                            Отмена
                        </button>
                    </div>
                ) : (
                    <button
                        className="button"
                        onClick={() => setIsAdding(true)}
                    >
                        + Добавить новый шаблон
                    </button>
                )}
                <div className="template-list-container">
                    {templates.length === 0 ? (
                        <p className="empty-list-message">
                            Ваш список шаблонов пуст.
                        </p>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleTemplateDragEnd}
                        >
                            <SortableContext
                                items={templates}
                                strategy={verticalListSortingStrategy}
                            >
                                <ul className="template-list">
                                    {templates.map((template, index) => (
                                        <SortableTemplateItem
                                            key={template.id}
                                            template={template}
                                            index={index}
                                            onEdit={() =>
                                                setEditingTemplateId(
                                                    template.id
                                                )
                                            }
                                            onDuplicate={() =>
                                                handleDuplicateTemplate(
                                                    template.id
                                                )
                                            }
                                            onDelete={() =>
                                                handleDeleteTemplate(
                                                    template.id,
                                                    template.name
                                                )
                                            }
                                        />
                                    ))}
                                </ul>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="section">
                <div className="section-header">
                    <h2>Свойства плитки</h2>
                    <button
                        className="button secondary"
                        onClick={() => setShowTemplateList(true)}
                    >
                        Шаблоны
                    </button>
                </div>
                <div className="active-template-display">
                    <span>Текущий шаблон:</span>
                    {activeTemplate ? (
                        <strong>{activeTemplate.name}</strong>
                    ) : (
                        <span className="no-template">Не выбран</span>
                    )}
                    <div className="template-selector-wrapper">
                        <button
                            className="button icon-button small"
                            onClick={() =>
                                setShowTemplateSelector(!showTemplateSelector)
                            }
                            title="Выбрать шаблон"
                        >
                            <Icon name="pencil" />
                        </button>
                        {showTemplateSelector && (
                            <select
                                className="template-chooser-popup"
                                value={activeTemplateId || ""}
                                onChange={(e) => {
                                    setActiveTemplateId(e.target.value);
                                    setShowTemplateSelector(false);
                                }}
                                disabled={templates.length === 0}
                                size={Math.min(templates.length + 1, 8)}
                                autoFocus
                                onBlur={() => setShowTemplateSelector(false)}
                            >
                                <option value="">-- Выбрать шаблон --</option>
                                {templates.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
                {activeTemplate && (
                    <div className="inline-properties-section">
                        {showTemplateProperties && localProperties ? (
                            // --- ИЗМЕНЕНИЕ: Обертка для sticky-эффекта ---
                            <div className="inline-properties-header">
                                <div className="inline-properties-controls">
                                    <button
                                        className="button secondary"
                                        onClick={() =>
                                            setShowTemplateProperties((p) => !p)
                                        }
                                    >
                                        {showTemplateProperties
                                            ? "Скрыть свойства"
                                            : "Показать свойства"}
                                    </button>
                                    <button
                                        className="button secondary"
                                        onClick={handleResetLocalChanges}
                                    >
                                        Сбросить изменения
                                    </button>
                                </div>
                                <div className="search-bar-container">
                                    <input
                                        type="text"
                                        placeholder="Поиск по названию..."
                                        className="input-field search-input"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
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
                            </div>
                        ) : (
                            <div className="inline-properties-controls">
                                <button
                                    className="button secondary"
                                    onClick={() =>
                                        setShowTemplateProperties((p) => !p)
                                    }
                                >
                                    {showTemplateProperties
                                        ? "Скрыть свойства"
                                        : "Показать свойства"}
                                </button>
                            </div>
                        )}
                        {showTemplateProperties && localProperties && (
                            <div className="properties-list">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleInlinePropertiesDragEnd}
                                >
                                    <SortableContext
                                        items={localProperties}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <ul className="template-list">
                                            {filteredInlineProperties.map(
                                                (prop, index) => (
                                                    <InlinePropertyItem
                                                        key={prop.id}
                                                        prop={prop}
                                                        index={index}
                                                        isEditing={
                                                            inlineEditingPropId ===
                                                            prop.id
                                                        }
                                                        editingValue={
                                                            inlineEditingPropValue
                                                        }
                                                        onStartEdit={() => {
                                                            setInlineEditingPropId(
                                                                prop.id
                                                            );
                                                            setInlineEditingPropValue(
                                                                prop.value
                                                            );
                                                        }}
                                                        onCancelEdit={() =>
                                                            setInlineEditingPropId(
                                                                null
                                                            )
                                                        }
                                                        onSaveEdit={
                                                            handleSaveInlineProperty
                                                        }
                                                        onToggleIgnore={() =>
                                                            handleToggleIgnoreProperty(
                                                                prop.id
                                                            )
                                                        }
                                                        onValueChange={
                                                            setInlineEditingPropValue
                                                        }
                                                    />
                                                )
                                            )}
                                        </ul>
                                    </SortableContext>
                                </DndContext>
                            </div>
                        )}
                    </div>
                )}
                <div className="action-buttons-grid-2x2">
                    <button
                        className="button"
                        disabled={!activeTemplate}
                        onClick={handleFindMissingProperties}
                    >
                        Поиск свойств
                    </button>
                    <button
                        className="button"
                        disabled={
                            !activeTemplate ||
                            !missingProperties ||
                            missingProperties.length === 0
                        }
                        onClick={handleAddMissingForms}
                    >
                        Добавить формы
                    </button>
                    <button
                        className="button"
                        disabled={
                            !activeTemplate ||
                            !missingProperties ||
                            missingProperties.length === 0
                        }
                        onClick={handleFillMissingForms}
                    >
                        Заполнить
                    </button>
                    <button
                        className="button"
                        disabled={!activeTemplate}
                        onClick={handleReplaceAllValues}
                    >
                        Заменить
                    </button>
                </div>
                {/* --- НОВАЯ КНОПКА И ЕЕ КОНТЕЙНЕР --- */}
                <div className="extra-actions-container">
                    <button
                        className="button secondary"
                        onClick={handleDeleteEmptyProperties}
                    >
                        Удалить пустые свойства
                    </button>
                </div>
            </div>
            <hr />
            <div className="section">
                <h2>Вычисление параметров</h2>
                <Calculator
                    manageStatus={manageStatus}
                    manageError={manageError}
                />
            </div>
        </div>
    );
}

export default PropertiesTab;
