"use client";

import { useState } from "react";
import type { Condition } from "@/lib/valuation";
import type { PropertyType, Rooms } from "@/lib/statfin";
import type { SearchRequestBody } from "@/app/api/search/route";
import { useDictionary } from "@/lib/LanguageContext";

interface Props {
  onSubmit: (values: SearchRequestBody) => void;
  loading: boolean;
}

export default function SearchForm({ onSubmit, loading }: Props) {
  const dict = useDictionary();
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType>("kerrostalo");
  const [rooms, setRooms] = useState<Rooms>("2");
  const [sizeM2, setSizeM2] = useState("55");
  const [yearBuilt, setYearBuilt] = useState("");
  const [condition, setCondition] = useState<Condition>("hyva");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const size = parseFloat(sizeM2);
    if (!address.trim() || !size || size <= 0) return;

    onSubmit({
      address: address.trim(),
      propertyType,
      rooms,
      sizeM2: size,
      yearBuilt: yearBuilt ? parseInt(yearBuilt, 10) : undefined,
      condition,
    });
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted/70 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";
  const labelClass = "mb-1.5 block text-[13px] font-medium text-muted";

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-3xl border border-border bg-surface/60 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-7"
    >
      <div>
        <label className={labelClass} htmlFor="address">
          {dict.form.addressLabel}
        </label>
        <input
          id="address"
          type="text"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={dict.form.addressPlaceholder}
          className={`${inputClass} text-[17px]`}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className={labelClass} htmlFor="propertyType">
            {dict.form.propertyTypeLabel}
          </label>
          <select
            id="propertyType"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value as PropertyType)}
            className={inputClass}
          >
            <option value="kerrostalo">{dict.form.propertyTypes.kerrostalo}</option>
            <option value="rivitalo">{dict.form.propertyTypes.rivitalo}</option>
            <option value="omakotitalo">{dict.form.propertyTypes.omakotitalo}</option>
          </select>
        </div>

        {propertyType === "kerrostalo" && (
          <div>
            <label className={labelClass} htmlFor="rooms">
              {dict.form.roomsLabel}
            </label>
            <select
              id="rooms"
              value={rooms}
              onChange={(e) => setRooms(e.target.value as Rooms)}
              className={inputClass}
            >
              <option value="1">{dict.form.rooms["1"]}</option>
              <option value="2">{dict.form.rooms["2"]}</option>
              <option value="3plus">{dict.form.rooms["3plus"]}</option>
            </select>
          </div>
        )}

        <div>
          <label className={labelClass} htmlFor="sizeM2">
            {dict.form.sizeLabel}
          </label>
          <input
            id="sizeM2"
            type="number"
            min={1}
            step="0.5"
            required
            value={sizeM2}
            onChange={(e) => setSizeM2(e.target.value)}
            className={inputClass}
          />
          {propertyType === "omakotitalo" && (
            <p className="mt-1 text-[12px] text-muted/70">{dict.form.sizeNotUsedNote}</p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="yearBuilt">
            {dict.form.yearBuiltLabel}{" "}
            <span className="text-muted/60">{dict.form.yearBuiltOptional}</span>
          </label>
          <input
            id="yearBuilt"
            type="number"
            min={1800}
            max={new Date().getFullYear()}
            placeholder={dict.form.yearBuiltPlaceholder}
            value={yearBuilt}
            onChange={(e) => setYearBuilt(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="col-span-2 sm:col-span-4">
          <label className={labelClass} htmlFor="condition">
            {dict.form.conditionLabel}
          </label>
          <select
            id="condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value as Condition)}
            className={inputClass}
          >
            <option value="erinomainen">{dict.form.conditions.condition_erinomainen}</option>
            <option value="hyva">{dict.form.conditions.condition_hyva}</option>
            <option value="tyydyttava">{dict.form.conditions.condition_tyydyttava}</option>
            <option value="valttava">{dict.form.conditions.condition_valttava}</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-foreground px-4 py-3 text-[15px] font-medium text-background transition hover:opacity-90 disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {loading ? dict.form.submitting : dict.form.submit}
      </button>
    </form>
  );
}
