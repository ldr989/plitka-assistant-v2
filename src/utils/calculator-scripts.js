// ВНИМАНИЕ: Все функции самодостаточны.
// Хелперы дублируются внутри каждой функции,
// чтобы executeScript гарантированно работал без внешних зависимостей.

// 1. Площадь плитки (Длина * Ширина / 10000)
export const calculateTileArea = () => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])',
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])',
        );

        const getProp = (id) => {
            let element = null;
            allPropSelects.forEach((select, index) => {
                if (select.value === String(id))
                    element = allValueElements[index];
            });
            return element;
        };

        const getValue = (el) => {
            if (!el || !el.value) return 0;
            return parseFloat(el.value.replace(",", "."));
        };

        // --- УМНОЕ ОКРУГЛЕНИЕ ---
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            let result;
            const absVal = Math.abs(val);

            if (absVal === 0) {
                result = 0;
            } else if (absVal < 1) {
                // Для малых чисел (0.0009, 0.00122) берем 3 значащие цифры
                // Пример: 0.001225 -> 0.00123
                result = parseFloat(Number(val).toPrecision(3));
            } else {
                // Для больших чисел (22.4964) берем жестко 3 знака после запятой
                // Пример: 22.4964 -> 22.496
                result = parseFloat(Number(val).toFixed(3));
            }

            el.value = result;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };

        const lengthEl = document.querySelector("#id_length");
        const widthEl = document.querySelector("#id_width");
        const areaEl = getProp(4362); // Площадь плитки

        if (lengthEl && widthEl && areaEl) {
            const length = getValue(lengthEl); // см
            const width = getValue(widthEl); // см

            const area = (length * width) / 10000;

            if (area > 0) {
                setValue(areaEl, area);
            }
        }
    } catch (e) {
        console.error("Calculator Error (Area):", e);
    }
};

// 2. Вес 1 шт
export const calculateWeightOfTile = () => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])',
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])',
        );
        const getProp = (id) => {
            let element = null;
            allPropSelects.forEach((select, index) => {
                if (select.value === String(id))
                    element = allValueElements[index];
            });
            return element;
        };
        const getValue = (el) => {
            if (!el || !el.value) return 0;
            return parseFloat(el.value.replace(",", "."));
        };
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            let result;
            const absVal = Math.abs(val);

            if (absVal === 0) {
                result = 0;
            } else if (absVal < 1) {
                result = parseFloat(Number(val).toPrecision(3));
            } else {
                result = parseFloat(Number(val).toFixed(3));
            }

            el.value = result;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };

        const areaEl = getProp(4362);
        const weightM2El = getProp(4355);
        const weightBoxEl = getProp(4357);
        const quantityInBoxEl = getProp(4288);
        const weightTileEl = getProp(4354); // Цель

        if (!weightTileEl) return;

        const area = getValue(areaEl);

        // А: Через вес м2
        if (getValue(weightM2El) > 0 && area > 0) {
            const weight = getValue(weightM2El) * area;
            setValue(weightTileEl, weight);
            return;
        }

        // Б: Через вес коробки
        const qty = getValue(quantityInBoxEl);
        const wBox = getValue(weightBoxEl);
        if (wBox > 0 && qty > 0) {
            const weight = wBox / qty;
            setValue(weightTileEl, weight);
        }
    } catch (e) {
        console.error("Calculator Error (Weight Tile):", e);
    }
};

// 3. Вес 1 м2
export const calculateWeightOfM2 = () => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])',
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])',
        );
        const getProp = (id) => {
            let element = null;
            allPropSelects.forEach((select, index) => {
                if (select.value === String(id))
                    element = allValueElements[index];
            });
            return element;
        };
        const getValue = (el) => {
            if (!el || !el.value) return 0;
            return parseFloat(el.value.replace(",", "."));
        };
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            let result;
            const absVal = Math.abs(val);

            if (absVal === 0) {
                result = 0;
            } else if (absVal < 1) {
                result = parseFloat(Number(val).toPrecision(3));
            } else {
                result = parseFloat(Number(val).toFixed(3));
            }

            el.value = result;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };

        const areaEl = getProp(4362);
        const weightTileEl = getProp(4354);
        const weightBoxEl = getProp(4357);
        const m2InBoxEl = getProp(4289);
        const weightM2El = getProp(4355); // Цель

        if (!weightM2El) return;

        const area = getValue(areaEl);
        const wTile = getValue(weightTileEl);

        // А: Через вес плитки
        if (wTile > 0 && area > 0) {
            setValue(weightM2El, wTile / area);
            return;
        }

        // Б: Через вес коробки
        const wBox = getValue(weightBoxEl);
        const m2Box = getValue(m2InBoxEl);
        if (wBox > 0 && m2Box > 0) {
            setValue(weightM2El, wBox / m2Box);
        }
    } catch (e) {
        console.error("Calculator Error (Weight M2):", e);
    }
};

