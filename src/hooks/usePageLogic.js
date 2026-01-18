/* eslint-disable no-undef */
import { useCallback } from "react";
import {
    getPropertiesFromPage,
    addPropertyFormsOnPage,
    fillPropertyFormsOnPage,
    deleteEmptyProperties,
} from "../utils/page-scripts.js";

export default function usePageLogic(manageStatus, manageError) {
    const findMissingProperties = useCallback(
        (localProperties, callback) => {
            manageStatus("Ищу свойства на странице...", 2000);
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs[0]) return;
                chrome.scripting.executeScript(
                    {
                        target: { tabId: tabs[0].id },
                        func: getPropertiesFromPage,
                        world: "MAIN",
                    },
                    (results) => {
                        const result = results[0]?.result;
                        if (result?.success) {
                            const pagePropIds = new Set(
                                result.data.properties.map((p) => p.id),
                            );
                            const missing = localProperties.filter(
                                (p) => !p.ignored && !pagePropIds.has(p.id),
                            );
                            callback(missing);
                            manageStatus(
                                missing.length > 0
                                    ? `Найдено отсутствующих: ${missing.length}`
                                    : "Все свойства уже на странице.",
                                3000,
                            );
                        } else {
                            manageError(result?.message || "Ошибка скрипта");
                        }
                    },
                );
            });
        },
        [manageStatus, manageError],
    );

    const addMissingForms = useCallback(
        (missingProperties) => {
            const ids = missingProperties.map((p) => p.id);
            manageStatus(`Добавляю ${ids.length} форм...`, 1000);
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0])
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        func: addPropertyFormsOnPage,
                        args: [ids],
                        world: "MAIN",
                    });
            });
        },
        [manageStatus],
    );

    const fillForms = useCallback(
        (properties, label = "Заполняю") => {
            manageStatus(`${label} ${properties.length} свойств...`, 2000);
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0])
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        func: fillPropertyFormsOnPage,
                        args: [properties],
                        world: "MAIN",
                    });
            });
        },
        [manageStatus],
    );

    const cleanEmpty = useCallback(() => {
        manageStatus("Удаляю пустые свойства...", 2000);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) return;
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    func: deleteEmptyProperties,
                    world: "MAIN",
                },
                (results) => {
                    const result = results[0]?.result;
                    if (result?.message) manageStatus(result.message, 3000);
                },
            );
        });
    }, [manageStatus]);

    return { findMissingProperties, addMissingForms, fillForms, cleanEmpty };
}
