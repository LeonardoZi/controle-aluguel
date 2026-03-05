import { z } from "zod";

export const isoDateTimeSchema = z.string().datetime();
export const currencyNumberSchema = z.number();
export const nullableCurrencyNumberSchema = z.number().nullable();
