export const getPropertiesFromPage = () => {
    try {
        const props = [];
        const anyPropertyElement = document.querySelector(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"]'
        );

        if (!anyPropertyElement) {
            return {
                success: true,
                data: { properties: [], length: "", width: "" },
            };
        }

        const formContainer = anyPropertyElement.closest(".grp-closed");
        if (formContainer) {
            formContainer.classList.remove("grp-closed");
            formContainer.classList.add("grp-open");
        }

        const lengthInput = document.querySelector("#id_length");
        const widthInput = document.querySelector("#id_width");
        const lengthValue = lengthInput ? lengthInput.value : "";
        const widthValue = widthInput ? widthInput.value : "";

        const getScrapedValue = (element) => {
            if (!element) return "";
            if (element.tagName === "SELECT" || element.tagName === "INPUT") {
                return element.value || "";
            }
            const checkedRadios = element.querySelectorAll(
                'input[type="radio"]:checked'
            );
            if (checkedRadios.length > 0) {
                const val = checkedRadios[0].value;
                if (val === "True") return true;
                if (val === "False") return false;
                return val;
            }
            const checkedCheckboxes = element.querySelectorAll(
                'input[type="checkbox"]:checked'
            );
            if (checkedCheckboxes.length > 0) {
                return Array.from(checkedCheckboxes).map((cb) => cb.value);
            }
            if (element.querySelectorAll('input[type="checkbox"]').length > 0) {
                return [];
            }
            return "";
        };

        const propertyRows = document.querySelectorAll(
            ".grp-dynamic-form:not(.grp-empty-form)"
        );

        propertyRows.forEach((row) => {
            const propSelect = row.querySelector('[id$="-attribute"]');
            const valueElement = row.querySelector('[id$="-value"]');

            if (propSelect && valueElement) {
                const propIdString = propSelect.value;
                if (propIdString) {
                    const propId = Number(propIdString);
                    const value = getScrapedValue(valueElement);
                    props.push({ id: propId, value: value });
                }
            }
        });

        return {
            success: true,
            data: { properties: props, length: lengthValue, width: widthValue },
        };
    } catch (e) {
        return {
            success: false,
            message: `Произошла ошибка в page-script: ${e.message}`,
        };
    }
};

export const addPropertyFormsOnPage = (missingPropIds) => {
    let addButton = null;
    const strongElements = document.querySelectorAll("strong");
    for (const strong of strongElements) {
        if (strong.textContent.includes("Добавить еще один Свойство")) {
            addButton = strong.parentElement;
            break;
        }
    }

    if (!addButton) {
        return {
            success: false,
            message: 'Ошибка: не найдена кнопка "Добавить свойство".',
        };
    }

    const clickEvent = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
    });
    let propsToAdd = [...missingPropIds];

    function addNextForm() {
        if (propsToAdd.length === 0) {
            window.postMessage(
                { type: "EXTENSION_PROPS_ADDED", status: "success" },
                "*"
            );
            return;
        }

        const propIdToAdd = propsToAdd.shift();
        const currentFormCount = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])'
        ).length;
        addButton.dispatchEvent(clickEvent);

        // --- УСКОРЕНИЕ: Уменьшено ожидание появления строки с 75 до 30 мс ---
        setTimeout(() => {
            const newSelectId = `id_plumbing-attributevalue-content_type-object_id-${currentFormCount}-attribute`;
            const newSelect = document.getElementById(newSelectId);

            if (newSelect) {
                newSelect.value = propIdToAdd;
                newSelect.dispatchEvent(new Event("change", { bubbles: true }));
            }

            window.scrollTo(0, document.body.scrollHeight * 0.98);

            // --- УСКОРЕНИЕ: Уменьшена пауза перед следующей формой с 100 до 20 мс ---
            setTimeout(addNextForm, 20);
        }, 30);
    }

    addNextForm();
    return { success: true };
};

