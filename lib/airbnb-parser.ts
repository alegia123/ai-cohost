interface ParsedAirbnbEmail {
  guestName: string;
  messageBody: string;
  reservationCode: string | null;
  checkIn: string | null;
  checkOut: string | null;
  rawSubject: string;
}

function decodeBase64Url(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function getHeader(headers: any[], name: string): string {
  return (
    headers.find(
      (h: any) => h.name.toLowerCase() === name.toLowerCase()
    )?.value ?? ""
  );
}

function extractTextPart(payload: any): string {
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractTextPart(part);
      if (text) return text;
    }
  }

  return "";
}

export function isAirbnbMessageEmail(message: any): boolean {
  const headers = message.payload?.headers ?? [];
  const from = getHeader(headers, "from").toLowerCase();
  const subject = getHeader(headers, "subject").toLowerCase();

  const isFromAirbnb =
    from.includes("airbnb.com") || from.includes("@airbnb");

  const isMessage =
    subject.includes("message") ||
    subject.includes("inquiry") ||
    subject.includes("booking request") ||
    subject.includes("new message");

  return isFromAirbnb && isMessage;
}

export function parseAirbnbEmail(message: any): ParsedAirbnbEmail {
  const headers = message.payload?.headers ?? [];
  const subject = getHeader(headers, "subject");
  const body = extractTextPart(message.payload);

  // Extract guest name from subject like "Message from John S."
  const nameMatch = subject.match(
    /(?:message from|new message from|inquiry from)\s+([A-Za-z]+(?:\s+[A-Z]\.?)?)/i
  );
  const guestName = nameMatch ? nameMatch[1].trim() : "Guest";

  // Extract reservation code (HMXXXXXXXX format)
  const codeMatch = body.match(/\bHM[A-Z0-9]{6,10}\b/i);
  const reservationCode = codeMatch ? codeMatch[0].toUpperCase() : null;

  // Extract dates
  const checkInMatch = body.match(
    /check[- ]?in[:\s]+([A-Za-z]+ \d{1,2},? \d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i
  );
  const checkOutMatch = body.match(
    /check[- ]?out[:\s]+([A-Za-z]+ \d{1,2},? \d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i
  );

  // Clean up the message body — strip boilerplate after "---"
  const cleanBody = body
    .split(/\n-{3,}\n/)[0]
    .replace(/https?:\/\/\S+/g, "")
    .trim()
    .slice(0, 2000);

  return {
    guestName,
    messageBody: cleanBody,
    reservationCode,
    checkIn: checkInMatch ? checkInMatch[1] : null,
    checkOut: checkOutMatch ? checkOutMatch[1] : null,
    rawSubject: subject,
  };
}
