import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { propertiesList } from "../../data/propertiesList.js";
import { getDisplayValue } from "../property-helpers.jsx";
import Icon from "../Icon.jsx";
import { CALCULABLE_PROP_IDS } from "../../utils/template-calculations.js";

function SortablePropertyItem({
    prop,
    index,
    onEdit,
    onClearValue,
    onDelete,
    onCalculate,
    onRecalculateShape,
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: prop.id });

    const style = { transform: CSS.Transform.toString(transform), transition };

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
                        className="button small calc-button"
                        onClick={onRecalculateShape}
                    >
                        Calc
                    </button>
                )}
                {CALCULABLE_PROP_IDS.includes(prop.id) && (
                    <button
                        className="button small calc-button"
                        onClick={() => onCalculate(prop.id)}
                    >
                        Calc
                    </button>
                )}
                <button
                    className="button small clear-button"
                    onClick={() => onClearValue(prop.id)}
                >
                    Clear
                </button>
                <button
                    className="button small icon-button"
                    onClick={() => onEdit(prop)}
                >
                    <Icon name="pencil" />
                </button>
                <button
                    className="button small icon-button danger"
                    onClick={() => onDelete(prop.id)}
                >
                    <Icon name="trash" />
                </button>
            </div>
        </li>
    );
}

export default SortablePropertyItem;
