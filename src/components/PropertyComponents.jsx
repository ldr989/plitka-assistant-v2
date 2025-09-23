import React from "react";
import { propertiesList } from "../data/propertiesList.js";

// Вспомогательный компонент для отображения полей ввода
export const PropertyValueInput = ({ propId, value, onChange }) => {
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