// 4. Штук в коробке
export const calculateTilesInBox = () => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])',
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])',
        );
        const getProp = (id) => {
            let element = null;
            allPropSelects.forEach((select, index) => {
                if (select.value === String(id))
                    element = allValueElements[index];
            });
            return element;
        };
        const getValue = (el) => {
            if (!el || !el.value) return 0;
            return parseFloat(el.value.replace(",", "."));
        };
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            let result;
            const absVal = Math.abs(val);

            if (absVal === 0) {
                result = 0;
            } else if (absVal < 1) {
                result = parseFloat(Number(val).toPrecision(3));
            } else {
                // Для штук тоже оставляем 3 знака, вдруг там дробное кол-во (редко, но бывает)
                result = parseFloat(Number(val).toFixed(3));
            }

            el.value = result;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };

        const areaEl = getProp(4362);
        const m2InBoxEl = getProp(4289);
        const qtyEl = getProp(4288); // Цель

        if (!qtyEl) return;

        const area = getValue(areaEl);
        const m2Box = getValue(m2InBoxEl);

        if (area > 0 && m2Box > 0) {
            setValue(qtyEl, m2Box / area);
        }
    } catch (e) {
        console.error("Calculator Error (Tiles In Box):", e);
    }
};

// 5. М2 в коробке
export const calculateM2InBox = () => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])',
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])',
        );
        const getProp = (id) => {
            let element = null;
            allPropSelects.forEach((select, index) => {
                if (select.value === String(id))
                    element = allValueElements[index];
            });
            return element;
        };
        const getValue = (el) => {
            if (!el || !el.value) return 0;
            return parseFloat(el.value.replace(",", "."));
        };
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            let result;
            const absVal = Math.abs(val);

            if (absVal === 0) {
                result = 0;
            } else if (absVal < 1) {
                result = parseFloat(Number(val).toPrecision(3));
            } else {
                result = parseFloat(Number(val).toFixed(3));
            }

            el.value = result;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };

        const areaEl = getProp(4362);
        const qtyEl = getProp(4288);
        const m2InBoxEl = getProp(4289); // Цель

        if (!m2InBoxEl) return;

        const area = getValue(areaEl);
        const qty = getValue(qtyEl);

        if (area > 0 && qty > 0) {
            setValue(m2InBoxEl, area * qty);
        }
    } catch (e) {
        console.error("Calculator Error (M2 In Box):", e);
    }
};

// 6. Вес коробки
export const calculateWeightOfBox = () => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])',
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])',
        );
        const getProp = (id) => {
            let element = null;
            allPropSelects.forEach((select, index) => {
                if (select.value === String(id))
                    element = allValueElements[index];
            });
            return element;
        };
        const getValue = (el) => {
            if (!el || !el.value) return 0;
            return parseFloat(el.value.replace(",", "."));
        };
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            let result;
            const absVal = Math.abs(val);

            if (absVal === 0) {
                result = 0;
            } else if (absVal < 1) {
                result = parseFloat(Number(val).toPrecision(3));
            } else {
                result = parseFloat(Number(val).toFixed(3));
            }

            el.value = result;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };

        const qtyEl = getProp(4288); // Штук в упаковке
        const weightTileEl = getProp(4354); // Вес 1 шт
        const m2InBoxEl = getProp(4289); // М2 в упаковке
        const weightM2El = getProp(4355); // Вес м2
        const weightBoxEl = getProp(4357); // Цель

        // Новые поля для расчета "через палету"
        const boxesEl = getProp(4947); // Коробок в палете
        const weightPalletEl = getProp(5277); // Вес палеты

        if (!weightBoxEl) return;

        // ПРИОРИТЕТЫ:

        // 1. М2 в коробке * Вес м2 (Самый точный и частый)
        const m2Box = getValue(m2InBoxEl);
        const wM2 = getValue(weightM2El);
        if (m2Box > 0 && wM2 > 0) {
            setValue(weightBoxEl, m2Box * wM2);
            return;
        }

        // 2. Штуки * Вес одной
        const qty = getValue(qtyEl);
        const wTile = getValue(weightTileEl);
        if (qty > 0 && wTile > 0) {
            setValue(weightBoxEl, qty * wTile);
            return;
        }

        // 3. Вес палеты / Коробок в палете (Запасной)
        const wPallet = getValue(weightPalletEl);
        const boxes = getValue(boxesEl);
        if (wPallet > 0 && boxes > 0) {
            setValue(weightBoxEl, wPallet / boxes);
            return;
        }
    } catch (e) {
        console.error("Calculator Error (Weight Box):", e);
    }
};

