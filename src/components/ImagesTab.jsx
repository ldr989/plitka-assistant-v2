/* eslint-disable no-undef */
import React, { useState } from "react";

function ImagesTab({ manageStatus, manageError }) {
    const [amount, setAmount] = useState("");

    const handleAmountChange = (increment) => {
        const currentValue = parseInt(amount, 10) || 0;
        let newValue = currentValue + increment;
        if (newValue < 1) newValue = 1;
        if (newValue > 100) newValue = 100;
        setAmount(String(newValue));
    };

    const createNewImageForms = (count) => {
        const formContainer = document.querySelector(
            "#plumbing-image-content_type-object_id-group"
        );
        if (!formContainer) {
            return {
                success: false,
                message: "Ошибка: не найден контейнер изображений",
            };
        }
        if (formContainer.classList.contains("grp-closed")) {
            formContainer.classList.remove("grp-closed");
            formContainer.classList.add("grp-open");
        }
        const addButton = formContainer.querySelector("a.grp-add-handler");
        if (!addButton) {
            return {
                success: false,
                message: 'Ошибка: кнопка "Добавить" не найдена',
            };
        }
        const clickEvent = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
        });
        let clicksRemaining = count;
        // --- УСКОРЕНИЕ: Интервал снижен с 150 до 40 ---
        const clickInterval = 40;

        function clickWithDelay() {
            if (clicksRemaining <= 0) return;
            addButton.dispatchEvent(clickEvent);

            // --- УСКОРЕНИЕ: Скролл чуть быстрее, но реже (опционально, оставим небольшую задержку) ---
            setTimeout(() => {
                window.scrollTo(0, document.body.scrollHeight * 0.98);
            }, 20);

            clicksRemaining--;
            setTimeout(clickWithDelay, clickInterval);
        }
        clickWithDelay();
        return { success: true };
    };

    const handleCreateFormsClick = () => {
        const num = parseInt(amount, 10);
        if (isNaN(num) || num < 1 || num > 100) {
            alert("Пожалуйста, введите число от 1 до 100.");
            return;
        }

        // --- УСКОРЕНИЕ: Обновлен расчет времени для статус-бара ---
        const clickInterval = 40;
        const estimatedTime = 300 + num * clickInterval;
        manageStatus(`Создаю ${num} форм...`, estimatedTime);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                manageError("Ошибка: активная вкладка не найдена");
                return;
            }
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    func: createNewImageForms,
                    args: [num],
                    world: "MAIN",
                },
                (injectionResults) => {
                    if (
                        chrome.runtime.lastError ||
                        !injectionResults ||
                        !injectionResults[0]
                    ) {
                        manageError(
                            "Ошибка: не удалось выполнить скрипт на странице"
                        );
                        return;
                    }
                    const result = injectionResults[0].result;
                    if (result && !result.success) {
                        manageError(result.message);
                    }
                }
            );
        });
    };

    const changeAllSelectsTo = (targetValue) => {
        const allSelectsOnPage = document.querySelectorAll("select");
        let found = false;
        allSelectsOnPage.forEach((select) => {
            // --- ИСПРАВЛЕНИЕ: Добавлена проверка, что имя заканчивается на -itype ---
            // Это исключает поле interior_type, которое тоже начинается с plumbing-image
            if (
                select.name.startsWith("plumbing-image") &&
                select.name.endsWith("-itype")
            ) {
                found = true;
                if (select.value !== targetValue) {
                    select.value = targetValue;
                    select.dispatchEvent(
                        new Event("change", { bubbles: true })
                    );
                }
            }
        });
        if (!found) {
            return {
                success: false,
                message: "Не найдено изображений для изменения",
            };
        }
        return { success: true };
    };

    const handleChangeTypeClick = (valueToSet) => {
        const typeName = valueToSet === "10" ? "Изображения" : "Лица";
        manageStatus(`Меняю тип на "${typeName}"...`, 1000);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                manageError("Ошибка: активная вкладка не найдена");
                return;
            }
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    func: changeAllSelectsTo,
                    args: [valueToSet],
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
                        manageError(result.message);
                    }
                }
            );
        });
    };

    return (
        <div>
            <h2>Добавить изображения</h2>
            <div className="form-group">
                <div className="input-group">
                    <input
                        type="number"
                        className="input-field"
                        placeholder="шт"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <div className="button-group">
                        <button
                            className="stepper-button"
                            onClick={() => handleAmountChange(-1)}
                        >
                            -1
                        </button>
                        <button
                            className="stepper-button"
                            onClick={() => handleAmountChange(1)}
                        >
                            +1
                        </button>
                        <button
                            className="stepper-button"
                            onClick={() => handleAmountChange(5)}
                        >
                            +5
                        </button>
                        <button
                            className="stepper-button"
                            onClick={() => handleAmountChange(10)}
                        >
                            +10
                        </button>
                        <button
                            className="stepper-button clear-button"
                            title="Очистить"
                            onClick={() => setAmount("")}
                        >
                            C
                        </button>
                    </div>
                </div>
                <button className="button" onClick={handleCreateFormsClick}>
                    Создать
                </button>
            </div>
            <hr
                style={{
                    margin: "20px 0",
                    border: "none",
                    borderTop: "1px solid #dce3f0",
                }}
            />
            <h2>Изменить тип всех изображений</h2>
            <div className="form-group">
                <button
                    className="button"
                    onClick={() => handleChangeTypeClick("10")}
                >
                    Поменять на Изображения
                </button>
                <button
                    className="button"
                    onClick={() => handleChangeTypeClick("60")}
                >
                    Поменять на Лица
                </button>
            </div>
        </div>
    );
}

export default ImagesTab;
