// To parse this data:
//
//   import { Convert, LinguaResponse } from "./file";
//
//   const linguaResponse = Convert.toLinguaResponse(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface LinguaResponse {
    entries: Entry[];
}

export interface Entry {
    entry: string;
    pronunciations: Pronunciation[];
    interpretations: Interpretation[];
    lexemes: Lexeme[];
    license: License;
    sourceUrls: string[];
}

export interface Interpretation {
    lemma: string;
    normalizedLemmas: NormalizedLemma[];
    partOfSpeech: string;
    grammar?: Grammar[];
    morphemes: Morpheme[];
}

export interface Grammar {
    person?: Person[];
    number?: string[];
    verbForm: VerbForm[];
    tense?: Tense[];
    mood?: string[];
}

export enum Person {
    FirstPerson = "first-person",
    SecondPerson = "second-person",
    ThirdPerson = "third-person",
}

export enum Tense {
    Past = "past",
    Present = "present",
}

export enum VerbForm {
    Finite = "finite",
    Gerund = "gerund",
    Participle = "participle",
}

export interface Morpheme {
    entry: string;
    type: string;
    labels?: string[];
}

export interface NormalizedLemma {
    lemma: string;
}

export interface Lexeme {
    lemma: string;
    partOfSpeech: string;
    senses: Sense[];
    forms?: Form[];
}

export interface Form {
    form: string;
    grammar: Grammar[];
    labels?: string[];
}

export interface Sense {
    definition: string;
    labels?: string[];
    usageExamples?: string[];
}

export interface License {
    name: string;
    url: string;
}

export interface Pronunciation {
    transcriptions: Transcription[];
    context: Context;
    audio?: Audio;
}

export interface Audio {
    url: string;
    license: License;
    sourceUrl: string;
}

export interface Context {
    regions: string[];
}

export interface Transcription {
    transcription: string;
    notation: string;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toLinguaResponse(json: string): LinguaResponse {
        return cast(JSON.parse(json), r("LinguaResponse"));
    }

    public static linguaResponseToJson(value: LinguaResponse): string {
        return JSON.stringify(uncast(value, r("LinguaResponse")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any = ''): never {
    if (key) {
        throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
    }
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`,);
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) { }
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, prop.key);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems") ? transformArray(typ.arrayItems, val)
                : typ.hasOwnProperty("props") ? transformObject(getProps(typ), typ.additional, val)
                    : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "LinguaResponse": o([
        { json: "entries", js: "entries", typ: a(r("Entry")) },
    ], false),
    "Entry": o([
        { json: "entry", js: "entry", typ: "" },
        { json: "pronunciations", js: "pronunciations", typ: a(r("Pronunciation")) },
        { json: "interpretations", js: "interpretations", typ: a(r("Interpretation")) },
        { json: "lexemes", js: "lexemes", typ: a(r("Lexeme")) },
        { json: "license", js: "license", typ: r("License") },
        { json: "sourceUrls", js: "sourceUrls", typ: a("") },
    ], false),
    "Interpretation": o([
        { json: "lemma", js: "lemma", typ: "" },
        { json: "normalizedLemmas", js: "normalizedLemmas", typ: a(r("NormalizedLemma")) },
        { json: "partOfSpeech", js: "partOfSpeech", typ: "" },
        { json: "grammar", js: "grammar", typ: u(undefined, a(r("Grammar"))) },
        { json: "morphemes", js: "morphemes", typ: a(r("Morpheme")) },
    ], false),
    "Grammar": o([
        { json: "person", js: "person", typ: u(undefined, a(r("Person"))) },
        { json: "number", js: "number", typ: u(undefined, a("")) },
        { json: "verbForm", js: "verbForm", typ: a(r("VerbForm")) },
        { json: "tense", js: "tense", typ: u(undefined, a(r("Tense"))) },
        { json: "mood", js: "mood", typ: u(undefined, a("")) },
    ], false),
    "Morpheme": o([
        { json: "entry", js: "entry", typ: "" },
        { json: "type", js: "type", typ: "" },
        { json: "labels", js: "labels", typ: u(undefined, a("")) },
    ], false),
    "NormalizedLemma": o([
        { json: "lemma", js: "lemma", typ: "" },
    ], false),
    "Lexeme": o([
        { json: "lemma", js: "lemma", typ: "" },
        { json: "partOfSpeech", js: "partOfSpeech", typ: "" },
        { json: "senses", js: "senses", typ: a(r("Sense")) },
        { json: "forms", js: "forms", typ: u(undefined, a(r("Form"))) },
    ], false),
    "Form": o([
        { json: "form", js: "form", typ: "" },
        { json: "grammar", js: "grammar", typ: a(r("Grammar")) },
        { json: "labels", js: "labels", typ: u(undefined, a("")) },
    ], false),
    "Sense": o([
        { json: "definition", js: "definition", typ: "" },
        { json: "labels", js: "labels", typ: u(undefined, a("")) },
        { json: "usageExamples", js: "usageExamples", typ: u(undefined, a("")) },
    ], false),
    "License": o([
        { json: "name", js: "name", typ: "" },
        { json: "url", js: "url", typ: "" },
    ], false),
    "Pronunciation": o([
        { json: "transcriptions", js: "transcriptions", typ: a(r("Transcription")) },
        { json: "context", js: "context", typ: r("Context") },
        { json: "audio", js: "audio", typ: u(undefined, r("Audio")) },
    ], false),
    "Audio": o([
        { json: "url", js: "url", typ: "" },
        { json: "license", js: "license", typ: r("License") },
        { json: "sourceUrl", js: "sourceUrl", typ: "" },
    ], false),
    "Context": o([
        { json: "regions", js: "regions", typ: a("") },
    ], false),
    "Transcription": o([
        { json: "transcription", js: "transcription", typ: "" },
        { json: "notation", js: "notation", typ: "" },
    ], false),
    "Person": [
        "first-person",
        "second-person",
        "third-person",
    ],
    "Tense": [
        "past",
        "present",
    ],
    "VerbForm": [
        "finite",
        "gerund",
        "participle",
    ],
};
