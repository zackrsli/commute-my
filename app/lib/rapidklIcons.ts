/**
 * RapidKL Line Icon Mapping
 * Icons from https://myrapid.com.my
 */

export const RAPIDKL_LINE_ICONS: Record<string, string> = {
    "AG": "/icons/rapidkl/icon_line_ampang.png",
    "SP": "/icons/rapidkl/icon_line_sri-petaling.png",
    "KJ": "/icons/rapidkl/icon_line_kelana-jaya.png",
    "MR": "/icons/rapidkl/icon_line_kl-monorail.png",
    "KG": "/icons/rapidkl/icon_line_kajang-01.png",
    "PY": "/icons/rapidkl/icon_line_putrajaya-01.png",
};

export const RAPIDKL_STATION_ICONS = {
    interchange: "/icons/rapidkl/icon_interchange-station.png",
    connecting: "/icons/rapidkl/icon_connecting-station.png",
};

// RapidKL official line colors (extracted from their branding)
export const RAPIDKL_LINE_COLORS: Record<string, string> = {
    "AG": "#FF8E10", // Ampang Line - Orange
    "SP": "#8D0C06", // Sri Petaling Line - Dark Red
    "KJ": "#ED0F4C", // Kelana Jaya Line - Magenta/Red
    "MR": "#81BC00", // KL Monorail - Green
    "KG": "#008640", // Kajang Line - Dark Green
    "PY": "#FBCD20", // Putrajaya Line - Yellow
};

export function getLineIconUrl(lineId: string): string {
    return RAPIDKL_LINE_ICONS[lineId] || RAPIDKL_LINE_ICONS["AG"];
}

export function getLineColor(lineId: string): string {
    return RAPIDKL_LINE_COLORS[lineId] || RAPIDKL_LINE_COLORS["AG"];
}

