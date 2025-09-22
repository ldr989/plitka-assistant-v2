// Эта функция будет запущена на странице для сбора всех свойств
export const getPropertiesFromPage = () => {
    const props = [];
    try {
        // --- ИСПРАВЛЕНИЕ ЗДЕСЬ: "Открываем дверь" перед поиском ---
        const formContainer = document.querySelector(
            "#plumbing-attributevalue-content_type-object_id-group"
        );
        if (formContainer && formContainer.classList.contains("grp-closed")) {
            formContainer.classList.remove("grp-closed");
            formContainer.classList.add("grp-open");
        }

        const lengthInput = document.querySelector("#id_length");
        const widthInput = document.querySelector("#id_width");
        const lengthValue = lengthInput ? lengthInput.value : "";
        const widthValue = widthInput ? widthInput.value : "";

        const getScrapedValue = (element) => {
            if (!element) return null;
            if (
                element.tagName === "SELECT" ||
                (element.tagName === "INPUT" && element.type === "text")
            )
                return element.value;
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
            if (checkedCheckboxes.length > 0)
                return Array.from(checkedCheckboxes).map((cb) => cb.value);
            return null;
        };

        // --- ИСПРАВЛЕНИЕ ЗДЕСЬ: Новый, более надежный метод поиска, как в старом приложении ---
        const propSelects = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])'
        );
        const valueElements = document.querySelectorAll(
            '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])'
        );

        if (propSelects.length !== valueElements.length) {
            return {
                success: false,
                message: "Ошибка: несоответствие количеств свойств и значений.",
            };
        }

        propSelects.forEach((propSelect, index) => {
            const propId = propSelect.value;
            if (propId) {
                // Учитываем только те строки, где свойство выбрано
                const value = getScrapedValue(valueElements[index]);
                props.push({ id: propId, value: value });
            }
        });

        return {
            success: true,
            data: { properties: props, length: lengthValue, width: widthValue },
        };
    } catch (e) {
        return { success: false, message: `Произошла ошибка: ${e.message}` };
    }
};

// Эта функция будет добавлять на страницу формы для недостающих свойств
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

        setTimeout(() => {
            const newSelectId = `id_plumbing-attributevalue-content_type-object_id-${currentFormCount}-attribute`;
            const newSelect = document.getElementById(newSelectId);

            if (newSelect) {
                newSelect.value = propIdToAdd;
                newSelect.dispatchEvent(new Event("change", { bubbles: true }));
            }

            window.scrollTo(0, document.body.scrollHeight * 0.97);

            setTimeout(addNextForm, 200);
        }, 150);
    }

    addNextForm();
    return { success: true };
};

// Заполняет формы на странице значениями из шаблона
export const fillPropertyFormsOnPage = (propsToFill) => {
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
    const allPropSelects = document.querySelectorAll(
        '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-attribute"]:not([id*="__prefix__"])'
    );
    const allValueElements = document.querySelectorAll(
        '[id^="id_plumbing-attributevalue-content_type-object_id-"][id$="-value"]:not([id*="__prefix__"])'
    );

    propsToFill.forEach((propFromTemplate) => {
        for (let i = 0; i < allPropSelects.length; i++) {
            if (allPropSelects[i].value === propFromTemplate.id) {
                const valueElement = allValueElements[i];
                if (valueElement) {
                    setElementValue(valueElement, propFromTemplate.value);
                    filledCount++;
                }
            }
        }
    });

    return { success: true, message: `Заполнено ${filledCount} свойств.` };
};
