/* eslint-disable no-undef */
import React from "react";
import * as calcs from "../utils/calculator-scripts.js";

function Calculator({ manageStatus, manageError }) {
    const handleCalculate = (calculationFunc, successMessage) => {
        manageStatus(`Вычисляю "${successMessage}"...`, 1500);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                manageError("Ошибка: активная вкладка не найдена");
                return;
            }

            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    func: calculationFunc,
                    world: "MAIN",
                },
                () => {
                    if (chrome.runtime.lastError) {
                        manageError(
                            "Ошибка выполнения: " +
                                chrome.runtime.lastError.message
                        );
                        return;
                    }
                }
            );
        });
    };

    return (
        <div className="calculator-section">
            <h4>Плитка:</h4>
            <div className="action-buttons-grid">
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(calcs.calculateTileArea, "Площадь")
                    }
                >
                    Площадь
                </button>
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(calcs.calculateWeightOfTile, "Кг/шт")
                    }
                >
                    Кг/шт
                </button>
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(calcs.calculateWeightOfM2, "Кг/м2")
                    }
                >
                    Кг/м2
                </button>
            </div>

            <h4 style={{ marginTop: "16px" }}>Коробка:</h4>
            <div className="action-buttons-grid">
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(calcs.calculateTilesInBox, "Шт/кор")
                    }
                >
                    Шт/кор
                </button>
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(calcs.calculateM2InBox, "М2/кор")
                    }
                >
                    М2/кор
                </button>
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(calcs.calculateWeightOfBox, "Кг/кор")
                    }
                >
                    Кг/кор
                </button>
            </div>

            <h4 style={{ marginTop: "16px" }}>Паллета:</h4>
            <div className="action-buttons-grid">
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(
                            calcs.calculateBoxesInPallet,
                            "Кор/палл"
                        )
                    }
                >
                    Кор/палл
                </button>
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(calcs.calculateM2InPallet, "М2/палл")
                    }
                >
                    М2/палл
                </button>
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(
                            calcs.calculateWeightOfPallet,
                            "Кг/палл"
                        )
                    }
                >
                    Кг/палл
                </button>
            </div>
        </div>
    );
}

export default Calculator;
