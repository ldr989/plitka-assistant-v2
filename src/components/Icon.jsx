import React from "react";

function Icon({ name }) {
    switch (name) {
        case "pencil":
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {" "}
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>{" "}
                    <path d="m15 5 4 4"></path>{" "}
                </svg>
            );
        case "trash":
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {" "}
                    <polyline points="3 6 5 6 21 6"></polyline>{" "}
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>{" "}
                    <line x1="10" y1="11" x2="10" y2="17"></line>{" "}
                    <line x1="14" y1="11" x2="14" y2="17"></line>{" "}
                </svg>
            );
        case "help":
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {" "}
                    <circle cx="12" cy="12" r="10"></circle>{" "}
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>{" "}
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>{" "}
                </svg>
            );
        case "gear":
            return (
                <svg
                    xmlns="http://www.w.org/2000/svg"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid"
                    width="16"
                    height="16"
                    style={{
                        shapeRendering: "auto",
                        display: "block",
                        background: "transparent",
                    }}
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                >
                    <g>
                        <g transform="translate(50 50)">
                            <g>
                                <animateTransform
                                    repeatCount="indefinite"
                                    dur="0.2s"
                                    keyTimes="0;1"
                                    values="0;45"
                                    type="rotate"
                                    attributeName="transform"
                                ></animateTransform>
                                {/* --- Цвет изменен на черный --- */}
                                <path
                                    fill="#000000"
                                    d="M29.491524206117255 -5.5 L37.491524206117255 -5.5 L37.491524206117255 5.5 L29.491524206117255 5.5 A30 30 0 0 1 24.742744050198738 16.964569457146712 L24.742744050198738 16.964569457146712 L30.399598299691117 22.621423706639092 L22.621423706639096 30.399598299691114 L16.964569457146716 24.742744050198734 A30 30 0 0 1 5.5 29.491524206117255 L5.5 29.491524206117255 L5.5 37.491524206117255 L-5.499999999999997 37.491524206117255 L-5.499999999999997 29.491524206117255 A30 30 0 0 1 -16.964569457146705 24.742744050198738 L-16.964569457146705 24.742744050198738 L-22.621423706639085 30.399598299691117 L-30.399598299691117 22.621423706639092 L-24.742744050198738 16.964569457146712 A30 30 0 0 1 -29.491524206117255 5.500000000000009 L-29.491524206117255 5.500000000000009 L-37.491524206117255 5.50000000000001 L-37.491524206117255 -5.500000000000001 L-29.491524206117255 -5.500000000000002 A30 30 0 0 1 -24.742744050198738 -16.964569457146705 L-24.742744050198738 -16.964569457146705 L-30.399598299691117 -22.621423706639085 L-22.621423706639092 -30.399598299691117 L-16.964569457146712 -24.742744050198738 A30 30 0 0 1 -5.500000000000011 -29.491524206117255 L-5.500000000000011 -29.491524206117255 L-5.500000000000012 -37.491524206117255 L5.499999999999998 -37.491524206117255 L5.5 -29.491524206117255 A30 30 0 0 1 16.964569457146702 -24.74274405019874 L16.964569457146702 -24.74274405019874 L22.62142370663908 -30.39959829969112 L30.399598299691117 -22.6214237066391 L24.742744050198738 -16.964569457146716 A30 30 0 0 1 29.491524206117255 -5.500000000000013 M0 -20A20 20 0 1 0 0 20 A20 20 0 1 0 0 -20"
                                ></path>
                            </g>
                        </g>
                        <g></g>
                    </g>
                    {/* [ldio] generated by https://loading.io */}
                </svg>
            );
        case "close":
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {" "}
                    <line x1="18" y1="6" x2="6" y2="18"></line>{" "}
                    <line x1="6" y1="6" x2="18" y2="18"></line>{" "}
                </svg>
            );
        default:
            return null;
    }
}

export default Icon;
