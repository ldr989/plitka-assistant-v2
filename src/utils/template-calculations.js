export const CALCULABLE_PROP_IDS = [
    4288, 4289, 4357, 4362, 4354, 4355, 4947, 4356, 5277,
];

export const truncateToTwoDecimals = (num) => {
    if (isNaN(num) || !isFinite(num)) return "";
    return Math.floor(num * 100) / 100;
};

export const safeParseFloat = (str) =>
    parseFloat(String(str).replace(",", "."));

export const calculatePropertyValue = (
    propIdToCalc,
    properties,
    length,
    width,
) => {
    const findPropValue = (id) => {
        const prop = properties.find((p) => p.id === id);
        return prop ? safeParseFloat(prop.value) : NaN;
    };

    switch (propIdToCalc) {
        case 4362: {
            const l = safeParseFloat(length);
            const w = safeParseFloat(width);
            if (!isNaN(l) && !isNaN(w) && l > 0 && w > 0)
                return truncateToTwoDecimals((l / 100) * (w / 100));
            break;
        }
        case 4354: {
            const boxWeight = findPropValue(4357);
            const amountInBox = findPropValue(4288);
            if (!isNaN(boxWeight) && !isNaN(amountInBox) && amountInBox > 0)
                return truncateToTwoDecimals(boxWeight / amountInBox);
            break;
        }
        case 4355: {
            const boxWeight = findPropValue(4357);
            const m2InBox = findPropValue(4289);
            if (!isNaN(boxWeight) && !isNaN(m2InBox) && m2InBox > 0)
                return truncateToTwoDecimals(boxWeight / m2InBox);
            break;
        }
        case 4357: {
            const m2Weight = findPropValue(4355);
            const m2InBox = findPropValue(4289);
            if (!isNaN(m2Weight) && !isNaN(m2InBox))
                return truncateToTwoDecimals(m2Weight * m2InBox);
            const palletWeight = findPropValue(5277);
            const boxesInPallet = findPropValue(4947);
            if (
                !isNaN(palletWeight) &&
                !isNaN(boxesInPallet) &&
                boxesInPallet > 0
            )
                return truncateToTwoDecimals(palletWeight / boxesInPallet);
            break;
        }
        case 4289: {
            const amountInBox = findPropValue(4288);
            const tileArea = findPropValue(4362);
            if (!isNaN(amountInBox) && !isNaN(tileArea))
                return truncateToTwoDecimals(amountInBox * tileArea);
            break;
        }
        case 4356: {
            const boxesInPallet = findPropValue(4947);
            const m2InBox = findPropValue(4289);
            if (!isNaN(boxesInPallet) && !isNaN(m2InBox))
                return truncateToTwoDecimals(boxesInPallet * m2InBox);
            break;
        }
        case 4947: {
            const m2InPallet = findPropValue(4356);
            const m2InBox = findPropValue(4289);
            if (!isNaN(m2InPallet) && !isNaN(m2InBox) && m2InBox > 0)
                return truncateToTwoDecimals(m2InPallet / m2InBox);
            break;
        }
        case 5277: {
            const boxWeight = findPropValue(4357);
            const boxesInPallet = findPropValue(4947);
            if (!isNaN(boxWeight) && !isNaN(boxesInPallet))
                return truncateToTwoDecimals(boxWeight * boxesInPallet);
            break;
        }
        default:
            return null;
    }
};
