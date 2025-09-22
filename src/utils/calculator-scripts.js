// Вспомогательная функция для всех калькуляторов
const runCalculation = (calculationLogic) => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])'
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])'
        );

        const getProp = (id) => {
            let element = null;
            allPropSelects.forEach((select, index) => {
                if (select.value === String(id)) {
                    element = allValueElements[index];
                }
            });
            return element;
        };

        const getValue = (element) => {
            if (!element || !element.value) return NaN;
            return parseFloat(element.value.replace(",", "."));
        };

        const setValue = (element, value) => {
            if (!element) return;
            const truncatedValue = Math.floor(value * 100) / 100; // Обрезка до 2 знаков
            element.value = truncatedValue;
            element.dispatchEvent(new Event("change", { bubbles: true }));
        };

        calculationLogic(getProp, getValue, setValue);
        return { success: true };
    } catch (e) {
        return { success: false, message: `Ошибка вычисления: ${e.message}` };
    }
};

// --- Функции для кнопок ---

export const calculateTileArea = () =>
    runCalculation((getProp, getValue, setValue) => {
        const lengthEl = document.querySelector("#id_length");
        const widthEl = document.querySelector("#id_width");
        const areaEl = getProp(4362); // Площадь плитки
        if (lengthEl && widthEl && areaEl) {
            const area = (getValue(lengthEl) / 100) * (getValue(widthEl) / 100);
            setValue(areaEl, area);
        }
    });

export const calculateWeightOfTile = () =>
    runCalculation((getProp, getValue, setValue) => {
        const boxWeightEl = getProp(4357); // Вес упаковки
        const amountInBoxEl = getProp(4288); // В упаковке [шт]
        const tileWeightEl = getProp(4354); // Вес 1 шт. плитки
        if (boxWeightEl && amountInBoxEl && tileWeightEl) {
            const weight = getValue(boxWeightEl) / getValue(amountInBoxEl);
            setValue(tileWeightEl, weight);
        }
    });

export const calculateWeightOfM2 = () =>
    runCalculation((getProp, getValue, setValue) => {
        const boxWeightEl = getProp(4357); // Вес упаковки
        const m2InBoxEl = getProp(4289); // Кол-во м2 в упаковке
        const m2WeightEl = getProp(4355); // Вес 1 кв.м.
        if (boxWeightEl && m2InBoxEl && m2WeightEl) {
            const weight = getValue(boxWeightEl) / getValue(m2InBoxEl);
            setValue(m2WeightEl, weight);
        }
    });

export const calculateM2InBox = () =>
    runCalculation((getProp, getValue, setValue) => {
        const amountInBoxEl = getProp(4288); // В упаковке [шт]
        const tileAreaEl = getProp(4362); // Площадь плитки
        const m2InBoxEl = getProp(4289); // Кол-во м2 в упаковке
        if (amountInBoxEl && tileAreaEl && m2InBoxEl) {
            const m2 = getValue(amountInBoxEl) * getValue(tileAreaEl);
            setValue(m2InBoxEl, m2);
        }
    });

export const calculateWeightOfBox = () =>
    runCalculation((getProp, getValue, setValue) => {
        const m2WeightEl = getProp(4355); // Вес 1 кв.м.
        const m2InBoxEl = getProp(4289); // Кол-во м2 в упаковке
        const boxWeightEl = getProp(4357); // Вес упаковки
        if (m2WeightEl && m2InBoxEl && boxWeightEl) {
            const weight = getValue(m2WeightEl) * getValue(m2InBoxEl);
            setValue(boxWeightEl, weight);
        }
    });

export const calculateTilesInBox = () =>
    runCalculation((getProp, getValue, setValue) => {
        const boxWeightEl = getProp(4357); // Вес упаковки
        const tileWeightEl = getProp(4354); // Вес 1 шт. плитки
        const amountInBoxEl = getProp(4288); // В упаковке [шт]
        if (boxWeightEl && tileWeightEl && amountInBoxEl) {
            const amount = getValue(boxWeightEl) / getValue(tileWeightEl);
            setValue(amountInBoxEl, amount);
        }
    });

export const calculateBoxesInPallet = () =>
    runCalculation((getProp, getValue, setValue) => {
        const m2InPalletEl = getProp(4356); // м2 в палетте
        const m2InBoxEl = getProp(4289); // м2 в упаковке
        const boxesInPalletEl = getProp(4947); // Коробок на палетте
        if (m2InPalletEl && m2InBoxEl && boxesInPalletEl) {
            const boxes = getValue(m2InPalletEl) / getValue(m2InBoxEl);
            setValue(boxesInPalletEl, boxes);
        }
    });

export const calculateM2InPallet = () =>
    runCalculation((getProp, getValue, setValue) => {
        const boxesInPalletEl = getProp(4947); // Коробок на палетте
        const m2InBoxEl = getProp(4289); // м2 в упаковке
        const m2InPalletEl = getProp(4356); // м2 в палетте
        if (boxesInPalletEl && m2InBoxEl && m2InPalletEl) {
            const m2 = getValue(boxesInPalletEl) * getValue(m2InBoxEl);
            setValue(m2InPalletEl, m2);
        }
    });

export const calculateWeightOfPallet = () =>
    runCalculation((getProp, getValue, setValue) => {
        const boxWeightEl = getProp(4357); // Вес упаковки
        const boxesInPalletEl = getProp(4947); // Коробок на палетте
        const palletWeightEl = getProp(5277); // Вес палетты
        if (boxWeightEl && boxesInPalletEl && palletWeightEl) {
            const weight = getValue(boxWeightEl) * getValue(boxesInPalletEl);
            setValue(palletWeightEl, weight);
        }
    });