export const fillPropertyFormsOnPage = async (propsToFill) => {
    // --- УСКОРЕНИЕ: Уменьшена задержка заполнения с 100 до 20 мс ---
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const setElementValue = (element, value) => {
        if (!element) return;
        const radioInputs = element.querySelectorAll('input[type="radio"]');
        if (radioInputs.length > 0) {
            const targetValue = value ? "true" : "false";
            const radioToSelect = Array.from(radioInputs).find(
                (r) => r.value.toLowerCase() === targetValue
            );
            if (radioToSelect) {
                radioToSelect.checked = true;
                radioToSelect.dispatchEvent(
                    new Event("change", { bubbles: true })
                );
            }
            return;
        }
        if (Array.isArray(value)) {
            const checkboxInputs = element.querySelectorAll(
                'input[type="checkbox"]'
            );
            checkboxInputs.forEach((cb) => {
                const shouldBeChecked = value.includes(cb.value);
                if (cb.checked !== shouldBeChecked) {
                    cb.checked = shouldBeChecked;
                    cb.dispatchEvent(new Event("change", { bubbles: true }));
                }
            });
            return;
        }
        if (element.value !== value) {
            element.value = value;
            element.dispatchEvent(new Event("change", { bubbles: true }));
        }
    };

    let filledCount = 0;
    const propertyRows = document.querySelectorAll(
        ".grp-dynamic-form:not(.grp-empty-form)"
    );

    for (const propFromTemplate of propsToFill) {
        // --- ВАЖНОЕ ИЗМЕНЕНИЕ: Пропускаем пустые значения ---
        // Если value пустое, null или undefined — переходим к следующему свойству,
        // не меняя ничего на странице.
        if (
            propFromTemplate.value === null ||
            propFromTemplate.value === undefined ||
            String(propFromTemplate.value).trim() === ""
        ) {
            continue;
        }

        for (const row of propertyRows) {
            const propSelect = row.querySelector('[id$="-attribute"]');
            if (
                propSelect &&
                propSelect.value === String(propFromTemplate.id)
            ) {
                const valueElement = row.querySelector('[id$="-value"]');
                if (valueElement) {
                    setElementValue(valueElement, propFromTemplate.value);
                    filledCount++;
                    // --- УСКОРЕНИЕ: используем уменьшенную задержку 20мс ---
                    await delay(20);
                }
                break;
            }
        }
    }

    return { success: true, message: `Заполнено ${filledCount} свойств.` };
};

export const deleteEmptyProperties = () => {
    const propertyContainers = document.querySelectorAll(
        'div.grp-dynamic-form[id^="plumbing-attributevalue-content_type-object_id"]'
    );
    const deleteButtonsToClick = [];

    const isContainerEmpty = (container) => {
        if (!container) return true;

        const textInput = container.querySelector(
            'input[type="text"], input[type="number"], textarea'
        );
        if (textInput) {
            return textInput.value.trim() === "";
        }

        const selectInput = container.querySelector("select");
        if (selectInput) {
            return !selectInput.value;
        }

        const hasCheckboxes = container.querySelector('input[type="checkbox"]');
        if (hasCheckboxes) {
            return !container.querySelector('input[type="checkbox"]:checked');
        }

        const hasRadios = container.querySelector('input[type="radio"]');
        if (hasRadios) {
            return !container.querySelector('input[type="radio"]:checked');
        }

        return false;
    };

    propertyContainers.forEach((container) => {
        const valueContainer = container.querySelector(".grp-td.value");

        if (isContainerEmpty(valueContainer)) {
            const deleteButton = container.querySelector(
                'a.grp-icon[title="Delete Item"].grp-delete-handler, a.grp-icon[title="Delete Item"].grp-remove-handler'
            );
            if (deleteButton) {
                deleteButtonsToClick.push(deleteButton);
            }
        }
    });

    if (deleteButtonsToClick.length === 0) {
        return { success: true, message: "Пустых свойств не найдено." };
    }

    const initialCount = deleteButtonsToClick.length;

    function clickNext() {
        if (deleteButtonsToClick.length === 0) return;
        const button = deleteButtonsToClick.pop();
        button.click();
        // --- УСКОРЕНИЕ: Уменьшена задержка удаления с 100 до 30 мс ---
        setTimeout(clickNext, 30);
    }

    clickNext();
    return {
        success: true,
        message: `Удалено ${initialCount} пустых свойств.`,
    };
};
