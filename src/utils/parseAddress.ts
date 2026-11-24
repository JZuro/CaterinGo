import type { AddressInput } from "../types/Address";

export type AddressListParseResult = {
	addresses: AddressInput[];
	invalidLineNumbers: number[];
};

export const sanitizeAddressField = (
	field: keyof AddressInput,
	value: string,
) => {
	const normalizedValue = value.normalize("NFC");

	switch (field) {
		case "street":
			return normalizedValue.replace(/[^\p{L}\p{N} ]/gu, "");
		case "apartment":
			return normalizedValue.replace(/[^\p{L}\p{N}]/gu, "");
		case "postal_code":
			return normalizedValue.replace(/[^\d-]/gu, "");
		case "city":
			return normalizedValue.replace(/[^\p{L} ]/gu, "");
	}
};

const usRegions = new Set([
	"al",
	"ak",
	"az",
	"ar",
	"ca",
	"co",
	"ct",
	"de",
	"fl",
	"ga",
	"hi",
	"id",
	"il",
	"in",
	"ia",
	"ks",
	"ky",
	"la",
	"me",
	"md",
	"ma",
	"mi",
	"mn",
	"ms",
	"mo",
	"mt",
	"ne",
	"nv",
	"nh",
	"nj",
	"nm",
	"ny",
	"nc",
	"nd",
	"oh",
	"ok",
	"or",
	"pa",
	"ri",
	"sc",
	"sd",
	"tn",
	"tx",
	"ut",
	"vt",
	"va",
	"wa",
	"wv",
	"wi",
	"wy",
	"dc",
]);

const normalize = (value: string) => value.trim().replace(/\s+/gu, " ");

const parseApartmentSegment = (value: string) => {
	const match = normalize(value).match(
		/^(?:#\s*|(?:apt\.?|apartment|unit|suite|ste\.?|lok\.?|m\.?)\s+)(.+)$/iu,
	);

	return match ? normalize(match[1]) : null;
};

const parseStreet = (
	value: string,
): Pick<AddressInput, "street" | "apartment"> | null => {
	const parts = value
		.split(/\s*,\s*/u)
		.map(normalize)
		.filter(Boolean);
	let apartment = "";

	if (parts.length > 1) {
		const parsedApartment = parseApartmentSegment(parts.at(-1) ?? "");

		if (parsedApartment) {
			apartment = parsedApartment;
			parts.pop();
		}
	}

	if (parts.length !== 1) {
		return null;
	}

	let street = parts[0];
	const labelledApartment = street.match(
		/^(.+?)\s+(?:#\s*|(?:apt\.?|apartment|unit|suite|ste\.?|lok\.?|m\.?)\s+)(.+)$/iu,
	);

	if (labelledApartment) {
		street = normalize(labelledApartment[1]);
		apartment = normalize(labelledApartment[2]);
	} else {
		const slashApartment = street.match(
			/^(.+\s\d+[\p{L}]?(?:-\d+[\p{L}]?)?)\s*\/\s*([\p{L}\p{N}][\p{L}\p{N}./-]*)$/u,
		);

		if (slashApartment) {
			street = normalize(slashApartment[1]);
			apartment = normalize(slashApartment[2]);
		}
	}

	return street && street.length <= 255 && apartment.length <= 20
		? { street, apartment }
		: null;
};

const parsePolishAddress = (value: string): AddressInput | null => {
	const match = value.match(
		/^(.+?)(?:\s*,\s*|[\s/]+)(\d{2}-\d{3})\s+(.+)$/u,
	);

	if (!match) {
		return null;
	}

	const street = parseStreet(match[1]);
	const city = normalize(match[3]);

	return street && city && city.length <= 100
		? { ...street, postal_code: match[2], city }
		: null;
};

const parseUsAddress = (value: string): AddressInput | null => {
	const zipMatch = value.match(/\b(\d{5}(?:-\d{4})?)$/u);

	if (!zipMatch || zipMatch.index === undefined) {
		return null;
	}

	const parts = value
		.slice(0, zipMatch.index)
		.replace(/[\s,]+$/u, "")
		.split(/\s*,\s*/u)
		.map(normalize)
		.filter(Boolean);

	if (parts.length < 2) {
		return null;
	}

	const lastPart = parts.at(-1) ?? "";
	const previousPart = parts.at(-2) ?? "";
	const normalizedRegion = lastPart.toLowerCase();

	if (
		parts.length >= 3 &&
		usRegions.has(normalizedRegion) &&
		!parseApartmentSegment(previousPart)
	) {
		parts.pop();
	} else {
		const regionMatch = lastPart.match(/^(.*?)\s+([a-z]{2})$/iu);

		if (regionMatch && usRegions.has(regionMatch[2].toLowerCase())) {
			parts[parts.length - 1] = normalize(regionMatch[1]);
		}
	}

	if (parts.length < 2) {
		return null;
	}

	const city = parts.pop() ?? "";
	const street = parseStreet(parts.join(", "));

	return street && city && city.length <= 100
		? { ...street, city, postal_code: zipMatch[1] }
		: null;
};

export const parseAddressLine = (line: string): AddressInput | null => {
	const value = normalize(line).replace(/,+$/u, "");

	if (!value) {
		return null;
	}

	const parsedAddress = parsePolishAddress(value) ?? parseUsAddress(value);

	if (!parsedAddress) {
		return null;
	}

	const sanitizedAddress: AddressInput = {
		street: normalize(sanitizeAddressField("street", parsedAddress.street)),
		apartment: sanitizeAddressField("apartment", parsedAddress.apartment),
		city: normalize(sanitizeAddressField("city", parsedAddress.city)),
		postal_code: sanitizeAddressField(
			"postal_code",
			parsedAddress.postal_code,
		),
	};

	return sanitizedAddress.street &&
		sanitizedAddress.city &&
		sanitizedAddress.postal_code
		? sanitizedAddress
		: null;
};

export const parseAddressList = (value: string): AddressListParseResult => {
	const addresses: AddressInput[] = [];
	const invalidLineNumbers: number[] = [];

	for (const [index, line] of value.split(/\r?\n/u).entries()) {
		if (!line.trim()) {
			continue;
		}

		const address = parseAddressLine(line);

		if (address) {
			addresses.push(address);
		} else {
			invalidLineNumbers.push(index + 1);
		}
	}

	return { addresses, invalidLineNumbers };
};
