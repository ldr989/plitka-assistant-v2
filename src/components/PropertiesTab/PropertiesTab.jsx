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

import useUndoableState from "../../hooks/useUndoableState.js";
import TemplateEditor from "../TemplateEditor/TemplateEditor.jsx";
import Icon from "../Icon.jsx";
import Calculator from "../Calculator.jsx";
import { propertiesList } from "../../data/propertiesList.js";

import TemplateList from "./TemplateList.jsx";
import InlinePropertyItem from "./InlinePropertyItem.jsx";
import usePageLogic from "../../hooks/usePageLogic.js";

function PropertiesTab({ manageStatus, manageError }) {
    const [templates, setTemplates, setUndoableTemplates, undoTemplates] =
        useUndoableState("prop-templates", []);
    const [activeTemplateId, setActiveTemplateId] = useUndoableState(
        "prop-active-template-id",
        null,
    );
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    const [missingProperties, setMissingProperties] = useState(null);
    const [showTemplateList, setShowTemplateList] = useState(false);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [showTemplateProperties, setShowTemplateProperties] = useState(false);
    const [inlineEditingPropId, setInlineEditingPropId] = useState(null);
    const [inlineEditingPropValue, setInlineEditingPropValue] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [localProperties, setLocalProperties] = useState(null);

    const { findMissingProperties, addMissingForms, fillForms, cleanEmpty } =
        usePageLogic(manageStatus, manageError);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    );

    const activeTemplate = templates.find(
        (t) => String(t.id) === activeTemplateId,
    );

    useEffect(() => {
        setMissingProperties(null);
        setShowTemplateProperties(false);
        setSearchTerm("");
        setLocalProperties(
            activeTemplate
                ? JSON.parse(JSON.stringify(activeTemplate.properties))
                : null,
        );
    }, [activeTemplate]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.code === "KeyZ" && !editingTemplateId) {
                e.preventDefault();
                if (undoTemplates())
                    manageStatus("Удаление шаблона отменено", 1500);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undoTemplates, manageStatus, editingTemplateId]);

    const handleAddTemplate = (name) => {
        const newT = {
            id: Date.now(),
            name,
            properties: [],
            length: "",
            width: "",
        };
        setTemplates((prev) => [...prev, newT]);
        manageStatus(`Шаблон "${name}" создан`, 1000);
    };

    const handleDeleteTemplate = (id, name) => {
        if (confirm(`Вы уверены, что хотите удалить шаблон "${name}"?`)) {
            if (String(id) === activeTemplateId) setActiveTemplateId(null);
            setUndoableTemplates(templates.filter((t) => t.id !== id));
            manageStatus("Шаблон удален (Ctrl+Z для отмены)", 3000);
        }
    };

    const handleDuplicateTemplate = (id) => {
        const target = templates.find((t) => t.id === id);
        if (!target) return;
        const copy = JSON.parse(JSON.stringify(target));
        copy.id = Date.now();
        copy.name = `${target.name} (Копия)`;
        const idx = templates.findIndex((t) => t.id === id);
        const newList = [...templates];
        newList.splice(idx + 1, 0, copy);
        setTemplates(newList);
        manageStatus(`Шаблон "${target.name}" скопирован`, 1500);
    };

    if (editingTemplateId) {
        const t = templates.find((t) => t.id === editingTemplateId);
        return (
            <TemplateEditor
                template={t}
                onBack={() => setEditingTemplateId(null)}
                onUpdate={(upd) =>
                    setTemplates((prev) =>
                        prev.map((x) => (x.id === upd.id ? upd : x)),
                    )
                }
                manageStatus={manageStatus}
            />
        );
    }

    if (showTemplateList) {
        return (
            <TemplateList
                templates={templates}
                onDragEnd={(e) => {
                    if (e.over && e.active.id !== e.over.id)
                        setTemplates((items) =>
                            arrayMove(
                                items,
                                items.findIndex((x) => x.id === e.active.id),
                                items.findIndex((x) => x.id === e.over.id),
                            ),
                        );
                }}
                onAdd={handleAddTemplate}
                onEdit={setEditingTemplateId}
                onDuplicate={handleDuplicateTemplate}
                onDelete={handleDeleteTemplate}
                onClose={() => setShowTemplateList(false)}
            />
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
                        <div className="inline-properties-header">
                            <div className="inline-properties-controls">
                                <button
                                    className="button secondary"
                                    onClick={() =>
                                        setShowTemplateProperties(
                                            !showTemplateProperties,
                                        )
                                    }
                                >
                                    {showTemplateProperties
                                        ? "Скрыть свойства"
                                        : "Показать свойства"}
                                </button>
                                {showTemplateProperties && (
                                    <button
                                        className="button secondary"
                                        onClick={() => {
                                            if (
                                                confirm(
                                                    "Сбросить все локальные изменения для этого шаблона?",
                                                )
                                            ) {
                                                setLocalProperties(
                                                    JSON.parse(
                                                        JSON.stringify(
                                                            activeTemplate.properties,
                                                        ),
                                                    ),
                                                );
                                                manageStatus(
                                                    "Изменения сброшены",
                                                    1500,
                                                );
                                            }
                                        }}
                                    >
                                        Сбросить изменения
                                    </button>
                                )}
                            </div>
                            {showTemplateProperties && (
                                <div className="search-bar-container">
                                    <input
                                        className="input-field search-input"
                                        placeholder="Поиск по названию..."
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
                            )}
                        </div>
                        {showTemplateProperties && localProperties && (
                            <div className="properties-list">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={(e) => {
                                        if (e.over && e.active.id !== e.over.id)
                                            setLocalProperties(
                                                arrayMove(
                                                    localProperties,
                                                    localProperties.findIndex(
                                                        (p) =>
                                                            p.id ===
                                                            e.active.id,
                                                    ),
                                                    localProperties.findIndex(
                                                        (p) =>
                                                            p.id === e.over.id,
                                                    ),
                                                ),
                                            );
                                    }}
                                >
                                    <SortableContext
                                        items={localProperties}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <ul className="template-list">
                                            {localProperties
                                                .filter((p) =>
                                                    propertiesList[p.id]?.text
                                                        .toLowerCase()
                                                        .includes(
                                                            searchTerm.toLowerCase(),
                                                        ),
                                                )
                                                .map((p, idx) => (
                                                    <InlinePropertyItem
                                                        key={p.id}
                                                        prop={p}
                                                        index={idx}
                                                        isEditing={
                                                            inlineEditingPropId ===
                                                            p.id
                                                        }
                                                        editingValue={
                                                            inlineEditingPropValue
                                                        }
                                                        onStartEdit={() => {
                                                            setInlineEditingPropId(
                                                                p.id,
                                                            );
                                                            setInlineEditingPropValue(
                                                                p.value,
                                                            );
                                                        }}
                                                        onCancelEdit={() =>
                                                            setInlineEditingPropId(
                                                                null,
                                                            )
                                                        }
                                                        onSaveEdit={() => {
                                                            setLocalProperties(
                                                                localProperties.map(
                                                                    (x) =>
                                                                        x.id ===
                                                                        inlineEditingPropId
                                                                            ? {
                                                                                  ...x,
                                                                                  value: inlineEditingPropValue,
                                                                              }
                                                                            : x,
                                                                ),
                                                            );
                                                            setInlineEditingPropId(
                                                                null,
                                                            );
                                                        }}
                                                        onToggleIgnore={() =>
                                                            setLocalProperties(
                                                                localProperties.map(
                                                                    (x) =>
                                                                        x.id ===
                                                                        p.id
                                                                            ? {
                                                                                  ...x,
                                                                                  ignored:
                                                                                      !x.ignored,
                                                                              }
                                                                            : x,
                                                                ),
                                                            )
                                                        }
                                                        onValueChange={
                                                            setInlineEditingPropValue
                                                        }
                                                    />
                                                ))}
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
                        onClick={() =>
                            findMissingProperties(
                                localProperties,
                                setMissingProperties,
                            )
                        }
                    >
                        Поиск свойств
                    </button>
                    <button
                        className="button"
                        disabled={!missingProperties?.length}
                        onClick={() => addMissingForms(missingProperties)}
                    >
                        Добавить формы
                    </button>
                    <button
                        className="button"
                        disabled={!missingProperties?.length}
                        onClick={() => fillForms(missingProperties)}
                    >
                        Заполнить
                    </button>
                    <button
                        className="button"
                        disabled={!activeTemplate}
                        onClick={() =>
                            fillForms(
                                localProperties.filter((p) => !p.ignored),
                                "Заменяю значения для",
                            )
                        }
                    >
                        Заменить
                    </button>
                </div>

                <div className="extra-actions-container">
                    <button className="button secondary" onClick={cleanEmpty}>
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
