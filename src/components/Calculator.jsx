/* eslint-disable no-undef */
import React from "react";
// Импортируем все наши функции-калькуляторы
import * as calcs from "../utils/calculator-scripts.js";

// Компонент принимает функции для управления строкой состояния
function Calculator({ manageStatus, manageError }) {
    // Общая функция для запуска любого вычисления
    const handleCalculate = (calculationFunc, successMessage) => {
        // Сообщаем пользователю, что процесс начался
        manageStatus(`Вычисляю "${successMessage}"...`, 1500);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                manageError("Ошибка: активная вкладка не найдена");
                return;
            }

            // Запускаем нужную функцию на странице
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    func: calculationFunc,
                    world: "MAIN",
                },
                (injectionResults) => {
                    if (
                        chrome.runtime.lastError ||
                        !injectionResults ||
                        !injectionResults[0]
                    ) {
                        manageError("Ошибка: не удалось выполнить скрипт");
                        return;
                    }
                    const result = injectionResults[0].result;
                    if (result && !result.success) {
                        manageError(result.message || "Произошла ошибка");
                    }
                    // Если всё успешно, manageStatus завершит операцию
                }
            );
        });
    };

    // Рендерим группы кнопок
    return (
        <div className="calculator-section">
            <h4>Плитка:</h4>
            <div className="action-buttons-grid">
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(
                            calcs.calculateTileArea,
                            "Площадь плитки"
                        )
                    }
                >
                    Площадь плитки
                </button>
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(
                            calcs.calculateWeightOfTile,
                            "Вес 1 шт."
                        )
                    }
                >
                    Вес 1 шт.
                </button>
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(calcs.calculateWeightOfM2, "Вес 1 м²")
                    }
                >
                    Вес 1 м²
                </button>
            </div>

            <h4 style={{ marginTop: "16px" }}>Коробка:</h4>
            <div className="action-buttons-grid">
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(calcs.calculateM2InBox, "м² в коробке")
                    }
                >
                    м² в коробке
                </button>
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(
                            calcs.calculateWeightOfBox,
                            "Вес коробки"
                        )
                    }
                >
                    Вес коробки
                </button>
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(
                            calcs.calculateTilesInBox,
                            "Штук в коробке"
                        )
                    }
                >
                    Штук в коробке
                </button>
            </div>

            <h4 style={{ marginTop: "16px" }}>Паллета:</h4>
            <div className="action-buttons-grid">
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(
                            calcs.calculateBoxesInPallet,
                            "Коробок на паллете"
                        )
                    }
                >
                    Коробок на паллете
                </button>
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(
                            calcs.calculateM2InPallet,
                            "м² на паллете"
                        )
                    }
                >
                    м² на паллете
                </button>
                <button
                    className="button"
                    onClick={() =>
                        handleCalculate(
                            calcs.calculateWeightOfPallet,
                            "Вес паллеты"
                        )
                    }
                >
                    Вес паллеты
                </button>
            </div>
        </div>
    );
}

export default Calculator;
