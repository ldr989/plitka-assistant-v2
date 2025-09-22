// src/utils/calculator-scripts.js

export const calculateTileArea = () => {
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
                if (select.value === String(id))
                    element = allValueElements[index];
            });
            return element;
        };
        const getValue = (el) =>
            el && el.value ? parseFloat(el.value.replace(",", ".")) : NaN;
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            el.value = Math.floor(val * 100) / 100;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };

        const lengthEl = document.querySelector("#id_length");
        const widthEl = document.querySelector("#id_width");
        const areaEl = getProp(4362);
        if (lengthEl && widthEl && areaEl) {
            const area = (getValue(lengthEl) / 100) * (getValue(widthEl) / 100);
            setValue(areaEl, area);
        }
    } catch (e) {
        console.error("Calculator Error:", e);
    }
};

export const calculateWeightOfTile = () => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])'
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])'
        );
        const getProp = (id) => {
            let e = null;
            allPropSelects.forEach((s, i) => {
                if (s.value === String(id)) e = allValueElements[i];
            });
            return e;
        };
        const getValue = (el) =>
            el && el.value ? parseFloat(el.value.replace(",", ".")) : NaN;
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            el.value = Math.floor(val * 100) / 100;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };
        const boxWeightEl = getProp(4357);
        const amountInBoxEl = getProp(4288);
        const tileWeightEl = getProp(4354);
        if (boxWeightEl && amountInBoxEl && tileWeightEl) {
            const weight = getValue(boxWeightEl) / getValue(amountInBoxEl);
            setValue(tileWeightEl, weight);
        }
    } catch (e) {
        console.error("Calculator Error:", e);
    }
};

export const calculateWeightOfM2 = () => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])'
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])'
        );
        const getProp = (id) => {
            let e = null;
            allPropSelects.forEach((s, i) => {
                if (s.value === String(id)) e = allValueElements[i];
            });
            return e;
        };
        const getValue = (el) =>
            el && el.value ? parseFloat(el.value.replace(",", ".")) : NaN;
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            el.value = Math.floor(val * 100) / 100;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };
        const boxWeightEl = getProp(4357);
        const m2InBoxEl = getProp(4289);
        const m2WeightEl = getProp(4355);
        if (boxWeightEl && m2InBoxEl && m2WeightEl) {
            const weight = getValue(boxWeightEl) / getValue(m2InBoxEl);
            setValue(m2WeightEl, weight);
        }
    } catch (e) {
        console.error("Calculator Error:", e);
    }
};

export const calculateM2InBox = () => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])'
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])'
        );
        const getProp = (id) => {
            let e = null;
            allPropSelects.forEach((s, i) => {
                if (s.value === String(id)) e = allValueElements[i];
            });
            return e;
        };
        const getValue = (el) =>
            el && el.value ? parseFloat(el.value.replace(",", ".")) : NaN;
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            el.value = Math.floor(val * 100) / 100;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };
        const amountInBoxEl = getProp(4288);
        const tileAreaEl = getProp(4362);
        const m2InBoxEl = getProp(4289);
        if (amountInBoxEl && tileAreaEl && m2InBoxEl) {
            const m2 = getValue(amountInBoxEl) * getValue(tileAreaEl);
            setValue(m2InBoxEl, m2);
        }
    } catch (e) {
        console.error("Calculator Error:", e);
    }
};

export const calculateWeightOfBox = () => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])'
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])'
        );
        const getProp = (id) => {
            let e = null;
            allPropSelects.forEach((s, i) => {
                if (s.value === String(id)) e = allValueElements[i];
            });
            return e;
        };
        const getValue = (el) =>
            el && el.value ? parseFloat(el.value.replace(",", ".")) : NaN;
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            el.value = Math.floor(val * 100) / 100;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };
        const m2WeightEl = getProp(4355);
        const m2InBoxEl = getProp(4289);
        const boxWeightEl = getProp(4357);
        if (m2WeightEl && m2InBoxEl && boxWeightEl) {
            const weight = getValue(m2WeightEl) * getValue(m2InBoxEl);
            setValue(boxWeightEl, weight);
        }
    } catch (e) {
        console.error("Calculator Error:", e);
    }
};

