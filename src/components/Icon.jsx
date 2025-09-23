import React from "react";

function Icon({ name }) {
    switch (name) {
        // --- НОВАЯ ИКОНКА ---
        case "copy":
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
                    <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        ry="2"
                    ></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            );
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
        case "gear":
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid"
                    width="24"
                    height="24"
                    style={{
                        shapeRendering: "auto",
                        display: "block",
                        background: "transparent",
                    }}
                >
                    {" "}
                    <g>
                        {" "}
                        <g transform="translate(50 50)">
                            {" "}
                            <g>
                                {" "}
                                <animateTransform
                                    repeatCount="indefinite"
                                    dur="0.2s"
                                    keyTimes="0;1"
                                    values="0;45"
                                    type="rotate"
                                    attributeName="transform"
                                ></animateTransform>{" "}
                                <path fill="#000000" d="M29.49..."></path>{" "}
                            </g>{" "}
                        </g>{" "}
                        <g></g>{" "}
                    </g>{" "}
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
