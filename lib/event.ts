import { EVENT } from "@/lib/constants";

const start = new Date(EVENT.startsAt);

/** "[College] Garba Night", or just the event name when no college is configured. */
export const eventTitle = EVENT.college ? `${EVENT.college} ${EVENT.name}` : EVENT.name;

/** "Mon, 12 Oct" in the event's own time zone. */
export const eventDate = start.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: EVENT.timeZone });

/** "7:00 pm" in the event's own time zone. */
export const eventTime = start.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: EVENT.timeZone });

/** "[Venue], [Campus]" with whichever parts are configured; empty when neither is. */
export const eventPlace = [EVENT.venue, EVENT.campus].filter(Boolean).join(", ");

/** Kicker line used above hero headlines: "[College] Garba Night · Mon, 12 Oct". */
export const eventKicker = `${eventTitle} · ${eventDate}`;