export const calculateTilesInBox = () => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])'
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])'
        );
        const getProp = (id) => {
            let e = null;
            allPropSelects.forEach((s, i) => {
                if (s.value === String(id)) e = allValueElements[i];
            });
            return e;
        };
        const getValue = (el) =>
            el && el.value ? parseFloat(el.value.replace(",", ".")) : NaN;
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            el.value = Math.floor(val * 100) / 100;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };
        const boxWeightEl = getProp(4357);
        const tileWeightEl = getProp(4354);
        const amountInBoxEl = getProp(4288);
        if (boxWeightEl && tileWeightEl && amountInBoxEl) {
            const amount = getValue(boxWeightEl) / getValue(tileWeightEl);
            setValue(amountInBoxEl, amount);
        }
    } catch (e) {
        console.error("Calculator Error:", e);
    }
};

export const calculateBoxesInPallet = () => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])'
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])'
        );
        const getProp = (id) => {
            let e = null;
            allPropSelects.forEach((s, i) => {
                if (s.value === String(id)) e = allValueElements[i];
            });
            return e;
        };
        const getValue = (el) =>
            el && el.value ? parseFloat(el.value.replace(",", ".")) : NaN;
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            el.value = Math.floor(val * 100) / 100;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };
        const m2InPalletEl = getProp(4356);
        const m2InBoxEl = getProp(4289);
        const boxesInPalletEl = getProp(4947);
        if (m2InPalletEl && m2InBoxEl && boxesInPalletEl) {
            const boxes = getValue(m2InPalletEl) / getValue(m2InBoxEl);
            setValue(boxesInPalletEl, boxes);
        }
    } catch (e) {
        console.error("Calculator Error:", e);
    }
};

export const calculateM2InPallet = () => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])'
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])'
        );
        const getProp = (id) => {
            let e = null;
            allPropSelects.forEach((s, i) => {
                if (s.value === String(id)) e = allValueElements[i];
            });
            return e;
        };
        const getValue = (el) =>
            el && el.value ? parseFloat(el.value.replace(",", ".")) : NaN;
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            el.value = Math.floor(val * 100) / 100;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };
        const boxesInPalletEl = getProp(4947);
        const m2InBoxEl = getProp(4289);
        const m2InPalletEl = getProp(4356);
        if (boxesInPalletEl && m2InBoxEl && m2InPalletEl) {
            const m2 = getValue(boxesInPalletEl) * getValue(m2InBoxEl);
            setValue(m2InPalletEl, m2);
        }
    } catch (e) {
        console.error("Calculator Error:", e);
    }
};

export const calculateWeightOfPallet = () => {
    try {
        const allPropSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])'
        );
        const allValueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])'
        );
        const getProp = (id) => {
            let e = null;
            allPropSelects.forEach((s, i) => {
                if (s.value === String(id)) e = allValueElements[i];
            });
            return e;
        };
        const getValue = (el) =>
            el && el.value ? parseFloat(el.value.replace(",", ".")) : NaN;
        const setValue = (el, val) => {
            if (!el || isNaN(val)) return;
            el.value = Math.floor(val * 100) / 100;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        };
        const boxWeightEl = getProp(4357);
        const boxesInPalletEl = getProp(4947);
        const palletWeightEl = getProp(5277);
        if (boxWeightEl && boxesInPalletEl && palletWeightEl) {
            const weight = getValue(boxWeightEl) * getValue(boxesInPalletEl);
            setValue(palletWeightEl, weight);
        }
    } catch (e) {
        console.error("Calculator Error:", e);
    }
};
