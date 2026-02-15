export function getTrackingUrl(
    courier: string | null,
    trackingNumber: string | null,
) {
    if (!courier || !trackingNumber) return null;

    const normalized = courier.toLowerCase();

    if (normalized.includes("delhivery")) {
        return `https://www.delhivery.com/track/package/${trackingNumber}`;
    }

    if (normalized.includes("dtdc")) {
        return `https://www.dtdc.in/tracking/tracking_results.asp?strCnno=${trackingNumber}`;
    }

    if (normalized.includes("bluedart")) {
        return `https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo=${trackingNumber}`;
    }

    return null;
}