// 7. Коробок на палете
export const calculateBoxesInPallet = () => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])',
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])',
        );
        const getProp = (id) => {
            let element = null;
            allPropSelects.forEach((select, index) => {
                if (select.value === String(id))
                    element = allValueElements[index];
            });
            return element;
        };
        const getValue = (el) => {
            if (!el || !el.value) return 0;
            return parseFloat(el.value.replace(",", "."));
        };
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            let result;
            const absVal = Math.abs(val);
            // Тут скорее всего будут числа > 1, так что сработает toFixed(3)
            if (absVal === 0) {
                result = 0;
            } else if (absVal < 1) {
                result = parseFloat(Number(val).toPrecision(3));
            } else {
                result = parseFloat(Number(val).toFixed(3));
            }
            el.value = result;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };

        const m2InBoxEl = getProp(4289);
        const m2InPalletEl = getProp(4356);
        const boxesInPalletEl = getProp(4947); // Цель

        if (!boxesInPalletEl) return;

        const m2Box = getValue(m2InBoxEl);
        const m2Pallet = getValue(m2InPalletEl);

        if (m2Box > 0 && m2Pallet > 0) {
            setValue(boxesInPalletEl, m2Pallet / m2Box);
        }
    } catch (e) {
        console.error("Calculator Error (Boxes Pallet):", e);
    }
};

// 8. М2 на палете
export const calculateM2InPallet = () => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])',
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])',
        );
        const getProp = (id) => {
            let element = null;
            allPropSelects.forEach((select, index) => {
                if (select.value === String(id))
                    element = allValueElements[index];
            });
            return element;
        };
        const getValue = (el) => {
            if (!el || !el.value) return 0;
            return parseFloat(el.value.replace(",", "."));
        };
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            let result;
            const absVal = Math.abs(val);
            if (absVal === 0) {
                result = 0;
            } else if (absVal < 1) {
                result = parseFloat(Number(val).toPrecision(3));
            } else {
                result = parseFloat(Number(val).toFixed(3));
            }
            el.value = result;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };

        const boxesEl = getProp(4947);
        const m2InBoxEl = getProp(4289);
        const m2InPalletEl = getProp(4356); // Цель

        if (!m2InPalletEl) return;

        const boxes = getValue(boxesEl);
        const m2Box = getValue(m2InBoxEl);

        if (boxes > 0 && m2Box > 0) {
            setValue(m2InPalletEl, boxes * m2Box);
        }
    } catch (e) {
        console.error("Calculator Error (M2 Pallet):", e);
    }
};

// 9. Вес палеты
export const calculateWeightOfPallet = () => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])',
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])',
        );
        const getProp = (id) => {
            let element = null;
            allPropSelects.forEach((select, index) => {
                if (select.value === String(id))
                    element = allValueElements[index];
            });
            return element;
        };
        const getValue = (el) => {
            if (!el || !el.value) return 0;
            return parseFloat(el.value.replace(",", "."));
        };
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            let result;
            const absVal = Math.abs(val);
            // Вес палеты точно > 1
            if (absVal === 0) {
                result = 0;
            } else if (absVal < 1) {
                result = parseFloat(Number(val).toPrecision(3));
            } else {
                result = parseFloat(Number(val).toFixed(3));
            }
            el.value = result;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };

        const boxesEl = getProp(4947);
        const weightBoxEl = getProp(4357);
        const weightPalletEl = getProp(5277); // Цель

        if (!weightPalletEl) return;

        const boxes = getValue(boxesEl);
        const wBox = getValue(weightBoxEl);

        if (boxes > 0 && wBox > 0) {
            setValue(weightPalletEl, boxes * wBox);
        }
    } catch (e) {
        console.error("Calculator Error (Weight Pallet):", e);
    }
};
